import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Unified Query Reviewer - Single LLM call to check:
 * 1. Is it yoga-related?
 * 2. Is it safe (no medical conditions)?
 * 3. Should we proceed with RAG pipeline?
 */
class UnifiedQueryReviewer {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  /**
   * Single LLM review for all pre-processing checks
   * @param {string} query - User's question
   * @returns {Object} - Complete review results
   */
  async reviewQuery(query) {
    try {
      const prompt = `You are a pre-processing analyzer for a Yoga Q&A application. Analyze this user query for THREE things:

1. TOPIC RELEVANCE: Is it about yoga?
2. SAFETY: Does it mention medical conditions requiring professional guidance?
3. INTENT: What is the user trying to do?

USER QUERY: "${query}"

===== YOGA-RELATED TOPICS =====
✅ Yoga poses/asanas (names, benefits, how-to)
✅ Breathing exercises (pranayama)
✅ Meditation and mindfulness
✅ Yoga philosophy and traditions
✅ Physical health through yoga
✅ Yoga for specific conditions (back pain, stress, flexibility)
✅ Different yoga styles (Hatha, Vinyasa, Ashtanga)
✅ Yogic lifestyle and Ayurveda

❌ NOT YOGA: greetings, weather, cooking, math, programming, other sports

===== MEDICAL CONDITIONS (UNSAFE) =====
⚠️ Pregnancy, expecting, trimester
⚠️ Heart disease, cardiac issues, heart attack
⚠️ Surgery, post-operative recovery
⚠️ Hernia
⚠️ Glaucoma, eye pressure
⚠️ High blood pressure, hypertension
⚠️ Epilepsy, seizures
⚠️ Spinal injuries, disc problems, slipped disc
⚠️ Neck injuries, cervical issues
⚠️ Osteoporosis, brittle bones
⚠️ Any serious medical condition

Respond ONLY with valid JSON (no markdown):
{
  "isYogaRelated": true/false,
  "isUnsafe": true/false,
  "shouldProceed": true/false,
  "intent": "yoga_question" | "greeting" | "off_topic" | "medical_query",
  "detectedMedicalConditions": ["condition1", "condition2"] or [],
  "confidence": 0.0-1.0,
  "reason": "brief explanation",
  "recommendation": "what to do next"
}

DECISION RULES:
- If OFF-TOPIC (not yoga): shouldProceed=false, intent="off_topic"
- If GREETING only: shouldProceed=false, intent="greeting"
- If UNSAFE (medical): shouldProceed=false, intent="medical_query", list conditions
- If SAFE YOGA QUESTION: shouldProceed=true, intent="yoga_question"

EXAMPLES:

Query: "What are yoga benefits?"
Response: {"isYogaRelated": true, "isUnsafe": false, "shouldProceed": true, "intent": "yoga_question", "detectedMedicalConditions": [], "confidence": 1.0, "reason": "Valid yoga question", "recommendation": "Proceed with RAG pipeline"}

Query: "Can I do yoga during pregnancy?"
Response: {"isYogaRelated": true, "isUnsafe": true, "shouldProceed": false, "intent": "medical_query", "detectedMedicalConditions": ["pregnancy"], "confidence": 1.0, "reason": "Mentions pregnancy requiring medical guidance", "recommendation": "Return safety warning, do not use RAG"}

Query: "What's the weather?"
Response: {"isYogaRelated": false, "isUnsafe": false, "shouldProceed": false, "intent": "off_topic", "detectedMedicalConditions": [], "confidence": 1.0, "reason": "Not related to yoga", "recommendation": "Politely redirect to yoga topics"}

Query: "Hello"
Response: {"isYogaRelated": false, "isUnsafe": false, "shouldProceed": false, "intent": "greeting", "detectedMedicalConditions": [], "confidence": 1.0, "reason": "Just a greeting", "recommendation": "Send friendly welcome message"}`;

      console.log(`\n🔍 Starting Unified LLM Review...`);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();
      
      // Remove markdown code blocks if present
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      const review = JSON.parse(cleanText);
      
      // Log review results
      console.log(`📊 LLM Review Results:`);
      console.log(`   Yoga-related: ${review.isYogaRelated ? '✅ YES' : '❌ NO'}`);
      console.log(`   Safe: ${review.isUnsafe ? '⚠️ UNSAFE' : '✅ SAFE'}`);
      console.log(`   Should proceed: ${review.shouldProceed ? '✅ YES' : '❌ NO'}`);
      console.log(`   Intent: ${review.intent}`);
      console.log(`   Confidence: ${(review.confidence * 100).toFixed(0)}%`);
      console.log(`   Reason: ${review.reason}`);
      if (review.detectedMedicalConditions.length > 0) {
        console.log(`   Medical conditions: ${review.detectedMedicalConditions.join(', ')}`);
      }

      return {
        ...review,
        method: 'llm',
        success: true
      };

    } catch (error) {
      console.warn(`⚠️ LLM review failed, using fallback: ${error.message}`);
      return this.fallbackReview(query);
    }
  }

  /**
   * Fallback review using keyword matching
   */
  fallbackReview(query) {
    const queryLower = query.toLowerCase();
    
    console.log(`\n🔑 Using Fallback Keyword Review...`);

    // Check for unsafe medical keywords
    const medicalKeywords = {
      'pregnancy': ['pregnant', 'pregnancy', 'expecting', 'trimester', 'pregnent', 'pregant'],
      'cardiac': ['heart disease', 'cardiac', 'heart attack', 'angina', 'hart disease'],
      'surgery': ['surgery', 'post-surgery', 'operation', 'surgry', 'operaton'],
      'hernia': ['hernia', 'hurnia', 'hernea'],
      'glaucoma': ['glaucoma', 'glucoma', 'eye pressure'],
      'hypertension': ['high blood pressure', 'hypertension', 'high bp'],
      'epilepsy': ['epilepsy', 'seizure', 'epilepsi'],
      'spinal': ['spinal injury', 'disc prolapse', 'slipped disc', 'back injury'],
      'neck': ['neck injury', 'cervical', 'neck pain'],
      'osteoporosis': ['osteoporosis', 'brittle bones', 'bone density']
    };

    const detectedConditions = [];
    for (const [condition, keywords] of Object.entries(medicalKeywords)) {
      if (keywords.some(keyword => queryLower.includes(keyword))) {
        detectedConditions.push(condition);
      }
    }

    const isUnsafe = detectedConditions.length > 0;

    // Check for greetings
    const greetingPatterns = [
      /^(hi|hello|hey|howdy|greetings|good morning|good afternoon|good evening)[\s!?.]*$/i,
      /^how are you/i
    ];
    const isGreeting = greetingPatterns.some(pattern => pattern.test(query.trim()));

    // Check for yoga keywords
    const yogaKeywords = [
      'yoga', 'asana', 'pose', 'posture', 'pranayama', 'breathing', 'breath',
      'meditation', 'stretch', 'flexibility', 'mindfulness', 'relaxation',
      'surya', 'namaskar', 'shavasana', 'warrior', 'downward', 'upward',
      'cobra', 'balance', 'core', 'spine', 'chakra', 'mudra', 'mantra'
    ];
    const isYogaRelated = yogaKeywords.some(keyword => queryLower.includes(keyword));

    // Determine intent and shouldProceed
    let intent, shouldProceed, reason, recommendation;

    if (isUnsafe) {
      intent = 'medical_query';
      shouldProceed = false;
      reason = `Detected medical conditions: ${detectedConditions.join(', ')}`;
      recommendation = 'Return safety warning immediately';
    } else if (isGreeting) {
      intent = 'greeting';
      shouldProceed = false;
      reason = 'User greeting detected';
      recommendation = 'Send friendly welcome message';
    } else if (isYogaRelated) {
      intent = 'yoga_question';
      shouldProceed = true;
      reason = 'Contains yoga keywords, no medical conditions';
      recommendation = 'Proceed with RAG pipeline';
    } else {
      intent = 'off_topic';
      shouldProceed = false;
      reason = 'No yoga keywords found';
      recommendation = 'Politely redirect to yoga topics';
    }

    console.log(`📊 Fallback Review Results:`);
    console.log(`   Yoga-related: ${isYogaRelated ? '✅ YES' : '❌ NO'}`);
    console.log(`   Safe: ${isUnsafe ? '⚠️ UNSAFE' : '✅ SAFE'}`);
    console.log(`   Should proceed: ${shouldProceed ? '✅ YES' : '❌ NO'}`);
    console.log(`   Intent: ${intent}`);
    console.log(`   Reason: ${reason}`);

    return {
      isYogaRelated,
      isUnsafe,
      shouldProceed,
      intent,
      detectedMedicalConditions: detectedConditions,
      confidence: isUnsafe ? 0.85 : (isYogaRelated ? 0.75 : 0.8),
      reason,
      recommendation,
      method: 'fallback',
      success: true
    };
  }
}

// Singleton instance
const unifiedQueryReviewer = new UnifiedQueryReviewer();

export default unifiedQueryReviewer;
