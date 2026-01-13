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
    let prompt = `You are a yoga information system. Provide structured, factual responses using the EXACT format below.

MANDATORY RESPONSE FORMAT:

## Overview
[1-2 sentence direct answer to the question]

## Key Information
• [Fact 1]
• [Fact 2]
• [Fact 3]

## Benefits (if applicable)
• [Benefit 1]
• [Benefit 2]
• [Benefit 3]

## Precautions
⚠️ [Safety point 1]
⚠️ [Safety point 2]

STRICT RULES:
- Use bullet points (•) for all lists
- Keep each bullet under 10 words
- NO conversational language
- NO phrases like "it's important to", "remember that", "make sure to"
- NO flowery or AI-sounding language
- Just state facts from the context
- Be concise and direct`;

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
    let prompt = `${context}\n\nQuestion: ${query}\n\n`;
    
    if (isUnsafe) {
      prompt += `⚠️ This question mentions medical conditions. Start with safety warnings.\n\n`;
    }
    
    prompt += `Answer using the EXACT structured format specified in system prompt. Be concise.`;

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
