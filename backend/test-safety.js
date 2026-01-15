import safetyService from './src/services/safetyService.js';

// Test queries with various spellings and phrasings
const testQueries = [
  // Correct spelling
  "Can I do yoga during pregnancy?",
  
  // Misspellings
  "Can I do yoga if I'm pregnent?",
  "Is yoga safe when you're pregant?",
  "I am pregnet, can I practice yoga?",
  
  // Different phrasing
  "I'm expecting a baby, is yoga okay?",
  "I'm in my second trimester, which poses should I avoid?",
  
  // Heart issues with typos
  "I have hart disease, can I do yoga?",
  "Recent heart atack - yoga safe?",
  
  // Surgery with typos
  "Had surgry last month, when can I start yoga?",
  "Post operaton recovery - yoga?",
  
  // Other conditions
  "I have glucoma, what poses to avoid?",
  "Hernea patient - yoga recommendations?",
  
  // Safe queries
  "What are the benefits of Surya Namaskar?",
  "How to do headstand?",
  "Yoga for stress relief"
];

async function runTests() {
  console.log('🧪 Testing LLM-based Safety Detection\n');
  console.log('='.repeat(80));
  
  for (const query of testQueries) {
    console.log(`\n📝 Query: "${query}"`);
    
    try {
      const result = await safetyService.detectUnsafeConditions(query);
      
      if (result.isUnsafe) {
        console.log(`   ⚠️  UNSAFE - Categories: ${result.detectedKeywords.join(', ')}`);
        console.log(`   Method: ${result.method}`);
      } else {
        console.log(`   ✅ SAFE`);
        console.log(`   Method: ${result.method}`);
      }
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }
    
    console.log('-'.repeat(80));
  }
  
  console.log('\n✅ Testing complete!\n');
  process.exit(0);
}

runTests();
