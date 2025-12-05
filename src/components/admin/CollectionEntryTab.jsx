import { useState, useEffect, useMemo } from 'react';
import { FaPlus, FaTimesCircle, FaUpload, FaSave } from 'react-icons/fa';
import apiService from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import { toast } from 'react-hot-toast';

// Transaction types available
const TRANSACTION_TYPES = [
  { value: 'EMI', label: 'Loan Instalment' },
  { value: 'THRIFT', label: 'THRIFT' },
  { value: 'INTEREST', label: 'Interest' },
  { value: 'JOINING_FEE', label: 'Joining Fee' },
  { value: 'CHEYUTHA', label: 'Cheyutha' },
  { value: 'SHARE_CAPITAL', label: 'Share Capital' },
  { value: 'LRF', label: 'LRF' }
];

function CollectionEntryTab({
  collectionEntryForm,
  setCollectionEntryForm,
  collectionEntryMembers,
  setCollectionEntryMembers,
  collectionEntryLoading,
  setCollectionEntryLoading,
  collectionEntryReceipt,
  setCollectionEntryReceipt,
  collectionEntrySubmitting,
  setCollectionEntrySubmitting,
  groups,
  loadGroups,
  onSave
}) {
  const [selectedGroupData, setSelectedGroupData] = useState(null);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState(null);
  const [selectedVillage, setSelectedVillage] = useState('');
  const [villages, setVillages] = useState([]);
  const normalizeVillage = (name) => (name || '').trim().toLowerCase();
  const [memberLoanMap, setMemberLoanMap] = useState({}); // memberId -> loanId for Loan Instalment/INTEREST linkage

  // Extract unique villages from groups (dedupe by trimmed, lowercased value)
  useEffect(() => {
    if (groups && groups.length > 0) {
      const villageMap = new Map();
      groups.forEach(g => {
        const raw = (g.location || '').trim();
        if (!raw) return;
        const norm = normalizeVillage(raw);
        if (!villageMap.has(norm)) {
          villageMap.set(norm, raw);
        }
      });
      const villageOptions = Array.from(villageMap.entries())
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label));
      setVillages(villageOptions);
    }
  }, [groups]);

  // Filter groups by selected village - memoized to prevent infinite loops
  const filteredGroups = useMemo(() => {
    return selectedVillage 
      ? groups.filter(g => normalizeVillage(g.location) === selectedVillage)
      : groups;
  }, [selectedVillage, groups]);

  const loadGroupMembers = async (groupId) => {
    setCollectionEntryLoading(true);
    try {
      const members = await apiService.getClerkMembers(groupId);
      setCollectionEntryMembers(members || []);
    } catch (error) {
      console.error('Error loading group members:', error);
      toast.error('Failed to load group members');
      setCollectionEntryMembers([]);
    } finally {
      setCollectionEntryLoading(false);
    }
  };

  // Load members when group is selected - use loadGroupMembers directly
  useEffect(() => {
    if (collectionEntryForm.group_id) {
      loadGroupMembers(collectionEntryForm.group_id);
      const selectedGroup = filteredGroups.find(g => g.id === collectionEntryForm.group_id);
      if (selectedGroup) {
        setSelectedGroupData(selectedGroup);
      }
    } else {
      setCollectionEntryMembers([]);
      setSelectedGroupData(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionEntryForm.group_id]); // Only depend on group_id to prevent infinite loops

  // Handle village selection
  const handleVillageChange = (village) => {
    setSelectedVillage(village);
    // Reset group when village changes
    setCollectionEntryForm(prev => ({
      ...prev,
      group_id: '',
      members: []
    }));
    setSelectedGroupData(null);
    setCollectionEntryMembers([]);
  };

  // Handle group selection
  const handleGroupChange = (groupId) => {
    setCollectionEntryForm(prev => ({
      ...prev,
      group_id: groupId,
      members: []
    }));
  };

  // Add member entry
  const addMemberEntry = () => {
    setCollectionEntryForm(prev => ({
      ...prev,
      members: [...prev.members, {
        member_id: '',
        receipt_number: '', // Receipt number for this member
        transaction_types: [], // Array of selected transaction types
        amounts: {} // Object to store amounts: { EMI: 0 (Loan Instalment), INTEREST: 0, THRIFT: 0, etc. }
      }]
    }));
  };

  // Remove member entry
  const removeMemberEntry = (index) => {
    setCollectionEntryForm(prev => ({
      ...prev,
      members: prev.members.filter((_, i) => i !== index)
    }));
  };

  // Update member entry
  const updateMemberEntry = (index, field, value) => {
    setCollectionEntryForm(prev => {
      const updatedMembers = [...prev.members];
      updatedMembers[index] = {
        ...updatedMembers[index],
        [field]: value
      };
      return {
        ...prev,
        members: updatedMembers
      };
    });

    // When member changes, fetch and cache their current loan id for proper loan linkage
    if (field === 'member_id' && value) {
      const memberId = parseInt(value);
      if (!Number.isNaN(memberId)) {
        (async () => {
          try {
            const details = await apiService.getClerkMemberDetails(memberId);
            const loanId = details?.loan_info?.id || null;
            setMemberLoanMap(prev => ({ ...prev, [memberId]: loanId }));
          } catch (err) {
            setMemberLoanMap(prev => ({ ...prev, [memberId]: null }));
          }
        })();
      }
    }
  };

  // Add transaction type to member entry
  const addTransactionType = (memberIndex, transactionType) => {
    setCollectionEntryForm(prev => {
      const updatedMembers = [...prev.members];
      const member = updatedMembers[memberIndex];
      
      // Check if transaction type already exists
      if (member.transaction_types?.includes(transactionType)) {
        return prev; // Already added
      }
      
      // Create new member object with updated transaction types
      const currentTransactionTypes = member.transaction_types || [];
      const newTransactionTypes = [...currentTransactionTypes, transactionType];
      
      // Initialize amounts - Loan Instalment is now just Principal, Interest is separate
      let newAmounts = { ...member.amounts };
      // Initialize amount for all transaction types (Loan Instalment is now just one amount field)
      newAmounts = {
        ...newAmounts,
        [transactionType]: 0
      };
      
      // Create new member object to ensure React detects the change
      updatedMembers[memberIndex] = {
        ...member,
        transaction_types: newTransactionTypes,
        amounts: newAmounts
      };
      
      return {
        ...prev,
        members: updatedMembers
      };
    });
  };

  // Remove transaction type from member entry
  const removeTransactionType = (memberIndex, transactionType) => {
    setCollectionEntryForm(prev => {
      const updatedMembers = [...prev.members];
      const member = updatedMembers[memberIndex];
      
      // Remove transaction type
      const newTransactionTypes = (member.transaction_types || []).filter(t => t !== transactionType);
      
      // Remove amounts for this transaction type
      const newAmounts = { ...member.amounts };
      delete newAmounts[transactionType];
      
      // Create new member object to ensure React detects the change
      updatedMembers[memberIndex] = {
        ...member,
        transaction_types: newTransactionTypes,
        amounts: newAmounts
      };
      
      return {
        ...prev,
        members: updatedMembers
      };
    });
  };

  // Update amount for a transaction type
  const updateTransactionAmount = (memberIndex, amountKey, value) => {
    setCollectionEntryForm(prev => {
      const updatedMembers = [...prev.members];
      const member = updatedMembers[memberIndex];
      
      member.amounts = {
        ...member.amounts,
        [amountKey]: Math.round(parseFloat(value || 0) * 100) / 100
      };
      
      return {
        ...prev,
        members: updatedMembers
      };
    });
  };

  // Calculate total amount for a member entry
  const calculateMemberTotal = (memberEntry) => {
    const amounts = memberEntry.amounts || {};
    const total = Object.values(amounts).reduce((sum, amount) => sum + parseFloat(amount || 0), 0);
    return Math.round(total * 100) / 100;
  };

  // Handle receipt file change
  const handleReceiptChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload a JPG, PNG, or PDF file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      
      if (receiptPreviewUrl) {
        URL.revokeObjectURL(receiptPreviewUrl);
      }
      
      if (file.type.startsWith('image/')) {
        setReceiptPreviewUrl(URL.createObjectURL(file));
      } else {
        setReceiptPreviewUrl(null);
      }
      
      setCollectionEntryReceipt(file);
      toast.success('Receipt file selected');
    }
  };

  // Remove receipt file
  const handleRemoveReceipt = (e) => {
    e?.preventDefault();
    if (receiptPreviewUrl) {
      URL.revokeObjectURL(receiptPreviewUrl);
      setReceiptPreviewUrl(null);
    }
    setCollectionEntryReceipt(null);
    toast.success('Receipt file removed');
  };

  useEffect(() => {
    return () => {
      if (receiptPreviewUrl) {
        URL.revokeObjectURL(receiptPreviewUrl);
      }
    };
  }, [receiptPreviewUrl]);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedVillage) {
      toast.error('Please select a village/town');
      return;
    }
    
    if (!collectionEntryForm.group_id) {
      toast.error('Please select a group');
      return;
    }
    
    if (collectionEntryForm.members.length === 0) {
      toast.error('Please add at least one member entry');
      return;
    }
    
    // Validate that each member has at least one transaction type with amount > 0
    for (const memberEntry of collectionEntryForm.members) {
      if (!memberEntry.member_id) {
        toast.error('Please select a member for all entries');
        return;
      }
      if (!memberEntry.transaction_types || memberEntry.transaction_types.length === 0) {
        toast.error('Please add at least one transaction type for each member');
        return;
      }
      const total = calculateMemberTotal(memberEntry);
      if (total <= 0) {
        toast.error('Please enter amounts greater than 0 for transaction types');
        return;
      }
    }
    
    if (!collectionEntryReceipt) {
      toast.error('Please upload a receipt');
      return;
    }
    
    setCollectionEntrySubmitting(true);
    
    try {
      // Upload receipt
      const receiptFormData = new FormData();
      receiptFormData.append('file', collectionEntryReceipt);
      
      const receiptResponse = await fetch(`${apiService.baseURL}/clerk/collections/upload-receipt`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: receiptFormData
      });
      
      if (!receiptResponse.ok) {
        throw new Error('Failed to upload receipt');
      }
      
      const receiptData = await receiptResponse.json();
      const receiptFilePath = receiptData.file_path;
      
      // Transform collection items
      const collectionItems = [];
      
      for (const memberEntry of collectionEntryForm.members) {
        const member = collectionEntryMembers.find(m => m.id === parseInt(memberEntry.member_id));
        if (!member) continue;
        
        const amounts = memberEntry.amounts || {};
        
        // Add Loan Instalment Principal if Loan Instalment is selected
        if (memberEntry.transaction_types.includes('EMI')) {
          const principalAmount = parseFloat(amounts['EMI'] || 0);
          
          if (principalAmount > 0) {
            collectionItems.push({
              member_id: parseInt(memberEntry.member_id),
              loan_id: memberLoanMap[parseInt(memberEntry.member_id)] ?? null,
              amount: principalAmount,
              payment_type: 'LOAN_PRINCIPAL',
              receipt_number: memberEntry.receipt_number || null,
              notes: 'Loan Instalment Principal payment'
            });
          }
        }
        
        // Add THRIFT
        if (memberEntry.transaction_types.includes('THRIFT')) {
          const thriftAmount = parseFloat(amounts['THRIFT'] || 0);
          if (thriftAmount > 0) {
            collectionItems.push({
              member_id: parseInt(memberEntry.member_id),
              loan_id: null,
              amount: thriftAmount,
              payment_type: 'THRIFT',
              receipt_number: memberEntry.receipt_number || null,
              notes: 'Thrift deposit'
            });
          }
        }
        
        // Add Interest (standalone interest payment)
        if (memberEntry.transaction_types.includes('INTEREST')) {
          const interestAmount = parseFloat(amounts['INTEREST'] || 0);
          if (interestAmount > 0) {
            collectionItems.push({
              member_id: parseInt(memberEntry.member_id),
              loan_id: memberLoanMap[parseInt(memberEntry.member_id)] ?? null,
              amount: interestAmount,
              payment_type: 'LOAN_INTEREST',
              receipt_number: memberEntry.receipt_number || null,
              notes: 'Interest payment'
            });
          }
        }
        
        // Add Joining Fee
        if (memberEntry.transaction_types.includes('JOINING_FEE')) {
          const joiningFeeAmount = parseFloat(amounts['JOINING_FEE'] || 0);
          if (joiningFeeAmount > 0) {
            collectionItems.push({
              member_id: parseInt(memberEntry.member_id),
              loan_id: null,
              amount: joiningFeeAmount,
              payment_type: 'JOINING_FEE',
              receipt_number: memberEntry.receipt_number || null,
              notes: 'Joining fee'
            });
          }
        }
        
        // Add Cheyutha
        if (memberEntry.transaction_types.includes('CHEYUTHA')) {
          const cheyuthaAmount = parseFloat(amounts['CHEYUTHA'] || 0);
          if (cheyuthaAmount > 0) {
            collectionItems.push({
              member_id: parseInt(memberEntry.member_id),
              loan_id: null,
              amount: cheyuthaAmount,
              payment_type: 'CHEYUTHA',
              receipt_number: memberEntry.receipt_number || null,
              notes: 'Cheyutha payment'
            });
          }
        }
        
        // Add Share Capital
        if (memberEntry.transaction_types.includes('SHARE_CAPITAL')) {
          const shareCapitalAmount = parseFloat(amounts['SHARE_CAPITAL'] || 0);
          if (shareCapitalAmount > 0) {
            collectionItems.push({
              member_id: parseInt(memberEntry.member_id),
              loan_id: null,
              amount: shareCapitalAmount,
              payment_type: 'SHARE_CAPITAL',
              receipt_number: memberEntry.receipt_number || null,
              notes: 'Share capital'
            });
          }
        }
        
        // Add LRF
        if (memberEntry.transaction_types.includes('LRF')) {
          const lrfAmount = parseFloat(amounts['LRF'] || 0);
          if (lrfAmount > 0) {
            collectionItems.push({
              member_id: parseInt(memberEntry.member_id),
              loan_id: null,
              amount: lrfAmount,
              payment_type: 'LRF',
              receipt_number: memberEntry.receipt_number || null,
              notes: 'LRF'
            });
          }
        }
      }
      
      // Calculate totals
      const totals = collectionItems.reduce((acc, item) => {
        if (item.payment_type === 'THRIFT') acc.total_thrift += item.amount;
        if (item.payment_type === 'THRIFT_WITHDRAWAL') acc.total_thrift_withdrawal += item.amount;
        if (item.payment_type === 'LOAN_PRINCIPAL') acc.total_loan_principal += item.amount;
        if (item.payment_type === 'LOAN_INTEREST') acc.total_loan_interest += item.amount;
        if (item.payment_type === 'JOINING_FEE') acc.total_joining_fees += item.amount;
        if (item.payment_type === 'INSURANCE_AMOUNT') acc.total_insurance_amount += item.amount;
        if (item.payment_type === 'SHARE_CAPITAL') acc.total_share_capital += item.amount;
        if (item.payment_type === 'LRF') acc.total_lrf += item.amount;
        return acc;
      }, {
        total_deposits: 0,
        total_thrift_withdrawal: 0,
        total_loan_principal: 0,
        total_loan_interest: 0,
        total_joining_fees: 0,
        total_insurance_amount: 0,
        total_carry_forward: 0,
        total_share_capital: 0,
        total_lrf: 0
      });
      
      // Grand total includes all payments but excludes withdrawals (they reduce the total)
      const grandTotal = totals.total_deposits + totals.total_loan_principal + 
                        totals.total_loan_interest + totals.total_joining_fees + 
                        totals.total_insurance_amount + totals.total_share_capital + totals.total_lrf;
      
      const uniqueMembers = new Set(collectionItems.map(item => item.member_id)).size;
      
      // Create collection record
      const collectionData = {
        group_id: collectionEntryForm.group_id,
        collection_date: collectionEntryForm.collection_date,
        receipt_file_path: receiptFilePath,
        total_deposits: totals.total_deposits,
        total_thrift_withdrawal: totals.total_thrift_withdrawal,
        total_loan_principal: totals.total_loan_principal,
        total_loan_interest: totals.total_loan_interest,
        total_joining_fees: totals.total_joining_fees,
        total_insurance_amount: totals.total_insurance_amount,
        total_carry_forward: totals.total_carry_forward,
        total_share_capital: totals.total_share_capital,
        total_lrf: totals.total_lrf,
        member_count: uniqueMembers,
        transaction_count: collectionItems.length,
        grand_total: grandTotal,
        collection_items: collectionItems,
        is_verified: true
      };
      
      // Submit collection
      const response = await fetch(`${apiService.baseURL}/clerk/collections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(collectionData),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to save collection entry');
      }
      
      const responseData = await response.json();
      
      // Reset form
      setSelectedVillage('');
      setCollectionEntryForm({
        group_id: '',
        collection_date: new Date().toISOString().split('T')[0],
        members: []
      });
      setCollectionEntryMembers([]);
      
      if (receiptPreviewUrl) {
        URL.revokeObjectURL(receiptPreviewUrl);
        setReceiptPreviewUrl(null);
      }
      
      setCollectionEntryReceipt(null);
      setSelectedGroupData(null);
      
      if (onSave) {
        await onSave();
      }
      
      if (responseData.is_verified) {
        toast.success('Collection entry saved and verified successfully! Balances have been updated.');
      } else {
        toast.success('Collection entry saved successfully! Pending verification.');
      }
    } catch (error) {
      console.error('Error submitting collection entry:', error);
      toast.error(error.message || 'Failed to save collection entry. Please try again.');
    } finally {
      setCollectionEntrySubmitting(false);
    }
  };

  const selectedGroup = selectedGroupData || filteredGroups.find(g => g.id === collectionEntryForm.group_id);

  // Get available members for dropdown (exclude already selected members)
  const getAvailableMembers = (currentIndex) => {
    if (!collectionEntryMembers || collectionEntryMembers.length === 0) {
      return [];
    }
    
    if (!collectionEntryForm.members || collectionEntryForm.members.length === 0) {
      return collectionEntryMembers;
    }
    
    const selectedMemberIds = collectionEntryForm.members
      .map((entry, idx) => idx !== currentIndex && entry.member_id ? parseInt(entry.member_id) : null)
      .filter(id => id !== null);
    
    const currentEntry = collectionEntryForm.members[currentIndex];
    const currentMemberId = currentEntry?.member_id ? parseInt(currentEntry.member_id) : null;
    
    return collectionEntryMembers.filter(member => {
      const memberId = member.id;
      // Include member if it's the currently selected member for this entry, or if it hasn't been selected in other entries
      return (currentMemberId === memberId) || !selectedMemberIds.includes(memberId);
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Collection Entry</h3> */}
      
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Village/Town - First Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Village/Town *
              </label>
              <select
                value={selectedVillage}
                onChange={(e) => handleVillageChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                required
              >
                <option value="">Select Village/Town</option>
                {villages.map(village => (
                  <option key={village.value} value={village.value}>{village.label}</option>
                ))}
              </select>
            </div>
            
            {/* Group Name - Filtered by Village */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Group Name *
              </label>
              <select
                value={collectionEntryForm.group_id}
                onChange={(e) => handleGroupChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                required
                disabled={!selectedVillage}
              >
                <option value="">Select Group</option>
                {filteredGroups.map(group => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>
            </div>
            
            {/* Bill Collector - Auto-filled */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bill Collector
              </label>
              <input
                type="text"
                value={selectedGroup?.bill_collector?.full_name || selectedGroup?.bill_collector?.username || 'N/A'}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700"
              />
            </div>
            
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                value={collectionEntryForm.collection_date}
                onChange={(e) => setCollectionEntryForm(prev => ({ ...prev, collection_date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                required
              />
            </div>
          </div>
        </div>

        {/* Member Entry Section */}
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-md">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
            <h4 className="text-md font-semibold text-gray-900">Member Entries</h4>
            {collectionEntryForm.members.length === 0 && (
              <button
                type="button"
                onClick={addMemberEntry}
                disabled={!collectionEntryForm.group_id}
                className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer w-full sm:w-auto"
              >
                <FaPlus className="mr-2" />
                More
              </button>
            )}
          </div>
          
          {collectionEntryForm.members.map((memberEntry, index) => {
            const selectedMember = collectionEntryMembers.find(m => m.id === parseInt(memberEntry.member_id));
            const availableMembers = getAvailableMembers(index);
            const totalAmount = calculateMemberTotal(memberEntry);
            
            return (
              <div key={index} className="border border-gray-200 rounded-lg p-3 sm:p-4 mb-4">
                <div className="flex justify-between items-center mb-3 sm:mb-4">
                  <h5 className="font-medium text-sm sm:text-base text-gray-900">Member {index + 1}</h5>
                  <button
                    type="button"
                    onClick={() => removeMemberEntry(index)}
                    className="text-red-600 hover:text-red-800 cursor-pointer transition-colors flex-shrink-0 ml-2"
                    aria-label="Remove member entry"
                  >
                    <FaTimesCircle className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Member Selection */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Member *
                    </label>
                    <select
                      value={memberEntry.member_id}
                      onChange={(e) => updateMemberEntry(index, 'member_id', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      required
                      disabled={collectionEntryLoading || !collectionEntryForm.group_id}
                    >
                      <option value="">Select Member</option>
                      {availableMembers.map(member => (
                        <option key={member.id} value={member.id}>
                          {member.user?.full_name || member.member_code} ({member.member_code})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Receipt Number - Per Member */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Receipt Number
                    </label>
                    <input
                      type="text"
                      value={memberEntry.receipt_number || ''}
                      onChange={(e) => updateMemberEntry(index, 'receipt_number', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-text"
                      placeholder="Enter receipt number"
                    />
                  </div>
                  
                  {/* Total Amount - Auto-calculated */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Amount
                    </label>
                    <input
                      type="text"
                      value={formatCurrency(totalAmount)}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700 font-semibold"
                    />
                  </div>
                </div>
                
                {/* Transaction Types - Only show when member is selected */}
                {selectedMember && (
                  <div className="space-y-4">
                    {/* Transaction Type Dropdown */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type of Transaction
                      </label>
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            addTransactionType(index, e.target.value);
                            e.target.value = ''; // Reset dropdown
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        disabled={!memberEntry.member_id}
                      >
                        <option value="">Select Transaction Type</option>
                        {TRANSACTION_TYPES.map(type => {
                          // Don't show already selected types
                          if (memberEntry.transaction_types?.includes(type.value)) {
                            return null;
                          }
                          
                          // Check if member has a loan
                          const memberId = parseInt(memberEntry.member_id);
                          // Check if loan info has been loaded (entry exists in map)
                          const loanInfoLoaded = memberId in memberLoanMap;
                          
                          if (loanInfoLoaded) {
                            // Loan info has been loaded - check if member has a loan
                            const hasLoan = memberLoanMap[memberId] !== null && memberLoanMap[memberId] !== undefined;
                            // If member doesn't have a loan, only show THRIFT and JOINING_FEE
                            if (!hasLoan) {
                              if (type.value !== 'THRIFT' && type.value !== 'JOINING_FEE') {
                                return null; // Hide Loan Instalment and INTEREST for members without loans
                              }
                            }
                            // If member has a loan, show all transaction types
                          } else {
                            // Loan info hasn't loaded yet - be conservative and only show THRIFT and JOINING_FEE
                            // This prevents users from selecting loan-related transactions before loan info is confirmed
                            if (type.value !== 'THRIFT' && type.value !== 'JOINING_FEE') {
                              return null; // Hide Loan Instalment and INTEREST until loan info loads
                            }
                          }
                          
                          return (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          );
                        })}
                      </select>
                    </div>
                    
                    {/* Dynamic Transaction Amount Fields */}
                    {memberEntry.transaction_types && memberEntry.transaction_types.length > 0 && (
                      <div className="space-y-3">
                        {memberEntry.transaction_types.map(transactionType => {
                          // All transaction types now have single amount field
                          // Loan Instalment = Principal only, Interest = separate transaction
                          const transactionLabel = TRANSACTION_TYPES.find(t => t.value === transactionType)?.label || transactionType;
                          return (
                            <div key={transactionType} className="border border-gray-200 rounded-lg p-2 sm:p-3 bg-gray-50">
                              <div className="flex justify-between items-center mb-2 sm:mb-3">
                                <span className="font-medium text-xs sm:text-sm text-gray-900 break-words pr-2">
                                  {transactionType === 'EMI' ? 'Loan Instalment' : transactionLabel}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => removeTransactionType(index, transactionType)}
                                  className="text-red-600 hover:text-red-800 cursor-pointer flex-shrink-0"
                                  aria-label="Remove transaction type"
                                >
                                  <FaTimesCircle className="text-sm w-4 h-4 sm:w-5 sm:h-5" />
                                </button>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  {transactionType === 'EMI' ? 'Loan Instalment Amount' : 'Amount'}
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={memberEntry.amounts?.[transactionType] || 0}
                                  onChange={(e) => updateTransactionAmount(index, transactionType, e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-text"
                                  placeholder="0.00"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          
          {collectionEntryForm.members.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {collectionEntryForm.group_id 
                ? 'Click "More" to add a member entry'
                : 'Please select a group first'}
            </div>
          )}
          
          {collectionEntryForm.members.length > 0 && (
            <div className="flex justify-end mt-4">
              <button
                type="button"
                onClick={addMemberEntry}
                className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer w-full sm:w-auto"
              >
                <FaPlus className="mr-2" />
                More
              </button>
            </div>
          )}
        </div>

        {/* Receipt Upload */}
        {collectionEntryForm.members.length > 0 && (
          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-md">
            <h4 className="text-md font-semibold text-gray-900 mb-4">Receipt Upload</h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Receipt (JPG, PNG, PDF) *
              </label>
              
              {!collectionEntryReceipt ? (
                <div>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <FaUpload className="w-8 h-8 mb-2 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">JPG, PNG or PDF (MAX. 10MB)</p>
                    </div>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={handleReceiptChange}
                      className="hidden"
                      required
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-2">One receipt for the entire group collection</p>
                </div>
              ) : (
                <div className="border border-gray-300 rounded-lg p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex items-start space-x-3 sm:space-x-4 flex-1 min-w-0">
                      {collectionEntryReceipt.type.startsWith('image/') && receiptPreviewUrl && (
                        <div className="flex-shrink-0">
                          <img
                            src={receiptPreviewUrl}
                            alt="Receipt preview"
                            className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg border border-gray-300"
                          />
                        </div>
                      )}
                      
                      {collectionEntryReceipt.type === 'application/pdf' && (
                        <div className="flex-shrink-0">
                          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-red-100 rounded-lg border border-red-300 flex items-center justify-center">
                            <span className="text-red-600 font-bold text-xl sm:text-2xl">PDF</span>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {collectionEntryReceipt.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatFileSize(collectionEntryReceipt.size)} • {collectionEntryReceipt.type.split('/')[1].toUpperCase()}
                        </p>
                        <p className="text-xs text-green-600 mt-1">✓ File selected and ready to upload</p>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={handleRemoveReceipt}
                      className="text-red-600 hover:text-red-800 transition-colors cursor-pointer self-start sm:self-auto flex-shrink-0"
                      title="Remove file"
                      aria-label="Remove file"
                    >
                      <FaTimesCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={collectionEntrySubmitting || collectionEntryForm.members.length === 0}
            className="flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer w-full sm:w-auto"
          >
            <FaSave className="mr-2" />
            {collectionEntrySubmitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CollectionEntryTab;
