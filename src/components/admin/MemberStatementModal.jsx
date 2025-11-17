import React, { useState, useEffect } from 'react';
import { FaTimes, FaPrint, FaUser, FaCalendarAlt, FaMoneyBillWave, FaFileAlt } from 'react-icons/fa';
import apiService from '../../services/api';
import { toast } from 'react-hot-toast';

// Helper function to get the base URL for static files
const getBaseURL = () => {
  const apiBaseURL = apiService.baseURL; // e.g., "http://localhost:8000/api/v1"
  return apiBaseURL.replace('/api/v1', ''); // Remove /api/v1 to get base URL
};

const MemberStatementModal = ({ isOpen, onClose, memberId, memberData, isClerkView = false }) => {
  const [loading, setLoading] = useState(false);
  const [statementData, setStatementData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    totalSavings: 0,
    totalLoanPrincipal: 0,
    totalLoanInterest: 0,
    totalJoiningFees: 0,
    totalInsuranceAmount: 0,
    totalCarryForward: 0,
    totalPaid: 0,
    currentLoanBalance: 0,
    currentSavingsBalance: 0
  });

  useEffect(() => {
    if (isOpen && memberId) {
      loadMemberStatement();
    }
  }, [isOpen, memberId]);

  const loadMemberStatement = async () => {
    try {
      setLoading(true);
      
      
      // Validate member ID
      if (!memberId) {
        throw new Error('Member ID is required');
      }
      
      // Test each API call individually to identify which one fails
      let memberDetails, loanData, collectionData;
      
      try {
        memberDetails = isClerkView 
          ? await apiService.getClerkMemberDetails(memberId)
          : await apiService.getMemberDetails(memberId);
      } catch (error) {
        // Use passed memberData as fallback
        if (memberData) {
          memberDetails = memberData;
        } else {
          throw new Error(`Failed to load member details: ${error.message}`);
        }
      }
      
      try {
        loanData = isClerkView 
          ? await apiService.getClerkMemberLoans(memberId)
          : await apiService.getMemberLoans(memberId);
      } catch (error) {
        // Don't throw here, just continue with empty array
        loanData = [];
      }
      
      try {
        const transactionData = isClerkView 
          ? await apiService.getClerkMemberTransactions(memberId)
          : await apiService.getMemberTransactions(memberId);
        
        // Process the transaction data into the expected format
        collectionData = transactionData.filter(t => t.type === 'collection');
        loanData = transactionData.filter(t => t.type === 'loan');
      } catch (error) {
        // Don't throw here, just continue with empty arrays
        collectionData = [];
        loanData = [];
      }

      // Process transaction data
      const processedTransactions = processTransactions(collectionData, loanData);
      
      // Calculate summary
      const calculatedSummary = calculateSummary(processedTransactions, memberDetails);
      
      // Debug logging
      console.log('Member details for loan calculation:', {
        memberDetails,
        loanInfo: memberDetails?.loan_info,
        processedTransactions,
        calculatedSummary
      });
      
      setStatementData(memberDetails);
      setTransactions(processedTransactions);
      setSummary(calculatedSummary);
      
    } catch (error) {
      toast.error(`Failed to load member statement: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getPaymentTypeDescription = (paymentType) => {
    const descriptions = {
      'DEPOSIT': 'Savings Deposit',
      'LOAN_PRINCIPAL': 'Loan Principal',
      'LOAN_INTEREST': 'Loan Interest',
      'JOINING_FEE': 'Joining Fee',
      'INSURANCE_AMOUNT': 'Insurance Amount',
      'CARRY_FORWARD': 'Carry Forward',
      'SHARE_CAPITAL': 'Share Capital',
      'LRF': 'LRF'
    };
    return descriptions[paymentType] || paymentType;
  };

  const processTransactions = (collections, loans) => {
    const allTransactions = [];
    
    // Process collection transactions (already processed by API)
    if (collections && Array.isArray(collections)) {
      collections.forEach(transaction => {
        allTransactions.push({
          date: transaction.date,
          type: 'collection',
          paymentType: transaction.payment_type,
          amount: parseFloat(transaction.amount),
          description: transaction.description || getPaymentTypeDescription(transaction.payment_type),
          reference: transaction.receipt_number
        });
      });
    }

    // Process loan transactions (already processed by API)
    if (loans && Array.isArray(loans)) {
      loans.forEach(transaction => {
        allTransactions.push({
          date: transaction.date,
          type: 'loan',
          paymentType: transaction.payment_type,
          amount: parseFloat(transaction.amount),
          description: transaction.description || getPaymentTypeDescription(transaction.payment_type),
          reference: transaction.receipt_number
        });
      });
    }

    // Sort by date (newest first)
    return allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const calculateSummary = (transactions, memberDetails) => {
    let totalSavings = 0;
    let totalLoanPrincipal = 0;
    let totalLoanInterest = 0;
    let totalJoiningFees = 0;
    let totalInsuranceAmount = 0;
    let totalCarryForward = 0;
    let totalPaid = 0;
    let totalLoanDisbursed = 0;

    if (transactions && Array.isArray(transactions)) {
      transactions.forEach(transaction => {
        totalPaid += transaction.amount || 0;
        
        switch (transaction.paymentType) {
          case 'DEPOSIT':
            totalSavings += transaction.amount || 0;
            break;
          case 'LOAN_PRINCIPAL':
            totalLoanPrincipal += transaction.amount || 0;
            break;
          case 'LOAN_INTEREST':
            totalLoanInterest += transaction.amount || 0;
            break;
          case 'JOINING_FEE':
            totalJoiningFees += transaction.amount || 0;
            break;
          case 'INSURANCE_AMOUNT':
            totalInsuranceAmount += transaction.amount || 0;
            break;
          case 'CARRY_FORWARD':
            totalCarryForward += transaction.amount || 0;
            break;
          case 'disbursement':
          case 'DISBURSEMENT':
          case 'loan_disbursement':
            totalLoanDisbursed += transaction.amount || 0;
            break;
        }
      });
    }

    // Calculate current loan balance using the same method as bill collector
    let currentLoanBalance = 0;
    
    console.log('Loan balance calculation inputs:', {
      memberDetails,
      loanInfo: memberDetails?.loan_info,
      totalLoanDisbursed,
      totalLoanPrincipal,
      totalLoanInterest
    });
    
    // If we have member details with loan info, calculate properly
    if (memberDetails?.loan_info) {
      const loanInfo = memberDetails.loan_info;
      const loanAmount = loanInfo.loan_amount || 0;
      const termMonths = loanInfo.term_months || 12;
      const annualInterestRate = loanInfo.interest_rate || 12.0;
      const monthlyRate = annualInterestRate / 100 / 12;
      
      // Calculate EMI
      const emi = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, termMonths) / 
                  (Math.pow(1 + monthlyRate, termMonths) - 1);
      
      // Calculate total amount to be paid
      const totalAmount = emi * termMonths;
      
      // Get payments made (principal + interest payments)
      const paymentsMade = totalLoanPrincipal + totalLoanInterest;
      
      // Calculate remaining amount
      currentLoanBalance = Math.max(0, totalAmount - paymentsMade);
      
      console.log('EMI calculation details:', {
        loanAmount,
        termMonths,
        annualInterestRate,
        monthlyRate,
        emi,
        totalAmount,
        paymentsMade,
        currentLoanBalance
      });
    } else {
      // Fallback: use simple calculation if no loan info
      currentLoanBalance = Math.max(0, totalLoanDisbursed - totalLoanPrincipal);
      console.log('Using fallback calculation:', {
        totalLoanDisbursed,
        totalLoanPrincipal,
        currentLoanBalance
      });
    }

    return {
      totalSavings,
      totalLoanPrincipal,
      totalLoanInterest,
      totalJoiningFees,
      totalInsuranceAmount,
      totalCarryForward,
      totalPaid,
      totalLoanDisbursed,
      currentLoanBalance: memberDetails?.current_loan_balance || currentLoanBalance,
      currentSavingsBalance: memberDetails?.savings_balance || totalSavings
    };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  const handlePrint = () => {
    const printContent = document.getElementById('member-statement-content');
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Member Financial Statement - ${statementData?.user?.full_name || 'Member'}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .member-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .member-details { flex: 1; }
            .member-photo { width: 120px; height: 120px; border: 2px solid #ccc; }
            .transaction-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .transaction-table th, .transaction-table td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            .transaction-table th { background-color: #f5f5f5; font-weight: bold; }
            .summary { margin-top: 30px; padding: 20px; background-color: #f9f9f9; }
            .summary-row { display: flex; justify-content: space-between; margin: 5px 0; }
            .total-row { font-weight: bold; border-top: 2px solid #333; padding-top: 10px; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };



  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-3 sm:p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center">
            <FaFileAlt className="mr-2 text-blue-600" />
            Member Financial Statement
          </h3>
          <div className="flex space-x-2 w-full sm:w-auto">
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center cursor-pointer text-sm sm:text-base"
            >
              <FaPrint className="mr-2" />
              Print
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors duration-200 p-2 rounded-lg hover:bg-gray-100"
            >
              <FaTimes className="h-5 w-5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading member statement...</p>
          </div>
        ) : (
          <div id="member-statement-content" className="space-y-6">
            {/* Header */}
            <div className="text-center border-b pb-4">
              <h1 className="text-2xl font-bold text-gray-900">MEMBER FINANCIAL STATEMENT</h1>
              <p className="text-gray-600">Generated on {new Date().toLocaleDateString('en-GB')}</p>
            </div>

            {/* Member Information */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <FaUser className="mr-2 text-blue-600" />
                    MEMBER INFORMATION
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Member Code:</label>
                      <p className="text-lg font-semibold text-gray-900">{statementData?.member_code || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Date Joined:</label>
                      <p className="text-lg font-semibold text-gray-900">
                        {statementData?.joined_date ? formatDate(statementData.joined_date) : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Name:</label>
                      <p className="text-lg font-semibold text-gray-900">{statementData?.user?.full_name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Age:</label>
                      <p className="text-lg font-semibold text-gray-900">{statementData?.age || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Guardian Name:</label>
                      <p className="text-lg font-semibold text-gray-900">{statementData?.father_husband_name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Phone:</label>
                      <p className="text-lg font-semibold text-gray-900">{statementData?.nominee_phone || 'N/A'}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-gray-600">Address:</label>
                      <p className="text-lg font-semibold text-gray-900">{statementData?.group?.location || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center">
                <div className="w-32 h-32 border-2 border-gray-300 rounded-lg flex items-center justify-center bg-gray-100">
                  {(statementData?.photo_url || statementData?.member?.photo_url) ? (
                    <img 
                      src={`${getBaseURL()}/${statementData?.photo_url || statementData?.member?.photo_url}`} 
                      alt="Member Photo" 
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                  ) : null}
                  <FaUser className="text-4xl text-gray-400" style={{ display: (statementData?.photo_url || statementData?.member?.photo_url) ? 'none' : 'block' }} />
                </div>
              </div>
            </div>

            {/* Transactional Details */}
            <div className="bg-white border rounded-lg">
              <div className="bg-gray-50 px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900 text-center">
                  TRANSACTIONAL DETAILS
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">Date</th>
                      <th className="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">Type</th>
                      <th className="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">Description</th>
                      <th className="px-2 sm:px-4 py-3 text-right text-xs sm:text-sm font-semibold text-gray-700">Amount (₹)</th>
                      <th className="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {transactions.length > 0 ? (
                      transactions.map((transaction, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-900">{formatDate(transaction.date)}</td>
                          <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-900">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              transaction.type === 'collection' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {transaction.type === 'collection' ? 'Collection' : 'Loan'}
                            </span>
                          </td>
                          <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-900">{transaction.description}</td>
                          <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-900 text-right font-medium">
                            {formatCurrency(transaction.amount)}
                          </td>
                          <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-500">{transaction.reference || '-'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-2 sm:px-4 py-8 text-center text-gray-500">
                          No transactions found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                FINANCIAL SUMMARY
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Total Savings</p>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(summary.totalSavings)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Total Loan Disbursed</p>
                  <p className="text-xl font-bold text-blue-600">{formatCurrency(summary.totalLoanDisbursed || 0)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Total Loan Principal Paid</p>
                  <p className="text-xl font-bold text-blue-500">{formatCurrency(summary.totalLoanPrincipal)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Total Loan Interest Paid</p>
                  <p className="text-xl font-bold text-orange-600">{formatCurrency(summary.totalLoanInterest)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Joining Fees</p>
                  <p className="text-lg font-bold text-purple-600">{formatCurrency(summary.totalJoiningFees)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Insurance Amount</p>
                  <p className="text-lg font-bold text-teal-600">{formatCurrency(summary.totalInsuranceAmount || 0)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Carry Forward</p>
                  <p className="text-lg font-bold text-indigo-600">{formatCurrency(summary.totalCarryForward)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Total Paid</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(summary.totalPaid)}</p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-300">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Current Savings Balance</p>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(summary.currentSavingsBalance)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Current Loan Balance</p>
                    <p className="text-lg font-bold text-red-600">{formatCurrency(summary.currentLoanBalance)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberStatementModal;
