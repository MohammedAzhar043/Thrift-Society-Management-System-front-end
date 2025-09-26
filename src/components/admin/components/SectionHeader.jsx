import React from 'react';

const SectionHeader = ({ 
  title, 
  description, 
  className = "",
  children 
}) => {
  return (
    <div className={`px-6 py-6 border-b border-gray-100 ${className}`}>
      <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
        {title}
      </h3>
      {description && (
        <p className="mt-2 text-sm font-medium text-gray-600">
          {description}
        </p>
      )}
      {children}
    </div>
  );
};

export default SectionHeader;
