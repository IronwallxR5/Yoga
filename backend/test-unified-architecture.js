import unifiedQueryReviewer from './src/services/unifiedQueryReviewer.js';

// Test queries for the unified review system
const testQueries = [
  {
    query: "What are the benefits of Surya Namaskar?",
    expected: { intent: 'yoga_question', shouldProceed: true, isUnsafe: false }
  },
  {
    query: "Can I do yoga during pregnancy?",
    expected: { intent: 'medical_query', shouldProceed: false, isUnsafe: true }
  },
  {
    query: "Hello!",
    expected: { intent: 'greeting', shouldProceed: false, isUnsafe: false }
  },
  {
    query: "What's the weather today?",
    expected: { intent: 'off_topic', shouldProceed: false, isUnsafe: false }
  },
  {
    query: "How to cook pasta?",
    expected: { intent: 'off_topic', shouldProceed: false, isUnsafe: false }
  },
  {
    query: "I have heart disease, can I do yoga?",
    expected: { intent: 'medical_query', shouldProceed: false, isUnsafe: true }
  },
  {
    query: "Yoga poses for back pain",
    expected: { intent: 'yoga_question', shouldProceed: true, isUnsafe: false }
  },
  {
    query: "What is pranayama?",
    expected: { intent: 'yoga_question', shouldProceed: true, isUnsafe: false }
  }
];

async function runArchitectureTest() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 TESTING UNIFIED QUERY REVIEW ARCHITECTURE');
  console.log('='.repeat(80));
  
  let passed = 0;
  let failed = 0;
  
  for (const test of testQueries) {
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`📝 QUERY: "${test.query}"`);
    console.log(`   Expected: ${test.expected.intent} | Should Proceed: ${test.expected.shouldProceed} | Unsafe: ${test.expected.isUnsafe}`);
    
    try {
      const review = await unifiedQueryReviewer.reviewQuery(test.query);
      
      const intentMatch = review.intent === test.expected.intent;
      const proceedMatch = review.shouldProceed === test.expected.shouldProceed;
      const safetyMatch = review.isUnsafe === test.expected.isUnsafe;
      
      const allMatch = intentMatch && proceedMatch && safetyMatch;
      
      if (allMatch) {
        console.log(`\n   ✅ PASS - All checks match!`);
        passed++;
      } else {
        console.log(`\n   ❌ FAIL - Mismatch:`);
        if (!intentMatch) console.log(`      Intent: expected ${test.expected.intent}, got ${review.intent}`);
        if (!proceedMatch) console.log(`      Proceed: expected ${test.expected.shouldProceed}, got ${review.shouldProceed}`);
        if (!safetyMatch) console.log(`      Safety: expected ${test.expected.isUnsafe}, got ${review.isUnsafe}`);
        failed++;
      }
      
      console.log(`\n   📊 Review Details:`);
      console.log(`      • Intent: ${review.intent}`);
      console.log(`      • Should Proceed: ${review.shouldProceed ? '✅ YES' : '❌ NO'}`);
      console.log(`      • Is Unsafe: ${review.isUnsafe ? '⚠️ YES' : '✅ NO'}`);
      console.log(`      • Yoga Related: ${review.isYogaRelated ? '✅ YES' : '❌ NO'}`);
      console.log(`      • Confidence: ${(review.confidence * 100).toFixed(0)}%`);
      console.log(`      • Method: ${review.method}`);
      console.log(`      • Reason: ${review.reason}`);
      if (review.detectedMedicalConditions.length > 0) {
        console.log(`      • Medical Conditions: ${review.detectedMedicalConditions.join(', ')}`);
      }
      console.log(`      • Recommendation: ${review.recommendation}`);
      
    } catch (error) {
      console.error(`   ❌ ERROR: ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📊 ARCHITECTURE TEST RESULTS`);
  console.log(`='.repeat(80)}`);
  console.log(`   ✅ Passed: ${passed}/${testQueries.length}`);
  console.log(`   ❌ Failed: ${failed}/${testQueries.length}`);
  console.log(`   Success Rate: ${((passed / testQueries.length) * 100).toFixed(1)}%`);
  console.log(`='.repeat(80)}\n`);
  
  // Show architecture flow
  console.log(`\n📐 ARCHITECTURE FLOW:`);
  console.log(`
┌─────────────────────────┐
│   User Sends Query      │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│  STEP 1: Unified LLM Review             │
│  ├─ Check: Yoga-related?                │
│  ├─ Check: Medical/Unsafe?              │
│  └─ Check: Intent (greeting/off-topic)  │
└──────────┬──────────────────────────────┘
           │
           ├─── isUnsafe = true ──────────────────┐
           │                                      │
           ├─── intent = 'greeting' ─────────────┤
           │                                      │
           ├─── intent = 'off_topic' ────────────┤
           │                                      │
           └─── shouldProceed = true             │
                     │                            │
                     ▼                            ▼
        ┌────────────────────────┐    ┌──────────────────────┐
        │  STEP 2: Vector Search │    │  Return Appropriate  │
        │  (Pinecone/RAG)        │    │  Message Immediately │
        └────────┬───────────────┘    │  • Safety Warning    │
                 │                     │  • Greeting          │
                 ▼                     │  • Off-topic Notice  │
        ┌────────────────────────┐    └──────────────────────┘
        │  STEP 3: AI Generation │
        │  (Gemini with Context) │
        └────────┬───────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │  STEP 4: Log to DB     │
        └────────┬───────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │  STEP 5: Send Response │
        └────────────────────────┘
`);
  
  process.exit(failed > 0 ? 1 : 0);
}

runArchitectureTest();
