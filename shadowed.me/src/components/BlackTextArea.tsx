import React, { TextareaHTMLAttributes } from 'react';

interface BlackTextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}

const BlackTextArea: React.FC<BlackTextAreaProps> = ({ 
  className = '', 
  style = {}, 
  ...props 
}) => {
  return (
    <textarea
      className={`black-text-input ${className}`}
      style={{ 
        color: 'black', 
        WebkitTextFillColor: 'black',
        ...style 
      }}
      {...props}
    />
  );
};

export default BlackTextArea; 