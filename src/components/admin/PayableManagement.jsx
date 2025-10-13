import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Card from './components/Card';
import Button from './components/Button';
import SectionHeader from './components/SectionHeader';
import SectionContent from './components/SectionContent';
import BonusTable from './components/BonusTable';
import BonusFormModal from './modals/BonusFormModal';
import apiService from '../../services/api';

const BonusManagement = () => {
  const [payablees, setBonuses] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingBonus, setEditingBonus] = useState(null);
  const [filters, setFilters] = useState({
    status: null,
    payable_type: null,
    member_id: null
  });
  const [payableSummary, setBonusSummary] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadBonuses();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [payableesData, membersData, summaryData] = await Promise.all([
        apiService.getMemberBonuses(),
        apiService.getMembers(),
        apiService.getBonusSummary()
      ]);
      
      setBonuses(payableesData);
      setMembers(membersData);
      setBonusSummary(summaryData);
    } catch (err) {
      toast((t) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <span>{err.message || 'Failed to load data'}</span>
          <button
            onClick={() => {
              toast.dismiss(t.id);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '0',
              marginLeft: '10px',
              fontSize: '18px',
              fontWeight: 'bold'
            }}
          >
            ✕
          </button>
        </div>
      ), {
        duration: 2000,
        position: "top-center",
        style: {
          background: '#EF4444',
          color: '#fff',
          padding: '12px 16px',
          fontSize: '14px',
        },
      });
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadBonuses = async () => {
    try {
      const payableesData = await apiService.getMemberBonuses(filters);
      setBonuses(payableesData);
    } catch (err) {
      toast((t) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <span>{err.message || 'Failed to load payablees'}</span>
          <button
            onClick={() => {
              toast.dismiss(t.id);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '0',
              marginLeft: '10px',
              fontSize: '18px',
              fontWeight: 'bold'
            }}
          >
            ✕
          </button>
        </div>
      ), {
        duration: 2000,
        position: "top-center",
        style: {
          background: '#EF4444',
          color: '#fff',
          padding: '12px 16px',
          fontSize: '14px',
        },
      });
      setError(err.message || 'Failed to load payablees');
    }
  };

  const handleCreateBonus = () => {
    setEditingBonus(null);
    setShowFormModal(true);
  };

  const handleEditBonus = (payable) => {
    setEditingBonus(payable);
    setShowFormModal(true);
  };

  const handleFormSuccess = () => {
    loadBonuses();
    loadData(); // Reload summary
  };

  const handleApprove = async (payableId) => {
    toast((t) => (
      <div className="flex items-center space-x-4">
        <span>Are you sure you want to approve this payable?</span>
        <div className="flex space-x-2">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await apiService.approveMemberBonus(payableId);
                toast.success('Bonus approved successfully!');
                loadBonuses();
                loadData(); // Reload summary
              } catch (err) {
                toast((t) => (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <span>{err.message || 'Failed to approve payable'}</span>
                    <button
                      onClick={() => {
                        toast.dismiss(t.id);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        padding: '0',
                        marginLeft: '10px',
                        fontSize: '18px',
                        fontWeight: 'bold'
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ), {
                  duration: 2000,
                  position: "top-center",
                  style: {
                    background: '#EF4444',
                    color: '#fff',
                    padding: '12px 16px',
                    fontSize: '14px',
                  },
                });
              }
            }}
            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
          >
            Yes
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
          >
            No
          </button>
        </div>
      </div>
    ), {
      duration: 10000,
      position: "top-center",
    });
  };

  const handleMarkPaid = async (payableId) => {
    toast((t) => (
      <div className="flex items-center space-x-4">
        <span>Are you sure you want to mark this payable as paid?</span>
        <div className="flex space-x-2">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await apiService.markBonusPaid(payableId);
                toast.success('Bonus marked as paid successfully!');
                loadBonuses();
                loadData(); // Reload summary
              } catch (err) {
                toast((t) => (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <span>{err.message || 'Failed to mark payable as paid'}</span>
                    <button
                      onClick={() => {
                        toast.dismiss(t.id);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        padding: '0',
                        marginLeft: '10px',
                        fontSize: '18px',
                        fontWeight: 'bold'
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ), {
                  duration: 2000,
                  position: "top-center",
                  style: {
                    background: '#EF4444',
                    color: '#fff',
                    padding: '12px 16px',
                    fontSize: '14px',
                  },
                });
              }
            }}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            Yes
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
          >
            No
          </button>
        </div>
      </div>
    ), {
      duration: 10000,
      position: "top-center",
    });
  };

  const handleCancel = async (payableId) => {
    toast((t) => (
      <div className="flex items-center space-x-4">
        <span>Are you sure you want to cancel this payable?</span>
        <div className="flex space-x-2">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await apiService.cancelMemberBonus(payableId);
                toast.success('Bonus cancelled successfully!');
                loadBonuses();
                loadData(); // Reload summary
              } catch (err) {
                toast((t) => (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <span>{err.message || 'Failed to cancel payable'}</span>
                    <button
                      onClick={() => {
                        toast.dismiss(t.id);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        padding: '0',
                        marginLeft: '10px',
                        fontSize: '18px',
                        fontWeight: 'bold'
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ), {
                  duration: 2000,
                  position: "top-center",
                  style: {
                    background: '#EF4444',
                    color: '#fff',
                    padding: '12px 16px',
                    fontSize: '14px',
                  },
                });
              }
            }}
            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
          >
            Yes
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
          >
            No
          </button>
        </div>
      </div>
    ), {
      duration: 10000,
      position: "top-center",
    });
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: null,
      payable_type: null,
      member_id: null
    });
  };

  const activeFilters = Object.values(filters).some(value => value !== null && value !== '');

  return (
    <div className="space-y-6">
      <SectionHeader title="Bonus Management" />

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Enhanced Summary Cards */}
      {payableSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-blue-600 mb-1">Total Bonuses</div>
                <div className="text-3xl font-bold text-blue-900">{payableSummary.total_payables}</div>
              </div>
              <div className="p-3 bg-blue-500 rounded-lg">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl shadow-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-purple-600 mb-1">Total Amount</div>
                <div className="text-3xl font-bold text-purple-900">
                  ₹{payableSummary.total_amount?.toLocaleString('en-IN') || '0'}
                </div>
              </div>
              <div className="p-3 bg-purple-500 rounded-lg">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-xl shadow-lg border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-yellow-600 mb-1">Pending</div>
                <div className="text-3xl font-bold text-yellow-900">{payableSummary.pending_payables}</div>
              </div>
              <div className="p-3 bg-yellow-500 rounded-lg">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-green-600 mb-1">Paid</div>
                <div className="text-3xl font-bold text-green-900">{payableSummary.paid_payables}</div>
              </div>
              <div className="p-3 bg-green-500 rounded-lg">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Filters and Actions */}
      <Card>
        <SectionContent>
          <div className="space-y-6">
            {/* Filter Header */}
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Filters & Actions</h3>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <select
                    value={filters.status || ''}
                    onChange={(e) => handleFilterChange('status', e.target.value || null)}
                    className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 appearance-none bg-white min-w-[140px]"
                  >
                    <option value="">All Statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="PAID">Paid</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <select
                    value={filters.payable_type || ''}
                    onChange={(e) => handleFilterChange('payable_type', e.target.value || null)}
                    className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 appearance-none bg-white min-w-[140px]"
                  >
                    <option value="">All Types</option>
                    <option value="PERFORMANCE">Performance</option>
                    <option value="LOYALTY">Loyalty</option>
                    <option value="REFERRAL">Referral</option>
                    <option value="SPECIAL">Special</option>
                    <option value="HOLIDAY">Holiday</option>
                    <option value="ACHIEVEMENT">Achievement</option>
                    <option value="AMOUNT_RETURN">Amount Return</option>
                  </select>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <select
                    value={filters.member_id || ''}
                    onChange={(e) => handleFilterChange('member_id', e.target.value || null)}
                    className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 appearance-none bg-white min-w-[200px]"
                  >
                    <option value="">All Members</option>
                    {members.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.user?.full_name || member.user?.username} - {member.member_code}
                      </option>
                    ))}
                  </select>
                </div>

                {activeFilters && (
                  <button
                    onClick={clearFilters}
                    className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 flex items-center space-x-2 cursor-pointer"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Clear Filters</span>
                  </button>
                )}
              </div>

              <button
                onClick={handleCreateBonus}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-700 text-white rounded-lg hover:from-purple-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2 font-medium cursor-pointer"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Create New Bonus</span>
              </button>
            </div>
          </div>
        </SectionContent>
      </Card>

      {/* Bonuses Table */}
      <Card>
        <SectionContent>
          <BonusTable
            payablees={payablees}
            onApprove={handleApprove}
            onMarkPaid={handleMarkPaid}
            onCancel={handleCancel}
            onEdit={handleEditBonus}
            loading={loading}
          />
        </SectionContent>
      </Card>

      {/* Form Modal */}
      <BonusFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSuccess={handleFormSuccess}
        payable={editingBonus}
        members={members}
      />
    </div>
  );
};

export default BonusManagement;
