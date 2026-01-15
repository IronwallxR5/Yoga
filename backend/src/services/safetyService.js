import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

class SafetyService {
  constructor() {
    // Initialize Gemini AI for LLM-based safety detection
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    // Load unsafe keywords from environment or use defaults (fallback)
    const unsafeKeywordsStr = process.env.UNSAFE_KEYWORDS || 
      'pregnant,pregnancy,first trimester,second trimester,third trimester,expecting,hernia,glaucoma,high blood pressure,hypertension,recent surgery,surgery,post-surgery,epilepsy,seizure,heart disease,cardiac,heart attack,angina,spinal injury,spine injury,back injury,severe back,neck injury,cervical,severe pain,chronic pain,osteoporosis,fracture,broken bone,arthritis,severe arthritis,menstruation,heavy period,sciatica,disc prolapse,slipped disc';
    
    this.unsafeKeywords = unsafeKeywordsStr.split(',').map(k => k.trim().toLowerCase());
    
    // Define safety rules with specific recommendations (including common misspellings)
    this.safetyRules = [
      {
        keywords: ['pregnant', 'pregnancy', 'expecting', 'trimester', 'pregnent', 'pregant', 'pregnacy', 'preganant', 'pregancy', 'pregnet'],
        category: 'pregnancy',
        warning: 'Pregnancy requires specialized yoga guidance.',
        recommendation: 'Consider prenatal yoga classes under expert supervision. Avoid inversions, deep twists, and abdominal compressions. Focus on gentle stretching, breathing exercises (pranayama), and modified poses suitable for your trimester.'
      },
      {
        keywords: ['hernia', 'inguinal hernia', 'umbilical hernia', 'hurnia', 'hernea', 'hurnea'],
        category: 'hernia',
        warning: 'Hernia conditions require medical clearance before practicing yoga.',
        recommendation: 'Avoid poses involving abdominal pressure, forward bends, and inversions. Instead, practice gentle breathing exercises, meditation, and consult your doctor before attempting any physical poses.'
      },
      {
        keywords: ['glaucoma', 'eye pressure', 'ocular', 'glaucomo', 'glaucoma', 'gluacoma', 'glucoma'],
        category: 'glaucoma',
        warning: 'Glaucoma requires special precautions in yoga practice.',
        recommendation: 'Strictly avoid inversions like headstands, shoulder stands, and downward-facing dog as they increase intraocular pressure. Practice gentle seated poses, breathing exercises, and meditation with medical supervision.'
      },
      {
        keywords: ['high blood pressure', 'hypertension', 'bp', 'blood pressure', 'hypertention', 'high bp', 'hi bp', 'bloodpressure'],
        category: 'hypertension',
        warning: 'High blood pressure requires careful pose selection.',
        recommendation: 'Avoid inversions, intense backbends, and breath retention practices. Practice gentle forward bends, restorative poses like Shavasana, and calming breathing techniques (like Anulom Vilom). Always practice under guidance.'
      },
      {
        keywords: ['surgery', 'recent surgery', 'post-surgery', 'operation', 'post-operative', 'surgry', 'surgary', 'sergery', 'surjery', 'operaton', 'opration'],
        category: 'post-surgery',
        warning: 'Post-surgical recovery requires medical clearance.',
        recommendation: 'Wait for complete healing and obtain clearance from your surgeon. Start with gentle breathing exercises and meditation only. Gradually introduce gentle movements under physiotherapist or yoga therapist guidance.'
      },
      {
        keywords: ['epilepsy', 'seizure', 'seizures', 'epilepsi', 'eplepsy', 'epilepcy', 'seizur', 'seisure', 'siezure'],
        category: 'epilepsy',
        warning: 'Epilepsy requires specialized yoga approach.',
        recommendation: 'Avoid rapid breathing exercises (Bhastrika, Kapalbhati), intense practices, and inversions. Practice gentle, calming yoga with focus on relaxation, meditation, and slow breathing under medical supervision.'
      },
      {
        keywords: ['heart disease', 'cardiac', 'heart attack', 'angina', 'heart condition', 'hart disease', 'heart desease', 'cardiak', 'hartattack', 'heart atack', 'angena', 'anjina'],
        category: 'cardiac',
        warning: 'Heart conditions require medical supervision.',
        recommendation: 'Avoid strenuous poses, inversions, and intense breathing exercises. Practice gentle, restorative poses, relaxation techniques, and meditation only after consulting your cardiologist.'
      },
      {
        keywords: ['spinal injury', 'spine injury', 'back injury', 'severe back', 'disc prolapse', 'slipped disc', 'herniated disc', 'spinel injury', 'spine injry', 'back injry', 'disc prolaps', 'sliped disc', 'hernated disc', 'disk prolapse'],
        category: 'spinal',
        warning: 'Spinal injuries require expert guidance and medical clearance.',
        recommendation: 'Avoid forward bends, deep backbends, twists, and inversions. Practice only under supervision of a qualified yoga therapist or physiotherapist who can provide modified, therapeutic poses.'
      },
      {
        keywords: ['neck injury', 'cervical', 'neck pain', 'severe neck', 'neck injry', 'nek injury', 'cervical pain', 'servikal', 'cervicle', 'nek pain'],
        category: 'neck',
        warning: 'Neck injuries require careful practice.',
        recommendation: 'Avoid shoulder stands, headstands, plow pose, and deep neck rotations. Practice gentle neck stretches, supported poses, and breathing exercises under expert guidance.'
      },
      {
        keywords: ['osteoporosis', 'bone density', 'brittle bones', 'osteoporsis', 'ostioporosis', 'osteoperosis', 'osteo porosis', 'brittle bone', 'weak bones'],
        category: 'osteoporosis',
        warning: 'Osteoporosis requires modified practice to prevent fractures.',
        recommendation: 'Avoid forward bends, deep twists, and high-impact movements. Focus on gentle weight-bearing poses, balance exercises, and strengthening practices under qualified supervision.'
      }
    ];
  }

  // LLM-based safety detection (primary method)
  async detectUnsafeConditionsWithLLM(query) {
    try {
      const prompt = `You are a medical safety analyzer for a yoga application. Analyze the following user query and determine if it mentions any medical conditions that require special precautions before practicing yoga.

QUERY: "${query}"

MEDICAL CONDITIONS TO DETECT (even with spelling mistakes or different phrasing):
- Pregnancy (pregnant, expecting, trimester, etc.)
- Hernia (any type)
- Glaucoma or eye pressure issues
- High blood pressure / hypertension
- Recent surgery or post-operative recovery
- Epilepsy or seizures
- Heart disease, cardiac issues, heart attack, angina
- Spinal injuries, disc problems, slipped disc
- Neck injuries or cervical issues
- Osteoporosis or brittle bones
- Any other serious medical condition

Respond ONLY with a valid JSON object in this exact format (no markdown, no additional text):
{
  "isUnsafe": true/false,
  "detectedCategories": ["category1", "category2"],
  "reasoning": "brief explanation"
}

Use these category names: "pregnancy", "hernia", "glaucoma", "hypertension", "post-surgery", "epilepsy", "cardiac", "spinal", "neck", "osteoporosis", "other"

If NO medical conditions are detected, respond:
{"isUnsafe": false, "detectedCategories": [], "reasoning": "No medical conditions detected"}`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();
      
      // Remove markdown code blocks if present
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      const llmResult = JSON.parse(cleanText);
      
      // Map detected categories to our safety rules
      const detectedConditions = [];
      if (llmResult.isUnsafe && llmResult.detectedCategories) {
        for (const category of llmResult.detectedCategories) {
          const rule = this.safetyRules.find(r => r.category === category);
          if (rule) {
            detectedConditions.push(rule);
          }
        }
      }

      console.log(`🤖 LLM Safety Detection: ${llmResult.isUnsafe ? '⚠️ UNSAFE' : '✅ SAFE'}`);
      if (llmResult.reasoning) {
        console.log(`   Reasoning: ${llmResult.reasoning}`);
      }

      return {
        isUnsafe: llmResult.isUnsafe,
        detectedConditions,
        detectedKeywords: llmResult.detectedCategories,
        method: 'llm'
      };
    } catch (error) {
      console.warn('⚠️ LLM safety detection failed, falling back to keyword matching:', error.message);
      // Fallback to keyword-based detection
      return this.detectUnsafeConditionsKeywordBased(query);
    }
  }

  // Keyword-based detection (fallback method)
  detectUnsafeConditionsKeywordBased(query) {
    const queryLower = query.toLowerCase();
    const detectedConditions = [];
    const detectedKeywords = [];

    // Check against all safety rules
    for (const rule of this.safetyRules) {
      for (const keyword of rule.keywords) {
        if (queryLower.includes(keyword)) {
          // Avoid duplicate conditions
          if (!detectedConditions.find(c => c.category === rule.category)) {
            detectedConditions.push(rule);
            detectedKeywords.push(keyword);
          }
          break;
        }
      }
    }

    const isUnsafe = detectedConditions.length > 0;

    console.log(`🔑 Keyword Safety Detection: ${isUnsafe ? '⚠️ UNSAFE' : '✅ SAFE'}`);

    return {
      isUnsafe,
      detectedConditions,
      detectedKeywords: [...new Set(detectedKeywords)], // Remove duplicates
      method: 'keyword'
    };
  }

  // Main detection method (uses LLM by default, keyword as fallback)
  async detectUnsafeConditions(query) {
    // Try LLM-based detection first
    return await this.detectUnsafeConditionsWithLLM(query);
  }

  generateSafetyResponse(query, detectedConditions) {
    if (detectedConditions.length === 0) {
      return null;
    }

    let response = `⚠️ **IMPORTANT SAFETY NOTICE** ⚠️\n\n`;
    response += `Your question mentions conditions that require special attention and professional guidance.\n\n`;

    // Add specific warnings and recommendations
    detectedConditions.forEach((condition, index) => {
      response += `**${index + 1}. ${condition.warning}**\n\n`;
      response += `📋 **Recommendation:** ${condition.recommendation}\n\n`;
    });

    // General disclaimer
    response += `---\n\n`;
    response += `**⚕️ Medical Disclaimer:**\n`;
    response += `This is not medical advice. Always consult your doctor, physiotherapist, or certified yoga therapist before starting any yoga practice, especially with pre-existing conditions. `;
    response += `A qualified professional can assess your specific situation and provide personalized modifications.\n\n`;
    response += `**✨ General Safe Practices:**\n`;
    response += `• Listen to your body and never push through pain\n`;
    response += `• Start slowly with gentle practices\n`;
    response += `• Focus on breathing and relaxation techniques\n`;
    response += `• Work one-on-one with a certified yoga therapist initially\n`;
    response += `• Keep your healthcare provider informed about your practice\n`;

    return response;
  }

  // Check if a query is safe for standard yoga recommendations
  async isSafeForStandardRecommendations(query) {
    const detection = await this.detectUnsafeConditions(query);
    return !detection.isUnsafe;
  }
}

// Singleton instance
const safetyService = new SafetyService();

export default safetyService;
