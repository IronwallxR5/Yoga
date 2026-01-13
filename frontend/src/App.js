import React, { useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import './App.css';

function App() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  const examples = [
    'Benefits of Surya Namaskar',
    'How to do Shavasana',
    'Yoga for back pain',
  ];

  const handleSubmit = async (q = query) => {
    if (!q.trim()) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const result = await axios.post('/api/ask', { query: q });
      setResponse(result.data);
      setQuery(''); // Clear input after submission
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to get answer');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (helpful) => {
    if (!response?.queryId) return;
    try {
      await axios.post('/api/feedback', {
        queryId: response.queryId,
        helpful
      });
      alert('Thank you for your feedback!');
    } catch (err) {
      console.error('Feedback error:', err);
    }
  };

  return (
    <div className="App">
      {/* Chat Messages Area */}
      <div className="messages-container">
        {!response && !loading && !error && (
          <div className="welcome-message">
            <div className="example-prompts">
              {examples.map((ex, i) => (
                <button
                  key={i}
                  className="example-prompt"
                  onClick={() => handleSubmit(ex)}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Response */}
        {response && (
          <div className="message-group">
            {/* Safety Warning */}
            {response.isUnsafe && (
              <div className="safety-warning">
                <div className="warning-header">⚠️ SAFETY NOTICE</div>
                <div className="warning-content">
                  <ReactMarkdown>{response.answer}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* Normal Answer */}
            {!response.isUnsafe && (
              <div className="answer-message">
                <ReactMarkdown>{response.answer}</ReactMarkdown>
                <div className="response-footer">
                  <span className="response-time">{response.responseTime}ms</span>
                </div>
              </div>
            )}

            {/* Sources */}
            {response.sources && response.sources.length > 0 && (
              <div className="sources-section">
                <div className="sources-header">📚 Sources</div>
                {response.sources.map((src, i) => (
                  <div key={i} className="source-item">
                    <div className="source-title">{src.title}</div>
                    <div className="source-meta">
                      {src.source.split('-')[0].trim()} • Page {src.page} • {(src.score * 100).toFixed(0)}%
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Feedback */}
            {!response.isUnsafe && (
              <div className="feedback-row">
                <button onClick={() => handleFeedback(true)}>👍</button>
                <button onClick={() => handleFeedback(false)}>👎</button>
              </div>
            )}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="loading-message">
            <div className="spinner"></div>
            <span>Searching knowledge base...</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Input Area (Fixed at Bottom) */}
      <div className="input-container">
        <div className="input-wrapper">
          <input
            type="text"
            className="query-input"
            placeholder="Ask about yoga..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            disabled={loading}
          />
          <button
            className="send-button"
            onClick={() => handleSubmit()}
            disabled={loading || !query.trim()}
          >
            ➤
          </button>
        </div>
        <div className="disclaimer">
          ⚕️ Not medical advice • Based on Common Yoga Protocol
        </div>
      </div>
    </div>
  );
}

export default App;
