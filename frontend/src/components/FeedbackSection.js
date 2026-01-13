import React, { useState } from 'react';
import axios from 'axios';

const FeedbackSection = ({ queryId }) => {
  const [feedback, setFeedback] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleFeedback = async (helpful) => {
    try {
      await axios.post('/api/feedback', {
        queryId,
        helpful,
        comment: ''
      });
      
      setFeedback(helpful);
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  if (submitted) {
    return (
      <div className="feedback-section">
        <div className="feedback-success">
          ✓ Thank you for your feedback!
        </div>
      </div>
    );
  }

  return (
    <div className="feedback-section">
      <h4>Was this answer helpful?</h4>
      <div className="feedback-buttons">
        <button
          className={`feedback-button ${feedback === true ? 'selected' : ''}`}
          onClick={() => handleFeedback(true)}
          title="Helpful"
        >
          👍
        </button>
        <button
          className={`feedback-button ${feedback === false ? 'selected' : ''}`}
          onClick={() => handleFeedback(false)}
          title="Not helpful"
        >
          👎
        </button>
      </div>
    </div>
  );
};

export default FeedbackSection;
