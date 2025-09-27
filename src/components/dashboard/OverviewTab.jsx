import React from 'react';
import { FaUsers, FaHandHoldingUsd, FaClock, FaMoneyBillWave } from 'react-icons/fa';
import StatsCard from './StatsCard';
import { formatCurrency } from '../../utils/formatters';

const OverviewTab = ({ 
  assignedGroups, 
  groupMembers, 
  pendingMembers, 
  groupLoans, 
  loanRequests, 
  loanOverview 
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <StatsCard
          title="Total Groups"
          value={assignedGroups.length}
          icon={FaUsers}
          color="purple"
          gradient="from-purple-50 to-purple-100"
          borderColor="border-purple-200"
          iconBg="bg-purple-500"
          textColor="text-purple-700"
          valueColor="text-purple-900"
        />

        <StatsCard
          title="Total Members"
          value={groupMembers.length}
          icon={FaUsers}
          color="blue"
          gradient="from-blue-50 to-blue-100"
          borderColor="border-blue-200"
          iconBg="bg-blue-500"
          textColor="text-blue-700"
          valueColor="text-blue-900"
        />

        <StatsCard
          title="Active Loans"
          value={groupLoans.filter(
            (l) =>
              l.status === "ACTIVE" ||
              l.status === "DISBURSED" ||
              l.status === "APPROVED"
          ).length}
          icon={FaHandHoldingUsd}
          color="green"
          gradient="from-green-50 to-green-100"
          borderColor="border-green-200"
          iconBg="bg-green-500"
          textColor="text-green-700"
          valueColor="text-green-900"
        />

        <StatsCard
          title="Pending Requests"
          value={loanRequests.filter(
            (r) =>
              r.status === "REQUEST" || r.status === "PENDING"
          ).length + pendingMembers.length}
          icon={FaClock}
          color="yellow"
          gradient="from-yellow-50 to-yellow-100"
          borderColor="border-yellow-200"
          iconBg="bg-yellow-500"
          textColor="text-yellow-700"
          valueColor="text-yellow-900"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FaMoneyBillWave className="mr-2 text-green-600" />
            Loan Overview
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Loan Amount</span>
              <span className="font-semibold text-gray-900">
                {formatCurrency(
                  groupLoans.reduce(
                    (sum, loan) => sum + parseFloat(loan.loan_amount),
                    0
                  )
                )}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Average Loan Amount</span>
              <span className="font-semibold text-gray-900">
                {formatCurrency(
                  groupLoans.length > 0
                    ? groupLoans.reduce(
                        (sum, loan) => sum + parseFloat(loan.loan_amount),
                        0
                      ) / groupLoans.length
                    : 0
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FaUsers className="mr-2 text-blue-600" />
            Group Summary
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Active Groups</span>
              <span className="font-semibold text-gray-900">
                {assignedGroups.filter(g => g.status === 'active').length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Members per Group</span>
              <span className="font-semibold text-gray-900">
                {assignedGroups.length > 0 
                  ? Math.round(groupMembers.length / assignedGroups.length)
                  : 0
                }
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
