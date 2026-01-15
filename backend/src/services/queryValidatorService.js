import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

class QueryValidatorService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  /**
   * Use LLM to check if query is yoga-related and determine its intent
   * @param {string} query - User's question
   * @returns {Object} - { isYogaRelated, intent, shouldAnswer, reason }
   */
  async validateQuery(query) {
    try {
      const prompt = `You are a query classifier for a Yoga Q&A application. Analyze the following user query and determine if it's related to yoga.

QUERY: "${query}"

YOGA-RELATED TOPICS include:
- Yoga poses/asanas (names, benefits, how-to, contraindications)
- Breathing exercises (pranayama)
- Meditation practices
- Yoga philosophy and traditions
- Physical benefits and health improvements through yoga
- Yoga for specific conditions (back pain, stress, flexibility, etc.)
- Different yoga styles (Hatha, Vinyasa, Ashtanga, etc.)
- Yoga equipment and practice
- Spiritual aspects of yoga
- Yogic lifestyle and Ayurveda

NOT YOGA-RELATED (should reject):
- General greetings (hi, hello, how are you)
- Random questions unrelated to yoga (weather, math, programming, etc.)
- Off-topic health questions not related to yoga practice
- General chit-chat or conversation
- Questions about other sports or exercises not related to yoga
- Requests for non-yoga information

Respond ONLY with a valid JSON object (no markdown, no extra text):
{
  "isYogaRelated": true/false,
  "intent": "one of: yoga_question, greeting, off_topic, unclear",
  "confidence": 0.0-1.0,
  "reason": "brief explanation why this is or isn't yoga-related"
}

Examples:
Query: "How to do headstand?" → {"isYogaRelated": true, "intent": "yoga_question", "confidence": 1.0, "reason": "Asking about specific yoga pose"}
Query: "Hello, how are you?" → {"isYogaRelated": false, "intent": "greeting", "confidence": 1.0, "reason": "Just a greeting"}
Query: "What's the weather?" → {"isYogaRelated": false, "intent": "off_topic", "confidence": 1.0, "reason": "Weather question, not yoga"}
Query: "Yoga for back pain?" → {"isYogaRelated": true, "intent": "yoga_question", "confidence": 1.0, "reason": "Asking about yoga for specific health condition"}`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();
      
      // Remove markdown code blocks if present
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      const validation = JSON.parse(cleanText);
      
      // Determine if we should answer
      validation.shouldAnswer = validation.isYogaRelated && 
                                validation.intent === 'yoga_question' &&
                                validation.confidence >= 0.6;

      console.log(`🔍 LLM Query Validation:`);
      console.log(`   Yoga-related: ${validation.isYogaRelated ? '✅ YES' : '❌ NO'}`);
      console.log(`   Intent: ${validation.intent}`);
      console.log(`   Confidence: ${(validation.confidence * 100).toFixed(0)}%`);
      console.log(`   Reason: ${validation.reason}`);

      return validation;
    } catch (error) {
      console.warn('⚠️ LLM query validation failed, using fallback:', error.message);
      
      // Fallback to simple keyword checking
      return this.fallbackValidation(query);
    }
  }

  /**
   * Fallback validation using keywords (when LLM fails)
   */
  fallbackValidation(query) {
    const queryLower = query.toLowerCase();
    
    // Off-topic patterns (greetings, etc.)
    const offTopicPatterns = [
      /^(hi|hello|hey|howdy|greetings|good morning|good afternoon|good evening)[\s!?.]*$/i,
      /^how are you/i,
      /^what('s| is) your name/i,
      /^who are you/i,
      /^(thanks|thank you|bye|goodbye|see you)/i,
      /^(ok|okay|yes|no|sure|alright)[\s!?.]*$/i
    ];

    for (const pattern of offTopicPatterns) {
      if (pattern.test(query.trim())) {
        return {
          isYogaRelated: false,
          intent: 'greeting',
          confidence: 0.9,
          shouldAnswer: false,
          reason: 'Detected as greeting or casual conversation',
          method: 'fallback'
        };
      }
    }

    // Yoga keywords
    const yogaKeywords = [
      'yoga', 'asana', 'pose', 'posture', 'pranayama', 'breathing', 'breath',
      'meditation', 'stretch', 'flexibility', 'mindfulness', 'relaxation',
      'surya', 'namaskar', 'shavasana', 'warrior', 'downward', 'upward',
      'cobra', 'balance', 'core', 'spine', 'chakra', 'mudra', 'mantra'
    ];

    const hasYogaKeyword = yogaKeywords.some(keyword => queryLower.includes(keyword));

    return {
      isYogaRelated: hasYogaKeyword,
      intent: hasYogaKeyword ? 'yoga_question' : 'off_topic',
      confidence: hasYogaKeyword ? 0.7 : 0.8,
      shouldAnswer: hasYogaKeyword,
      reason: hasYogaKeyword ? 'Contains yoga keywords' : 'No yoga keywords found',
      method: 'fallback'
    };
  }
}

// Singleton instance
const queryValidatorService = new QueryValidatorService();

export default queryValidatorService;
