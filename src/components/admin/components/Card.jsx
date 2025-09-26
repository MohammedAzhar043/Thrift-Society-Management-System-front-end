import React from 'react';

const Card = ({ 
  children, 
  className = "", 
  padding = "p-6", 
  margin = "mb-8",
  overflow = "overflow-hidden" 
}) => {
  return (
    <div className={`admin-card bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 ${overflow} ${margin} ${className}`}>
      {children}
    </div>
  );
};

export default Card;
