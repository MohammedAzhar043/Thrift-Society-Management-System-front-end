import React from 'react';
import {
  FaChartPie,
  FaUsers,
  FaHandHoldingUsd,
  FaClock,
  FaMoneyBillWave,
} from 'react-icons/fa';

const MobileNavigation = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: "overview", name: "Overview", icon: FaChartPie, shortName: "Overview" },
    { id: "members", name: "Members", icon: FaUsers, shortName: "Members" },
    { id: "loans", name: "Loans", icon: FaHandHoldingUsd, shortName: "Loans" },
    { id: "requests", name: "Loan Requests", icon: FaClock, shortName: "Requests" },
    { id: "pending", name: "Pending Approvals", icon: FaClock, shortName: "Pending" },
    {
      id: "transactions",
      name: "Transactions",
      icon: FaMoneyBillWave,
      shortName: "Transactions"
    },
  ];

  return (
    <div className="sticky top-24 z-40 bg-white shadow-lg rounded-xl mb-8 border border-gray-100 backdrop-blur-sm bg-white/95">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-0 sm:space-x-2 lg:space-x-4 px-1 sm:px-4 lg:px-6 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group relative py-4 px-3 sm:px-4 border-b-2 font-semibold text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center min-w-[80px] sm:min-w-auto whitespace-nowrap transition-all duration-300 rounded-t-lg touch-manipulation ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600 bg-gradient-to-b from-blue-50 to-blue-100 shadow-sm"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50 active:bg-gray-100"
                }`}
              >
                <Icon className={`mb-1 sm:mb-0 sm:mr-2 h-5 w-5 sm:h-4 sm:w-4 transition-transform duration-200 ${
                  activeTab === tab.id ? "scale-110" : "group-hover:scale-105"
                }`} />
                <span className="hidden sm:inline">{tab.name}</span>
                <span className="sm:hidden text-xs font-medium">{tab.shortName}</span>
                {activeTab === tab.id && (
                  <div className="absolute -bottom-px left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"></div>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default MobileNavigation;
