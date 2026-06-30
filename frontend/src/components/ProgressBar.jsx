import React, { useEffect, useState } from 'react';

const ProgressBar = ({ score = 0 }) => {
  // Animate the bar on load for a smooth UI experience
  const [width, setWidth] = useState(0);
  
  // Ensure score is clamped between 0 and 100
  const normalizedScore = Math.min(Math.max(score, 0), 100);

  useEffect(() => {
    // Slight delay to allow the CSS transition to trigger after mount
    const timer = setTimeout(() => setWidth(normalizedScore), 100);
    return () => clearTimeout(timer);
  }, [normalizedScore]);

  // Determine colors based on our Emerald Green & Amber Yellow theme
  let trackColor = '#fee2e2'; // Light red background for low
  let barColor = 'var(--error)';     // Red for low
  
  if (normalizedScore >= 75) {
    trackColor = '#d1fae5';   // Light green background
    barColor = 'var(--primary)';     // Emerald Green
  } else if (normalizedScore >= 40) {
    trackColor = '#fef3c7';   // Light yellow background
    barColor = 'var(--secondary)';   // Amber Yellow
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      {/* Score Text */}
      <span style={{ 
        width: '32px', 
        fontWeight: '700', 
        fontSize: '13px', 
        color: barColor,
        textAlign: 'right'
      }}>
        {normalizedScore}
      </span>
      
      {/* Progress Track */}
      <div style={{ 
        flex: 1, 
        height: '8px', 
        backgroundColor: trackColor, 
        borderRadius: '6px',
        overflow: 'hidden',
        minWidth: '100px'
      }}>
        {/* Animated Progress Fill */}
        <div style={{ 
          width: `${width}%`, 
          height: '100%', 
          backgroundColor: barColor,
          borderRadius: '6px',
          transition: 'width 1s cubic-bezier(0.34, 1.56, 0.64, 1)' // Spring-like animation
        }} />
      </div>
    </div>
  );
};

export default ProgressBar;