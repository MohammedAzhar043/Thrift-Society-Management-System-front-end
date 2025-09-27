import React from 'react';

const StatsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color = 'blue', 
  gradient = 'from-blue-50 to-blue-100',
  borderColor = 'border-blue-200',
  iconBg = 'bg-blue-500',
  textColor = 'text-blue-700',
  valueColor = 'text-blue-900'
}) => {
  return (
    <div className={`stats-card bg-gradient-to-br ${gradient} border ${borderColor} rounded-xl shadow-sm hover:shadow-md transition-all duration-300`}>
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center">
          <div className={`flex-shrink-0 ${iconBg} rounded-xl p-3 sm:p-4 shadow-lg`}>
            <Icon className={`text-white h-5 w-5 sm:h-6 sm:w-6`} />
          </div>
          <div className="ml-4 sm:ml-5 w-0 flex-1">
            <dl>
              <dt className={`text-xs sm:text-sm font-semibold ${textColor} truncate`}>
                {title}
              </dt>
              <dd className="flex items-baseline">
                <div className={`text-lg sm:text-xl lg:text-2xl font-bold ${valueColor}`}>
                  {value}
                </div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
