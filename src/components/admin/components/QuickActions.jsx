import React from 'react';
import { FaUsers, FaChartBar, FaUserPlus, FaUserCog } from 'react-icons/fa';
import Button from './Button';

const QuickActions = ({ 
  onCreateGroup, 
  onViewReports, 
  onViewMembers,
  onManageUsers,
  className = "" 
}) => {
  const actions = [
    {
      icon: FaUsers,
      label: "Create Group",
      onClick: onCreateGroup,
      variant: "primary"
    },
    {
      icon: FaChartBar,
      label: "Generate Reports",
      onClick: onViewReports,
      variant: "warning"
    },
    {
      icon: FaUserPlus,
      label: "Manage Members",
      onClick: onViewMembers,
      variant: "success"
    },
    {
      icon: FaUserCog,
      label: "Manage Users",
      onClick: onManageUsers,
      variant: "info"
    }
  ];

  return (
    <div className={`bg-white shadow sm:rounded-lg mb-8 ${className}`}>
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          Quick Actions
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Common administrative tasks
        </p>
      </div>
      <div className="px-4 py-5 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {actions.map((action, index) => (
            <Button
              key={index}
              onClick={action.onClick}
              variant={action.variant}
              icon={action.icon}
              className="w-full"
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuickActions;
