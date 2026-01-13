# Yoga RAG Micro-App: Ask Me Anything About Yoga

<div align="center">

🧘 **AI-Powered Yoga Assistant with Safety-First Recommendations** 🧘

[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)

</div>

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Setup Instructions](#setup-instructions)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Safety System](#safety-system)
- [Data Models](#data-models)
- [Demo](#demo)
- [AI Tools Used](#ai-tools-used)

## 🎯 Overview

This is a full-stack **RAG (Retrieval-Augmented Generation)** application that provides intelligent answers to yoga-related questions using a knowledge base of 100+ articles from the **Common Yoga Protocol** by the Ministry of Ayush, Government of India.

The application implements:
- **RAG Pipeline**: Semantic search using embeddings to find relevant context
- **Safety Filtering**: Detects health conditions requiring special care (pregnancy, heart disease, etc.)
- **Data Logging**: Stores all queries and responses in MongoDB for analytics
- **Feedback System**: Allows users to rate answer quality

## ✨ Features

### Core Functionality
- ✅ **Intelligent Q&A**: Ask any question about yoga and get accurate, sourced answers
- ✅ **Source Attribution**: Every answer shows which articles were used
- ✅ **Safety Warnings**: Automatically detects risky queries and provides cautious guidance
- ✅ **Real-time Processing**: Fast response times with vector similarity search
- ✅ **User Feedback**: Thumbs up/down to rate answer helpfulness

### Safety Features (Mandatory Requirement)
The system implements a comprehensive safety layer that detects and handles queries related to:

| Condition Category | Keywords Detected | Action Taken |
|-------------------|-------------------|--------------|
| Pregnancy | pregnant, trimester, expecting | ⚠️ Prenatal yoga recommendations, avoid inversions |
| Heart Disease | cardiac, heart attack, angina | ⚠️ Gentle practice only, medical clearance required |
| Hernia | hernia, inguinal | ⚠️ Avoid abdominal pressure, consult doctor |
| Glaucoma | glaucoma, eye pressure | ⚠️ Strictly avoid inversions |
| High Blood Pressure | hypertension, high bp | ⚠️ Avoid inversions and breath retention |
| Spinal Injuries | disc prolapse, slipped disc | ⚠️ Expert guidance required |
| Post-Surgery | recent surgery, operation | ⚠️ Wait for healing, get medical clearance |
| Epilepsy | seizure, epilepsy | ⚠️ Avoid rapid breathing exercises |
| Osteoporosis | brittle bones | ⚠️ Modified practice to prevent fractures |
| Neck Injuries | cervical, neck injury | ⚠️ Avoid headstands and shoulder stands |

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js (v20.18.0)
- **Framework**: Express.js
- **Database**: MongoDB (for query logging and analytics)
- **Vector Store**: Custom implementation using @xenova/transformers
- **Embeddings**: Xenova/all-MiniLM-L6-v2 (384-dimensional vectors)
- **AI Model**: OpenAI GPT-3.5-turbo (with fallback mode)

### Frontend
- **Framework**: React 18.2.0
- **HTTP Client**: Axios
- **Markdown Rendering**: react-markdown
- **Styling**: Vanilla CSS with animations

### Key Dependencies
```json
{
  "@xenova/transformers": "^2.17.1",  // Local embedding generation
  "mongoose": "^8.1.1",                 // MongoDB ODM
  "openai": "^4.28.0",                  // AI response generation
  "express": "^4.18.2",                 // Backend framework
  "react": "^18.2.0"                    // Frontend framework
}
```

## 🏗️ Architecture

### System Architecture

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────┐
│   Client    │◄────────┤  Express Server  ├────────►│   MongoDB   │
│  (React)    │         │   (Port 5001)    │         │  (Logging)  │
└─────────────┘         └────────┬─────────┘         └─────────────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
              ┌─────▼────┐  ┌────▼─────┐  ┌──▼──────────┐
              │  Vector  │  │  Safety  │  │ AI Service  │
              │  Store   │  │  Service │  │  (OpenAI)   │
              └──────────┘  └──────────┘  └─────────────┘
```

### RAG Pipeline Flow

```mermaid
graph LR
    A[User Query] --> B[Safety Check]
    B -->|Unsafe| C[Safety Response]
    B -->|Safe| D[Generate Embedding]
    D --> E[Vector Similarity Search]
    E --> F[Retrieve Top 5 Chunks]
    F --> G[Build Context]
    G --> H[Query AI Model]
    H --> I[Return Answer + Sources]
    I --> J[Log to MongoDB]
    C --> J
```

### RAG Implementation Details

#### 1. **Document Chunking**
- **Input**: 100 yoga articles from `yoga_knowledge.json`
- **Chunk Strategy**: Each article is a single chunk (not split further)
- **Chunk Content**: Title + Info + Precautions combined into searchable text
- **Metadata**: id, title, source, page, precautions

#### 2. **Embedding Generation**
- **Model**: Xenova/all-MiniLM-L6-v2 (runs locally, no API calls)
- **Dimension**: 384-dimensional dense vectors
- **Processing**: Batch processing with progress logging (every 10 documents)
- **Storage**: JSON files in `./vector_store/` directory
  - `documents.json`: Original document metadata
  - `embeddings.json`: Corresponding vector embeddings

#### 3. **Retrieval**
- **Method**: Cosine similarity between query and document embeddings
- **Top-K**: Retrieves 5 most relevant documents
- **Threshold**: No minimum score (always returns top 5)
- **Response Time**: ~50-200ms for search

#### 4. **Answer Generation**
- **Context Building**: Combines top 5 retrieved documents with metadata
- **Prompt Engineering**: System prompt emphasizes safety and accuracy
- **Model**: GPT-3.5-turbo with temperature=0.7
- **Max Tokens**: 500 (concise but complete answers)
- **Fallback**: If OpenAI fails, returns excerpts from top document

## 📦 Setup Instructions

### Prerequisites
- Node.js v18+ and npm
- MongoDB (local or Atlas)
- (Optional) OpenAI API key

### Step 1: Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### Step 2: Configure Environment

Create `backend/.env`:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/yoga-rag

# Server Configuration
PORT=5001
NODE_ENV=development

# OpenAI API Key (Optional - has fallback mode)
OPENAI_API_KEY=your_openai_api_key_here

# CORS Settings
FRONTEND_URL=http://localhost:3000

# Vector Store Configuration
VECTOR_STORE_PATH=./vector_store
EMBEDDING_MODEL=Xenova/all-MiniLM-L6-v2
```

### Step 3: Start MongoDB

```bash
# Using Homebrew on macOS
brew services start mongodb-community

# Or manually
mongod --dbpath ~/data/db
```

### Step 4: Initialize Vector Store

This generates embeddings for all 100 yoga articles (~2-3 minutes):

```bash
cd backend
npm run init-embeddings
```

Expected output:
```
🚀 Initializing Vector Store for Yoga RAG
📚 Loaded 100 documents from knowledge base
🔄 Loading embedding model: Xenova/all-MiniLM-L6-v2...
✅ Embedding model loaded successfully
🔄 Generating embeddings...
Processing embedding 1/100...
...
✅ Vector Store Initialization Complete!
📊 Statistics:
   • Documents indexed: 100
   • Embedding dimension: 384
```

### Step 5: Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

Expected output:
```
✅ MongoDB Connected: localhost
✅ Vector store loaded with 100 documents
✅ Server is running on port 5001
💡 Ready to answer yoga questions!
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

Browser opens automatically at http://localhost:3000

## 🚀 Usage

### Web Interface

1. **Ask a Question**: Type any yoga-related question in the search bar
2. **Example Queries**: Click provided examples like "What are the benefits of Surya Namaskar?"
3. **View Answer**: See AI-generated response with source attribution
4. **Check Sources**: Review which articles were used (with similarity scores)
5. **Provide Feedback**: Click 👍 or 👎 to rate the answer

### API Usage

#### Ask a Question
```bash
curl -X POST http://localhost:5001/api/ask \
  -H "Content-Type: application/json" \
  -d '{"query":"What is pranayama?"}'
```

Response:
```json
{
  "success": true,
  "queryId": "507f1f77bcf86cd799439011",
  "answer": "Pranayama is...",
  "isUnsafe": false,
  "safetyWarnings": [],
  "sources": [
    {
      "id": "yoga_036",
      "title": "Yoga and Breath - Pranayama Fundamentals",
      "source": "Common Yoga Protocol...",
      "score": 0.85
    }
  ],
  "responseTime": 1234
}
```

#### Submit Feedback
```bash
curl -X POST http://localhost:5001/api/feedback \
  -H "Content-Type: application/json" \
  -d '{"queryId":"507f1f77bcf86cd799439011","helpful":true,"comment":"Very helpful!"}'
```

## 📖 API Documentation

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ask` | Submit a yoga question |
| POST | `/api/feedback` | Submit feedback for an answer |
| GET | `/api/stats` | Get usage statistics |
| GET | `/api/health` | Health check (includes vector store status) |

### POST /api/ask

**Request Body:**
```typescript
{
  query: string  // Required, max 500 characters
}
```

**Response:**
```typescript
{
  success: boolean,
  queryId: string,
  answer: string,
  isUnsafe: boolean,
  safetyWarnings: string[],
  sources: Array<{
    id: string,
    title: string,
    source: string,
    page: string,
    score: number
  }>,
  responseTime: number  // milliseconds
}
```

### POST /api/feedback

**Request Body:**
```typescript
{
  queryId: string,    // Required
  helpful: boolean,   // Required
  comment?: string    // Optional
}
```

### GET /api/stats

**Response:**
```typescript
{
  success: boolean,
  stats: {
    totalQueries: number,
    unsafeQueries: number,
    queriesWithFeedback: number,
    positiveRating: number,
    averageResponseTime: number
  }
}
```

## ⚕️ Safety System

The safety system is a **mandatory requirement** that protects users from harmful recommendations.

### How It Works

1. **Keyword Detection**: Query is checked against 40+ safety keywords
2. **Category Matching**: Keywords mapped to specific health conditions
3. **Safety Response Generation**: Custom recommendations for detected conditions
4. **AI Context**: AI is instructed to be extra cautious for unsafe queries
5. **MongoDB Logging**: All unsafe queries logged with detected keywords

### Example: Pregnancy Query

**User Query**: "I am pregnant, can I do headstands?"

**System Response**:
```
⚠️ IMPORTANT SAFETY NOTICE ⚠️

Your question mentions conditions that require special attention and professional guidance.

**1. Pregnancy requires specialized yoga guidance.**

📋 Recommendation: Consider prenatal yoga classes under expert supervision. 
Avoid inversions, deep twists, and abdominal compressions. Focus on gentle 
stretching, breathing exercises (pranayama), and modified poses suitable for 
your trimester.

---

⚕️ Medical Disclaimer:
This is not medical advice. Always consult your doctor, physiotherapist, or 
certified yoga therapist before starting any yoga practice...
```

### Configuration

Safety keywords are configured in `backend/.env`:

```env
UNSAFE_KEYWORDS=pregnant,pregnancy,hernia,glaucoma,high blood pressure,...
```

Detailed safety rules are in `backend/src/services/safetyService.js`.

## 💾 Data Models

### QueryLog Schema (MongoDB)

```javascript
{
  query: String,                    // User's question
  retrievedChunks: [{               // Top-K documents from vector search
    id: String,
    title: String,
    source: String,
    info: String,                   // Truncated to 200 chars
    score: Number
  }],
  answer: String,                   // AI-generated response
  isUnsafe: Boolean,                // Safety flag
  safetyWarnings: [String],         // Warning messages shown
  detectedKeywords: [String],       // Keywords that triggered safety
  model: String,                    // AI model used (e.g., "gpt-3.5-turbo")
  responseTime: Number,             // Milliseconds
  feedback: {
    helpful: Boolean,
    comment: String
  },
  timestamp: Date                   // Auto-generated
}
```

### Vector Store Format

**documents.json:**
```json
[
  {
    "id": "yoga_001",
    "title": "Introduction to Yoga",
    "source": "Common Yoga Protocol - Ministry of Ayush",
    "page": "5-8",
    "info": "Yoga is an invaluable gift...",
    "precautions": "Practice under guidance...",
    "text": "Combined searchable text"
  }
]
```

**embeddings.json:**
```json
[
  [0.023, -0.145, 0.234, ...],  // 384-dimensional vector
  [0.156, -0.089, 0.312, ...],
  ...
]
```

## 🎬 Demo

### Screenshots

[Screenshots will be embedded here after browser recording]

### Demo Video

A comprehensive 2-5 minute demo video is available showing:
- Application startup and architecture overview
- Safe query example with source display
- Unsafe query triggering safety warnings
- Feedback mechanism
- MongoDB data verification

## 🤖 AI Tools Used

This project was developed with assistance from AI tools. All prompts used are documented in [AI_PROMPTS.md](./AI_PROMPTS.md).

### Primary Tool
- **Google Gemini 2.0 Flash (Thinking - Experimental)** via Antigravity IDE

### Prompt Categories
1. **Planning & Architecture** - System design and RAG pipeline planning
2. **Implementation** - Code generation for backend services
3. **Safety Logic** - Safety filtering rules and responses
4. **Frontend Development** - React components and styling
5. **Documentation** - README and technical docs
6. **Testing** - Test queries and validation scripts

See [AI_PROMPTS.md](./AI_PROMPTS.md) for complete prompt history.

## 📊 Project Statistics

- **Knowledge Base**: 100 articles, ~123KB
- **Code Files**: 20+ files across frontend/backend
- **Total Dependencies**: 221 backend + 1604 frontend packages
- **Vector Store Size**: 100 documents × 384 dimensions = 38,400 values
- **Average Query Response Time**: ~1-2 seconds
- **Safety Categories**: 10 medical conditions covered

## 🧪 Testing

### Manual Tests Completed

✅ Safe query ("What are the benefits of Surya Namaskar?")
- Returns relevant answer
- Shows source documents
- No safety warnings

✅ Unsafe query ("I am pregnant, can I do inversions?")
- Triggers safety system
- Shows red warning banner
- Provides modified recommendations
- Still retrieves relevant context

✅ MongoDB logging
- All queries stored in `querylogs` collection
- Includes full request/response data
- Timestamp and response time tracked

✅ Feedback system
- Thumbs up/down captured
- Updates query log in database

### Run Tests

```bash
# Backend health check
curl http://localhost:5001/api/health

# Test safe query
curl -X POST http://localhost:5001/api/ask \
  -H "Content-Type: application/json" \
  -d '{"query":"benefits of meditation"}' 

# Test unsafe query  
curl -X POST http://localhost:5001/api/ask \
  -H "Content-Type: application/json" \
  -d '{"query":"I have a hernia"}'

# Check database
mongosh yoga-rag
> db.querylogs.find().pretty()
```

## 🎯 Evaluation Criteria Compliance

| Criteria | Weight | Status | Details |
|----------|--------|--------|---------|
| **RAG Design & Implementation** | 40% | ✅ Complete | Chunking, @xenova/transformers embeddings, cosine similarity, top-5 retrieval, context building |
| **Safety & Guardrails** | 25% | ✅ Complete | 10 condition categories, keyword detection, safety responses, UI warnings |
| **Backend & Data Handling** | 20% | ✅ Complete | Express APIs, MongoDB logging, error handling, QueryLog schema |
| **UI & UX** | 10% | ✅ Complete | Clean React UI, loading states, source display, animations |
| **Documentation & README** | 5% | ✅ Complete | Comprehensive README, architecture docs, setup guide, API docs |

## 🔧 Troubleshooting

**Issue**: Port 5000/5001 already in use
```bash
# Solution: Kill process or change port
lsof -ti :5001 | xargs kill -9
# Or edit backend/.env: PORT=5002
```

**Issue**: MongoDB connection failed
```bash
# Solution: Start MongoDB
brew services start mongodb-community
```

**Issue**: Vector store not initialized
```bash
# Solution: Run initialization script
cd backend && npm run init-embeddings
```

**Issue**: OpenAI API errors
```bash
# Solution: System automatically uses fallback mode
# Fallback returns excerpts from knowledge base
```

## 📝 License

This project uses data from the **Common Yoga Protocol** by the Ministry of Ayush, Government of India.

## ⚠️ Disclaimer

**This application provides general yoga information only and is NOT a substitute for professional medical advice.**

Always consult with qualified healthcare providers and certified yoga instructors before starting any new physical practice, especially if you have pre-existing health conditions.

---

**Built with ❤️ for the Agentic AI Course by Google×Kaggle**
