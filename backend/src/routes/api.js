import express from 'express';
import vectorStore from '../services/vectorStore.js';
import safetyService from '../services/safetyService.js';
import aiService from '../services/aiService.js';
import QueryLog from '../models/QueryLog.js';

const router = express.Router();

// POST /api/ask - Main endpoint for asking yoga questions
router.post('/ask', async (req, res) => {
  const startTime = Date.now();

  try {
    const { query } = req.body;

    // Validation
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Query is required and must be a non-empty string'
      });
    }

    if (query.length > 500) {
      return res.status(400).json({
        success: false,
        error: 'Query must be less than 500 characters'
      });
    }

    console.log(`📝 Received query: "${query}"`);

    // Step 1: Safety Detection - Check FIRST before any processing
    const safetyCheck = safetyService.detectUnsafeConditions(query);
    const { isUnsafe, detectedConditions, detectedKeywords } = safetyCheck;

    console.log(`🔒 Safety check: ${isUnsafe ? 'UNSAFE' : 'SAFE'}`);
    
    // If unsafe, return safety response IMMEDIATELY without vector search or AI
    if (isUnsafe) {
      console.log(`🛑 Unsafe query detected - keywords: ${detectedKeywords.join(', ')}`);
      
      const safetyResponse = safetyService.generateSafetyResponse(query, detectedConditions);
      const safetyWarnings = detectedConditions.map(c => c.warning);
      const responseTime = Date.now() - startTime;

      // Log to MongoDB (without vector search results)
      const queryLog = new QueryLog({
        query: query.trim(),
        retrievedChunks: [],
        answer: safetyResponse,
        isUnsafe: true,
        safetyWarnings,
        detectedKeywords,
        model: 'safety-filter',
        responseTime
      });

      await queryLog.save();
      console.log(`💾 Unsafe query logged with ID: ${queryLog._id}`);

      return res.json({
        success: true,
        queryId: queryLog._id,
        answer: safetyResponse,
        isUnsafe: true,
        safetyWarnings,
        detectedKeywords,
        sources: [],
        responseTime
      });
    }

    // Step 2: Only for SAFE queries - Retrieve relevant documents from vector store
    console.log('🔍 Searching vector store...');
    const retrievedChunks = await vectorStore.search(query, 5);
    console.log(`   Found ${retrievedChunks.length} relevant documents`);

    // Step 3: Generate AI response for safe queries
    const answer = await aiService.generateAnswer(query, retrievedChunks, false);

    const responseTime = Date.now() - startTime;

    // Step 4: Log to MongoDB
    const queryLog = new QueryLog({
      query: query.trim(),
      retrievedChunks: retrievedChunks.map(chunk => ({
        id: chunk.id,
        title: chunk.title,
        source: chunk.source,
        info: chunk.info.substring(0, 200) + '...', // Store truncated version
        score: chunk.score
      })),
      answer,
      isUnsafe: false,
      safetyWarnings: [],
      detectedKeywords: [],
      model: 'gemini-1.5-flash',
      responseTime
    });

    await queryLog.save();
    console.log(`💾 Query logged with ID: ${queryLog._id}`);

    // Step 5: Send response
    res.json({
      success: true,
      queryId: queryLog._id,
      answer,
      isUnsafe: false,
      safetyWarnings: [],
      sources: retrievedChunks.map(chunk => ({
        id: chunk.id,
        title: chunk.title,
        source: chunk.source,
        page: chunk.page,
        score: Math.round(chunk.score * 100) / 100
      })),
      responseTime
    });

  } catch (error) {
    console.error('❌ Error in /ask endpoint:', error);
    
    res.status(500).json({
      success: false,
      error: 'An error occurred while processing your question',
      details: error.message,
      stack: error.stack // Included for debugging purposes
    });
  }
});

// POST /api/feedback - Submit feedback for a query
router.post('/feedback', async (req, res) => {
  try {
    const { queryId, helpful, comment } = req.body;

    // Validation
    if (!queryId) {
      return res.status(400).json({
        success: false,
        error: 'queryId is required'
      });
    }

    if (typeof helpful !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'helpful must be a boolean value'
      });
    }

    // Find and update the query log
    const queryLog = await QueryLog.findById(queryId);

    if (!queryLog) {
      return res.status(404).json({
        success: false,
        error: 'Query not found'
      });
    }

    // Update feedback
    queryLog.feedback = {
      helpful,
      comment: comment || ''
    };

    await queryLog.save();

    console.log(`👍 Feedback received for query ${queryId}: ${helpful ? 'helpful' : 'not helpful'}`);

    res.json({
      success: true,
      message: 'Feedback submitted successfully'
    });

  } catch (error) {
    console.error('❌ Error in /feedback endpoint:', error);
    
    res.status(500).json({
      success: false,
      error: 'An error occurred while submitting feedback',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/stats - Get usage statistics (optional analytics endpoint)
router.get('/stats', async (req, res) => {
  try {
    const totalQueries = await QueryLog.countDocuments();
    const unsafeQueries = await QueryLog.countDocuments({ isUnsafe: true });
    const queriesWithFeedback = await QueryLog.countDocuments({ 'feedback.helpful': { $ne: null } });
    const positiveRating = await QueryLog.countDocuments({ 'feedback.helpful': true });

    const avgResponseTime = await QueryLog.aggregate([
      { $group: { _id: null, avgTime: { $avg: '$responseTime' } } }
    ]);

    res.json({
      success: true,
      stats: {
        totalQueries,
        unsafeQueries,
        queriesWithFeedback,
        positiveRating,
        averageResponseTime: avgResponseTime[0]?.avgTime || 0
      }
    });

  } catch (error) {
    console.error('❌ Error in /stats endpoint:', error);
    
    res.status(500).json({
      success: false,
      error: 'An error occurred while fetching statistics'
    });
  }
});

// GET /api/health - Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const vectorStoreReady = vectorStore.isInitialized;
    
    res.json({
      success: true,
      status: 'healthy',
      vectorStore: vectorStoreReady ? 'ready' : 'not initialized',
      documentsCount: vectorStore.documents.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: error.message
    });
  }
});

export default router;
