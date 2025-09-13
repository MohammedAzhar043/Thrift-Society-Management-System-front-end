import React, { useState } from 'react';

const BonusTable = ({ bonuses, onApprove, onMarkPaid, onCancel, onEdit, loading = false }) => {
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');

  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      APPROVED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Approved' },
      PAID: { bg: 'bg-green-100', text: 'text-green-800', label: 'Paid' },
      CANCELLED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' }
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getBonusTypeBadge = (type) => {
    const typeConfig = {
      PERFORMANCE: { bg: 'bg-purple-100', text: 'text-purple-800' },
      LOYALTY: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
      REFERRAL: { bg: 'bg-green-100', text: 'text-green-800' },
      SPECIAL: { bg: 'bg-pink-100', text: 'text-pink-800' },
      HOLIDAY: { bg: 'bg-orange-100', text: 'text-orange-800' },
      ACHIEVEMENT: { bg: 'bg-cyan-100', text: 'text-cyan-800' }
    };

    const config = typeConfig[type] || typeConfig.PERFORMANCE;
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${config.bg} ${config.text}`}>
        {type.replace('_', ' ')}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedBonuses = [...bonuses].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    if (sortField === 'created_at' || sortField === 'approved_at' || sortField === 'paid_at') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (bonuses.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No bonuses found
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('member')}
            >
              Member
            </th>
            <th
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('bonus_type')}
            >
              Type
            </th>
            <th
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('amount')}
            >
              Amount
            </th>
            <th
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('status')}
            >
              Status
            </th>
            <th
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('created_at')}
            >
              Created
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedBonuses.map((bonus) => (
            <tr key={bonus.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {bonus.member?.user?.full_name || bonus.member?.user?.username || 'Unknown'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {bonus.member?.member_code} - {bonus.member?.group?.name}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getBonusTypeBadge(bonus.bonus_type)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {formatCurrency(bonus.amount)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getStatusBadge(bonus.status)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(bonus.created_at)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex space-x-2">
                  {bonus.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => onApprove(bonus.id)}
                        className="text-green-600 hover:text-green-900"
                        title="Approve"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => onCancel(bonus.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Cancel"
                      >
                        ✕
                      </button>
                    </>
                  )}
                  {bonus.status === 'APPROVED' && (
                    <button
                      onClick={() => onMarkPaid(bonus.id)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Mark as Paid"
                    >
                      💰
                    </button>
                  )}
                  <button
                    onClick={() => onEdit(bonus)}
                    className="text-gray-600 hover:text-gray-900"
                    title="Edit"
                  >
                    ✏️
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BonusTable;
