import express from 'express';
import vectorStore from '../services/vectorStore.js';
import safetyService from '../services/safetyService.js';
import aiService from '../services/aiService.js';
import QueryLog from '../models/QueryLog.js';

const router = express.Router();

// Yoga-related keywords to check if query is relevant
const yogaKeywords = [
  'yoga', 'asana', 'pose', 'posture', 'pranayama', 'breathing', 'breath',
  'meditation', 'stretch', 'flexibility', 'mindfulness', 'relaxation',
  'surya', 'namaskar', 'sun salutation', 'shavasana', 'corpse pose',
  'warrior', 'downward', 'upward', 'cobra', 'child pose', 'tree pose',
  'balance', 'core', 'spine', 'back pain', 'stress', 'anxiety', 'sleep',
  'chakra', 'mudra', 'mantra', 'bandha', 'kriya', 'dhyana', 'samadhi',
  'vinyasa', 'hatha', 'ashtanga', 'iyengar', 'kundalini', 'bikram',
  'beginner', 'advanced', 'morning', 'evening', 'routine', 'practice',
  'exercise', 'workout', 'fitness', 'health', 'wellness', 'body', 'mind',
  'headstand', 'handstand', 'inversion', 'backbend', 'forward bend', 'twist',
  'hip opener', 'shoulder', 'neck', 'leg', 'arm', 'strengthen', 'tone',
  'weight loss', 'digestion', 'immunity', 'energy', 'calm', 'focus',
  'prana', 'nadi', 'sutra', 'patanjali', 'ayurveda', 'holistic'
];

// Off-topic patterns (greetings, general chat, etc.)
const offTopicPatterns = [
  /^(hi|hello|hey|howdy|greetings|good morning|good afternoon|good evening)[\s!?.]*$/i,
  /^how are you/i,
  /^what('s| is) your name/i,
  /^who are you/i,
  /^what can you do/i,
  /^tell me (about yourself|a joke)/i,
  /^(thanks|thank you|bye|goodbye|see you)/i,
  /^(ok|okay|yes|no|sure|alright)[\s!?.]*$/i
];

// Check if query is yoga-related
function isYogaRelated(query) {
  const queryLower = query.toLowerCase();
  
  // Check if matches off-topic patterns
  for (const pattern of offTopicPatterns) {
    if (pattern.test(query.trim())) {
      return false;
    }
  }
  
  // Check if contains any yoga-related keywords
  for (const keyword of yogaKeywords) {
    if (queryLower.includes(keyword)) {
      return true;
    }
  }
  
  // If query is very short and doesn't contain yoga keywords, likely off-topic
  if (query.trim().split(/\s+/).length <= 3) {
    return false;
  }
  
  // Default: assume it might be yoga-related for longer queries
  return true;
}

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

    // Step 0: Check if query is yoga-related
    if (!isYogaRelated(query)) {
      console.log(`💬 Off-topic query detected: "${query}"`);
      const responseTime = Date.now() - startTime;
      
      const offTopicResponse = `🙏 Namaste! I'm a yoga assistant and I can only help with yoga-related questions.

**I can help you with:**
• Yoga poses (asanas) and their benefits
• Breathing techniques (pranayama)
• Meditation practices
• Yoga for specific health goals (stress relief, flexibility, strength)
• Beginner to advanced yoga guidance
• Yoga philosophy and traditions

**Try asking something like:**
• "What are the benefits of Surya Namaskar?"
• "How do I do a headstand safely?"
• "What breathing exercises help with anxiety?"
• "Yoga poses for back pain"

Please ask me a yoga-related question and I'll be happy to help! 🧘`;

      return res.json({
        success: true,
        answer: offTopicResponse,
        isUnsafe: false,
        isOffTopic: true,
        sources: [],
        responseTime
      });
    }

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
