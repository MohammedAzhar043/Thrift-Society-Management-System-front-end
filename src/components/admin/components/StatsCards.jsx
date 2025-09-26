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
      iconBgColor: "bg-blue-500"
    },
    {
      icon: FaUserPlus,
      title: "Pending Member Approvals",
      value: memberApprovals.length,
      iconBgColor: "bg-green-500"
    },
    {
      icon: FaHandHoldingUsd,
      title: "Pending Loan Approvals",
      value: loanApprovals.length,
      iconBgColor: "bg-yellow-500"
    },
    {
      icon: FaHandHoldingUsd,
      title: "Daily Collections",
      value: formatIndianCurrency(dashboardStats.total_collections_today),
      iconBgColor: "bg-indigo-500"
    },
    {
      icon: FaChartBar,
      title: "Total Collection",
      value: formatIndianCurrency(dashboardStats.total_collections_month),
      iconBgColor: "bg-purple-500"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
      {stats.map((stat, index) => (
        <StatsCard
          key={index}
          icon={stat.icon}
          title={stat.title}
          value={stat.value}
          iconBgColor={stat.iconBgColor}
          className="animate-fade-in"
          style={{ animationDelay: `${index * 0.1}s` }}
        />
      ))}
    </div>
  );
};

export default StatsCards;
