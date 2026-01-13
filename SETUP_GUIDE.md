# Yoga RAG Application - Setup Guide

## ✅ Completed Setup Steps

1. **Dependencies Installed**
   - Backend: 221 packages ✓
   - Frontend: 1604 packages ✓

2. **MongoDB Status**
   - MongoDB is installed and running ✓
   - Service: `mongodb-community started`

## 📝 Next Steps to Complete Setup

### Step 1: Create .env File

Copy the `.env.example` to `.env` in the backend directory:

```bash
cd /Users/padamrathi/Desktop/Yoga/backend
cp .env.example .env
```

Then edit `/Users/padamrathi/Desktop/Yoga/backend/.env` and update:

```env
# If you have an OpenAI API key, add it here:
OPENAI_API_KEY=sk-your-actual-openai-key-here

# Or leave as is to use fallback mode (extracts from knowledge base)
OPENAI_API_KEY=your_openai_api_key_here
```

**Note**: The application works in fallback mode without an OpenAI key - it will return relevant excerpts from the knowledge base instead of AI-generated responses.

### Step 2: Initialize Vector Store

Run the embedding initialization script:

```bash
cd /Users/padamrathi/Desktop/Yoga/backend
npm run init-embeddings
```

This will:
- Load all 100 yoga articles from `yoga_knowledge.json`
- Generate embeddings using @xenova/transformers
- Save the vector store to `./vector_store/`
- Takes approximately 2-3 minutes

### Step 3: Start the Backend

```bash
cd /Users/padamrathi/Desktop/Yoga/backend
npm start
```

Expected output:
- ✅ MongoDB connected successfully
- ✅ Vector store loaded with 100 documents
- ✅ Server is running on port 5000

### Step 4: Start the Frontend

In a new terminal:

```bash
cd /Users/padamrathi/Desktop/Yoga/frontend
npm start
```

This will open http://localhost:3000 in your browser.

## 🧪 Testing the Application

### Test Safe Query
Ask: "What are the benefits of Surya Namaskar?"
- Should return detailed answer with sources
- Should show sources used

### Test Unsafe Query
Ask: "I am pregnant, can I do headstands?"
- Should show red safety warning
- Should recommend prenatal yoga
- Should advise consulting a doctor

### Test Feedback
- Click thumbs up or down on any answer
- This logs feedback to MongoDB

## 📊 Monitoring

Check MongoDB logs:
```bash
mongosh yoga-rag
db.querylogs.find().pretty()
```

Check API health:
```bash
curl http://localhost:5000/api/health
```

## ⚠️ Troubleshooting

**Port 5000 already in use:**
```bash
# Change PORT in .env file
PORT=5001
```

**MongoDB connection error:**
```bash
# Check if MongoDB is running
brew services list | grep mongodb

# Start if needed
brew services start mongodb-community
```

**Vector store not initialized:**
```bash
# Run the init script
npm run init-embeddings
```
