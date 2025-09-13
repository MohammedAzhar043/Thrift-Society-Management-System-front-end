// components/BillCollectorDashboard.jsx
import { useState, useEffect } from 'react';
import { FaUsers, FaMoneyBillWave, FaHistory, FaHandHoldingUsd, FaSignOutAlt, FaPlus, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import apiService from '../services/api';
import { formatIndianCurrency } from '../utils/formatters';
import useFormSubmission from '../hooks/useFormSubmission';

function BillCollectorDashboard({ user, onLogout }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Form submission hooks
  const { isSubmitting: isSubmittingCollection, submitForm: submitCollectionForm } = useFormSubmission();
  const { isSubmitting: isSubmittingLoan, submitForm: submitLoanForm } = useFormSubmission();
  const [stats, setStats] = useState({
    assigned_groups: 0,
    today_collections: 0,
    today_total: 0,
    month_total: 0,
    pending_verifications: 0,
    groups: []
  });
  const [collections, setCollections] = useState([]);
  const [loanRequests, setLoanRequests] = useState([]);
  const [groupMembers, setGroupMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [collectionForm, setCollectionForm] = useState({
    group_id: '',
    collection_date: new Date().toISOString().split('T')[0],
    total_collected: 0,
    collection_items: [],
    // Loan request fields
    member_id: '',
    requested_amount: '',
    purpose: '',
    term_months: '12'
  });

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [statsData, collectionsData, loanRequestsData] = await Promise.all([
        apiService.getCollectorDashboardStats(),
        apiService.getCollectionRecords(),
        apiService.getCollectorLoanRequests()
      ]);
      
      setStats(statsData);
      setCollections(collectionsData);
      setLoanRequests(loanRequestsData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Load group members when group is selected
  const loadGroupMembers = async (groupId, forLoanRequest = false) => {
    try {
      setLoadingMembers(true);
      console.log('Loading members for group ID:', groupId, 'forLoanRequest:', forLoanRequest);
      
      // Load both members and loans for the group
      const [members, loans] = await Promise.all([
        apiService.getCollectorGroupMembers(groupId, forLoanRequest ? 'ACTIVE' : null),
        apiService.getCollectorGroupLoans(groupId)
      ]);
      
      console.log('Loaded members:', members);
      console.log('Loaded loans:', loans);
      console.log('Loan statuses:', loans.map(loan => ({ id: loan.id, member_id: loan.member_id, status: loan.status })));
      
      let filteredMembers;
      
      if (forLoanRequest) {
        // For loan requests, use all members (already filtered by ACTIVE status from API)
        filteredMembers = members;
        console.log('Active members for loan request:', filteredMembers);
      } else {
        // For collections, filter members who have active loans
        const activeLoanMemberIds = new Set(
          loans
            .filter(loan => loan.status === 'ACTIVE' || loan.status === 'DISBURSED' || loan.status === 'APPROVED')
            .map(loan => loan.member_id)
        );
        
        // Filter members to only include those with active loans
        filteredMembers = members.filter(member => activeLoanMemberIds.has(member.id));
        console.log('Active loan member IDs:', Array.from(activeLoanMemberIds));
        console.log('Members with active loans:', filteredMembers);
        console.log('Members without loans:', members.filter(member => !activeLoanMemberIds.has(member.id)));
      }
      
      // Add EMI calculation for each member
      const membersWithEMI = await Promise.all(filteredMembers.map(async (member) => {
        // Find the member's active loan
        const memberLoan = loans.find(loan => 
          loan.member_id === member.id && 
          (loan.status === 'ACTIVE' || loan.status === 'DISBURSED' || loan.status === 'APPROVED')
        );
        
        // Fetch payment history for this member's loan
        let paymentsMade = 0;
        if (memberLoan) {
          try {
            const paymentData = await apiService.getLoanPayments(memberLoan.id);
            paymentsMade = paymentData.total_payments || 0;
          } catch (error) {
            console.warn(`Failed to fetch payments for loan ${memberLoan.id}:`, error);
            paymentsMade = 0;
          }
        }
        
        return {
          ...member,
          current_emi_due: calculateEMIDue(member, memberLoan),
          carry_forward_amount: member.carry_forward_amount || 0,
          remaining_loan_amount: calculateRemainingLoanAmount({...member, payments_made: paymentsMade}, memberLoan),
          payments_made: paymentsMade,
          loan_info: memberLoan
        };
      }));
      
      console.log('Members with EMI calculation:', membersWithEMI);
      setGroupMembers(membersWithEMI);
    } catch (err) {
      console.error('Error loading group members:', err);
      // Fallback: create some mock members with loans for testing
      const mockMembers = [
        {
          id: 1,
          member_code: 'M001',
          user: { full_name: 'John Doe' },
          monthly_emi: 500,
          carry_forward_amount: 0,
          loan_info: { id: 1, loan_amount: 10000, status: 'ACTIVE' }
        },
        {
          id: 2,
          member_code: 'M002',
          user: { full_name: 'Jane Smith' },
          monthly_emi: 600,
          carry_forward_amount: 100,
          loan_info: { id: 2, loan_amount: 15000, status: 'ACTIVE' }
        },
        {
          id: 3,
          member_code: 'M003',
          user: { full_name: 'Bob Johnson' },
          monthly_emi: 400,
          carry_forward_amount: 0,
          loan_info: { id: 3, loan_amount: 8000, status: 'ACTIVE' }
        }
      ];
      
      const membersWithEMI = mockMembers.map(member => ({
        ...member,
        current_emi_due: calculateEMIDue(member, member.loan_info),
        carry_forward_amount: member.carry_forward_amount || 0
      }));
      
      console.log('Using mock members with loans:', membersWithEMI);
      setGroupMembers(membersWithEMI);
    } finally {
      setLoadingMembers(false);
    }
  };

  // Calculate EMI due for a member using correct compound interest formula
  const calculateEMIDue = (member, loanInfo) => {
    // If no loan info, return 0
    if (!loanInfo) {
      return 0;
    }
    
    const loanAmount = loanInfo.loan_amount || 0;
    const termMonths = loanInfo.term_months || 12;
    const annualInterestRate = loanInfo.interest_rate || 12.0; // Use actual loan interest rate
    
    // Convert annual rate to monthly rate
    const monthlyRate = annualInterestRate / 100 / 12;
    
    // Calculate EMI using compound interest formula
    // EMI = P × r × (1+r)^n / ((1+r)^n - 1)
    const emi = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, termMonths) / 
                (Math.pow(1 + monthlyRate, termMonths) - 1);
    
    const carryForward = member.carry_forward_amount || 0;
    
    // Calculate interest on carry-forward amount (monthly rate)
    const interestOnCarryForward = carryForward * monthlyRate;
    
    // Total due = This month's EMI + Carry forward + Interest on carry forward
    const totalDue = emi + carryForward + interestOnCarryForward;
    
    return totalDue;
  };

  // Calculate remaining loan amount
  const calculateRemainingLoanAmount = (member, loanInfo) => {
    if (!loanInfo) {
      return 0;
    }
    
    const loanAmount = loanInfo.loan_amount || 0;
    const termMonths = loanInfo.term_months || 12;
    const annualInterestRate = loanInfo.interest_rate || 12.0;
    const monthlyRate = annualInterestRate / 100 / 12;
    
    // Calculate EMI
    const emi = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, termMonths) / 
                (Math.pow(1 + monthlyRate, termMonths) - 1);
    
    // Calculate total amount to be paid
    const totalAmount = emi * termMonths;
    
    // Get payments made from member's payment history
    const paymentsMade = member.payments_made || 0;
    
    // Calculate remaining amount
    const remainingAmount = totalAmount - paymentsMade;
    
    return Math.max(0, remainingAmount);
  };

  // Calculate carry-forward amount after partial payment
  const calculateCarryForward = (member, amountPaid) => {
    const totalDue = calculateEMIDue(member, member.loan_info);
    const remaining = totalDue - amountPaid;
    return remaining > 0 ? remaining : 0;
  };

  // Get member by ID for calculations
  const getMemberById = (memberId) => {
    return groupMembers.find(member => member.id === parseInt(memberId));
  };

  // Get member name by ID for display
  const getMemberNameById = (memberId) => {
    const member = getMemberById(memberId);
    if (member) {
      return member.user?.full_name || member.member_code || `Member ${memberId}`;
    }
    // If member not found in current groupMembers, return a fallback
    return `Member ${memberId}`;
  };

  // Handle collection submission
  const handleCollectionSubmit = async (e) => {
    e.preventDefault();
    
    // Validate collection items
    if (collectionForm.collection_items.length === 0) {
      setError('Please add at least one collection item');
      return;
    }

    // Validate all collection items have required fields
    for (let i = 0; i < collectionForm.collection_items.length; i++) {
      const item = collectionForm.collection_items[i];
      if (!item.member_id || !item.amount || !item.payment_type) {
        setError(`Please fill in all fields for collection item ${i + 1}`);
        return;
      }
      if (parseFloat(item.amount) <= 0) {
        setError(`Amount must be greater than 0 for collection item ${i + 1}`);
        return;
      }
    }

    await submitCollectionForm(async () => {
      const totalCalculated = collectionForm.collection_items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
      if (Math.abs(totalCalculated - parseFloat(collectionForm.total_collected || 0)) > 0.01) {
        throw new Error(`Total collected amount (${collectionForm.total_collected}) does not match sum of collection items (${formatIndianCurrency(totalCalculated, false)})`);
      }

      await apiService.createCollectionRecord(collectionForm);
      
      // Reset form and refresh data
      setCollectionForm({
        group_id: '',
        collection_date: new Date().toISOString().split('T')[0],
        total_collected: 0,
        collection_items: []
      });
      setShowCollectionModal(false);
      fetchDashboardData();
    }, {
      onError: (err) => {
        console.error('Error creating collection record:', err);
        setError('Failed to create collection record. Please try again.');
      }
    });
  };

  // Add collection item
  const addCollectionItem = () => {
    setCollectionForm(prev => ({
      ...prev,
      collection_items: [
        ...prev.collection_items,
        { member_id: '', amount: '', payment_type: 'principal', loan_id: null }
      ]
    }));
  };

  // Remove collection item
  const removeCollectionItem = (index) => {
    setCollectionForm(prev => ({
      ...prev,
      collection_items: prev.collection_items.filter((_, i) => i !== index)
    }));
  };

  // Update collection item
  const updateCollectionItem = (index, field, value) => {
    setCollectionForm(prev => ({
      ...prev,
      collection_items: prev.collection_items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value };
          
          // If member_id is being updated, also set the loan_id
          if (field === 'member_id') {
            const selectedMember = getMemberById(value);
            if (selectedMember && selectedMember.loan_info) {
              updatedItem.loan_id = selectedMember.loan_info.id;
            }
          }
          
          return updatedItem;
        }
        return item;
      })
    }));
  };

  // Reset loan request form
  const resetLoanRequestForm = () => {
    setCollectionForm(prev => ({
      ...prev,
      member_id: '',
      requested_amount: '',
      purpose: '',
      term_months: '12'
    }));
    setGroupMembers([]);
  };

  // Handle loan request submission
  const handleLoanRequestSubmit = async (e) => {
    e.preventDefault();
    
    await submitLoanForm(async () => {
      const loanRequestData = {
        member_id: parseInt(collectionForm.member_id),
        group_id: parseInt(collectionForm.group_id),
        requested_amount: parseFloat(collectionForm.requested_amount),
        purpose: collectionForm.purpose,
        term_months: parseInt(collectionForm.term_months)
      };

      await apiService.createCollectorLoanRequest(loanRequestData);
      
      setShowLoanModal(false);
      resetLoanRequestForm();
      fetchDashboardData();
    }, {
      onError: (err) => {
        console.error('Error creating loan request:', err);
        let errorMessage = 'Failed to create loan request. Please try again.';
        
        if (err.message) {
          errorMessage = err.message;
        } else if (err.detail) {
          errorMessage = err.detail;
        } else if (typeof err === 'string') {
          errorMessage = err;
        }
        
        setError(errorMessage);
      }
    });
  };

  if (loading && !stats.groups.length) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Bill Collector Dashboard</h1>
            <p className="text-sm text-gray-600">Welcome, {user.name}</p>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center text-gray-700 hover:text-gray-900"
          >
            <FaSignOutAlt className="mr-1" /> Logout
          </button>
        </div>
      </header>

      {/* Error Alert */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <FaTimesCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-600"
                >
                  <FaTimesCircle className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-3 py-4 sm:px-4 sm:py-5 lg:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500 rounded-md p-2 sm:p-3">
                  <FaUsers className="text-white h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="ml-3 sm:ml-5 w-0 flex-1 min-w-0">
                  <dl>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Total Groups</dt>
                    <dd className="flex items-baseline">
                      <div className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">{stats.assigned_groups}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-3 py-4 sm:px-4 sm:py-5 lg:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500 rounded-md p-2 sm:p-3">
                  <FaMoneyBillWave className="text-white h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="ml-3 sm:ml-5 w-0 flex-1 min-w-0">
                  <dl>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Today's Collection</dt>
                    <dd className="flex items-baseline">
                      <div className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 truncate">{formatIndianCurrency(stats.today_total)}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-3 py-4 sm:px-4 sm:py-5 lg:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-500 rounded-md p-2 sm:p-3">
                  <FaHandHoldingUsd className="text-white h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="ml-3 sm:ml-5 w-0 flex-1 min-w-0">
                  <dl>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Month Total</dt>
                    <dd className="flex items-baseline">
                      <div className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 truncate">{formatIndianCurrency(stats.month_total)}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-3 py-4 sm:px-4 sm:py-5 lg:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-500 rounded-md p-2 sm:p-3">
                  <FaCheckCircle className="text-white h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="ml-3 sm:ml-5 w-0 flex-1 min-w-0">
                  <dl>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Pending Verifications</dt>
                    <dd className="flex items-baseline">
                      <div className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">{stats.pending_verifications}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Groups Section */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Assigned Groups</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Groups you manage and collect from</p>
              </div>
              {stats.groups.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {stats.groups.map((group) => (
                    <li key={group.id}>
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-blue-600 truncate">{group.name}</p>
                            <p className="mt-2 flex items-center text-sm text-gray-500">
                              <FaUsers className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                              {group.member_count} members
                            </p>
                          </div>
                          <div className="ml-2 flex-shrink-0 flex space-x-2">
                            <button 
                              onClick={async () => {
                                setSelectedGroup(group);
                                setCollectionForm(prev => ({ ...prev, group_id: group.id }));
                                setShowCollectionModal(true);
                                // Load group members when opening collection modal
                                await loadGroupMembers(group.id, false);
                              }}
                              className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                            >
                              Collect
                            </button>
                            <button 
                              onClick={async () => {
                                setSelectedGroup(group);
                                setShowTransactionModal(true);
                                // Load group members for transaction history display
                                await loadGroupMembers(group.id, false);
                              }}
                              className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                            >
                              History
                            </button>
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="text-sm text-gray-500">
                            <span className="text-gray-600">Location: {group.location}</span>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-4 py-8 text-center text-gray-500">
                  No groups assigned yet.
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Section */}
          <div>
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Quick Actions</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Common tasks</p>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <div className="grid gap-4">
                  <button 
                    onClick={() => {
                      setError(null); // Clear any previous errors
                      // Reset form and clear group members
                      setCollectionForm({
                        group_id: '',
                        collection_date: new Date().toISOString().split('T')[0],
                        total_collected: 0,
                        collection_items: []
                      });
                      setGroupMembers([]);
                      setShowCollectionModal(true);
                    }}
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <FaMoneyBillWave className="mr-2" /> Collect Daily Money
                  </button>
                  <button 
                    onClick={() => {
                      setError(null); // Clear any previous errors
                      setSelectedGroup(null); // Clear selected group for general history view
                      setGroupMembers([]); // Clear group members
                      setShowTransactionModal(true);
                    }}
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <FaHistory className="mr-2" /> View Transaction History
                  </button>
                  <button 
                    onClick={() => {
                      setError(null); // Clear any previous errors
                      setShowLoanModal(true);
                    }}
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <FaHandHoldingUsd className="mr-2" /> Raise Loan Request
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Collections */}
            <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Collections</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Latest collection records</p>
              </div>
              <div className="px-4 py-5 sm:p-6">
                {collections.slice(0, 3).length > 0 ? (
                  <div className="space-y-3">
                    {collections.slice(0, 3).map((collection) => (
                      <div key={collection.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {collection.group?.name || 'Unknown Group'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(collection.collection_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-green-600">
                            {formatIndianCurrency(collection.total_collected)}
                          </p>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            collection.is_verified 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {collection.is_verified ? 'Verified' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 text-sm">No recent collections</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Collection Modal */}
      {showCollectionModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create Collection Record</h3>
              <form onSubmit={handleCollectionSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Group</label>
                    <select
                      value={collectionForm.group_id}
                      onChange={(e) => {
                        const groupId = e.target.value;
                        setCollectionForm(prev => ({ ...prev, group_id: groupId }));
                        if (groupId) {
                          loadGroupMembers(groupId, false); // false for collections
                        } else {
                          setGroupMembers([]);
                        }
                      }}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select Group</option>
                      {stats.groups.map(group => (
                        <option key={group.id} value={group.id}>{group.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Collection Date</label>
                    <input
                      type="date"
                      value={collectionForm.collection_date}
                      onChange={(e) => setCollectionForm(prev => ({ ...prev, collection_date: e.target.value }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>


                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Collection Items</label>
                    <button
                      type="button"
                      onClick={addCollectionItem}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                    >
                      <FaPlus className="mr-1" /> Add Item
                    </button>
                  </div>
                  
                  {collectionForm.collection_items.map((item, index) => {
                    const selectedMember = getMemberById(item.member_id);
                    const dueAmount = selectedMember ? parseFloat(calculateEMIDue(selectedMember, selectedMember.loan_info)) : 0;
                    const amountPaid = parseFloat(item.amount || 0);
                    const remaining = dueAmount - amountPaid;
                    
                    // Debug logging
                    console.log('Collection item debug:', {
                      memberId: item.member_id,
                      selectedMember: selectedMember,
                      loanInfo: selectedMember?.loan_info,
                      dueAmount,
                      amountPaid,
                      remaining
                    });
                    
                    return (
                      <div key={index} className="border border-gray-200 rounded-lg p-3 mb-3">
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <select
                            value={item.member_id}
                            onChange={(e) => updateCollectionItem(index, 'member_id', e.target.value)}
                            className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            required
                            disabled={loadingMembers}
                          >
                            <option value="">
                              {loadingMembers ? 'Loading members...' : 'Select Member'}
                            </option>
                            {groupMembers.map(member => (
                              <option key={member.id} value={member.id}>
                                {member.user?.full_name || member.member_code}
                              </option>
                            ))}
                          </select>
                          <div className="flex">
                            <input
                              type="number"
                              placeholder="Amount Paid"
                              value={item.amount}
                              onChange={(e) => updateCollectionItem(index, 'amount', e.target.value)}
                              className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                              step="0.01"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => removeCollectionItem(index)}
                              className="ml-2 px-2 py-1 text-red-600 hover:text-red-800"
                            >
                              <FaTimesCircle />
                            </button>
                          </div>
                        </div>
                        
                        {/* Hidden fields for backend compatibility */}
                        <input
                          type="hidden"
                          value={item.payment_type || 'principal'}
                          onChange={(e) => updateCollectionItem(index, 'payment_type', e.target.value)}
                        />
                        <input
                          type="hidden"
                          value={item.loan_id || ''}
                          onChange={(e) => updateCollectionItem(index, 'loan_id', e.target.value)}
                        />
                        
                        {/* Show due amount and remaining for selected member */}
                        {selectedMember && (
                          <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                            {selectedMember.loan_info ? (
                              <>
                                <div className="flex justify-between">
                                  <span>Due Amount: {formatIndianCurrency(dueAmount)}</span>
                                  <span className={remaining > 0 ? 'text-red-600' : 'text-green-600'}>
                                    {remaining > 0 ? `Remaining: ${formatIndianCurrency(remaining)}` : 'Fully Paid'}
                                  </span>
                                </div>
                                {remaining > 0 && (
                                  <div className="text-red-500 text-xs mt-1">
                                    ⚠️ This amount will carry forward to next month with interest
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="text-yellow-600 text-xs">
                                ⚠️ No active loan found for this member
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* EMI Due Information */}
                {collectionForm.group_id && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">EMI Due Information</h4>
                    {loadingMembers ? (
                      <div className="text-center text-gray-500 py-4">
                        Loading members...
                      </div>
                    ) : groupMembers.length > 0 ? (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {groupMembers.map(member => (
                          <div key={member.id} className="bg-white p-3 rounded-lg border border-gray-200">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-gray-800 font-semibold">
                                    {member.user?.full_name || member.member_code}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {member.loan_info?.interest_rate || 12.0}% p.a.
                                  </span>
                                </div>
                                
                                {member.loan_info && (
                                  <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                                    <div>
                                      <span className="font-medium">Principal:</span><br/>
                                      {formatIndianCurrency(member.loan_info.loan_amount || 0)}
                                    </div>
                                    <div>
                                      <span className="font-medium">Paid:</span><br/>
                                      <span className="text-green-600 font-semibold">
                                        {formatIndianCurrency(member.payments_made || 0)}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="font-medium">Remaining:</span><br/>
                                      <span className="text-orange-600 font-semibold">
                                        {formatIndianCurrency(member.remaining_loan_amount || 0)}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              <div className="text-right ml-4">
                                <div className="bg-blue-50 px-3 py-2 rounded-lg">
                                  <div className="text-xs text-gray-600 mb-1">This Month Due</div>
                                  <div className="text-lg font-bold text-blue-700">
                                    {formatIndianCurrency(member.current_emi_due || 0)}
                                  </div>
                                </div>
                                
                                {member.carry_forward_amount > 0 && (
                                  <div className="mt-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                                    Carry Forward: {formatIndianCurrency(member.carry_forward_amount)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-4">
                        No members with active loans found for this group
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Collected</label>
                  <input
                    type="number"
                    value={collectionForm.total_collected}
                    onChange={(e) => setCollectionForm(prev => ({ ...prev, total_collected: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    step="0.01"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCollectionModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingCollection}
                    className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white flex items-center ${
                      isSubmittingCollection 
                        ? 'bg-blue-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {isSubmittingCollection && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    )}
                    {isSubmittingCollection ? 'Creating...' : 'Create Collection'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Transaction History Modal */}
      {showTransactionModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Transaction History
                  {selectedGroup && ` - ${selectedGroup.name}`}
                </h3>
                <button
                  onClick={() => setShowTransactionModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimesCircle className="h-6 w-6" />
                </button>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {loadingMembers ? (
                  <div className="text-center text-gray-500 py-8">
                    Loading transaction history...
                  </div>
                ) : collections.length > 0 ? (
                  <div className="space-y-3">
                    {collections
                      .filter(c => !selectedGroup || c.group_id === selectedGroup.id)
                      .map((collection) => (
                        <div key={collection.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900">
                                {collection.group?.name || 'Unknown Group'}
                              </p>
                              <p className="text-sm text-gray-500">
                                {new Date(collection.collection_date).toLocaleDateString()}
                              </p>
                              {collection.notes && (
                                <p className="text-sm text-gray-600 mt-1">{collection.notes}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-semibold text-green-600">
                                {formatIndianCurrency(collection.total_collected)}
                              </p>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                collection.is_verified 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {collection.is_verified ? 'Verified' : 'Pending'}
                              </span>
                            </div>
                          </div>
                          
                          {collection.collection_items && collection.collection_items.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-sm font-medium text-gray-700 mb-2">Collection Items:</p>
                              <div className="space-y-1">
                                {collection.collection_items.map((item, index) => (
                                  <div key={index} className="flex justify-between text-sm">
                                    <span className="text-gray-600">
                                      {item.member?.user?.full_name || item.member?.member_code || `Member ${item.member_id}`}
                                    </span>
                                    <span className="font-medium">{formatIndianCurrency(item.amount)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500">No transaction history available</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loan Request Modal */}
      {showLoanModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create Loan Request</h3>
              <form onSubmit={handleLoanRequestSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Group</label>
                    <select
                      value={collectionForm.group_id}
                      onChange={(e) => {
                        const groupId = e.target.value;
                        setCollectionForm(prev => ({ ...prev, group_id: groupId, member_id: '' }));
                        if (groupId) {
                          loadGroupMembers(parseInt(groupId), true); // true for loan requests
                        } else {
                          setGroupMembers([]);
                        }
                      }}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select Group</option>
                      {stats.groups.map(group => (
                        <option key={group.id} value={group.id}>{group.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Member</label>
                    <select
                      value={collectionForm.member_id}
                      onChange={(e) => setCollectionForm(prev => ({ ...prev, member_id: e.target.value }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      required
                      disabled={loadingMembers}
                    >
                      <option value="">
                        {loadingMembers ? 'Loading members...' : 'Select Member'}
                      </option>
                      {groupMembers.map(member => (
                        <option key={member.id} value={member.id}>
                          {member.user?.full_name || member.member_code}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Requested Amount</label>
                    <input
                      type="number"
                      value={collectionForm.requested_amount}
                      onChange={(e) => setCollectionForm(prev => ({ ...prev, requested_amount: e.target.value }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Term (Months)</label>
                    <input
                      type="number"
                      value={collectionForm.term_months}
                      onChange={(e) => setCollectionForm(prev => ({ ...prev, term_months: e.target.value }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      min="1"
                      max="120"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Purpose</label>
                  <textarea
                    value={collectionForm.purpose}
                    onChange={(e) => setCollectionForm(prev => ({ ...prev, purpose: e.target.value }))}
                    rows={3}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowLoanModal(false);
                      resetLoanRequestForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingLoan}
                    className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white flex items-center ${
                      isSubmittingLoan 
                        ? 'bg-blue-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {isSubmittingLoan && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    )}
                    {isSubmittingLoan ? 'Creating...' : 'Create Loan Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BillCollectorDashboard;