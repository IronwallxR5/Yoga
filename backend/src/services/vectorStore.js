import { Pinecone } from '@pinecone-database/pinecone';
import fs from 'fs/promises';
import embeddingService from './embeddingService.js';
import queryPreprocessor from './queryPreprocessor.js';
import dotenv from 'dotenv';

dotenv.config();

class VectorStore {
  constructor() {
    this.client = null;
    this.index = null;
    this.indexName = process.env.PINECONE_INDEX || 'yoga-rag';
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) {
      return true;
    }

    try {
      console.log('🌲 Initializing Pinecone connection...');
      this.client = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY
      });

      // Check if index exists
      const existingIndexes = await this.client.listIndexes();
      const indexExists = existingIndexes.indexes?.some(idx => idx.name === this.indexName);

      if (!indexExists) {
        console.log(`⚠️ Index "${this.indexName}" not found. Creating new serverless index...`);
        try {
          await this.client.createIndex({
            name: this.indexName,
            dimension: 384, // Xenova/all-MiniLM-L6-v2 dimension
            metric: 'cosine',
            spec: { 
              serverless: { 
                cloud: 'aws', 
                region: 'us-east-1' 
              }
            }
          });
          console.log('✅ Index created successfully. Waiting for initialization...');
          // Wait a moment for index to be ready
          await new Promise(resolve => setTimeout(resolve, 10000));
        } catch (createError) {
          // If error is "Resource already exists", we can ignore it and proceed
          if (createError.message?.includes('already exists') || createError.status === 409) {
            console.log('⚠️ Index already exists (race condition), proceeding...');
          } else {
            throw createError;
          }
        }
      }

      this.index = this.client.index(this.indexName);
      this.isInitialized = true;
      console.log('✅ Connected to Pinecone index:', this.indexName);
      return true;
    } catch (error) {
      console.error('❌ Error initializing Pinecone:', error);
      return false;
    }
  }

  async buildVectorStore(knowledgeBasePath) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log('🔨 Preparing documents for Pinecone ingestion...');
      
      // Load knowledge base
      const knowledgeData = await fs.readFile(knowledgeBasePath, 'utf-8');
      const knowledgeBase = JSON.parse(knowledgeData);

      console.log(`📚 Loaded ${knowledgeBase.length} documents from knowledge base`);

      // Prepare documents with embeddings
      const documents = knowledgeBase.map(doc => ({
        id: doc.id,
        text: `${doc.title}. ${doc.info} Precautions: ${doc.precautions}`,
        metadata: {
          title: doc.title,
          source: doc.source,
          page: doc.page,
          info: doc.info, // Original info for display
          precautions: doc.precautions
        }
      }));

      // Initialize embedding service
      await embeddingService.initialize();

      console.log('🔄 Generating embeddings and upserting to Pinecone...');
      
      // Batch process to avoid hitting limits
      const BATCH_SIZE = 50;
      
      for (let i = 0; i < documents.length; i += BATCH_SIZE) {
        const batchDocs = documents.slice(i, i + BATCH_SIZE);
        const batchTexts = batchDocs.map(d => d.text);
        
        // Generate embeddings
        const embeddings = await embeddingService.generateBatchEmbeddings(batchTexts);

        // Prepare vectors for Pinecone
        const vectors = batchDocs.map((doc, idx) => ({
          id: doc.id,
          values: embeddings[idx],
          metadata: {
            ...doc.metadata,
            text: doc.text // Store text for context retrieval
          }
        }));

        // Upsert to Pinecone
        await this.index.upsert(vectors);
        console.log(`✅ Upserted batch ${Math.floor(i / BATCH_SIZE) + 1} (${vectors.length} vectors)`);
      }

      console.log('✅ Pinecone population complete!');
      
      return {
        success: true,
        documentsCount: documents.length
      };

    } catch (error) {
      console.error('Error building vector store:', error);
      throw error;
    }
  }

  async search(query, topK = 5) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Preprocess query
      const processedQuery = queryPreprocessor.preprocess(query);
      console.log(`Original query: "${query}"`);
      console.log(`Processed query: "${processedQuery}"`);

      // Generate embedding
      const queryEmbedding = await embeddingService.generateEmbedding(processedQuery);

      // Query Pinecone
      const queryResponse = await this.index.query({
        vector: queryEmbedding,
        topK,
        includeMetadata: true
      });

      // Format results
      console.log(`Top ${topK} results:`);
      const results = queryResponse.matches.map((match, i) => {
        console.log(`  ${i + 1}. ${match.metadata.title} (score: ${match.score.toFixed(3)})`);
        return {
          id: match.id,
          score: match.score,
          // Unpack metadata fields
          title: match.metadata.title,
          source: match.metadata.source,
          page: match.metadata.page,
          info: match.metadata.info,
          precautions: match.metadata.precautions,
          text: match.metadata.text
        };
      });

      return results;

    } catch (error) {
      console.error('Error searching vector store:', error);
      throw error;
    }
  }
}

// Singleton instance
const vectorStore = new VectorStore();

export default vectorStore;
