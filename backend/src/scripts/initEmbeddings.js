import path from 'path';
import { fileURLToPath } from 'url';
import vectorStore from '../services/vectorStore.js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

async function initializeEmbeddings() {
  try {
    console.log('\n🚀 Initializing Vector Store for Yoga RAG\n');
    console.log('=' .repeat(60));
    
    // Path to knowledge base
    const knowledgeBasePath = path.join(__dirname, '../../../resources', 'yoga_knowledge.json');
    console.log(`📂 Knowledge base path: ${knowledgeBasePath}\n`);

    // Build vector store
    console.log('🔨 Building vector store...\n');
    const result = await vectorStore.buildVectorStore(knowledgeBasePath);

    console.log('\n' + '='.repeat(60));
    console.log('✅ Vector Store Initialization Complete!\n');
    console.log(`📊 Statistics:`);
    console.log(`   • Documents indexed: ${result.documentsCount}`);
    console.log(`   • Embedding dimension: ${result.embeddingDimension}`);
    console.log(`   • Model used: ${process.env.EMBEDDING_MODEL || 'Xenova/all-MiniLM-L6-v2'}`);
    console.log(`\n💾 Vector store saved to: ${process.env.VECTOR_STORE_PATH || './vector_store'}`);
    console.log('\n🎉 You can now start the server with: npm start\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error initializing embeddings:', error);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run initialization
initializeEmbeddings();
