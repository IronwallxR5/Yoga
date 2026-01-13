import { pipeline } from '@xenova/transformers';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class EmbeddingService {
  constructor() {
    this.embedder = null;
    this.modelName = process.env.EMBEDDING_MODEL || 'Xenova/all-MiniLM-L6-v2';
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log(`🔄 Loading embedding model: ${this.modelName}...`);
      
      // Create embedding pipeline using feature-extraction
      this.embedder = await pipeline('feature-extraction', this.modelName);
      
      this.isInitialized = true;
      console.log('✅ Embedding model loaded successfully');
    } catch (error) {
      console.error('❌ Error loading embedding model:', error);
      throw error;
    }
  }

  async generateEmbedding(text) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Generate embedding
      const output = await this.embedder(text, { pooling: 'mean', normalize: true });
      
      // Convert to regular array
      const embedding = Array.from(output.data);
      
      return embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }

  async generateBatchEmbeddings(texts) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const embeddings = [];
    
    for (let i = 0; i < texts.length; i++) {
      if (i % 10 === 0) {
        console.log(`Processing embedding ${i + 1}/${texts.length}...`);
      }
      const embedding = await this.generateEmbedding(texts[i]);
      embeddings.push(embedding);
    }

    return embeddings;
  }

  // Cosine similarity for comparing embeddings
  cosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }
}

// Singleton instance
const embeddingService = new EmbeddingService();

export default embeddingService;
