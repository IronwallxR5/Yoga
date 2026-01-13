import React from 'react';

const SourcesDisplay = ({ sources }) => {
  if (!sources || sources.length === 0) {
    return null;
  }

  return (
    <div className="sources-section">
      <h3>📚 Sources Used</h3>
      {sources.map((source, index) => (
        <div key={source.id} className="source-item">
          <div className="source-title">
            {index + 1}. {source.title}
          </div>
          <div className="source-details">
            <span>📖 {source.source}</span>
            {source.page && <span>📄 Page {source.page}</span>}
            {source.score && (
              <span className="source-badge">
                Relevance: {Math.round(source.score * 100)}%
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SourcesDisplay;
