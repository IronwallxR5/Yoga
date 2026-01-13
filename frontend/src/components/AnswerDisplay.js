import React from 'react';
import ReactMarkdown from 'react-markdown';

const AnswerDisplay = ({ answer, responseTime }) => {
  return (
    <div className="answer-section">
      <h3>📝 Answer</h3>
      <div className="answer-content">
        <ReactMarkdown>{answer}</ReactMarkdown>
      </div>
      {responseTime && (
        <div className="response-time">
          Responded in {(responseTime / 1000).toFixed(2)}s
        </div>
      )}
    </div>
  );
};

export default AnswerDisplay;
