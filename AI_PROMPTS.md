# 🤖 Agentic AI Development Log & Prompt History

This document serves as a comprehensive record of the **Chain-of-Thought (CoT)** prompts and **Agentic Instructions** used to engineer the Yoga RAG Micro-App. 

Each prompt below was crafted to enforce strict architectural patterns, safety guardrails, and aesthetic guidelines.

---

## 🏗️ Phase 1: Architecture & System Design

### 🔹 Prompt 1: RAG Pipeline Architecture
**Objective:** Define a robust RAG system dependent on local embedding generation.

> **Role**: Senior Solutions Architect
> **Task**: Design a Retrieval-Augmented Generation (RAG) pipeline for a sensitive health-related domain (Yoga).
> **Constraints**:
> 1.  **Privacy First**: Use local embedding generation (`@xenova/transformers`) to minimize external API filtering.
> 2.  **Safety Layer**: The system MUST detect medical queries (prenatal, injury-related) BEFORE hitting the LLM.
> 3.  **Data Structure**: Define a JSON schema for the Knowledge Base that separates "Instruction" from "Contraindications" to allow for precise safety filtering.
>
> **Output Requirement**: 
> - A mermaid.js sequence diagram showing the flow: `User -> Safety Check -> Vector Search -> Context Assembly -> LLM`.
> - A MongoDB schema definition for `QueryLog` that captures `isUnsafe`, `detectedConditions`, and `retrievedChunks` for auditability.

---

## 🛡️ Phase 2: Safety & Compliance Engineering

### 🔹 Prompt 2: Medical Safety Barrier Implementation
**Objective:** Implement the mandatory safety layer to prevent harmful advice.

> **Role**: Senior Backend Engineer (Security Focus)
> **Task**: Implement a `SafetyService` class in Node.js that acts as a middleware firewall for user queries.
> **Requirements**:
> 1.  **Keyword Dictionary**: Create a robust dictionary mapping sensitive keywords (e.g., "hernia", "glaucoma", "pregnancy", "sciatica", "high blood pressure") to specific warning messages.
> 2.  **Strict Mode**: If ANY keyword is detected, the service must return a structured "Safety Response" object immediately.
> 3.  **Logging**: All blocked queries must be flagged `isUnsafe: true` in the database.
> 4.  **Tone**: The warning messages must be authoritative yet empathetic (e.g., "Please consult a medical professional...").
>
> **Deliverable**: A robust `detectSafetyIssues(query)` function and a `generateSafetyResponse(warnings)` function.

---

## ⚙️ Phase 3: Backend Implementation

### 🔹 Prompt 3: Vector Store Service (Hybrid Architecture)
**Objective:** Create a vector storage service that supports local processing and easy migration.

> **Role**: Backend Developer
> **Task**: Build a `VectorStore` service class.
> **Specifications**:
> -   **Input**: `yoga_knowledge.json` (Array of articles).
> -   **Processing**: 
>     1.  Chunk documents (keep Title + Instructions + Precautions together).
>     2.  Generate embeddings using local `Xenova/all-MiniLM-L6-v2`.
>     3.  Store vectors in-memory (or local file) for MVP, but structure the code to allow swapping with **Pinecone** later.
> -   **Search**: Implement Cosine Similarity search returning the top 5 matches with a score > 0.4.
>
> **Note**: Ensure the service initializes asynchronously and caches the model to prevent reloading on every request.

---

## 🎨 Phase 4: Frontend & Zen Aesthetics

### 🔹 Prompt 4: UI/UX & Theming ("Zen Mode")
**Objective:** Create a calming, trustworthy interface that aligns with the yoga brand.

> **Role**: Lead UI/UX Designer / Frontend Engineer
> **Task**: overhaul the React frontend `App.css` to implement a "Zen + Yoga" visual language.
> **Design Rules**:
> 1.  **Color Palette**: 
>     -   *Primary*: Sage Green (`#6b9080`)
>     -   *Secondary*: Soft Cream (`#f4f1ea`)
>     -   *Accent*: Earthy Tan (`#D2B48C`) for safety warnings (replacing aggressive red/orange).
> 2.  **Typography**: Use **Quicksand** for headers (friendly, rounded) and **Lato** for body text (legible).
> 3.  **Feedback Loop**: The UI must clearly separate "AI Answer", "Safety Notice", and "Sources". The Safety Notice must look consistent with the theme but distinctly important.
> 4.  **Micro-interactions**: buttons should have soft shadows and smooth scale transitions on hover.
>
> **Deliverable**: CSS variables and component styles that transform the "Dark Mode" aesthetic into a "Morning Yoga Studio" vibe.

---

## 🧠 Phase 5: AI Integration & Prompt Engineering

### 🔹 Prompt 5: The System Prompt
**Objective:** Instruct the LLM to act as a responsible yoga guide.

> **Context**: You are a knowledgeable and cautious Yoga Instructor.
> **Task**: Answer the user's question using ONLY the provided context snippets.
> **Rules**:
> 1.  **Strict Grounding**: If the answer is not in the context, state "I cannot find this information in the official Common Yoga Protocol."
> 2.  **Safety First**: If the user mentions pain or injury, PREPEND the answer with "Please listen to your body and stop if you feel pain."
> 3.  **Citation**: explicitely mention the name of the Asana (Pose) when describing steps.
> 4.  **Tone**: Calm, encouraging, and precise.
>
> **Input Context**: {{context_chunks}}
> **User Question**: {{user_query}}

---

## ☁️ Phase 6: Cloud Migration (Pinecone)

### 🔹 Prompt 6: Scalability Refactor
**Objective:** Migrate vector storage to the cloud for scalability.

> **Role**: DevOps Engineer
> **Task**: Refactor `vectorStore.js` to replace the local file-based storage with **Pinecone Vector Database**.
> **Requirements**:
> 1.  **Client Initialization**: Implement robust connection logic that handles "Index Already Exists" race conditions gracefully.
> 2.  **Batch Processing**: The `buildVectorStore` function must upload vectors in batches of 50 to avoid rate limits.
> 3.  **Environment Config**: Use `process.env.PINECONE_API_KEY` and `PINECONE_INDEX`.
> 4.  **Verification**: Write a script to verify that the remote index count matches the local document count.

---
