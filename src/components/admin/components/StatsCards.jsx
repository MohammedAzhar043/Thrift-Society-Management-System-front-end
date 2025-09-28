import React from 'react';
import { FaUsers, FaUserPlus, FaHandHoldingUsd, FaChartBar } from 'react-icons/fa';
import StatsCard from './StatsCard';
import { formatIndianCurrency } from '../../../utils/formatters';

const StatsCards = ({ dashboardStats, memberApprovals, loanApprovals }) => {
  const stats = [
    {
      icon: FaUsers,
      title: "Total Groups",
      value: dashboardStats.total_groups,
      iconBgColor: "bg-gradient-to-br from-blue-500 to-blue-600"
    },
    {
      icon: FaUserPlus,
      title: "Pending Member Approvals",
      value: memberApprovals.length,
      iconBgColor: "bg-gradient-to-br from-emerald-500 to-green-600"
    },
    {
      icon: FaHandHoldingUsd,
      title: "Pending Loan Approvals",
      value: loanApprovals.length,
      iconBgColor: "bg-gradient-to-br from-amber-500 to-orange-500"
    },
    {
      icon: FaHandHoldingUsd,
      title: "Daily Collections",
      value: formatIndianCurrency(dashboardStats.total_collections_today),
      iconBgColor: "bg-gradient-to-br from-indigo-500 to-purple-600"
    },
    {
      icon: FaChartBar,
      title: "Total Collection",
      value: formatIndianCurrency(dashboardStats.total_collections_month),
      iconBgColor: "bg-gradient-to-br from-purple-500 to-pink-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
      {stats.map((stat, index) => (
        <StatsCard
          key={index}
          icon={stat.icon}
          title={stat.title}
          value={stat.value}
          iconBgColor={stat.iconBgColor}
          className="animate-fade-in hover:scale-105 hover:-translate-y-1 transform transition-all duration-300 cursor-pointer"
          style={{ animationDelay: `${index * 0.1}s` }}
        />
      ))}
    </div>
  );
};

export default StatsCards;
