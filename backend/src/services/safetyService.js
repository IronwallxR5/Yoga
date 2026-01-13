import dotenv from 'dotenv';

dotenv.config();

class SafetyService {
  constructor() {
    // Load unsafe keywords from environment or use defaults
    const unsafeKeywordsStr = process.env.UNSAFE_KEYWORDS || 
      'pregnant,pregnancy,first trimester,second trimester,third trimester,expecting,hernia,glaucoma,high blood pressure,hypertension,recent surgery,surgery,post-surgery,epilepsy,seizure,heart disease,cardiac,heart attack,angina,spinal injury,spine injury,back injury,severe back,neck injury,cervical,severe pain,chronic pain,osteoporosis,fracture,broken bone,arthritis,severe arthritis,menstruation,heavy period,sciatica,disc prolapse,slipped disc';
    
    this.unsafeKeywords = unsafeKeywordsStr.split(',').map(k => k.trim().toLowerCase());
    
    // Define safety rules with specific recommendations
    this.safetyRules = [
      {
        keywords: ['pregnant', 'pregnancy', 'expecting', 'trimester'],
        category: 'pregnancy',
        warning: 'Pregnancy requires specialized yoga guidance.',
        recommendation: 'Consider prenatal yoga classes under expert supervision. Avoid inversions, deep twists, and abdominal compressions. Focus on gentle stretching, breathing exercises (pranayama), and modified poses suitable for your trimester.'
      },
      {
        keywords: ['hernia', 'inguinal hernia', 'umbilical hernia'],
        category: 'hernia',
        warning: 'Hernia conditions require medical clearance before practicing yoga.',
        recommendation: 'Avoid poses involving abdominal pressure, forward bends, and inversions. Instead, practice gentle breathing exercises, meditation, and consult your doctor before attempting any physical poses.'
      },
      {
        keywords: ['glaucoma', 'eye pressure', 'ocular'],
        category: 'glaucoma',
        warning: 'Glaucoma requires special precautions in yoga practice.',
        recommendation: 'Strictly avoid inversions like headstands, shoulder stands, and downward-facing dog as they increase intraocular pressure. Practice gentle seated poses, breathing exercises, and meditation with medical supervision.'
      },
      {
        keywords: ['high blood pressure', 'hypertension', 'bp', 'blood pressure'],
        category: 'hypertension',
        warning: 'High blood pressure requires careful pose selection.',
        recommendation: 'Avoid inversions, intense backbends, and breath retention practices. Practice gentle forward bends, restorative poses like Shavasana, and calming breathing techniques (like Anulom Vilom). Always practice under guidance.'
      },
      {
        keywords: ['surgery', 'recent surgery', 'post-surgery', 'operation', 'post-operative'],
        category: 'post-surgery',
        warning: 'Post-surgical recovery requires medical clearance.',
        recommendation: 'Wait for complete healing and obtain clearance from your surgeon. Start with gentle breathing exercises and meditation only. Gradually introduce gentle movements under physiotherapist or yoga therapist guidance.'
      },
      {
        keywords: ['epilepsy', 'seizure', 'seizures'],
        category: 'epilepsy',
        warning: 'Epilepsy requires specialized yoga approach.',
        recommendation: 'Avoid rapid breathing exercises (Bhastrika, Kapalbhati), intense practices, and inversions. Practice gentle, calming yoga with focus on relaxation, meditation, and slow breathing under medical supervision.'
      },
      {
        keywords: ['heart disease', 'cardiac', 'heart attack', 'angina', 'heart condition'],
        category: 'cardiac',
        warning: 'Heart conditions require medical supervision.',
        recommendation: 'Avoid strenuous poses, inversions, and intense breathing exercises. Practice gentle, restorative poses, relaxation techniques, and meditation only after consulting your cardiologist.'
      },
      {
        keywords: ['spinal injury', 'spine injury', 'back injury', 'severe back', 'disc prolapse', 'slipped disc', 'herniated disc'],
        category: 'spinal',
        warning: 'Spinal injuries require expert guidance and medical clearance.',
        recommendation: 'Avoid forward bends, deep backbends, twists, and inversions. Practice only under supervision of a qualified yoga therapist or physiotherapist who can provide modified, therapeutic poses.'
      },
      {
        keywords: ['neck injury', 'cervical', 'neck pain', 'severe neck'],
        category: 'neck',
        warning: 'Neck injuries require careful practice.',
        recommendation: 'Avoid shoulder stands, headstands, plow pose, and deep neck rotations. Practice gentle neck stretches, supported poses, and breathing exercises under expert guidance.'
      },
      {
        keywords: ['osteoporosis', 'bone density', 'brittle bones'],
        category: 'osteoporosis',
        warning: 'Osteoporosis requires modified practice to prevent fractures.',
        recommendation: 'Avoid forward bends, deep twists, and high-impact movements. Focus on gentle weight-bearing poses, balance exercises, and strengthening practices under qualified supervision.'
      }
    ];
  }

  detectUnsafeConditions(query) {
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

    return {
      isUnsafe,
      detectedConditions,
      detectedKeywords: [...new Set(detectedKeywords)] // Remove duplicates
    };
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
  isSafeForStandardRecommendations(query) {
    const detection = this.detectUnsafeConditions(query);
    return !detection.isUnsafe;
  }
}

// Singleton instance
const safetyService = new SafetyService();

export default safetyService;
