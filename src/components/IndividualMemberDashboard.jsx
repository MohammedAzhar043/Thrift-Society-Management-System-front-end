import { useState, useEffect } from 'react';
import { 
  FaMoneyBillWave, 
  FaCreditCard, 
  FaHistory, 
  FaSignOutAlt, 
  FaUser, 
  FaFileAlt, 
  FaClock, 
  FaCheckCircle, 
  FaTimesCircle,
  FaPlus,
  FaEye,
  FaEdit
} from 'react-icons/fa';
import { toast, Toaster } from 'react-hot-toast';
import apiService from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import useFormSubmission from '../hooks/useFormSubmission';

function IndividualMemberDashboard({ user, onLogout }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Form submission hooks
  const { isSubmitting: isSubmittingLoan, submitForm: submitLoanForm } = useFormSubmission();
  
  // Dashboard data states
  const [dashboardStats, setDashboardStats] = useState({
    current_loan_amount: 0,
    loan_eligibility: 0,
    interest_rate: 0,
    next_payment_due: null,
    total_payments_made: 0,
    account_status: 'Active'
  });
  
  const [currentLoans, setCurrentLoans] = useState([]);
  const [loanRequests, setLoanRequests] = useState([]);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  
  // UI states
  const [activeTab, setActiveTab] = useState('overview');
  const [showLoanApplicationModal, setShowLoanApplicationModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLoanDetailsModal, setShowLoanDetailsModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  
  // Form states
  const [loanApplication, setLoanApplication] = useState({
    requested_amount: '',
    purpose: '',
    term_months: '12'
  });

  // Loan Calculator states
  const [loanCalculator, setLoanCalculator] = useState({
    amount: '',
    term_months: '12',
    interest_rate: ''
  });
  const [calculatedResults, setCalculatedResults] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load dashboard summary
      const summary = await apiService.getMemberDashboardSummary();
      
      // Load current loans
      const loans = await apiService.getCurrentLoans();
      setCurrentLoans(loans || []);
      
      // Load loan requests (including all pending loans)
      const requests = await apiService.getMemberLoanRequests();
      setLoanRequests(requests || []);
      
      // Load transaction history
      const transactions = await apiService.getMemberTransactionHistory();
      
      // Calculate current loan amount from actual loans data if API doesn't provide it
      let calculatedCurrentLoanAmount = 0;
      if (loans && loans.length > 0) {
        calculatedCurrentLoanAmount = loans
          .filter(loan => {
            const status = loan.status?.toUpperCase();
            return status === 'ACTIVE' || status === 'DISBURSED' || status === 'APPROVED';
          })
          .reduce((total, loan) => total + (loan.loan_amount || loan.amount || 0), 0);
      }
      
      // Set dashboard stats with calculated values as fallback
      setDashboardStats({
        current_loan_amount: summary.current_loan_amount || calculatedCurrentLoanAmount || 0,
        loan_eligibility: summary.loan_eligibility || 0,
        interest_rate: summary.interest_rate || 0,
        next_payment_due: summary.next_payment_due || null,
        total_payments_made: summary.total_payments_made || 0,
        account_status: summary.account_status || 'Active'
      });
      
      // Normalize transaction data to ensure consistent field names
      const normalizedTransactions = (transactions || []).map(t => ({
        id: t.id,
        transaction_date: t.transaction_date || t.created_at || t.date || t.transaction_date_created,
        description: t.description || t.narration || t.remarks || 'Transaction',
        type: t.type || t.transaction_type || t.transaction_category || t.category || 'N/A',
        amount: t.amount || t.transaction_amount || 0,
        status: t.status || t.transaction_status || 'Pending',
        purpose: t.purpose || t.narration || 'N/A'
      }));
      
      setTransactionHistory(normalizedTransactions);
      
      // Load payment history (from transaction history)
      const payments = normalizedTransactions.filter(t => 
        t.type === 'payment' || 
        t.transaction_type === 'payment' || 
        t.type?.toLowerCase().includes('payment') ||
        t.transaction_category === 'payment'
      );
      setPaymentHistory(payments);
      
    } catch (err) {
      setError('Failed to load dashboard data. Please try again.');
      // Set default values to prevent NaN
      setDashboardStats({
        current_loan_amount: 0,
        loan_eligibility: 0,
        interest_rate: 0,
        next_payment_due: null,
        total_payments_made: 0,
        account_status: 'Active'
      });
      setCurrentLoans([]);
      setLoanRequests([]);
      setTransactionHistory([]);
      setPaymentHistory([]);
    } finally {
      setLoading(false);
    }
  };



  const handleLoanApplication = async (e) => {
    e.preventDefault();
    
    if (!loanApplication.requested_amount) {
      toast((t) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <span>Please enter the requested amount</span>
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
        duration: 6000,
        position: "top-center",
        style: {
          background: '#EF4444',
          color: '#fff',
          padding: '12px 16px',
          fontSize: '14px',
        },
      });
      return;
    }
    
    const amount = parseFloat(loanApplication.requested_amount);
    if (isNaN(amount) || amount <= 0) {
      toast((t) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <span>Please enter a valid loan amount</span>
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
        duration: 6000,
        position: "top-center",
        style: {
          background: '#EF4444',
          color: '#fff',
          padding: '12px 16px',
          fontSize: '14px',
        },
      });
      return;
    }
    
    await submitLoanForm(async () => {
      // Get current user's member profile to get member_id and group_id
      const memberProfile = await apiService.getMemberProfile();
      
      if (!memberProfile || !memberProfile.id) {
        throw new Error('Unable to get member profile. Please try again.');
      }
      
      const loanData = {
        member_id: memberProfile.id,
        group_id: memberProfile.group_id || 1, // Default to group 1 if not specified
        loan_amount: amount,
        purpose: loanApplication.purpose?.trim() || null,
        term_months: parseInt(loanApplication.term_months) || 12
      };
      
      const response = await apiService.applyForLoan(loanData);
      
      // Reset form and close modal
      setLoanApplication({
        requested_amount: '',
        purpose: '',
        term_months: '12'
      });
      setShowLoanApplicationModal(false);
      
      // Refresh data
      await loadDashboardData();
      
      toast.success('Loan application submitted successfully! It is now pending approval.');
    }, {
      onError: (err) => {
        let errorMessage = 'Failed to submit loan application. Please try again.';
        
        // Use the detailed error message from API service
        if (err.message) {
          errorMessage = err.message;
        }
        
        toast((t) => (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <span>{errorMessage}</span>
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
          duration: 6000,
          position: "top-center",
          style: {
            background: '#EF4444',
            color: '#fff',
            padding: '12px 16px',
            fontSize: '14px',
          },
        });
      }
    });
  };

  const handleLogout = async () => {
    try {
      await apiService.logout();
      onLogout();
    } catch (error) {
      onLogout(); // Still logout even if API call fails
    }
  };

  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (status.toString().toLowerCase()) {
      case 'active':
      case 'approved':
      case 'disbursed':
      case 'completed':
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
      case 'overdue':
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Using shared utility functions from ../utils/formatters

  const getDisplayValue = (value, defaultValue = 'N/A') => {
    if (value === null || value === undefined || value === '') {
      return defaultValue;
    }
    return value.toString();
  };

  const calculateLoan = () => {
    const principal = parseFloat(loanCalculator.amount);
    // Use provided interest rate or fall back to dashboard stats rate
    const interestRate = loanCalculator.interest_rate || dashboardStats.interest_rate || 12.0;
    const rate = parseFloat(interestRate) / 100;
    const term = parseInt(loanCalculator.term_months);

    if (isNaN(principal) || isNaN(rate) || isNaN(term) || principal <= 0 || rate <= 0 || term <= 0) {
      toast((t) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <span>Please enter valid loan details.</span>
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
        duration: 6000,
        position: "top-center",
        style: {
          background: '#EF4444',
          color: '#fff',
          padding: '12px 16px',
          fontSize: '14px',
        },
      });
      return;
    }

    const monthlyRate = rate / 12;
    const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, term) / (Math.pow(1 + monthlyRate, term) - 1);
    const totalInterest = (emi * term) - principal;
    const totalAmount = emi * term;
    const processingFee = 500; // Assuming a fixed processing fee
    const netDisbursement = principal - processingFee;

    setCalculatedResults({
      monthlyPayment: emi.toFixed(2),
      totalInterest: totalInterest.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      processingFee: processingFee.toFixed(2),
      netDisbursement: netDisbursement.toFixed(2)
    });
  };

  const resetCalculator = () => {
    setLoanCalculator({
      amount: '',
      term_months: '12',
      interest_rate: ''
    });
    setCalculatedResults(null);
  };

  if (loading && !dashboardStats.current_loan_amount) {
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
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error}
          </div>
          <button 
            onClick={loadDashboardData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Toaster for notifications */}
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '8px',
            padding: '16px',
            fontSize: '14px',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
            style: {
              background: '#10B981',
              color: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
            style: {
              background: '#EF4444',
              color: '#fff',
            },
          },
        }}
      />
      
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between py-4 gap-4">
            <div className="flex-1 min-w-0 overflow-hidden">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">Member Dashboard</h1>
              <p className="text-sm text-gray-600 truncate">Welcome, {user?.full_name || user?.username}</p>
          </div>
            <div className="flex-shrink-0 flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setShowProfileModal(true)}
                className="inline-flex items-center px-2 sm:px-3 py-1.5 sm:py-2 border border-transparent text-xs sm:text-sm font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-blue-500 transition-colors duration-200"
            >
                <FaUser className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                <span className="hidden sm:inline">Profile</span>
            </button>
          <button
              onClick={handleLogout}
                className="inline-flex items-center px-2 sm:px-3 py-1.5 sm:py-2 border border-transparent text-xs sm:text-sm font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-red-500 transition-colors duration-200"
          >
                <FaSignOutAlt className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                <span className="hidden sm:inline">Logout</span>
          </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                  <FaMoneyBillWave className="text-white h-6 w-6" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Current Loan</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {formatCurrency(dashboardStats.current_loan_amount)}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                  <FaCreditCard className="text-white h-6 w-6" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Loan Eligibility</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {formatCurrency(dashboardStats.loan_eligibility)}
                      </div>
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
                    <dt className="text-sm font-medium text-gray-500 truncate">Next Payment</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {dashboardStats.next_payment_due ? formatDate(dashboardStats.next_payment_due) : 'N/A'}
                      </div>
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
                  <FaHistory className="text-white h-6 w-6" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Payments</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {formatCurrency(dashboardStats.total_payments_made)}
                      </div>
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
            <nav className="-mb-px flex space-x-2 sm:space-x-4 lg:space-x-8 px-2 sm:px-4 lg:px-6 overflow-x-auto">
              {[
                { id: 'overview', name: 'Overview', icon: FaUser },
                { id: 'loans', name: 'My Loans', icon: FaCreditCard },
                { id: 'requests', name: 'Loan Requests', icon: FaFileAlt },
                { id: 'payments', name: 'Payment History', icon: FaMoneyBillWave },
                { id: 'transactions', name: 'Transactions', icon: FaHistory }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="mr-2 h-5 w-5" />
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Account Summary</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Account Status:</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(dashboardStats.account_status)}`}>
                          {getDisplayValue(dashboardStats.account_status, 'Active')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Interest Rate:</span>
                        <span className="font-medium">{dashboardStats.interest_rate || 0}% per annum</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Active Loans:</span>
                        <span className="font-medium">{currentLoans.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pending Requests:</span>
                        <span className="font-medium">
                          {loanRequests.filter(r => r.status === 'REQUEST' || r.status === 'PENDING').length}
                        </span>
                      </div>
                    </div>
                    

                  </div>

                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                      <button
                        onClick={() => setShowLoanApplicationModal(true)}
                        className="w-full flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <FaPlus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> 
                        <span className="hidden sm:inline">Apply for New Loan</span>
                        <span className="sm:hidden">Apply Loan</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('loans')}
                        className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <FaEye className="mr-2" /> View Loan Details
                      </button>
                      <button
                        onClick={() => setActiveTab('payments')}
                        className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <FaHistory className="mr-2" /> Payment History
                      </button>
                    </div>
                  </div>
                </div>


              </div>
            )}

            {/* Loans Tab */}
            {activeTab === 'loans' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">My Loans</h3>
                  <button
                    onClick={() => setShowLoanApplicationModal(true)}
                    className="inline-flex items-center px-3 sm:px-4 py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <FaPlus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> 
                    <span className="hidden sm:inline">Apply for New Loan</span>
                    <span className="sm:hidden">Apply Loan</span>
                  </button>
                </div>

                {/* Desktop Loans Table */}
                <div className="hidden lg:block bg-white shadow rounded-lg">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Loan ID
                        </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Purpose
                        </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Term
                        </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentLoans.map((loan) => (
                          <tr key={loan.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-4 text-sm font-medium text-gray-900">
                            {loan.id}
                          </td>
                            <td className="px-4 py-4 text-sm text-gray-900">
                            {formatCurrency(loan.loan_amount)}
                          </td>
                            <td className="px-4 py-4 text-sm text-gray-500">
                            {getDisplayValue(loan.purpose, 'N/A')}
                          </td>
                            <td className="px-4 py-4 text-sm text-gray-500">
                            {loan.term_months || 0} months
                          </td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(loan.status)}`}>
                              {getDisplayValue(loan.status, 'N/A')}
                            </span>
                          </td>
                            <td className="px-4 py-4 text-sm font-medium">
                            <button
                              onClick={() => {
                                setSelectedLoan(loan);
                                setShowLoanDetailsModal(true);
                              }}
                                className="text-blue-600 hover:text-blue-900 transition-colors"
                            >
                              <FaEye />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </div>

                {/* Mobile Loans Cards */}
                <div className="lg:hidden space-y-4">
                  {currentLoans.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-400 mb-4">
                        <FaMoneyBillWave className="w-12 h-12 mx-auto" />
                      </div>
                      <p className="text-lg font-medium text-gray-900 mb-1">No active loans found</p>
                      <p className="text-sm text-gray-500">Apply for a new loan to get started.</p>
                    </div>
                  ) : (
                    currentLoans.map((loan) => (
                      <div key={loan.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-sm font-medium text-gray-500">{loan.id}</span>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(loan.status)}`}>
                                {getDisplayValue(loan.status, 'N/A')}
                              </span>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {formatCurrency(loan.loan_amount)}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {getDisplayValue(loan.purpose, 'No purpose specified')}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedLoan(loan);
                              setShowLoanDetailsModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 p-1"
                          >
                            <FaEye className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-2 text-sm">
                          <div>
                            <span className="text-gray-500">Term:</span>
                            <p className="font-medium text-gray-900">
                              {loan.term_months || 0} months
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Loan Requests Tab */}
            {activeTab === 'requests' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Loan Requests</h3>
                  <button
                    onClick={() => setShowLoanApplicationModal(true)}
                    className="inline-flex items-center px-3 sm:px-4 py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <FaPlus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> 
                    <span className="hidden sm:inline">New Request</span>
                    <span className="sm:hidden">New</span>
                  </button>
                </div>

                {/* Desktop Loan Requests Table */}
                <div className="hidden lg:block bg-white shadow rounded-lg">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Request ID
                        </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Purpose
                        </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Term
                        </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Requested Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {loanRequests.map((request) => (
                          <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-4 text-sm font-medium text-gray-900">
                            {request.id}
                          </td>
                            <td className="px-4 py-4 text-sm text-gray-900">
                            {formatCurrency(request.loan_amount)}
                          </td>
                            <td className="px-4 py-4 text-sm text-gray-500">
                            {getDisplayValue(request.purpose, 'N/A')}
                          </td>
                            <td className="px-4 py-4 text-sm text-gray-500">
                            {request.term_months || 0} months
                          </td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                              {getDisplayValue(request.status, 'N/A')}
                            </span>
                          </td>
                            <td className="px-4 py-4 text-sm text-gray-500">
                            {formatDate(request.requested_at || request.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </div>

                {/* Mobile Loan Requests Cards */}
                <div className="lg:hidden space-y-4">
                  {loanRequests.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-400 mb-4">
                        <FaClock className="w-12 h-12 mx-auto" />
                      </div>
                      <p className="text-lg font-medium text-gray-900 mb-1">No loan requests found</p>
                      <p className="text-sm text-gray-500">Submit a new loan request to get started.</p>
                    </div>
                  ) : (
                    loanRequests.map((request) => (
                      <div key={request.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-sm font-medium text-gray-500">{request.id}</span>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                                {getDisplayValue(request.status, 'N/A')}
                              </span>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {formatCurrency(request.loan_amount)}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {getDisplayValue(request.purpose, 'No purpose specified')}
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Term:</span>
                            <p className="font-medium text-gray-900">
                              {request.term_months || 0} months
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">Requested:</span>
                            <p className="font-medium text-gray-900">
                              {formatDate(request.requested_at || request.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
            </div>
            )}

            {/* Payment History Tab */}
            {activeTab === 'payments' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">Payment History</h3>
                {/* Desktop Payment History Table */}
                <div className="hidden lg:block bg-white shadow rounded-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Purpose
                        </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paymentHistory.map((payment) => (
                          <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-4 text-sm text-gray-900">
                            {formatDate(payment.transaction_date)}
                      </td>
                            <td className="px-4 py-4 text-sm font-medium text-gray-900">
                            {formatCurrency(payment.amount)}
                          </td>
                            <td className="px-4 py-4 text-sm text-gray-500">
                            {getDisplayValue(payment.payment_type || payment.type, 'Payment')}
                      </td>
                            <td className="px-4 py-4 text-sm text-gray-500">
                        {payment.purpose || payment.description || 'N/A'}
                      </td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                          {getDisplayValue(payment.status, 'N/A')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
                  </div>
                </div>

                {/* Mobile Payment History Cards */}
                <div className="lg:hidden space-y-4">
                  {paymentHistory.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-400 mb-4">
                        <FaCreditCard className="w-12 h-12 mx-auto" />
                      </div>
                      <p className="text-lg font-medium text-gray-900 mb-1">No payment history found</p>
                      <p className="text-sm text-gray-500">Payment history will appear here once payments are made.</p>
                    </div>
                  ) : (
                    paymentHistory.map((payment) => (
                      <div key={payment.id} className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 shadow-sm">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium w-fit ${getStatusColor(payment.status)}`}>
                                {getDisplayValue(payment.status, 'N/A')}
                              </span>
                              <span className="text-xs sm:text-sm text-gray-500">
                                {formatDate(payment.transaction_date)}
                              </span>
                            </div>
                            <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                              {formatCurrency(payment.amount)}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-600 mt-1 break-words">
                              {getDisplayValue(payment.payment_type || payment.type, 'Payment')}
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-2 text-xs sm:text-sm">
                          <div>
                            <span className="text-gray-500">Purpose:</span>
                            <p className="font-medium text-gray-900 break-words">
                              {payment.purpose || payment.description || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Transactions Tab */}
            {activeTab === 'transactions' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">Transaction History</h3>
                {/* Desktop Transaction History Table */}
                <div className="hidden lg:block bg-white shadow rounded-lg">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactionHistory.map((transaction) => (
                          <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-4 text-sm text-gray-900">
                            {formatDate(transaction.transaction_date)}
                          </td>
                            <td className="px-4 py-4 text-sm text-gray-900">
                            {getDisplayValue(transaction.description, 'Transaction')}
                          </td>
                            <td className="px-4 py-4 text-sm text-gray-500">
                            {getDisplayValue(transaction.type, 'N/A')}
                          </td>
                            <td className="px-4 py-4 text-sm font-medium text-gray-900">
                            {formatCurrency(transaction.amount)}
                          </td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                              {getDisplayValue(transaction.status, 'N/A')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </div>

                {/* Mobile Transaction History Cards */}
                <div className="lg:hidden space-y-4">
                  {transactionHistory.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-400 mb-4">
                        <FaHistory className="w-12 h-12 mx-auto" />
                      </div>
                      <p className="text-lg font-medium text-gray-900 mb-1">No transactions found</p>
                      <p className="text-sm text-gray-500">Transaction history will appear here once activities are recorded.</p>
                    </div>
                  ) : (
                    transactionHistory.map((transaction) => (
                      <div key={transaction.id} className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 shadow-sm">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium w-fit ${getStatusColor(transaction.status)}`}>
                                {getDisplayValue(transaction.status, 'N/A')}
                              </span>
                              <span className="text-xs sm:text-sm text-gray-500">
                                {formatDate(transaction.transaction_date)}
                              </span>
                            </div>
                            <h3 className="text-sm sm:text-base font-semibold text-gray-900 break-words">
                              {getDisplayValue(transaction.description, 'Transaction')}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-600 mt-1 break-words">
                              {getDisplayValue(transaction.type, 'N/A')}
                            </p>
                          </div>
                          <div className="text-right ml-2">
                            <div className="text-sm sm:text-base font-bold text-gray-900">
                              {formatCurrency(transaction.amount)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Loan Application Modal */}
      {showLoanApplicationModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Apply for New Loan</h3>
              <form onSubmit={handleLoanApplication} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Requested Amount *</label>
                  <input
                    type="number"
                    value={loanApplication.requested_amount}
                    onChange={(e) => setLoanApplication({...loanApplication, requested_amount: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter amount"
                    min="1000"
                    step="1000"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Purpose</label>
                  <textarea
                    value={loanApplication.purpose}
                    onChange={(e) => setLoanApplication({...loanApplication, purpose: e.target.value})}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe the purpose of the loan (optional)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Term (months)</label>
                  <select
                    value={loanApplication.term_months}
                    onChange={(e) => setLoanApplication({...loanApplication, term_months: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="6">6 months</option>
                    <option value="12">12 months</option>
                    <option value="18">18 months</option>
                    <option value="24">24 months</option>
                    <option value="36">36 months</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowLoanApplicationModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingLoan}
                    className={`px-4 py-2 text-white rounded-md flex items-center ${
                      isSubmittingLoan ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {isSubmittingLoan && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    )}
                    {isSubmittingLoan ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </form>
            </div>
            </div>
          </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Member Profile</h3>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimesCircle className="h-6 w-6" />
            </button>
            </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">{user?.full_name || user?.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Username:</span>
                  <span className="font-medium">{user?.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium">{user?.email || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Role:</span>
                  <span className="font-medium">Member</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(dashboardStats.account_status)}`}>
                    {getDisplayValue(dashboardStats.account_status, 'Active')}
                    </span>
                </div>
              </div>
            </div>
                </div>
            </div>
      )}

      {/* Loan Details Modal */}
      {showLoanDetailsModal && selectedLoan && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Loan Details</h3>
                <button
                  onClick={() => setShowLoanDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimesCircle className="h-6 w-6" />
              </button>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Loan ID:</span>
                  <span className="font-medium">{selectedLoan.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium">{formatCurrency(selectedLoan.loan_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Purpose:</span>
                  <span className="font-medium">{getDisplayValue(selectedLoan.purpose, 'N/A')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Term:</span>
                  <span className="font-medium">{selectedLoan.term_months || 0} months</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Interest Rate:</span>
                  <span className="font-medium">{selectedLoan.interest_rate || dashboardStats.interest_rate || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedLoan.status)}`}>
                    {getDisplayValue(selectedLoan.status, 'N/A')}
                  </span>
                </div>
                {selectedLoan.disbursed_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Disbursed Date:</span>
                    <span className="font-medium">{formatDate(selectedLoan.disbursed_date)}</span>
                  </div>
                )}
                {selectedLoan.due_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Due Date:</span>
                    <span className="font-medium">{formatDate(selectedLoan.due_date)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default IndividualMemberDashboard;