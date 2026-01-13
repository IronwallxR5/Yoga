import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import embeddingService from './embeddingService.js';
import queryPreprocessor from './queryPreprocessor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class VectorStore {
  constructor() {
    this.documents = [];
    this.embeddings = [];
    this.isInitialized = false;
    this.vectorStorePath = process.env.VECTOR_STORE_PATH || './vector_store';
  }

  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      // Try to load existing vector store
      const loaded = await this.loadVectorStore();
      
      if (!loaded) {
        console.log('📦 No existing vector store found. Please run initialization script.');
        // Don't throw error, just mark as not initialized
        return false;
      }

      this.isInitialized = true;
      console.log(`✅ Vector store loaded with ${this.documents.length} documents`);
      return true;
    } catch (error) {
      console.error('Error initializing vector store:', error);
      return false;
    }
  }

  async buildVectorStore(knowledgeBasePath) {
    try {
      console.log('🔨 Building vector store from knowledge base...');
      
      // Load knowledge base
      const knowledgeData = await fs.readFile(knowledgeBasePath, 'utf-8');
      const knowledgeBase = JSON.parse(knowledgeData);

      console.log(`📚 Loaded ${knowledgeBase.length} documents from knowledge base`);

      // Prepare documents
      this.documents = knowledgeBase.map(doc => ({
        id: doc.id,
        title: doc.title,
        source: doc.source,
        page: doc.page,
        info: doc.info,
        precautions: doc.precautions,
        // Create searchable text combining all fields
        text: `${doc.title}. ${doc.info} Precautions: ${doc.precautions}`
      }));

      // Initialize embedding service
      await embeddingService.initialize();

      // Generate embeddings for all documents
      console.log('🔄 Generating embeddings...');
      const texts = this.documents.map(doc => doc.text);
      this.embeddings = await embeddingService.generateBatchEmbeddings(texts);

      // Save vector store to disk
      await this.saveVectorStore();

      this.isInitialized = true;
      console.log('✅ Vector store built and saved successfully');
      
      return {
        success: true,
        documentsCount: this.documents.length,
        embeddingDimension: this.embeddings[0].length
      };
    } catch (error) {
      console.error('Error building vector store:', error);
      throw error;
    }
  }

  async saveVectorStore() {
    try {
      // Create directory if it doesn't exist
      await fs.mkdir(this.vectorStorePath, { recursive: true });

      // Save documents
      await fs.writeFile(
        path.join(this.vectorStorePath, 'documents.json'),
        JSON.stringify(this.documents, null, 2)
      );

      // Save embeddings
      await fs.writeFile(
        path.join(this.vectorStorePath, 'embeddings.json'),
        JSON.stringify(this.embeddings, null, 2)
      );

      console.log('💾 Vector store saved to disk');
    } catch (error) {
      console.error('Error saving vector store:', error);
      throw error;
    }
  }

  async loadVectorStore() {
    try {
      const documentsPath = path.join(this.vectorStorePath, 'documents.json');
      const embeddingsPath = path.join(this.vectorStorePath, 'embeddings.json');

      // Check if files exist
      try {
        await fs.access(documentsPath);
        await fs.access(embeddingsPath);
      } catch {
        return false;
      }

      // Load documents
      const documentsData = await fs.readFile(documentsPath, 'utf-8');
      this.documents = JSON.parse(documentsData);

      // Load embeddings
      const embeddingsData = await fs.readFile(embeddingsPath, 'utf-8');
      this.embeddings = JSON.parse(embeddingsData);

      return true;
    } catch (error) {
      console.error('Error loading vector store:', error);
      return false;
    }
  }

  async search(query, topK = 5) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.isInitialized) {
      throw new Error('Vector store not initialized. Please run initialization script.');
    }

    try {
      // Preprocess query for better matching
      const processedQuery = queryPreprocessor.preprocess(query);
      console.log(`Original query: "${query}"`);
      console.log(`Processed query: "${processedQuery}"`);

      // Generate embedding for the processed query
      const queryEmbedding = await embeddingService.generateEmbedding(processedQuery);

      // Calculate similarity scores
      const scores = this.embeddings.map((docEmbedding, index) => ({
        index,
        score: embeddingService.cosineSimilarity(queryEmbedding, docEmbedding)
      }));

      // Sort by score (descending) and get top K
      scores.sort((a, b) => b.score - a.score);
      const topResults = scores.slice(0, topK);

      // Log retrieval results
      console.log(`Top ${topK} results:`);
      topResults.forEach((result, i) => {
        console.log(`  ${i + 1}. ${this.documents[result.index].title} (score: ${result.score.toFixed(3)})`);
      });

      // Return documents with scores
      return topResults.map(result => ({
        ...this.documents[result.index],
        score: result.score
      }));
    } catch (error) {
      console.error('Error searching vector store:', error);
      throw error;
    }
  }
}

// Singleton instance
const vectorStore = new VectorStore();

export default vectorStore;
