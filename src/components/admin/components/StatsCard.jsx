import React from 'react';

const StatsCard = ({ 
  icon: Icon, 
  title, 
  value, 
  iconBgColor = "bg-blue-500",
  className = "" 
}) => {
  return (
    <div className={`admin-stats-card relative bg-gradient-to-br from-white to-gray-50/50 rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200/50 hover:border-gray-300/50 group overflow-hidden h-32 sm:h-36 ${className}`}>
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-transparent to-gray-100/30 rounded-2xl"></div>
      
      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 leading-tight">
            {title}
          </p>
          <div className="flex items-center justify-between">
            <p className="text-sm sm:text-base lg:text-lg xl:text-xl font-bold text-gray-900 leading-tight flex-1 min-w-0 pr-2">
              {value}
            </p>
            <div className={`flex-shrink-0 ${iconBgColor} rounded-lg p-1.5 sm:p-2 shadow-md group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 relative`}>
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-lg"></div>
              <Icon className="text-white h-3 w-3 sm:h-4 sm:w-4 relative z-10" />
            </div>
          </div>
        </div>
        
        {/* Bottom accent line */}
        <div className={`h-1 w-full rounded-full bg-gradient-to-r ${iconBgColor} opacity-20 group-hover:opacity-40 transition-opacity duration-300 mt-auto`}></div>
      </div>
    </div>
  );
};

export default StatsCard;
