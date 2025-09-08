import React from 'react';

const SectionContent = ({ 
  children, 
  className = "",
  padding = "px-4 py-5 sm:p-6" 
}) => {
  return (
    <div className={`${padding} ${className}`}>
      {children}
    </div>
  );
};

export default SectionContent;
