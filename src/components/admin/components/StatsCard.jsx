import React from 'react';

const StatsCard = ({ 
  icon: Icon, 
  title, 
  value, 
  iconBgColor = "bg-blue-500",
  className = "" 
}) => {
  return (
    <div className={`bg-white overflow-hidden shadow rounded-lg ${className}`}>
      <div className="px-3 py-4 sm:px-4 sm:py-5 lg:p-6 flex items-center">
        <div className={`flex-shrink-0 ${iconBgColor} rounded-md p-2 sm:p-3`}>
          <Icon className="text-white h-5 w-5 sm:h-6 sm:w-6" />
        </div>
        <div className="ml-3 sm:ml-5">
          <p className="text-xs sm:text-sm font-medium text-gray-500">
            {title}
          </p>
          <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
