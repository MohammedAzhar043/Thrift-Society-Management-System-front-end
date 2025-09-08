import React from 'react';
import { FaSignOutAlt } from 'react-icons/fa';

const DashboardHeader = ({ 
  title = "Admin Dashboard", 
  userName, 
  onLogout,
  className = "" 
}) => {
  return (
    <header className={`bg-white shadow-sm ${className}`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-3 sm:py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
            {title}
          </h1>
          {userName && (
            <p className="text-sm text-gray-600">Welcome, {userName}</p>
          )}
        </div>
        {onLogout && (
          <div className="flex items-center space-x-4 w-full sm:w-auto">
            <button
              onClick={onLogout}
              className="w-full sm:w-auto flex items-center justify-center text-gray-700 hover:text-gray-900 transition-colors px-3 py-2 rounded-md hover:bg-gray-100"
            >
              <FaSignOutAlt className="mr-1" /> Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default DashboardHeader;
