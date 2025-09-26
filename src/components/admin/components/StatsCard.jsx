import React from 'react';

const StatsCard = ({ 
  icon: Icon, 
  title, 
  value, 
  iconBgColor = "bg-blue-500",
  className = "" 
}) => {
  return (
    <div className={`admin-stats-card bg-white rounded-xl p-4 sm:p-5 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 ${className}`}>
      <div className="flex items-start">
        <div className={`flex-shrink-0 ${iconBgColor} rounded-lg p-2.5 sm:p-3 shadow-md`}>
          <Icon className="text-white h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        <div className="ml-3 sm:ml-4 min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-1 leading-tight break-words">
            {title}
          </p>
          <p className="text-lg sm:text-xl font-bold text-gray-900 leading-tight break-words">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
