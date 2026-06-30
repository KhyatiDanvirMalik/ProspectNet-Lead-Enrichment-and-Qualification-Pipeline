import React from 'react';

const PipelineSpinner = ({ message = 'Processing pipeline...', size = 'medium' }) => {
  // Determine dimensions based on size prop
  const dimensions = {
    small: { width: '24px', height: '24px', borderWidth: '3px', fontSize: '12px', marginTop: '8px' },
    medium: { width: '48px', height: '48px', borderWidth: '4px', fontSize: '14px', marginTop: '16px' },
    large: { width: '64px', height: '64px', borderWidth: '5px', fontSize: '16px', marginTop: '20px' }
  }[size] || dimensions.medium;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div 
        style={{
          width: dimensions.width,
          height: dimensions.height,
          position: 'relative'
        }}
      >
        <style>
          {`
            @keyframes spin-outer {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            @keyframes spin-inner {
              0% { transform: rotate(360deg); }
              100% { transform: rotate(0deg); }
            }
            @keyframes pulse-text {
              0%, 100% { opacity: 0.6; }
              50% { opacity: 1; }
            }
            
            .spinner-ring-outer {
              box-sizing: border-box;
              display: block;
              position: absolute;
              width: 100%;
              height: 100%;
              border: ${dimensions.borderWidth} solid transparent;
              border-radius: 50%;
              border-top-color: var(--primary);       /* Emerald Green */
              border-right-color: var(--primary-light); 
              animation: spin-outer 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
            }
            
            .spinner-ring-inner {
              box-sizing: border-box;
              display: block;
              position: absolute;
              width: 70%;
              height: 70%;
              top: 15%;
              left: 15%;
              border: ${dimensions.borderWidth} solid transparent;
              border-radius: 50%;
              border-bottom-color: var(--secondary);    /* Amber Yellow */
              border-left-color: var(--secondary-light);
              animation: spin-inner 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
            }
          `}
        </style>
        <div className="spinner-ring-outer"></div>
        <div className="spinner-ring-inner"></div>
      </div>
      
      {message && (
        <p style={{ 
          marginTop: dimensions.marginTop, 
          color: 'var(--text-muted)', 
          fontSize: dimensions.fontSize,
          fontWeight: 600,
          letterSpacing: '0.5px',
          animation: 'pulse-text 2s ease-in-out infinite'
        }}>
          {message}
        </p>
      )}
    </div>
  );
};

export default PipelineSpinner;