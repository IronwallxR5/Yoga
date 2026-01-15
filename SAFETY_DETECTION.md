# Safety Detection System - Documentation

## Overview

The Yoga RAG application now features an **intelligent safety detection system** that identifies medical conditions requiring professional guidance, **even when users misspell medical terms**.

## How It Works

### Two-Tier Detection System

1. **Primary: LLM-Based Detection** (Gemini AI)
   - Uses Google Gemini AI to analyze query intent
   - Understands context and natural language variations
   - Can detect conditions regardless of spelling

2. **Fallback: Enhanced Keyword Matching**
   - Includes 100+ common misspellings
   - Pattern matching for medical terms
   - Fast and reliable backup method

## Supported Misspellings

### Pregnancy
- ✅ pregnent, pregant, pregnacy, preganant, pregancy, pregnet

### Heart Conditions
- ✅ hart disease, heart desease, cardiak, hartattack, heart atack, angena, anjina

### Surgery
- ✅ surgry, surgary, sergery, surjery, operaton, opration

### Glaucoma
- ✅ glaucomo, gluacoma, glucoma

### Hernia
- ✅ hurnia, hernea, hurnea

### Hypertension
- ✅ hypertention, high bp, hi bp, bloodpressure

### Epilepsy
- ✅ epilepsi, eplepsy, epilepcy, seizur, seisure, siezure

### Spinal Injuries
- ✅ spinel injury, spine injry, disc prolaps, sliped disc, hernated disc

### Neck Injuries
- ✅ neck injry, nek injury, servikal, cervicle, nek pain

### Osteoporosis
- ✅ osteoporsis, ostioporosis, osteoperosis, weak bones

## Implementation Details

### File: `backend/src/services/safetyService.js`

```javascript
// LLM-based detection with fallback
async detectUnsafeConditions(query) {
  try {
    // Try LLM first (best accuracy)
    return await this.detectUnsafeConditionsWithLLM(query);
  } catch (error) {
    // Fallback to keyword matching (includes misspellings)
    return this.detectUnsafeConditionsKeywordBased(query);
  }
}
```

## Testing

Run the test suite to verify detection:

```bash
cd backend
node test-safety.js
```

### Example Test Output

```
📝 Query: "Can I do yoga if I'm pregnent?"
🔑 Keyword Safety Detection: ⚠️ UNSAFE
   ⚠️  UNSAFE - Categories: pregnent
   Method: keyword

📝 Query: "I have hart disease, can I do yoga?"
🔑 Keyword Safety Detection: ⚠️ UNSAFE
   ⚠️  UNSAFE - Categories: hart disease
   Method: keyword
```

## Benefits

1. **User Safety**: Catches unsafe queries even with typos
2. **Better UX**: Users don't get wrong advice due to spelling mistakes
3. **Reliability**: Two-tier system ensures detection always works
4. **Extensible**: Easy to add more medical conditions and variations

## Configuration

Misspellings are hard-coded in `safetyService.js` for reliability, but base keywords can be modified in `.env`:

```env
UNSAFE_KEYWORDS=pregnant,pregnancy,hernia,glaucoma,hypertension,surgery
```

## Future Enhancements

- [ ] Add phonetic matching (soundex algorithm)
- [ ] Machine learning for automatic misspelling detection
- [ ] Support for multiple languages
- [ ] Context-aware detection (e.g., "heart of yoga" vs "heart disease")
