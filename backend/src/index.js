import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import apiRoutes from './routes/api.js';
import vectorStore from './services/vectorStore.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration to allow Vercel preview URLs
const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL,
  // Allow Vercel preview deployments
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    // Remove trailing slash for comparison
    const normalizedOrigin = origin.replace(/\/$/, '');
    const normalizedAllowed = allowedOrigins.map(o => o?.replace(/\/$/, ''));
    
    // Check exact match or Vercel preview URL pattern (includes preview deployments)
    if (normalizedAllowed.includes(normalizedOrigin) || 
        normalizedOrigin.match(/^https:\/\/yoga[a-z0-9-]*\.vercel\.app$/)) {
      console.log('CORS allowed origin:', origin);
      return callback(null, true);
    }
    
    console.log('CORS blocked origin:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api', apiRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Yoga RAG API Server',
    version: '1.0.0',
    endpoints: {
      ask: 'POST /api/ask',
      feedback: 'POST /api/feedback',
      stats: 'GET /api/stats',
      health: 'GET /api/health'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Initialize and start server
async function startServer() {
  try {
    console.log('🚀 Starting Yoga RAG API Server...\n');

    // Connect to MongoDB
    await connectDB();

    // Initialize vector store
    console.log('\n🔄 Initializing vector store...');
    const initialized = await vectorStore.initialize();
    
    if (!initialized) {
      console.log('\n⚠️  Vector store not found!');
      console.log('📝 Please run: npm run init-embeddings');
      console.log('   This will build the vector store from yoga_knowledge.json\n');
    }

    // Start server
    app.listen(PORT, () => {
      console.log(`\n✅ Server is running on port ${PORT}`);
      console.log(`📡 API endpoint: http://localhost:${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
      console.log(`\n💡 Ready to answer yoga questions!\n`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

export default app;
