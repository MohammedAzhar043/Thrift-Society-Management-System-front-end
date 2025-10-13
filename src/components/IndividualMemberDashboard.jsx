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
        duration: 2000,
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
        duration: 2000,
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
        
        // Translate technical error messages to user-friendly messages
        if (err.message) {
          if (err.message.includes('Member status is MemberStatus.PENDING')) {
            errorMessage = 'Your account is still being reviewed. Please wait for your account to be approved before applying for a loan.';
          } else if (err.message.includes('Not eligible for loan')) {
            errorMessage = 'You are not currently eligible for a loan. Please contact support for more information.';
          } else if (err.message.includes('MemberStatus.INACTIVE')) {
            errorMessage = 'Your account is inactive. Please contact support to reactivate your account.';
          } else if (err.message.includes('MemberStatus.SUSPENDED')) {
            errorMessage = 'Your account has been suspended. Please contact support for assistance.';
          } else if (err.message.includes('insufficient balance')) {
            errorMessage = 'Insufficient account balance. Please ensure you have enough funds in your account.';
          } else if (err.message.includes('loan limit exceeded')) {
            errorMessage = 'You have reached your maximum loan limit. Please contact support for more information.';
          } else {
            // For other technical errors, use a generic user-friendly message
            errorMessage = 'Unable to process your loan application at this time. Please try again later or contact support if the issue persists.';
          }
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
        duration: 2000,
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
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
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
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Custom CSS for animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }
        
        .stats-card:hover {
          transform: translateY(-4px);
        }
        
        .member-loan-card:hover,
        .member-request-card:hover,
        .member-payment-card:hover,
        .member-transaction-card:hover {
          transform: translateY(-2px);
        }
        
        .tab-button {
          position: relative;
          overflow: hidden;
        }
        
        .tab-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s;
        }
        
        .tab-button:hover::before {
          left: 100%;
        }
      `}</style>
      
      {/* Toaster for notifications */}
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 2000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '8px',
            padding: '16px',
            fontSize: '14px',
          },
          success: {
            duration: 2000,
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
            duration: 2000,
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
      
      {/* Enhanced Header - Mobile Optimized */}
      <header className="bg-white shadow-xl border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between py-4 sm:py-6 gap-2 sm:gap-4">
            {/* Left side - Title and User info */}
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                  <FaUser className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">Member Dashboard</h1>
                  <p className="text-xs sm:text-sm text-gray-600 truncate">Welcome back, {user?.full_name || user?.username}</p>
                </div>
              </div>
            </div>
            
            {/* Right side - Action buttons */}
            <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
              <button
                onClick={() => setShowProfileModal(true)}
                className="inline-flex items-center px-2 sm:px-3 py-2 sm:py-2.5 border border-transparent text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105 cursor-pointer shadow-lg hover:shadow-xl"
              >
                <FaUser className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                <span className="hidden sm:inline">Profile</span>
              </button>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-2 sm:px-3 py-2 sm:py-2.5 border border-transparent text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500 transition-all duration-200 transform hover:scale-105 cursor-pointer shadow-lg hover:shadow-xl"
              >
                <FaSignOutAlt className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="stats-card bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <div className="px-6 py-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 shadow-lg">
                  <FaMoneyBillWave className="text-white h-6 w-6" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-semibold text-blue-700 truncate mb-1">Current Loan</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-bold text-gray-900">
                        {formatCurrency(dashboardStats.current_loan_amount)}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="stats-card bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <div className="px-6 py-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 shadow-lg">
                  <FaCreditCard className="text-white h-6 w-6" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-semibold text-green-700 truncate mb-1">Loan Eligibility</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-bold text-gray-900">
                        {formatCurrency(dashboardStats.loan_eligibility)}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="stats-card bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <div className="px-6 py-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-4 shadow-lg">
                  <FaClock className="text-white h-6 w-6" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-semibold text-yellow-700 truncate mb-1">Next Payment</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-bold text-gray-900">
                        {dashboardStats.next_payment_due ? formatDate(dashboardStats.next_payment_due) : 'N/A'}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="stats-card bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <div className="px-6 py-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 shadow-lg">
                  <FaHistory className="text-white h-6 w-6" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-semibold text-purple-700 truncate mb-1">Total Payments</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-bold text-gray-900">
                        {formatCurrency(dashboardStats.total_payments_made)}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Navigation Tabs */}
        <div className="bg-white shadow-xl rounded-xl mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
            <nav className="-mb-px flex space-x-1 sm:space-x-2 lg:space-x-4 px-2 sm:px-4 lg:px-6 overflow-x-auto">
              {[
                { id: 'overview', name: 'Overview', icon: FaUser, color: 'blue' },
                { id: 'loans', name: 'My Loans', icon: FaCreditCard, color: 'green' },
                { id: 'requests', name: 'Loan Requests', icon: FaFileAlt, color: 'orange' },
                { id: 'payments', name: 'Payment History', icon: FaMoneyBillWave, color: 'purple' },
                { id: 'transactions', name: 'Transactions', icon: FaHistory, color: 'indigo' }
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-3 sm:px-4 border-b-2 font-semibold text-sm flex items-center whitespace-nowrap cursor-pointer transition-all duration-200 rounded-t-lg ${
                      isActive
                        ? `border-${tab.color}-500 text-${tab.color}-600 bg-${tab.color}-50 shadow-sm`
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`mr-2 h-4 w-4 sm:h-5 sm:w-5 ${isActive ? `text-${tab.color}-600` : 'text-gray-400'}`} />
                    <span className="hidden sm:inline">{tab.name}</span>
                    <span className="sm:hidden">{tab.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Enhanced Account Summary and Quick Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="member-info-card bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                    <div className="flex items-center mb-6">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                        <FaUser className="h-5 w-5 text-indigo-600" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Account Summary</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm font-medium text-gray-600">Account Status:</span>
                        <span className={`px-3 py-1.5 text-xs font-bold rounded-full ${getStatusColor(dashboardStats.account_status)}`}>
                          <FaCheckCircle className="inline w-3 h-3 mr-1" />
                          {getDisplayValue(dashboardStats.account_status, 'Active')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm font-medium text-gray-600">Interest Rate:</span>
                        <span className="text-sm font-bold text-gray-900">{dashboardStats.interest_rate || 0}% per annum</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm font-medium text-gray-600">Active Loans:</span>
                        <span className="text-sm font-bold text-gray-900">{currentLoans.length}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm font-medium text-gray-600">Pending Requests:</span>
                        <span className="text-sm font-bold text-gray-900">
                          {loanRequests.filter(r => r.status === 'REQUEST' || r.status === 'PENDING').length}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="member-actions-card bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                    <div className="flex items-center mb-6">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                        <FaFileAlt className="h-5 w-5 text-purple-600" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Quick Actions</h3>
                    </div>
                    <div className="space-y-4">
                      <button
                        onClick={() => setShowLoanApplicationModal(true)}
                        className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-semibold rounded-xl shadow-md text-white bg-blue-600 hover:bg-blue-700 hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02] cursor-pointer"
                      >
                        <FaPlus className="w-4 h-4 mr-2" /> 
                        Apply for New Loan
                      </button>
                      <button
                        onClick={() => setActiveTab('loans')}
                        className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-semibold rounded-xl shadow-sm text-gray-700 bg-white hover:bg-gray-50 hover:shadow-md transition-all duration-200 cursor-pointer"
                      >
                        <FaEye className="w-4 h-4 mr-2" /> View Loan Details
                      </button>
                      <button
                        onClick={() => setActiveTab('payments')}
                        className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-semibold rounded-xl shadow-sm text-gray-700 bg-white hover:bg-gray-50 hover:shadow-md transition-all duration-200 cursor-pointer"
                      >
                        <FaHistory className="w-4 h-4 mr-2" /> Payment History
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
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900">My Loans</h3>
                  <button
                    onClick={() => setShowLoanApplicationModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-xl shadow-md text-white bg-blue-600 hover:bg-blue-700 hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02] cursor-pointer"
                  >
                    <FaPlus className="w-4 h-4 mr-2" /> 
                    Apply for New Loan
                  </button>
                </div>

                {/* Enhanced Desktop Loans Table */}
                <div className="hidden lg:block bg-white shadow-xl rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            <div className="flex items-center">
                              <FaFileAlt className="w-4 h-4 mr-2" />
                              Loan ID
                            </div>
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            <div className="flex items-center">
                              <FaMoneyBillWave className="w-4 h-4 mr-2" />
                              Amount
                            </div>
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Purpose</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            <div className="flex items-center">
                              <FaClock className="w-4 h-4 mr-2" />
                              Term
                            </div>
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {currentLoans.map((loan, index) => (
                          <tr key={loan.id} className={`hover:bg-gray-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                            <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                              {loan.id}
                            </td>
                            <td className="px-6 py-4 text-lg font-bold text-green-600">
                              {formatCurrency(loan.loan_amount)}
                            </td>
                            <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                              {getDisplayValue(loan.purpose, 'N/A')}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {loan.term_months || 0} months
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${getStatusColor(loan.status)}`}>
                                <FaCheckCircle className="w-3 h-3 mr-1" />
                                {getDisplayValue(loan.status, 'N/A')}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm font-medium">
                              <button
                                onClick={() => {
                                  setSelectedLoan(loan);
                                  setShowLoanDetailsModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors duration-200 cursor-pointer"
                                title="View Details"
                              >
                                <FaEye className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Enhanced Mobile Loans Cards */}
                <div className="lg:hidden space-y-4">
                  {currentLoans.length === 0 ? (
                    <div className="empty-state text-center py-12 px-6">
                      <div className="empty-state-icon mb-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto shadow-lg">
                          <FaMoneyBillWave className="h-10 w-10 text-blue-500" />
                        </div>
                      </div>
                      <h3 className="empty-state-title text-xl font-bold text-gray-900 mb-3">No active loans found</h3>
                      <p className="empty-state-description text-gray-600 mb-8 max-w-md mx-auto">Start your financial journey by applying for a loan. Our flexible terms and competitive rates make it easy to achieve your goals.</p>
                      <button
                        onClick={() => setShowLoanApplicationModal(true)}
                        className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 cursor-pointer"
                      >
                        <FaPlus className="w-5 h-5 mr-2" />
                        Apply for New Loan
                      </button>
                    </div>
                  ) : (
                    currentLoans.map((loan, index) => (
                      <div key={loan.id} className="member-loan-card bg-white rounded-xl p-4 sm:p-5 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <span className="text-sm font-semibold text-gray-600">#{loan.id}</span>
                              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${getStatusColor(loan.status)}`}>
                                <FaCheckCircle className="w-3 h-3 mr-1" />
                                {getDisplayValue(loan.status, 'N/A')}
                              </span>
                            </div>
                            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                              {formatCurrency(loan.loan_amount)}
                            </h3>
                            <p className="text-sm font-semibold text-gray-600 mb-3">
                              {getDisplayValue(loan.purpose, 'No purpose specified')}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedLoan(loan);
                              setShowLoanDetailsModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors duration-200 cursor-pointer"
                            title="View Details"
                          >
                            <FaEye className="w-5 h-5" />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center">
                            <FaClock className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-gray-500 mr-2">Term:</span>
                            <span className="font-semibold text-gray-900">
                              {loan.term_months || 0} months
                            </span>
                          </div>
                          <div className="flex items-center">
                            <FaMoneyBillWave className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-gray-500 mr-2">Amount:</span>
                            <span className="font-bold text-green-600">
                              {formatCurrency(loan.loan_amount)}
                            </span>
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
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Loan Requests</h3>
                  <button
                    onClick={() => setShowLoanApplicationModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-xl shadow-md text-white bg-blue-600 hover:bg-blue-700 hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02] cursor-pointer"
                  >
                    <FaPlus className="w-4 h-4 mr-2" /> 
                    New Request
                  </button>
                </div>

                {/* Enhanced Desktop Loan Requests Table */}
                <div className="hidden lg:block bg-white shadow-xl rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gradient-to-r from-gray-50 to-orange-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            <div className="flex items-center">
                              <FaFileAlt className="w-4 h-4 mr-2" />
                              Request ID
                            </div>
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            <div className="flex items-center">
                              <FaMoneyBillWave className="w-4 h-4 mr-2" />
                              Amount
                            </div>
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Purpose</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            <div className="flex items-center">
                              <FaClock className="w-4 h-4 mr-2" />
                              Term
                            </div>
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            <div className="flex items-center">
                              <FaClock className="w-4 h-4 mr-2" />
                              Requested Date
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {loanRequests.map((request, index) => (
                          <tr key={request.id} className={`hover:bg-gray-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                            <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                              #{request.id}
                            </td>
                            <td className="px-6 py-4 text-lg font-bold text-green-600">
                              {formatCurrency(request.loan_amount)}
                            </td>
                            <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                              {getDisplayValue(request.purpose, 'N/A')}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {request.term_months || 0} months
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${getStatusColor(request.status)}`}>
                                <FaClock className="w-3 h-3 mr-1" />
                                {getDisplayValue(request.status, 'N/A')}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                              {formatDate(request.requested_at || request.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Enhanced Mobile Loan Requests Cards */}
                <div className="lg:hidden space-y-4">
                  {loanRequests.length === 0 ? (
                    <div className="empty-state text-center py-12 px-6">
                      <div className="empty-state-icon mb-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto shadow-lg">
                          <FaClock className="h-10 w-10 text-orange-500" />
                        </div>
                      </div>
                      <h3 className="empty-state-title text-xl font-bold text-gray-900 mb-3">No loan requests found</h3>
                      <p className="empty-state-description text-gray-600 mb-8 max-w-md mx-auto">You haven't submitted any loan applications yet. Use the "New Request" button above to get started.</p>
                    </div>
                  ) : (
                    loanRequests.map((request, index) => (
                      <div key={request.id} className="member-request-card bg-white rounded-xl p-4 sm:p-5 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <span className="text-sm font-semibold text-gray-600">#{request.id}</span>
                              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${getStatusColor(request.status)}`}>
                                <FaClock className="w-3 h-3 mr-1" />
                                {getDisplayValue(request.status, 'N/A')}
                              </span>
                            </div>
                            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                              {formatCurrency(request.loan_amount)}
                            </h3>
                            <p className="text-sm font-semibold text-gray-600 mb-3">
                              {getDisplayValue(request.purpose, 'No purpose specified')}
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-3 text-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <FaClock className="w-4 h-4 text-gray-400 mr-2" />
                              <span className="text-gray-500">Term:</span>
                            </div>
                            <span className="font-semibold text-gray-900">
                              {request.term_months || 0} months
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <FaClock className="w-4 h-4 text-gray-400 mr-2" />
                              <span className="text-gray-500">Requested:</span>
                            </div>
                            <span className="font-semibold text-gray-900">
                              {formatDate(request.requested_at || request.created_at)}
                            </span>
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
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6">Payment History</h3>
                
                {/* Enhanced Desktop Payment History Table */}
                <div className="hidden lg:block bg-white shadow-xl rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gradient-to-r from-gray-50 to-green-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            <div className="flex items-center">
                              <FaClock className="w-4 h-4 mr-2" />
                              Date
                            </div>
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            <div className="flex items-center">
                              <FaMoneyBillWave className="w-4 h-4 mr-2" />
                              Amount
                            </div>
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Purpose</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {paymentHistory.map((payment, index) => (
                          <tr key={payment.id} className={`hover:bg-gray-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                            <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                              {formatDate(payment.transaction_date)}
                            </td>
                            <td className="px-6 py-4 text-lg font-bold text-green-600">
                              {formatCurrency(payment.amount)}
                            </td>
                            <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                              {getDisplayValue(payment.payment_type || payment.type, 'Payment')}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {payment.purpose || payment.description || 'N/A'}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${getStatusColor(payment.status)}`}>
                                <FaCheckCircle className="w-3 h-3 mr-1" />
                                {getDisplayValue(payment.status, 'N/A')}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Enhanced Mobile Payment History Cards */}
                <div className="lg:hidden space-y-4">
                  {paymentHistory.length === 0 ? (
                    <div className="empty-state text-center py-12 px-6">
                      <div className="empty-state-icon mb-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto shadow-lg">
                          <FaCreditCard className="h-10 w-10 text-purple-500" />
                        </div>
                      </div>
                      <h3 className="empty-state-title text-xl font-bold text-gray-900 mb-3">No payment history found</h3>
                      <p className="empty-state-description text-gray-600 mb-8 max-w-md mx-auto">Your payment history will appear here once you start making payments on your loans.</p>
                    </div>
                  ) : (
                    paymentHistory.map((payment, index) => (
                      <div key={payment.id} className="member-payment-card bg-white rounded-xl p-4 sm:p-5 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3 mb-3">
                              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${getStatusColor(payment.status)}`}>
                                <FaCheckCircle className="w-3 h-3 mr-1" />
                                {getDisplayValue(payment.status, 'N/A')}
                              </span>
                              <span className="text-sm font-semibold text-gray-500">
                                {formatDate(payment.transaction_date)}
                              </span>
                            </div>
                            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                              {formatCurrency(payment.amount)}
                            </h3>
                            <p className="text-sm font-semibold text-gray-600 mb-2">
                              {getDisplayValue(payment.payment_type || payment.type, 'Payment')}
                            </p>
                            <p className="text-xs text-gray-500">
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
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6">Transaction History</h3>
                
                {/* Enhanced Desktop Transaction History Table */}
                <div className="hidden lg:block bg-white shadow-xl rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            <div className="flex items-center">
                              <FaClock className="w-4 h-4 mr-2" />
                              Date
                            </div>
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Description</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            <div className="flex items-center">
                              <FaMoneyBillWave className="w-4 h-4 mr-2" />
                              Amount
                            </div>
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {transactionHistory.map((transaction, index) => (
                          <tr key={transaction.id} className={`hover:bg-gray-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                            <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                              {formatDate(transaction.transaction_date)}
                            </td>
                            <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                              {getDisplayValue(transaction.description, 'Transaction')}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {getDisplayValue(transaction.type, 'N/A')}
                            </td>
                            <td className="px-6 py-4 text-lg font-bold text-green-600">
                              {formatCurrency(transaction.amount)}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${getStatusColor(transaction.status)}`}>
                                <FaCheckCircle className="w-3 h-3 mr-1" />
                                {getDisplayValue(transaction.status, 'N/A')}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Enhanced Mobile Transaction History Cards */}
                <div className="lg:hidden space-y-4">
                  {transactionHistory.length === 0 ? (
                    <div className="empty-state text-center py-12 px-6">
                      <div className="empty-state-icon mb-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-full flex items-center justify-center mx-auto shadow-lg">
                          <FaHistory className="h-10 w-10 text-indigo-500" />
                        </div>
                      </div>
                      <h3 className="empty-state-title text-xl font-bold text-gray-900 mb-3">No transactions found</h3>
                      <p className="empty-state-description text-gray-600 mb-8 max-w-md mx-auto">Your transaction history will appear here once you start using our services.</p>
                    </div>
                  ) : (
                    transactionHistory.map((transaction, index) => (
                      <div key={transaction.id} className="member-transaction-card bg-white rounded-xl p-4 sm:p-5 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3 mb-3">
                              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${getStatusColor(transaction.status)}`}>
                                <FaCheckCircle className="w-3 h-3 mr-1" />
                                {getDisplayValue(transaction.status, 'N/A')}
                              </span>
                              <span className="text-sm font-semibold text-gray-500">
                                {formatDate(transaction.transaction_date)}
                              </span>
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 break-words">
                              {getDisplayValue(transaction.description, 'Transaction')}
                            </h3>
                            <p className="text-sm font-semibold text-gray-600 mb-2 break-words">
                              {getDisplayValue(transaction.type, 'N/A')}
                            </p>
                          </div>
                          <div className="text-right ml-2">
                            <div className="text-lg sm:text-xl font-bold text-green-600">
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
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Apply for New Loan
                </h3>
              </div>
              <form onSubmit={handleLoanApplication} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Requested Amount (₹) *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <input
                      type="number"
                      value={loanApplication.requested_amount}
                      onChange={(e) => setLoanApplication({...loanApplication, requested_amount: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 focus:bg-white"
                      placeholder="Enter loan amount"
                      min="1000"
                      step="1000"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Purpose</label>
                  <div className="relative">
                    <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <textarea
                      value={loanApplication.purpose}
                      onChange={(e) => setLoanApplication({...loanApplication, purpose: e.target.value})}
                      rows={3}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 focus:bg-white resize-none"
                      placeholder="Describe the purpose of the loan (optional)"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Term (months)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <select
                      value={loanApplication.term_months}
                      onChange={(e) => setLoanApplication({...loanApplication, term_months: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 focus:bg-white appearance-none bg-white cursor-pointer"
                    >
                    <option value="6">6 months</option>
                    <option value="12">12 months</option>
                    <option value="18">18 months</option>
                    <option value="24">24 months</option>
                    <option value="36">36 months</option>
                  </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowLoanApplicationModal(false)}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 cursor-pointer transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingLoan}
                    className={`px-6 py-3 text-white rounded-lg flex items-center font-medium transition-all duration-200 shadow-lg hover:shadow-xl ${
                      isSubmittingLoan 
                        ? 'bg-blue-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 cursor-pointer transform hover:scale-105'
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
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
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
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
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