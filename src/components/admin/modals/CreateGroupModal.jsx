import React from 'react';
import Modal from '../components/Modal';
import Button from '../components/Button';

const CreateGroupModal = ({ 
  isOpen, 
  onClose, 
  groupForm, 
  onFormChange, 
  onSubmit,
  billCollectors = [],
  isLoading = false 
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Group"
      size="sm"
    >
      <form onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onSubmit(e);
      }}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Group Name *
          </label>
          <input
            type="text"
            required
            value={groupForm.name}
            onChange={(e) => onFormChange('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter group name"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location *
          </label>
          <input
            type="text"
            required
            value={groupForm.location}
            onChange={(e) => onFormChange('location', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter location"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bill Collector (Optional)
          </label>
          <select
            value={groupForm.bill_collector_name || ""}
            onChange={(e) => onFormChange('bill_collector_name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a bill collector</option>
            {billCollectors.length > 0 ? (
              billCollectors.map((user) => (
                <option key={user.id} value={user.full_name || user.username}>
                  {user.full_name || user.username}
                </option>
              ))
            ) : (
              <option value="" disabled>No bill collectors available</option>
            )}
          </select>
        </div>
        
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-700">
            <strong>Note:</strong> Team leader will be assigned after adding members to the group.
          </p>
        </div>
        
        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            onClick={onClose}
            variant="secondary"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isLoading}
            disabled={isLoading}
          >
            Create Group
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateGroupModal;
