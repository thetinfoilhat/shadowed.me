import React, { useEffect } from 'react';

/**
 * Component that adds styles to all input and form elements to force black text
 */
export default function FormInputStyles() {
  useEffect(() => {
    // Create a style element
    const style = document.createElement('style');
    
    // CSS to force black text on all inputs
    style.textContent = `
      input, textarea, select {
        color: black !important;
        -webkit-text-fill-color: black !important;
      }
      
      input::placeholder, textarea::placeholder {
        color: rgba(0, 0, 0, 0.7) !important;
        -webkit-text-fill-color: rgba(0, 0, 0, 0.7) !important;
      }
      
      /* Target Next.js specific classes */
      [class*="nextui-c-"], [class*="nextui-input"] {
        color: black !important;
        --nextui-colors-text: black !important;
      }
    `;
    
    // Add the style element to the head
    document.head.appendChild(style);
    
    // Cleanup on unmount
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  return null; // This component doesn't render anything
} 