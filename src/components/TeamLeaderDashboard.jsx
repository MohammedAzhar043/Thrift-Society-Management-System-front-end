import { useState, useEffect } from 'react';
import { 
  FaUsers, 
  FaUserPlus, 
  FaHandHoldingUsd, 
  FaChartPie, 
  FaSignOutAlt, 
  FaEye, 
  FaPlus,
  FaSearch,
  FaFilter,
  FaDownload,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle
} from 'react-icons/fa';
import apiService from '../services/api';
import { formatIndianCurrency } from '../utils/formatters';
import { formatCurrency, formatDate } from '../utils/formatters';

function TeamLeaderDashboard({ user, onLogout }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Data states
  const [assignedGroups, setAssignedGroups] = useState([]);
  const [groupMembers, setGroupMembers] = useState([]);
  const [pendingMembers, setPendingMembers] = useState([]);
  const [groupLoans, setGroupLoans] = useState([]);
  const [loanRequests, setLoanRequests] = useState([]);
  const [loanOverview, setLoanOverview] = useState({});
  const [transactionHistory, setTransactionHistory] = useState([]);

  
  // UI states
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showLoanRequestModal, setShowLoanRequestModal] = useState(false);
  const [showMemberDetailsModal, setShowMemberDetailsModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [isCreatingMember, setIsCreatingMember] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Form states
  const [newMember, setNewMember] = useState({
    joined_date: '',
    // Member Information
    monthly_income: '',
    nominee_name: '',
    nominee_phone: '',
    nominee_relation: '',
    // User details
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    full_name: '',
    // Banking details
    aadhar_id: '',
    bank_account_number: '',
    bank_name: '',
    bank_branch: '',
    ifsc_code: '',
    // File upload
    aadhar_document_file: null,
    bank_passbook_file: null
  });
  
  // Add state for password visibility, field errors, and form steps
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newLoanRequest, setNewLoanRequest] = useState({
    requested_amount: '',
    purpose: '',
    term_months: '',
    member_id: ''
  });

  // Load initial data
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Password validation function
  const validatePassword = (password) => {
    if (password.length < 8) {
      return "Password must be at least 8 characters long";
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return "Password must contain at least one special character";
    }
    return null;
  };

  // Comprehensive form validation
  const validateForm = () => {
    const errors = {};
    
    // Required fields validation
    if (!newMember.username.trim()) {
      errors.username = "Username is required";
    } else if (newMember.username.length < 3) {
      errors.username = "Username must be at least 3 characters long";
    }
    
    if (!newMember.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newMember.email)) {
      errors.email = "Please enter a valid email address";
    }
    
    if (!newMember.password.trim()) {
      errors.password = "Password is required";
    } else {
      const passwordError = validatePassword(newMember.password);
      if (passwordError) {
        errors.password = passwordError;
      }
    }
    
    if (newMember.password !== newMember.confirm_password) {
      errors.confirm_password = "Passwords do not match";
    }
    
    if (!newMember.joined_date) {
      errors.joined_date = "Join date is required";
    }
    
    // Aadhar document is required
    if (!newMember.aadhar_document_file) {
      errors.aadhar_document = "Aadhar document is required";
    }
    
    // Bank passbook is required
    if (!newMember.bank_passbook_file) {
      errors.bank_passbook = "Bank passbook is required";
    }
    
    // Aadhar ID validation
    if (newMember.aadhar_id.trim() && !/^\d{12}$/.test(newMember.aadhar_id.replace(/\s/g, ''))) {
      errors.aadhar_id = "Aadhar ID must be exactly 12 digits";
    }
    
    // IFSC Code validation
    if (newMember.ifsc_code.trim() && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(newMember.ifsc_code)) {
      errors.ifsc_code = "IFSC code must be 11 characters (e.g., SBIN0001234)";
    }
    
    // Emergency phone validation
    if (newMember.nominee_phone.trim() && !/^[6-9]\d{9}$/.test(newMember.nominee_phone.replace(/\s/g, ''))) {
      errors.nominee_phone = "Nominee phone must be a valid 10-digit Indian mobile number";
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form step validation
  const validateStep = (step) => {
    const errors = {};
    
    switch (step) {
      case 1: // Basic Information
        if (!newMember.username.trim()) {
          errors.username = "Username is required";
        } else if (newMember.username.length < 3) {
          errors.username = "Username must be at least 3 characters";
        }
        
        if (!newMember.email.trim()) {
          errors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newMember.email)) {
          errors.email = "Please enter a valid email address";
        }
        
        if (!newMember.password.trim()) {
          errors.password = "Password is required";
        } else {
          const passwordError = validatePassword(newMember.password);
          if (passwordError) {
            errors.password = passwordError;
          }
        }
        
        if (!newMember.confirm_password) {
          errors.confirm_password = "Please confirm your password";
        } else if (newMember.password !== newMember.confirm_password) {
          errors.confirm_password = "Passwords do not match";
        }
        
        if (!newMember.full_name.trim()) {
          errors.full_name = "Full name is required";
        }
        break;
        
      case 2: // Banking Details
        if (newMember.aadhar_id.trim() && !/^\d{12}$/.test(newMember.aadhar_id.replace(/\s/g, ''))) {
          errors.aadhar_id = "Aadhar ID must be exactly 12 digits";
        }
        
        if (newMember.ifsc_code.trim() && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(newMember.ifsc_code)) {
          errors.ifsc_code = "IFSC code must be 11 characters (e.g., SBIN0001234)";
        }
        
        // Aadhar document is required
        if (!newMember.aadhar_document_file) {
          errors.aadhar_document = "Aadhar document is required";
        }
        
        // Bank passbook is required
        if (!newMember.bank_passbook_file) {
          errors.bank_passbook = "Bank passbook is required";
        }
        break;
        
      case 3: // Member & Nominee Information
        if (!newMember.joined_date.trim()) {
          errors.joined_date = "Join date is required";
        }
        
        if (newMember.nominee_phone.trim() && !/^[6-9]\d{9}$/.test(newMember.nominee_phone.replace(/\s/g, ''))) {
          errors.nominee_phone = "Nominee phone must be a valid 10-digit Indian mobile number";
        }
        break;
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form navigation functions
  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const resetForm = () => {
    setNewMember({
      joined_date: '',
      monthly_income: '',
      nominee_name: '',
      nominee_phone: '',
      nominee_relation: '',
      username: '',
      email: '',
      password: '',
      confirm_password: '',
      full_name: '',
      aadhar_id: '',
      bank_account_number: '',
      bank_name: '',
      bank_branch: '',
      ifsc_code: '',
      aadhar_document_file: null,
      bank_passbook_file: null
    });
    setFieldErrors({});
    setCurrentStep(1);
    setIsSubmitting(false);
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load assigned groups
      const groups = await apiService.getAssignedGroups();
      console.log('Loaded assigned groups:', groups);
      setAssignedGroups(groups);
      
      if (groups.length > 0) {
        await loadGroupData(groups[0].id);
      } else {
        console.warn('No assigned groups found for team leader');
      }
      
      // Load loan overview
      const overview = await apiService.getLoanOverview();
      setLoanOverview(overview);
      
      
    } catch (err) {
      setError('Failed to load dashboard data: ' + err.message);
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };



  const loadGroupData = async (groupId) => {
    try {
      console.log('Loading group data for group ID:', groupId);
      
      const [members, loans, requests, transactions, pending] = await Promise.all([
        apiService.getGroupMembers(groupId).catch(err => {
          console.error('Error loading group members:', err);
          return [];
        }),
        apiService.getGroupLoans(groupId).catch(err => {
          console.error('Error loading group loans:', err);
          return [];
        }),
        apiService.getGroupLoanRequests(groupId).catch(err => {
          console.error('Error loading loan requests:', err);
          return [];
        }),
        apiService.getGroupTransactionHistory(groupId).catch(err => {
          console.error('Error loading transaction history:', err);
          return [];
        }),
        apiService.getPendingMembers(groupId).catch(err => {
          console.error('Error loading pending members:', err);
          return [];
        })
      ]);
      
      console.log('Loaded data:', {
        members: members.length,
        loans: loans.length,
        requests: requests.length,
        transactions: transactions.length,
        pending: pending.length
      });
      
      // Debug loan data
      console.log('Loan data details:', loans.map(loan => ({
        id: loan.id,
        status: loan.status,
        amount: loan.loan_amount,
        member: loan.member?.user?.full_name || 'N/A'
      })));
      
      setGroupMembers(members);
      setGroupLoans(loans);
      setLoanRequests(requests);
      setTransactionHistory(transactions);
      setPendingMembers(pending);
    } catch (err) {
      console.error('Group data load error:', err);
    }
  };



  const handleAddMember = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setFieldErrors({});
    
    // Validate form
    if (!validateForm()) {
      setError('Please fix the errors below before submitting');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null); // Clear any previous errors
      
      // Create member data with user details (without file paths)
      const memberData = {
        group_id: assignedGroups[0]?.id, // Add the required group_id
        member_code: `M${Date.now().toString().slice(-4)}`, // Generate unique member code
        joined_date: newMember.joined_date,
        monthly_income: newMember.monthly_income ? parseFloat(newMember.monthly_income) : null,
        nominee_name: newMember.nominee_name?.trim() || null,
        nominee_phone: newMember.nominee_phone?.trim() || null,
        nominee_relation: newMember.nominee_relation?.trim() || null,
        // User details
        username: newMember.username.trim(),
        email: newMember.email.trim(),
        password: newMember.password,
        full_name: newMember.full_name?.trim() || null,
        // Banking details
        aadhar_id: newMember.aadhar_id?.trim() || null,
        bank_account_number: newMember.bank_account_number?.trim() || null,
        bank_name: newMember.bank_name?.trim() || null,
        bank_branch: newMember.bank_branch?.trim() || null,
        ifsc_code: newMember.ifsc_code?.trim() || null,
        // File paths - set to null initially, will be updated after upload
        bank_passbook_path: null,
        aadhar_document_path: null
      };
      
      // Create member first
      const result = await apiService.requestAddMember(assignedGroups[0]?.id, memberData);
      
      // Upload documents if provided
      let documentsUploaded = 0;
      let totalDocuments = 0;
      
      if (newMember.aadhar_document_file) {
        totalDocuments++;
        try {
          await apiService.uploadUserDocument(result.user_id, newMember.aadhar_document_file);
          documentsUploaded++;
        } catch (error) {
          console.error("Failed to upload Aadhar document:", error);
          setError("Aadhar document upload failed. Please upload manually.");
          return;
        }
      }
      
      if (newMember.bank_passbook_file) {
        totalDocuments++;
        try {
          await apiService.uploadBankPassbook(result.user_id, newMember.bank_passbook_file);
          documentsUploaded++;
        } catch (error) {
          console.error("Failed to upload bank passbook:", error);
          setError("Bank passbook upload failed. Please upload manually.");
          return;
        }
      }
      
      // Success - close modal and refresh data
      setShowAddMemberModal(false);
      resetForm();
      
      // Refresh group data to show new member
      await loadGroupData(assignedGroups[0]?.id);
      
      // Show success message
      const successMessage = documentsUploaded > 0 
        ? `Member has been added successfully with ${documentsUploaded} document(s) uploaded and is now pending admin approval.`
        : 'Member has been added successfully with user account and is now pending admin approval.';
      setSuccessMessage(successMessage);
      setError(null); // Clear any previous errors
    } catch (err) {
      console.error('Error adding member:', err);
      
      // Handle specific error cases
      if (err.message.includes('Member code already exists')) {
        setError('A member with this code already exists. Please use a different member code.');
      } else if (err.message.includes('Group not found')) {
        setError('The selected group was not found. Please refresh the page and try again.');
      } else if (err.message.includes('not authenticated')) {
        setError('Your session has expired. Please log in again.');
      } else {
        setError('Failed to add member: ' + err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateLoanRequest = async (e) => {
    e.preventDefault();
    try {
      const loanRequestData = {
        ...newLoanRequest,
        group_id: assignedGroups[0]?.id
      };
      
      await apiService.createLoanRequest(loanRequestData);
      setShowLoanRequestModal(false);
      setNewLoanRequest({
        requested_amount: '',
        purpose: '',
        term_months: '',
        member_id: ''
      });
      await loadGroupData(assignedGroups[0]?.id);
      setSuccessMessage('Loan request created successfully! The request is now pending admin approval.');
    } catch (err) {
      setError('Failed to create loan request: ' + err.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'approved':
      case 'disbursed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Using shared utility functions from ../utils/formatters

  // Function to truncate description at dash
  const truncateDescription = (description) => {
    if (!description) return '';
    const dashIndex = description.indexOf(' - ');
    return dashIndex !== -1 ? description.substring(0, dashIndex) : description;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <FaExclamationTriangle className="text-red-500 text-6xl mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={loadDashboardData}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-3 sm:py-4">
          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md">
              {successMessage}
              <button
                onClick={() => setSuccessMessage('')}
                className="float-right text-green-700 hover:text-green-900"
              >
                ×
              </button>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Team Leader Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome back, {user?.full_name || user?.username}</p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              <button
                onClick={onLogout}
                className="w-full sm:w-auto flex items-center justify-center text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100"
              >
                <FaSignOutAlt className="mr-2" /> Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                  <FaUsers className="text-white h-6 w-6" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Members</dt>
                    <dd className="text-2xl font-semibold text-gray-900">{groupMembers.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                  <FaHandHoldingUsd className="text-white h-6 w-6" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Loans</dt>
                                      <dd className="text-2xl font-semibold text-gray-900">
                    {groupLoans.filter(l => l.status === 'ACTIVE' || l.status === 'DISBURSED' || l.status === 'APPROVED').length}
                  </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                  <FaClock className="text-white h-6 w-6" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pending Requests</dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {loanRequests.filter(r => r.status === 'PENDING').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                  <FaMoneyBillWave className="text-white h-6 w-6" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Loan Amount</dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {formatCurrency(groupLoans.reduce((sum, loan) => sum + parseFloat(loan.loan_amount), 0))}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-4 sm:space-x-8 px-4 sm:px-6 overflow-x-auto">
              {[
                { id: 'overview', name: 'Overview', icon: FaChartPie },
                { id: 'members', name: 'Members', icon: FaUsers },
                { id: 'loans', name: 'Loans', icon: FaHandHoldingUsd },
                { id: 'requests', name: 'Loan Requests', icon: FaClock },
                { id: 'pending', name: 'Pending Approvals', icon: FaClock },
                { id: 'transactions', name: 'Transactions', icon: FaMoneyBillWave }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Group Information</h3>
                    {assignedGroups.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Group Name:</span>
                          <span className="font-medium">{assignedGroups[0].name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Location:</span>
                          <span className="font-medium">{assignedGroups[0].location}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(assignedGroups[0].status)}`}>
                            {assignedGroups[0].status}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Member Count:</span>
                          <span className="font-medium">{groupMembers.length}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Loan Summary</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Loans:</span>
                        <span className="font-medium">{groupLoans.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Active Loans:</span>
                        <span className="font-medium">
                          {groupLoans.filter(l => l.status === 'ACTIVE' || l.status === 'DISBURSED' || l.status === 'APPROVED').length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pending Requests:</span>
                        <span className="font-medium">
                          {loanRequests.filter(r => r.status === 'PENDING').length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Amount:</span>
                        <span className="font-medium">
                          {formatCurrency(groupLoans.reduce((sum, loan) => sum + parseFloat(loan.loan_amount), 0))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* Members Tab */}
            {activeTab === 'members' && (
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0 mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Group Members</h3>
                  <button
                    onClick={() => {
                      setNewMember({
                        joined_date: '',
                        // Member Information
                        monthly_income: '',
                        nominee_name: '',
                        nominee_phone: '',
                        // User details
                        username: '',
                        email: '',
                        password: '',
                        confirm_password: '',
                        full_name: '',
                        // Banking details
                        aadhar_id: '',
                        bank_account_number: '',
                        bank_name: '',
                        bank_branch: '',
                        ifsc_code: '',
                        // File upload
                        aadhar_document_file: null
                      });
                      setFieldErrors({});
                      setShowAddMemberModal(true);
                    }}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <FaUserPlus className="mr-2" /> Add New Member
                  </button>
                </div>



                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Member Code
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Join Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Monthly Income
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {groupMembers.map((member) => (
                        <tr key={member.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {member.member_code}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {member.user?.full_name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(member.joined_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {member.monthly_income ? formatCurrency(member.monthly_income) : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(member.status)}`}>
                              {member.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => {
                                setSelectedMember(member);
                                setShowMemberDetailsModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              <FaEye />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {groupMembers.length === 0 && (
                    <p className="text-center py-8 text-gray-500">No members found</p>
                  )}
                </div>
              </div>
            )}

            {/* Loans Tab */}
            {activeTab === 'loans' && (
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0 mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Group Loans</h3>
                  <button
                    onClick={() => setShowLoanRequestModal(true)}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                  >
                    <FaHandHoldingUsd className="mr-2" /> Request Loan
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Member
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Purpose
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Term
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Due Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {groupLoans.map((loan) => (
                        <tr key={loan.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {loan.member?.user?.full_name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(loan.loan_amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {loan.purpose}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {loan.term_months} months
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(loan.status)}`}>
                              {loan.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {loan.due_date ? formatDate(loan.due_date) : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {groupLoans.length === 0 && (
                    <p className="text-center py-8 text-gray-500">No loans found</p>
                  )}
                </div>
              </div>
            )}

            {/* Loan Requests Tab */}
            {activeTab === 'requests' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">Loan Requests</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Member
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Purpose
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Term
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Requested Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {loanRequests.map((request) => (
                        <tr key={request.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {request.member?.user?.full_name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(request.requested_amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {request.purpose}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {request.term_months} months
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(request.status)}`}>
                              {request.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(request.requested_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {loanRequests.length === 0 && (
                    <p className="text-center py-8 text-gray-500">No loan requests found</p>
                  )}
                </div>
              </div>
            )}

            {/* Pending Approvals Tab */}
            {activeTab === 'pending' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">Pending Approvals</h3>
                
                {/* Pending Members Section */}
                <div className="mb-8">
                  <h4 className="text-lg font-medium text-gray-700 mb-4 flex items-center">
                    <FaUsers className="mr-2" />
                    Pending Members ({pendingMembers.length})
                  </h4>
                  {pendingMembers.length > 0 ? (
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                              Member Code
                            </th>
                            <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                              Name
                            </th>
                            <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                              Join Date
                            </th>
                            <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                              Monthly Income
                            </th>
                            <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {pendingMembers.map((member) => (
                            <tr key={member.id}>
                              <td className="px-2 sm:px-4 lg:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                                {member.member_code}
                              </td>
                              <td className="px-2 sm:px-4 lg:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                                {member.user?.full_name || 'N/A'}
                              </td>
                              <td className="px-2 sm:px-4 lg:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                                {formatDate(member.joined_date)}
                              </td>
                              <td className="px-2 sm:px-4 lg:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                                {member.monthly_income ? formatCurrency(member.monthly_income) : 'N/A'}
                              </td>
                              <td className="px-2 sm:px-4 lg:px-6 py-4 whitespace-nowrap">
                                <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                                  {member.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-6 text-center">
                      <p className="text-gray-500">No pending members</p>
                    </div>
                  )}
                </div>

                {/* Pending Loan Requests Section */}
                <div>
                  <h4 className="text-lg font-medium text-gray-700 mb-4 flex items-center">
                    <FaHandHoldingUsd className="mr-2" />
                    Pending Loan Requests ({loanRequests.filter(r => r.status === 'PENDING').length})
                  </h4>
                  {loanRequests.filter(r => r.status === 'PENDING').length > 0 ? (
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                              Member
                            </th>
                            <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                              Amount
                            </th>
                            <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                              Purpose
                            </th>
                            <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                              Term
                            </th>
                            <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                              Requested Date
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {loanRequests.filter(r => r.status === 'PENDING').map((request) => (
                            <tr key={request.id}>
                              <td className="px-2 sm:px-4 lg:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                                {request.member?.user?.full_name || 'N/A'}
                              </td>
                              <td className="px-2 sm:px-4 lg:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                                {formatCurrency(request.requested_amount)}
                              </td>
                              <td className="px-2 sm:px-4 lg:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                                {request.purpose}
                              </td>
                              <td className="px-2 sm:px-4 lg:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                                {request.term_months} months
                              </td>
                              <td className="px-2 sm:px-4 lg:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                                {formatDate(request.requested_at)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-6 text-center">
                      <p className="text-gray-500">No pending loan requests</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Transactions Tab */}
            {activeTab === 'transactions' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">Transaction History</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Group
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactionHistory.map((transaction) => (
                        <tr key={transaction.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(transaction.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              transaction.type === 'member_creation' 
                                ? 'bg-blue-100 text-blue-800' 
                                : transaction.type === 'loan_request'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : transaction.type === 'loan_approved'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                            }`}>
                              {transaction.type === 'member_creation' 
                                ? 'Member Creation' 
                                : transaction.type === 'loan_request'
                                  ? 'Loan Request'
                                  : transaction.type === 'loan_approved'
                                    ? 'Loan Approved'
                                    : 'Collection'
                              }
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {transaction.group_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {truncateDescription(transaction.description)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {transaction.amount > 0 ? formatCurrency(transaction.amount) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              transaction.type === 'member_creation' 
                                ? 'bg-green-100 text-green-800'
                                : transaction.type === 'loan_request'
                                  ? transaction.status === 'PENDING' 
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : transaction.status === 'APPROVED'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-red-100 text-red-800'
                                  : transaction.type === 'loan_approved'
                                    ? 'bg-green-100 text-green-800'
                                    : transaction.status === 'verified' 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {transaction.type === 'member_creation' 
                                ? 'Completed' 
                                : transaction.type === 'loan_request'
                                  ? transaction.status === 'PENDING'
                                    ? 'Pending'
                                    : transaction.status === 'APPROVED'
                                      ? 'Approved'
                                      : 'Rejected'
                                  : transaction.type === 'loan_approved'
                                    ? 'Approved'
                                    : transaction.status === 'verified' 
                                      ? 'Verified' 
                                      : 'Pending'
                              }
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {transactionHistory.length === 0 && (
                    <p className="text-center py-8 text-gray-500">No transactions found</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Member</h3>
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Fill out the member and user information below. 
                  A user account will be created with the provided details, and a member code will be auto-generated. 
                  <strong>The member will be created with PENDING status and requires admin approval.</strong>
                </p>
              </div>
              <form onSubmit={handleAddMember} className="space-y-4">
                {/* User Details Section */}
                <div className="border-b border-gray-200 pb-4">
                  <h4 className="text-md font-medium text-gray-900 mb-3">User Account Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Username *</label>
                      <input
                        type="text"
                        value={newMember.username}
                        onChange={(e) => setNewMember({...newMember, username: e.target.value})}
                        className={`mt-1 block w-full border rounded-md px-3 py-2 ${
                          fieldErrors.username ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter username"
                        required
                      />
                      {fieldErrors.username && (
                        <div className="mt-1 text-xs text-red-600">{fieldErrors.username}</div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email *</label>
                      <input
                        type="email"
                        value={newMember.email}
                        onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                        className={`mt-1 block w-full border rounded-md px-3 py-2 ${
                          fieldErrors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter email"
                        required
                      />
                      {fieldErrors.email && (
                        <div className="mt-1 text-xs text-red-600">{fieldErrors.email}</div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Password *</label>
                      <div className="relative">
                      <input
                          type={showPassword ? "text" : "password"}
                        value={newMember.password}
                        onChange={(e) => setNewMember({...newMember, password: e.target.value})}
                          className={`mt-1 block w-full pr-10 border rounded-md px-3 py-2 ${
                            fieldErrors.password ? 'border-red-500' : 'border-gray-300'
                          }`}
                        placeholder="Enter password"
                        required
                      />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? '🙈' : '👁️'}
                        </button>
                      </div>
                      {fieldErrors.password && (
                        <div className="mt-1 text-xs text-red-600">{fieldErrors.password}</div>
                      )}
                      {newMember.password && (
                        <div className="mt-1 text-xs">
                          <div className={`flex items-center gap-2 ${newMember.password.length >= 8 ? 'text-green-600' : 'text-red-600'}`}>
                            <span>{newMember.password.length >= 8 ? '✓' : '✗'}</span>
                            <span>At least 8 characters</span>
                          </div>
                          <div className={`flex items-center gap-2 ${/[A-Z]/.test(newMember.password) ? 'text-green-600' : 'text-red-600'}`}>
                            <span>{/[A-Z]/.test(newMember.password) ? '✓' : '✗'}</span>
                            <span>One uppercase letter</span>
                          </div>
                          <div className={`flex items-center gap-2 ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newMember.password) ? 'text-green-600' : 'text-red-600'}`}>
                            <span>{/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newMember.password) ? '✓' : '✗'}</span>
                            <span>One special character</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Confirm Password *</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={newMember.confirm_password}
                          onChange={(e) => setNewMember({...newMember, confirm_password: e.target.value})}
                          className={`mt-1 block w-full pr-10 border rounded-md px-3 py-2 ${
                            fieldErrors.confirm_password ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Confirm password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? '🙈' : '👁️'}
                        </button>
                      </div>
                      {fieldErrors.confirm_password && (
                        <div className="mt-1 text-xs text-red-600">{fieldErrors.confirm_password}</div>
                      )}
                      {newMember.confirm_password && (
                        <div className={`mt-1 text-xs ${newMember.password === newMember.confirm_password ? 'text-green-600' : 'text-red-600'}`}>
                          {newMember.password === newMember.confirm_password ? '✓ Passwords match' : '✗ Passwords do not match'}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Full Name</label>
                      <input
                        type="text"
                        value={newMember.full_name}
                        onChange={(e) => setNewMember({...newMember, full_name: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        placeholder="Enter full name"
                      />
                    </div>
                  </div>
                </div>

                {/* Banking Details Section */}
                <div className="border-b border-gray-200 pb-4">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Banking Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Aadhar ID</label>
                      <input
                        type="text"
                        value={newMember.aadhar_id}
                        onChange={(e) => setNewMember({...newMember, aadhar_id: e.target.value})}
                        className={`mt-1 block w-full border rounded-md px-3 py-2 ${
                          fieldErrors.aadhar_id ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="12-digit Aadhar number"
                        maxLength="12"
                      />
                      {fieldErrors.aadhar_id && (
                        <div className="mt-1 text-xs text-red-600">{fieldErrors.aadhar_id}</div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Bank Account Number</label>
                      <input
                        type="text"
                        value={newMember.bank_account_number}
                        onChange={(e) => setNewMember({...newMember, bank_account_number: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        placeholder="Bank account number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                      <input
                        type="text"
                        value={newMember.bank_name}
                        onChange={(e) => setNewMember({...newMember, bank_name: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        placeholder="Bank name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Bank Branch</label>
                      <input
                        type="text"
                        value={newMember.bank_branch}
                        onChange={(e) => setNewMember({...newMember, bank_branch: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        placeholder="Bank branch"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">IFSC Code</label>
                      <input
                        type="text"
                        value={newMember.ifsc_code}
                        onChange={(e) => setNewMember({...newMember, ifsc_code: e.target.value})}
                        className={`mt-1 block w-full border rounded-md px-3 py-2 ${
                          fieldErrors.ifsc_code ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="IFSC code"
                      />
                      {fieldErrors.ifsc_code && (
                        <div className="mt-1 text-xs text-red-600">{fieldErrors.ifsc_code}</div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Aadhar Document *</label>
                      <input
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setNewMember({...newMember, aadhar_document_file: file});
                            // Clear error when file is selected
                            if (fieldErrors.aadhar_document) {
                              setFieldErrors({...fieldErrors, aadhar_document: null});
                            }
                          }
                        }}
                        className={`mt-1 block w-full border rounded-md px-3 py-2 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 ${
                          fieldErrors.aadhar_document ? 'border-red-500' : 'border-gray-300'
                        }`}
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        required
                      />
                      {fieldErrors.aadhar_document && (
                        <div className="mt-1 text-xs text-red-600">{fieldErrors.aadhar_document}</div>
                      )}
                      {newMember.aadhar_document_file && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="text-xs text-green-600">
                            ✓ File selected: {newMember.aadhar_document_file.name}
                    </div>
                          <button
                            type="button"
                            onClick={() => {
                              setNewMember({
                                ...newMember,
                                aadhar_document_file: null
                              });
                            }}
                            className="text-xs text-red-600 hover:text-red-800 underline"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Bank Passbook *</label>
                      <input
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setNewMember({...newMember, bank_passbook_file: file});
                            // Clear error when file is selected
                            if (fieldErrors.bank_passbook) {
                              setFieldErrors({...fieldErrors, bank_passbook: null});
                            }
                          }
                        }}
                        className={`mt-1 block w-full border rounded-md px-3 py-2 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 ${
                          fieldErrors.bank_passbook ? 'border-red-500' : 'border-gray-300'
                        }`}
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        required
                      />
                      {fieldErrors.bank_passbook && (
                        <div className="mt-1 text-xs text-red-600">{fieldErrors.bank_passbook}</div>
                      )}
                      {newMember.bank_passbook_file && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="text-xs text-green-600">
                            ✓ File selected: {newMember.bank_passbook_file.name}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setNewMember({
                                ...newMember,
                                bank_passbook_file: null
                              });
                            }}
                            className="text-xs text-red-600 hover:text-red-800 underline"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Member Details Section */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Member Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Join Date *</label>
                      <input
                        type="date"
                        value={newMember.joined_date}
                        onChange={(e) => setNewMember({...newMember, joined_date: e.target.value})}
                        className={`mt-1 block w-full border rounded-md px-3 py-2 ${
                          fieldErrors.joined_date ? 'border-red-500' : 'border-gray-300'
                        }`}
                        required
                      />
                      {fieldErrors.joined_date && (
                        <div className="mt-1 text-xs text-red-600">{fieldErrors.joined_date}</div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Monthly Income</label>
                      <input
                        type="number"
                        value={newMember.monthly_income}
                        onChange={(e) => setNewMember({...newMember, monthly_income: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nominee Name</label>
                      <input
                        type="text"
                        value={newMember.nominee_name}
                        onChange={(e) => setNewMember({...newMember, nominee_name: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        placeholder="Nominee name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nominee Phone</label>
                      <input
                        type="text"
                        value={newMember.nominee_phone}
                        onChange={(e) => setNewMember({...newMember, nominee_phone: e.target.value})}
                        className={`mt-1 block w-full border rounded-md px-3 py-2 ${
                          fieldErrors.nominee_phone ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Nominee phone number"
                      />
                      {fieldErrors.nominee_phone && (
                        <div className="mt-1 text-xs text-red-600">{fieldErrors.nominee_phone}</div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nominee Relation</label>
                      <select
                        value={newMember.nominee_relation}
                        onChange={(e) => setNewMember({...newMember, nominee_relation: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      >
                        <option value="">Select relationship</option>
                        <option value="spouse">Spouse</option>
                        <option value="parent">Parent</option>
                        <option value="sibling">Sibling</option>
                        <option value="child">Child</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddMemberModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-4 py-2 text-white rounded-md ${
                                              isSubmitting 
                          ? 'bg-blue-400 cursor-not-allowed' 
                          : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {isSubmitting ? 'Creating...' : 'Create Member'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Loan Request Modal */}
      {showLoanRequestModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create Loan Request</h3>
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">
                  <strong>Note:</strong> Loan requests will be created with PENDING status and require admin approval.
                </p>
              </div>
              <form onSubmit={handleCreateLoanRequest} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Member</label>
                  <select
                    value={newLoanRequest.member_id}
                    onChange={(e) => setNewLoanRequest({...newLoanRequest, member_id: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  >
                    <option value="">Select Member</option>
                    {groupMembers.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.user?.full_name || member.member_code}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Requested Amount</label>
                  <input
                    type="number"
                    value={newLoanRequest.requested_amount}
                    onChange={(e) => setNewLoanRequest({...newLoanRequest, requested_amount: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Purpose</label>
                  <input
                    type="text"
                    value={newLoanRequest.purpose}
                    onChange={(e) => setNewLoanRequest({...newLoanRequest, purpose: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Term (months)</label>
                  <input
                    type="number"
                    value={newLoanRequest.term_months}
                    onChange={(e) => setNewLoanRequest({...newLoanRequest, term_months: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="12"
                    min="1"
                    max="120"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowLoanRequestModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Create Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Member Details Modal */}
      {showMemberDetailsModal && selectedMember && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Member Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Member Code:</span>
                  <span className="font-medium">{selectedMember.member_code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">{selectedMember.user?.full_name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Join Date:</span>
                  <span className="font-medium">{formatDate(selectedMember.joined_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Monthly Income:</span>
                  <span className="font-medium">
                    {selectedMember.monthly_income ? formatCurrency(selectedMember.monthly_income) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Nominee Name:</span>
                  <span className="font-medium">{selectedMember.nominee_name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Nominee Phone:</span>
                  <span className="font-medium">{selectedMember.nominee_phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedMember.status)}`}>
                    {selectedMember.status}
                  </span>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowMemberDetailsModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamLeaderDashboard;
