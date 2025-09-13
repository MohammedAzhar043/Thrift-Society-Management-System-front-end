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
  const [bonuses, setBonuses] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingBonus, setEditingBonus] = useState(null);
  const [filters, setFilters] = useState({
    status: null,
    bonus_type: null,
    member_id: null
  });
  const [bonusSummary, setBonusSummary] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadBonuses();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bonusesData, membersData, summaryData] = await Promise.all([
        apiService.getMemberBonuses(),
        apiService.getMembers(),
        apiService.getBonusSummary()
      ]);
      
      setBonuses(bonusesData);
      setMembers(membersData);
      setBonusSummary(summaryData);
    } catch (err) {
      toast.error(err.message || 'Failed to load data');
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadBonuses = async () => {
    try {
      const bonusesData = await apiService.getMemberBonuses(filters);
      setBonuses(bonusesData);
    } catch (err) {
      toast.error(err.message || 'Failed to load bonuses');
      setError(err.message || 'Failed to load bonuses');
    }
  };

  const handleCreateBonus = () => {
    setEditingBonus(null);
    setShowFormModal(true);
  };

  const handleEditBonus = (bonus) => {
    setEditingBonus(bonus);
    setShowFormModal(true);
  };

  const handleFormSuccess = () => {
    loadBonuses();
    loadData(); // Reload summary
  };

  const handleApprove = async (bonusId) => {
    toast((t) => (
      <div className="flex items-center space-x-4">
        <span>Are you sure you want to approve this bonus?</span>
        <div className="flex space-x-2">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await apiService.approveMemberBonus(bonusId);
                toast.success('Bonus approved successfully!');
                loadBonuses();
                loadData(); // Reload summary
              } catch (err) {
                toast.error(err.message || 'Failed to approve bonus');
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

  const handleMarkPaid = async (bonusId) => {
    toast((t) => (
      <div className="flex items-center space-x-4">
        <span>Are you sure you want to mark this bonus as paid?</span>
        <div className="flex space-x-2">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await apiService.markBonusPaid(bonusId);
                toast.success('Bonus marked as paid successfully!');
                loadBonuses();
                loadData(); // Reload summary
              } catch (err) {
                toast.error(err.message || 'Failed to mark bonus as paid');
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

  const handleCancel = async (bonusId) => {
    toast((t) => (
      <div className="flex items-center space-x-4">
        <span>Are you sure you want to cancel this bonus?</span>
        <div className="flex space-x-2">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await apiService.cancelMemberBonus(bonusId);
                toast.success('Bonus cancelled successfully!');
                loadBonuses();
                loadData(); // Reload summary
              } catch (err) {
                toast.error(err.message || 'Failed to cancel bonus');
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
      bonus_type: null,
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

      {/* Summary Cards */}
      {bonusSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <div className="p-4">
              <div className="text-2xl font-bold text-blue-600">{bonusSummary.total_bonuses}</div>
              <div className="text-sm text-gray-600">Total Bonuses</div>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <div className="text-2xl font-bold text-green-600">
                ₹{bonusSummary.total_amount?.toLocaleString('en-IN') || '0'}
              </div>
              <div className="text-sm text-gray-600">Total Amount</div>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <div className="text-2xl font-bold text-yellow-600">{bonusSummary.pending_bonuses}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <div className="text-2xl font-bold text-green-600">{bonusSummary.paid_bonuses}</div>
              <div className="text-sm text-gray-600">Paid</div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters and Actions */}
      <Card>
        <SectionContent>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value || null)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="PAID">Paid</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              <select
                value={filters.bonus_type || ''}
                onChange={(e) => handleFilterChange('bonus_type', e.target.value || null)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="PERFORMANCE">Performance</option>
                <option value="LOYALTY">Loyalty</option>
                <option value="REFERRAL">Referral</option>
                <option value="SPECIAL">Special</option>
                <option value="HOLIDAY">Holiday</option>
                <option value="ACHIEVEMENT">Achievement</option>
              </select>

              <select
                value={filters.member_id || ''}
                onChange={(e) => handleFilterChange('member_id', e.target.value || null)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Members</option>
                {members.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.user?.full_name || member.user?.username} - {member.member_code}
                  </option>
                ))}
              </select>

              {activeFilters && (
                <Button
                  onClick={clearFilters}
                  variant="secondary"
                  size="sm"
                >
                  Clear Filters
                </Button>
              )}
            </div>

            <Button onClick={handleCreateBonus}>
              Create New Bonus
            </Button>
          </div>
        </SectionContent>
      </Card>

      {/* Bonuses Table */}
      <Card>
        <SectionContent>
          <BonusTable
            bonuses={bonuses}
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
        bonus={editingBonus}
        members={members}
      />
    </div>
  );
};

export default BonusManagement;
