import React from 'react';

const Card = ({ 
  children, 
  className = "", 
  padding = "p-6", 
  margin = "mb-8",
  overflow = "overflow-hidden" 
}) => {
  return (
    <div className={`bg-white shadow sm:rounded-lg ${overflow} ${margin} ${className}`}>
      {children}
    </div>
  );
};

export default Card;
