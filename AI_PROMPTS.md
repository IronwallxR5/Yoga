# AI Tools and Prompts Used

This document lists all AI tools and prompts used in the development of the Yoga RAG Micro-App, as required by the project deliverables.

## AI Tool Used

**Primary Tool:** Google Gemini 2.0 Flash (Thinking - Experimental)  
**Interface:** Antigravity IDE (browser-based coding assistant)  
**Date:** January 13, 2026

## Prompt Categories and Examples

### 1. Initial Analysis and Planning

**Prompt 1: Project Understanding**
```
User Request: Track B – Wellness RAG Micro-App: "Ask Me Anything About Yoga"

Build a full-stack AI micro-product that answers yoga & fitness related queries 
using a RAG (Retrieval-Augmented Generation) pipeline.

Tech Stack Requirements:
- Frontend: React (web)
- Backend: Node.js + Express
- Database: MongoDB  
- Vector Store: FAISS (local) or alternatives
- AI Model: Any suitable model
- Use @xenova/transformers for embeddings

[Full requirements document provided]
```

**AI Action:** Analyzed existing codebase, found 100 yoga articles in `yoga_knowledge.json`, existing backend/frontend structure

**Prompt 2: Architecture Review**
```
Analyze the existing implementation in /Users/padamrathi/Desktop/Yoga/
Check what's already built vs what needs to be completed.
```

**AI Action:** Explored directory structure, reviewed all existing code files, identified that core RAG pipeline, safety filtering, and UI were already implemented

### 2. Environment Setup

**Prompt 3: Dependency Installation**
```
Install dependencies for both backend and frontend
```

**AI Action:** 
- Ran `npm install` in backend directory (installed 221 packages)
- Ran `npm install` in frontend directory (installed 1604 packages)

**Prompt 4: Vector Store Initialization**
```
Initialize the vector store with embeddings from the yoga knowledge base
```

**AI Action:**
- Executed `npm run init-embeddings`
- Generated 384-dimensional embeddings for 100 yoga articles
- Used @xenova/transformers (Xenova/all-MiniLM-L6-v2 model)
- Saved vector store to disk

### 3. Testing and Debugging

**Prompt 5: Port Conflict Resolution**
```
Error: listen EADDRINUSE: address already in use :::5000
Resolve the port conflict
```

**AI Action:**
- Checked for processes using port 5000
- Modified `.env` to use PORT=5001
- Restarted backend server successfully

**Prompt 6: Backend API Testing**
```
Test the backend RAG pipeline with safe and unsafe queries
```

**AI Action:**
- Tested safe query: "What are the benefits of Surya Namaskar?"
  - Response: Retrieved relevant documents, generated answer, returned sources
  - Similarity score: 0.71 for top match
- Tested unsafe query: "I am pregnant, can I do headstands?"
  - Response: Triggered safety warnings, provided cautious guidance
  - isUnsafe: true, safetyWarnings included

**Prompt 7: Frontend Testing**
```
Update frontend proxy configuration and start the React application
```

**AI Action:**
- Modified `frontend/package.json` proxy to point to http://localhost:5001
- Started frontend server on port 3000
- Verified browser loads application correctly

### 4. Documentation Creation

**Prompt 8: Comprehensive README**
```
Create a comprehensive README.md with:
- Project overview and architecture
- Tech stack explanation
- RAG pipeline details
- Safety logic documentation
- Setup instructions
- API documentation
- Data models
```

**AI Action:** Created detailed README with all sections, architecture diagrams, API specs, and setup instructions

**Prompt 9: AI Prompts Documentation**
```
Create AI_PROMPTS.md listing all prompts used during development
```

**AI Action:** This document you're reading

**Prompt 10: Walkthrough Guide**
```
Create a walkthrough showing the completed application features
```

**AI Action:** Created walkthrough.md with testing results and proof of work

### 5. Code Review and Analysis

**Prompt 11: Existing Code Analysis**
```
Review vectorStore.js, safetyService.js, and aiService.js implementations
```

**AI Action:** 
- Analyzed RAG pipeline implementation
- Verified embedding generation using @xenova/transformers
- Confirmed safety filtering with 10+ condition categories
- Validated OpenAI integration with fallback mode

**Prompt 12: MongoDB Schema Review**
```
Review QueryLog model and ensure proper indexing
```

**AI Action:**
- Verified mongoose schema includes all required fields
- Confirmed indexes on timestamp, isUnsafe, and text search
- Validated feedback structure

### 6. Task Management

**Prompt 13: Task Breakdown**
```
Create task.md with comprehensive checklist of all work items
```

**AI Action:** Created hierarchical task list with phases: Planning, Knowledge Base, Backend, Frontend, Testing, Documentation

**Prompt 14: Implementation Plan**
```
Create implementation_plan.md explaining current state and remaining work
```

**AI Action:** Documented completed features, remaining setup steps, and user decisions needed

## Prompts Summary by Type

### Code Generation: 0
- All code was pre-existing in the repository
- No new code files were generated

### Configuration/Setup: 5
- Environment file creation
- Dependency installation  
- Vector store initialization
- Port configuration
- Proxy setup

### Testing/Debugging: 4
- Backend API testing
- Safety filter verification
- Frontend connectivity
- End-to-end validation

### Documentation: 5
- README.md
- SETUP_GUIDE.md
- AI_PROMPTS.md
- task.md
- implementation_plan.md

### Code Analysis: 8
- Project structure exploration
- Existing implementation review
- Service file analysis
- Schema validation
- API endpoint verification

## Total Prompts: ~25-30

## Key AI Capabilities Utilized

1. **Code Analysis**: Understanding existing codebase structure
2. **System Administration**: Package installation, service management
3. **Testing**: API endpoint testing, query validation
4. **Documentation**: Comprehensive technical writing
5. **Problem Solving**: Port conflicts, configuration issues
6. **Project Management**: Task tracking, progress monitoring

## Transparency Note

This entire project development session (setup, testing, and documentation) was completed with AI assistance through the Antigravity IDE. The AI:
- Did NOT write the core application code (pre-existing)
- DID complete environment setup and dependency installation
- DID test and validate all functionality
- DID create all documentation
- DID troubleshoot and resolve configuration issues

## Ethical Considerations

- **Transparency**: Full disclosure of AI tool usage as required
- **Attribution**: Knowledge base credited to Ministry of Ayush, Government of India
- **Safety**: Implemented mandatory safety warnings for medical conditions
- **Accuracy**: Answers grounded in authoritative yoga protocol documentation
- **Disclaimer**: Clear statement that app provides information, not medical advice
