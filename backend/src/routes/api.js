import express from 'express';
import vectorStore from '../services/vectorStore.js';
import aiService from '../services/aiService.js';
import unifiedQueryReviewer from '../services/unifiedQueryReviewer.js';
import safetyService from '../services/safetyService.js';
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

    console.log(`\n${'='.repeat(80)}`);
    console.log(`🔍 STEP 1: UNIFIED LLM REVIEW`);
    console.log(`${'='.repeat(80)}`);

    // STEP 1: Unified LLM Review - Check EVERYTHING in one go
    const review = await unifiedQueryReviewer.reviewQuery(query);

    // STEP 1A: Handle GREETING
    if (review.intent === 'greeting') {
      console.log(`\n💬 RESULT: Greeting detected - Sending welcome message`);
      const responseTime = Date.now() - startTime;
      
      const greetingResponse = `🙏 **Namaste!** 

I'm your Yoga AI Assistant. I'm here to help you with all things yoga!

**I can help you with:**
• Yoga poses (asanas) and their benefits
• Breathing techniques (pranayama)  
• Meditation and mindfulness practices
• Yoga for specific health goals (back pain, stress relief, flexibility)
• Different yoga styles (Hatha, Vinyasa, Ashtanga, etc.)
• Yoga philosophy and spiritual practices

**Try asking:**
• "What are the benefits of Surya Namaskar?"
• "How do I do a headstand safely?"
• "Yoga poses for lower back pain"
• "Breathing exercises for anxiety"

What would you like to know about yoga? 🧘‍♀️`;

      // Log greeting
      const logEntry = new QueryLog({
        query,
        answer: greetingResponse,
        sources: [],
        isUnsafe: false,
        isOffTopic: true,
        detectedKeywords: ['greeting'],
        responseTime,
        timestamp: new Date()
      });
      await logEntry.save();

      return res.json({
        success: true,
        answer: greetingResponse,
        isUnsafe: false,
        isOffTopic: true,
        review: { intent: 'greeting' },
        sources: [],
        responseTime
      });
    }

    // STEP 1B: Handle OFF-TOPIC
    if (review.intent === 'off_topic') {
      console.log(`\n❌ RESULT: Off-topic query - Not yoga-related`);
      const responseTime = Date.now() - startTime;
      
      const offTopicResponse = `🙏 **I'm specialized in Yoga!**

Your question doesn't appear to be about yoga. 

${review.reason}

I'm designed specifically to answer yoga-related questions. I can help with:
• Yoga poses and techniques
• Breathing exercises (pranayama)
• Meditation practices
• Health benefits of yoga
• Yoga for specific conditions
• Yoga philosophy and traditions

**Please ask me something related to yoga, and I'll be happy to help!** 🧘`;

      // Log off-topic query
      const logEntry = new QueryLog({
        query,
        answer: offTopicResponse,
        sources: [],
        isUnsafe: false,
        isOffTopic: true,
        detectedKeywords: ['off_topic'],
        responseTime,
        timestamp: new Date()
      });
      await logEntry.save();

      return res.json({
        success: true,
        answer: offTopicResponse,
        isUnsafe: false,
        isOffTopic: true,
        review: { intent: 'off_topic', reason: review.reason },
        sources: [],
        responseTime
      });
    }

    // STEP 1C: Handle MEDICAL/UNSAFE queries
    if (review.isUnsafe && review.intent === 'medical_query') {
      console.log(`\n⚠️ RESULT: Medical condition detected - Returning safety warning`);
      console.log(`   Detected conditions: ${review.detectedMedicalConditions.join(', ')}`);
      
      // Map detected conditions to detailed safety rules
      const detectedConditions = [];
      for (const condition of review.detectedMedicalConditions) {
        // Find matching safety rule from safetyService
        const rule = safetyService.safetyRules.find(r => r.category === condition);
        if (rule) {
          detectedConditions.push(rule);
        }
      }

      const safetyResponse = safetyService.generateSafetyResponse(query, detectedConditions);
      const responseTime = Date.now() - startTime;

      // Log unsafe query
      const queryLog = new QueryLog({
        query: query.trim(),
        retrievedChunks: [],
        answer: safetyResponse,
        isUnsafe: true,
        safetyWarnings: detectedConditions.map(c => c.warning),
        detectedKeywords: review.detectedMedicalConditions,
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
        safetyWarnings: detectedConditions.map(c => c.warning),
        detectedKeywords: review.detectedMedicalConditions,
        review: { intent: 'medical_query', conditions: review.detectedMedicalConditions },
        sources: [],
        responseTime
      });
    }

    // STEP 1D: Query APPROVED - Proceed to RAG Pipeline
    console.log(`\n✅ RESULT: Safe yoga question - Proceeding to RAG pipeline`);
    console.log(`   Confidence: ${(review.confidence * 100).toFixed(0)}%`);

    console.log(`\n${'='.repeat(80)}`);
    console.log(`🔍 STEP 2: RAG PIPELINE - VECTOR SEARCH`);
    console.log(`${'='.repeat(80)}`);

    // STEP 2: Retrieve relevant documents from vector store
    const retrievedChunks = await vectorStore.search(query, 5);
    console.log(`   Found ${retrievedChunks.length} relevant documents`);

    // Step 3: Generate AI response for safe queries
    const answer = await aiService.generateAnswer(query, retrievedChunks, false);

    const responseTime = Date.now() - startTime;

    console.log(`\n${'='.repeat(80)}`);
    console.log(`📊 FINAL RESULTS`);
    console.log(`${'='.repeat(80)}`);
    console.log(`   Total time: ${responseTime}ms`);
    console.log(`   Sources found: ${retrievedChunks.length}`);

    // STEP 4: Log to MongoDB
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

    // STEP 5: Send response
    res.json({
      success: true,
      queryId: queryLog._id,
      answer,
      isUnsafe: false,
      isOffTopic: false,
      review: { intent: 'yoga_question', confidence: review.confidence },
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

    console.log(`\n✅ Response sent successfully\n`);
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
