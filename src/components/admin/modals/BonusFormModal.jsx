import React, { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import apiService from '../../../services/api';

const BonusFormModal = ({ isOpen, onClose, onSuccess, payable = null, members = [] }) => {
  const [formData, setFormData] = useState({
    member_id: '',
    payable_type: 'PERFORMANCE',
    amount: '',
    reason: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const payableTypes = [
    { value: 'PERFORMANCE', label: 'Performance Payable' },
    { value: 'LOYALTY', label: 'Loyalty Payable' },
    { value: 'REFERRAL', label: 'Referral Payable' },
    { value: 'SPECIAL', label: 'Special Payable' },
    { value: 'HOLIDAY', label: 'Holiday Payable' },
    { value: 'ACHIEVEMENT', label: 'Achievement Payable' },
    { value: 'AMOUNT_RETURN', label: 'Amount Return' }
  ];

  useEffect(() => {
    if (payable) {
      setFormData({
        member_id: payable.member_id || '',
        payable_type: payable.payable_type || 'PERFORMANCE',
        amount: payable.amount || '',
        reason: payable.reason || '',
        notes: payable.notes || ''
      });
    } else {
      setFormData({
        member_id: '',
        payable_type: 'PERFORMANCE',
        amount: '',
        reason: '',
        notes: ''
      });
    }
    setError('');
  }, [payable, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payableData = {
        ...formData,
        amount: parseFloat(formData.amount)
      };

      if (payable) {
        await apiService.updateMemberBonus(payable.id, payableData);
      } else {
        await apiService.createMemberBonus(payableData);
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const selectedMember = members.find(m => m.id === parseInt(formData.member_id));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={payable ? 'Edit Bonus' : 'Create New Bonus'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Member *
          </label>
          <select
            name="member_id"
            value={formData.member_id}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a member</option>
            {members.map(member => (
              <option key={member.id} value={member.id}>
                {member.user?.full_name || member.user?.username} - {member.member_code}
              </option>
            ))}
          </select>
          {selectedMember && (
            <p className="text-sm text-gray-500 mt-1">
              Group: {selectedMember.group?.name || 'N/A'}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bonus Type *
          </label>
          <select
            name="payable_type"
            value={formData.payable_type}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {payableTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount (₹) *
          </label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter payable amount"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reason *
          </label>
          <textarea
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            required
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter reason for the payable"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Additional notes (optional)"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Saving...' : (payable ? 'Update Bonus' : 'Create Bonus')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default BonusFormModal;
