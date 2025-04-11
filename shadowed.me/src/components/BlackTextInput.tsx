import React, { InputHTMLAttributes } from 'react';

interface BlackTextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

const BlackTextInput: React.FC<BlackTextInputProps> = ({ 
  className = '', 
  style = {}, 
  ...props 
}) => {
  return (
    <input
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

export default BlackTextInput; 