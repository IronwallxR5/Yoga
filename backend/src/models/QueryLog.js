import mongoose from 'mongoose';

const queryLogSchema = new mongoose.Schema({
  query: {
    type: String,
    required: true,
    trim: true
  },
  retrievedChunks: [{
    id: String,
    title: String,
    source: String,
    info: String,
    score: Number
  }],
  answer: {
    type: String,
    required: true
  },
  isUnsafe: {
    type: Boolean,
    default: false
  },
  safetyWarnings: [{
    type: String
  }],
  detectedKeywords: [{
    type: String
  }],
  model: {
    type: String,
    default: 'gpt-3.5-turbo'
  },
  responseTime: {
    type: Number, // milliseconds
    required: true
  },
  feedback: {
    helpful: {
      type: Boolean,
      default: null
    },
    comment: {
      type: String,
      default: ''
    }
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
queryLogSchema.index({ timestamp: -1 });
queryLogSchema.index({ isUnsafe: 1 });
queryLogSchema.index({ query: 'text' });

export default mongoose.model('QueryLog', queryLogSchema);
