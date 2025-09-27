import React from 'react';
import { formatCurrency, formatDate } from '../../utils/formatters';

const LoanCard = ({ loan, index, isMobile = false }) => {
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
      case "approved":
      case "disbursed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isMobile) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 ${
        index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
      }`}>
        <div className="p-3">
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(loan.status)}`}>
                  {loan.status}
                </span>
                <span className="text-xs font-bold text-gray-700 bg-blue-100 px-2 py-1 rounded-md whitespace-nowrap">
                  {loan.term_months} months
                </span>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                <div className="text-lg font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg whitespace-nowrap">
                  {formatCurrency(loan.loan_amount)}
                </div>
              </div>
            </div>
            <h3 className="text-sm font-bold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">
              {loan.member?.user?.full_name || 'N/A'}
            </h3>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-left">
              <span className="text-gray-600 font-semibold text-xs uppercase tracking-wide">Purpose</span>
              <p className="font-bold text-gray-900 text-sm mt-1">
                {loan.purpose || 'N/A'}
              </p>
            </div>
            <div className="text-left">
              <span className="text-gray-600 font-semibold text-xs uppercase tracking-wide">Due Date</span>
              <p className="font-bold text-gray-900 text-sm mt-1">
                {loan.due_date ? formatDate(loan.due_date) : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Desktop version
  return (
    <tr className="hover:bg-gray-50 transition-colors duration-200">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-sm font-medium text-blue-600">
                {loan.member?.user?.full_name?.charAt(0) || 'N'}
              </span>
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {loan.member?.user?.full_name || 'N/A'}
            </div>
            <div className="text-sm text-gray-500">
              {loan.member?.user?.email || 'N/A'}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{formatCurrency(loan.loan_amount)}</div>
        <div className="text-sm text-gray-500">{loan.term_months} months</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(loan.status)}`}>
          {loan.status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {loan.purpose || 'N/A'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {loan.due_date ? formatDate(loan.due_date) : 'N/A'}
      </td>
    </tr>
  );
};

export default LoanCard;
