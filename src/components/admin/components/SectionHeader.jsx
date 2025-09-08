import React from 'react';

const SectionHeader = ({ 
  title, 
  description, 
  className = "",
  children 
}) => {
  return (
    <div className={`px-4 py-5 sm:px-6 border-b border-gray-200 ${className}`}>
      <h3 className="text-lg font-medium text-gray-900">
        {title}
      </h3>
      {description && (
        <p className="mt-1 text-sm text-gray-500">
          {description}
        </p>
      )}
      {children}
    </div>
  );
};

export default SectionHeader;
