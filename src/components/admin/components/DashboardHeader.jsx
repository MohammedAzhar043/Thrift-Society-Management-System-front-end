import React from 'react';
import { FaSignOutAlt } from 'react-icons/fa';

const DashboardHeader = ({ 
  title = "Admin Dashboard", 
  userName, 
  onLogout,
  className = "" 
}) => {
  return (
    <header className={`bg-white shadow-sm border-b border-gray-200 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4 gap-4">
          {/* Left side - Title and User info */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
              {title}
            </h1>
            {userName && (
              <p className="text-sm text-gray-600 mt-1 truncate">
                Welcome, {userName}
              </p>
            )}
          </div>
          
          {/* Right side - Logout button */}
          {onLogout && (
            <div className="flex-shrink-0">
              <button
                onClick={onLogout}
                className="inline-flex items-center px-2 sm:px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
              >
                <FaSignOutAlt className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
