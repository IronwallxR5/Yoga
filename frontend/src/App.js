import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import './App.css';

function App() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [showColdStartWarning, setShowColdStartWarning] = useState(false);

  useEffect(() => {
    // Check if user has visited before
    const hasVisited = localStorage.getItem('hasVisitedYogaApp');
    if (!hasVisited) {
      setShowColdStartWarning(true);
      localStorage.setItem('hasVisitedYogaApp', 'true');
    }
  }, []);



  const handleSubmit = async (q = query) => {
    if (!q.trim()) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    // Use environment variable for API URL or fall back to relative path (proxy)
    const apiUrl = process.env.REACT_APP_API_URL || '';

    try {
      const result = await axios.post(`${apiUrl}/api/ask`, { query: q });
      setResponse(result.data);
      setQuery(''); // Clear input after submission
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to get answer');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (helpful) => {
    if (!response?.queryId) {
      alert('Error: Query ID not found. Please try asking a new question.');
      console.error('No queryId in response:', response);
      return;
    }
    const apiUrl = process.env.REACT_APP_API_URL || '';
    try {
      const result = await axios.post(`${apiUrl}/api/feedback`, {
        queryId: response.queryId,
        helpful
      });
      alert('Thank you for your feedback!');
      console.log('Feedback submitted successfully:', result.data);
    } catch (err) {
      console.error('Feedback error:', err);
      console.error('Error details:', err.response?.data || err.message);
      alert(`Failed to submit feedback: ${err.response?.data?.error || err.message}`);
    }
  };

  return (
    <div className="App">
      {/* Cold Start Warning Popup */}
      {showColdStartWarning && (
        <div className="modal-overlay" onClick={() => setShowColdStartWarning(false)}>
          <div className="cold-start-popup" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <span className="popup-icon">⚠️</span>
              <h3>First-Time Visitor Notice</h3>
            </div>
            <div className="popup-body">
              <p>
                <strong>⏱️ Please Note:</strong> The first response may take <strong>1-2 minutes</strong> as the server wakes up from sleep.
              </p>
              <p className="popup-detail">
                This application is deployed on Render's free tier, which automatically sleeps after periods of inactivity. Subsequent responses will be fast (1-2 seconds).
              </p>
            </div>
            <div className="popup-footer">
              <button 
                className="popup-button"
                onClick={() => setShowColdStartWarning(false)}
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Messages Area */}
      <div className="messages-container">


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
