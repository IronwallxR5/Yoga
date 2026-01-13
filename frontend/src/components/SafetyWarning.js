import React from 'react';
import ReactMarkdown from 'react-markdown';

const SafetyWarning = ({ warnings, safetyContent }) => {
  return (
    <div className="safety-warning">
      <div className="safety-warning-header">
        <span className="safety-warning-icon">⚠️</span>
        <span>IMPORTANT SAFETY NOTICE</span>
      </div>
      <div className="safety-content">
        <ReactMarkdown>{safetyContent}</ReactMarkdown>
      </div>
    </div>
  );
};

export default SafetyWarning;
