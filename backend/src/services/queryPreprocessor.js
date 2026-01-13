import dotenv from 'dotenv';

dotenv.config();

class QueryPreprocessor {
  constructor() {
    // Common yoga query expansions
    this.expansions = {
      'pranayama': 'pranayama breathing exercises breath control',
      'asana': 'asana yoga pose posture',
      'meditation': 'meditation dhyana mindfulness concentration',
      'surya namaskar': 'surya namaskar sun salutation sequence',
      'shavasana': 'shavasana corpse pose relaxation',
      'headstand': 'headstand sirsasana inversion',
      'backbend': 'backbend backward bending spine flexibility',
    };

    // Query cleaning patterns
    this.stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'what', 'how', 'can', 'i', 'do']);
  }

  preprocess(query) {
    if (!query || typeof query !== 'string') {
      return query;
    }

    let processed = query.toLowerCase().trim();

    // Expand common yoga terms
    for (const [term, expansion] of Object.entries(this.expansions)) {
      if (processed.includes(term)) {
        processed = processed.replace(term, expansion);
      }
    }

    // Handle questions to extract intent
    if (processed.startsWith('what is')) {
      processed = processed.replace('what is', '').trim();
    } else if (processed.startsWith('how to')) {
      processed = processed.replace('how to', '').trim() + ' steps technique';
    } else if (processed.includes('benefits of')) {
      processed = processed.replace('benefits of', '') + ' benefits advantages';
    }

    // Add context for short queries
    if (processed.split(' ').length <= 2) {
      processed += ' yoga practice information';
    }

    return processed;
  }

  // Extract key entities (pose names, conditions, etc.)
  extractEntities(query) {
    const entities = {
      poses: [],
      conditions: [],
      practices: []
    };

    const queryLower = query.toLowerCase();

    // Common pose patterns
    const posePatterns = ['asana', 'pose', 'namaskar', 'mudra'];
    posePatterns.forEach(pattern => {
      if (queryLower.includes(pattern)) {
        entities.poses.push(pattern);
      }
    });

    // Medical conditions (for safety)
    const conditionPatterns = ['pregnant', 'pregnancy', 'hernia', 'glaucoma', 'blood pressure'];
    conditionPatterns.forEach(pattern => {
      if (queryLower.includes(pattern)) {
        entities.conditions.push(pattern);
      }
    });

    return entities;
  }
}

// Singleton instance
const queryPreprocessor = new QueryPreprocessor();

export default queryPreprocessor;
