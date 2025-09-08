import React from 'react';
import Modal from '../components/Modal';
import Button from '../components/Button';

const AssignTeamLeaderModal = ({ 
  isOpen, 
  onClose, 
  group,
  groupMembers = [],
  onAssignTeamLeader,
  isLoading = false 
}) => {
  const [selectedMemberId, setSelectedMemberId] = React.useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedMemberId) {
      onAssignTeamLeader(group.id, selectedMemberId);
      setSelectedMemberId('');
    }
  };

  const handleClose = () => {
    setSelectedMemberId('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Assign Team Leader - ${group?.name || 'Group'}`}
      size="md"
    >
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-4">
          Select a member from this group to assign as the team leader. 
          The team leader will have access to manage group activities and loans.
        </p>
        
        {groupMembers.length === 0 ? (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-700">
              No members found in this group. Please add members first before assigning a team leader.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Team Leader *
              </label>
              <select
                required
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a member</option>
                {groupMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.user?.full_name || member.user?.username} 
                    {member.user?.email ? ` (${member.user.email})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> The selected member will be assigned the team leader role 
                and will have access to manage this group's activities, loans, and collections.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                onClick={handleClose}
                variant="secondary"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={isLoading}
                disabled={!selectedMemberId}
              >
                Assign Team Leader
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};

export default AssignTeamLeaderModal;
