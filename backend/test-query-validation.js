import queryValidatorService from './src/services/queryValidatorService.js';
import dotenv from 'dotenv';

dotenv.config();

// Test queries - yoga-related and off-topic
const testQueries = [
  // YOGA-RELATED (should answer)
  {
    query: "What are the benefits of Surya Namaskar?",
    expected: "yoga_question"
  },
  {
    query: "How to do headstand safely?",
    expected: "yoga_question"
  },
  {
    query: "Yoga poses for back pain",
    expected: "yoga_question"
  },
  {
    query: "Breathing exercises for anxiety",
    expected: "yoga_question"
  },
  {
    query: "What is pranayama?",
    expected: "yoga_question"
  },
  
  // GREETINGS (should not answer with yoga info)
  {
    query: "Hello",
    expected: "greeting"
  },
  {
    query: "Hi, how are you?",
    expected: "greeting"
  },
  {
    query: "Good morning!",
    expected: "greeting"
  },
  
  // OFF-TOPIC (should reject)
  {
    query: "What is the weather today?",
    expected: "off_topic"
  },
  {
    query: "How do I cook pasta?",
    expected: "off_topic"
  },
  {
    query: "Write me a Python program",
    expected: "off_topic"
  },
  {
    query: "Who won the world cup?",
    expected: "off_topic"
  },
  {
    query: "Tell me a joke",
    expected: "off_topic"
  },
  {
    query: "What is 2+2?",
    expected: "off_topic"
  },
  
  // EDGE CASES
  {
    query: "Is yoga good?",
    expected: "yoga_question"
  },
  {
    query: "Can you help me?",
    expected: "unclear"
  }
];

async function runTests() {
  console.log('🧪 Testing LLM-based Query Validation\n');
  console.log('='.repeat(80));
  
  let passed = 0;
  let failed = 0;
  
  for (const test of testQueries) {
    console.log(`\n📝 Query: "${test.query}"`);
    console.log(`   Expected: ${test.expected}`);
    
    try {
      const result = await queryValidatorService.validateQuery(test.query);
      
      const match = result.intent === test.expected;
      
      if (match) {
        console.log(`   ✅ PASS`);
        passed++;
      } else {
        console.log(`   ❌ FAIL - Got: ${result.intent}`);
        failed++;
      }
      
      console.log(`   Yoga-related: ${result.isYogaRelated ? 'YES' : 'NO'}`);
      console.log(`   Should answer: ${result.shouldAnswer ? 'YES' : 'NO'}`);
      console.log(`   Confidence: ${(result.confidence * 100).toFixed(0)}%`);
      console.log(`   Reason: ${result.reason}`);
      
    } catch (error) {
      console.error(`   ❌ ERROR: ${error.message}`);
      failed++;
    }
    
    console.log('-'.repeat(80));
  }
  
  console.log(`\n📊 Test Results:`);
  console.log(`   ✅ Passed: ${passed}/${testQueries.length}`);
  console.log(`   ❌ Failed: ${failed}/${testQueries.length}`);
  console.log(`   Success Rate: ${((passed / testQueries.length) * 100).toFixed(1)}%\n`);
  
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
