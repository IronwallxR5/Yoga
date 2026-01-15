import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

class AIService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  async generateAnswer(query, retrievedChunks, isUnsafe = false) {
    // List of models to try in order
    const modelsToTry = ['gemini-1.5-flash', 'gemini-pro', 'gemini-1.0-pro'];

    for (const modelName of modelsToTry) {
      try {
        console.log(`Attempting to generate with model: ${modelName}`);
        const model = this.genAI.getGenerativeModel({ model: modelName });
        
        // Build context from retrieved chunks
        const context = this.buildContext(retrievedChunks);

        // Build system prompt
        const systemPrompt = this.buildSystemPrompt(isUnsafe);

        // Build user prompt
        const userPrompt = this.buildUserPrompt(query, context, isUnsafe);

        // Combine prompts
        const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

        // Call Gemini API
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        return response.text();
      } catch (error) {
        console.warn(`Failed with model ${modelName}:`, error.message);
        // Continue to next model
      }
    }

    // If all models fail, return fallback response
    console.error('All Gemini models failed. Returning fallback response.');
    return this.generateFallbackResponse(query, retrievedChunks);
  }

  buildContext(retrievedChunks) {
    if (!retrievedChunks || retrievedChunks.length === 0) {
      return 'No specific information found in the knowledge base.';
    }

    let context = '--- KNOWLEDGE BASE CONTEXT ---\n\n';
    
    retrievedChunks.forEach((chunk, index) => {
      context += `[${index + 1}] ${chunk.title}\n`;
      context += `${chunk.info}\n`;
      if (chunk.precautions) {
        context += `Precautions: ${chunk.precautions}\n`;
      }
      context += `\n`;
    });

    return context;
  }

  buildSystemPrompt(isUnsafe) {
    let prompt = `You are an expert yoga knowledge system providing precise, accurate information from the Common Yoga Protocol (Ministry of Ayush, Government of India).

CRITICAL INSTRUCTIONS:
1. Answer ONLY based on the provided context from the knowledge base
2. Be SPECIFIC and DIRECT - no vague or general statements
3. If context has specific instructions, include them exactly
4. Do NOT add information not present in the context
5. Do NOT make assumptions or generalizations

MANDATORY RESPONSE FORMAT:

## Overview
[1-2 sentences directly answering the question using information from context]

## Key Information
• [Specific fact from context]
• [Specific fact from context]
• [Specific fact from context]

## Benefits (if applicable and mentioned in context)
• [Specific benefit from context]
• [Specific benefit from context]
• [Specific benefit from context]

## Precautions (if mentioned in context)
⚠️ [Specific precaution from context]
⚠️ [Specific precaution from context]

STRICT RULES:
- Use bullet points (•) for all lists
- Each bullet: maximum 12 words
- NO conversational phrases like "it's important to", "remember that", "make sure to", "always", "never forget"
- NO generic advice not from context
- NO flowery or AI-sounding language
- ONLY use facts explicitly stated in the provided context
- If context lacks information for a section, skip that section
- Be precise and factual, not motivational`;

    if (isUnsafe) {
      prompt += `\n\n⚠️ MEDICAL ALERT MODE:
Start with:

## ⚠️ Medical Condition Detected

This question mentions a health condition requiring professional guidance.

## Required Steps
• Consult doctor before practicing
• Get medical clearance
• Practice only with certified yoga therapist
• Inform instructor of your condition

Then provide general information if available from context.`;
    }

    return prompt;
  }

  buildUserPrompt(query, context, isUnsafe) {
    let prompt = `${context}\n\n---\n\nUser Question: ${query}\n\n`;
    
    if (isUnsafe) {
      prompt += `⚠️ IMPORTANT: This question mentions medical conditions. Start response with safety warnings as specified.\n\n`;
    }
    
    prompt += `Instructions:
1. Read the context carefully
2. Extract ONLY relevant information that directly answers the question
3. Use the exact structured format from system prompt
4. Be precise - cite specific details from context
5. If context doesn't fully answer the question, say so (don't make up information)
6. Keep answer focused and concise

Generate your response now:`;

    return prompt;
  }

  generateFallbackResponse(query, retrievedChunks) {
    // Simple fallback when AI API is not available
    if (!retrievedChunks || retrievedChunks.length === 0) {
      return `## Overview\nLimited information available about "${query}" in the knowledge base.\n\n## Recommendation\n• Consult Common Yoga Protocol by Ministry of Ayush\n• Practice under certified yoga instructor`;
    }

    const topChunk = retrievedChunks[0];
    let response = `## ${topChunk.title}\n\n`;
    response += `${topChunk.info}\n\n`;
    
    if (topChunk.precautions) {
      response += `## Precautions\n⚠️ ${topChunk.precautions}\n\n`;
    }

    response += `## Recommendation\n• Practice under supervision\n• Consult certified yoga instructor`;

    return response;
  }
}

// Singleton instance
const aiService = new AIService();

export default aiService;
