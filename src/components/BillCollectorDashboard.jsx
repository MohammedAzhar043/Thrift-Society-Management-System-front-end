// components/BillCollectorDashboard.jsx
import { useState, useEffect } from 'react';
import { FaUsers, FaMoneyBillWave, FaHistory, FaHandHoldingUsd, FaSignOutAlt, FaPlus, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import apiService from '../services/api';
import { formatIndianCurrency } from '../utils/formatters';
import useFormSubmission from '../hooks/useFormSubmission';

function BillCollectorDashboard({ user, onLogout }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Helper function to format payment type
  const formatPaymentType = (paymentType) => {
    if (!paymentType) return 'N/A';
    const typeMap = {
      'LOAN_PRINCIPAL': 'EMI',
      'LOAN_INTEREST': 'Interest',
      'DEPOSIT': 'Deposit',
      'JOINING_FEE': 'Joining Fee',
      'CARRY_FORWARD': 'Carry Forward',
      'SHARE_CAPITAL': 'Share Capital',
      'LRF': 'LRF'
    };
    return typeMap[paymentType] || paymentType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Helper function to generate receipt number from collection record
  const getReceiptNumber = (collection) => {
    // If receipt_number exists on collection, use it
    if (collection.receipt_number) {
      return collection.receipt_number;
    }
    
    // Otherwise, generate from collection ID and date
    if (collection.id && collection.collection_date) {
      const date = new Date(collection.collection_date);
      const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
      return `RCP-${dateStr}-${String(collection.id).padStart(4, '0')}`;
    }
    
    // Fallback: use collection ID
    if (collection.id) {
      return `RCP-${collection.id}`;
    }
    
    return 'N/A';
  };
  
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
  const [showPrintConfirmation, setShowPrintConfirmation] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [collectionForm, setCollectionForm] = useState({
    group_id: '',
    collection_date: new Date().toISOString().split('T')[0],
    total_deposits: 0,
    total_loan_principal: 0,
    total_loan_interest: 0,
    total_joining_fees: 0,
    total_carry_forward: 0,
    total_share_capital: 0,
    total_lrf: 0,
    grand_total: 0,
    member_count: 0,
    transaction_count: 0,
    collection_items: [],
    // Loan request fields
    member_id: '',
    requested_amount: '',
    purpose: '',
    term_months: '12'
  });

  // Payment types for the dropdown
  const paymentTypes = [
    { value: 'DEPOSIT', label: 'Savings Deposit', description: 'General savings deposit' },
    { value: 'LOAN_PRINCIPAL', label: 'Loan Principal', description: 'EMI principal payment' },
    { value: 'LOAN_INTEREST', label: 'Loan Interest', description: 'EMI interest payment' },
    { value: 'JOINING_FEE', label: 'Joining Fee', description: 'One-time joining fee' },
    { value: 'CARRY_FORWARD', label: 'Carry Forward', description: 'Previous month carry forward amount' },
    { value: 'SHARE_CAPITAL', label: 'Share Capital', description: 'Share capital payment' },
    { value: 'LRF', label: 'LRF', description: 'Loan Recovery Fund payment' }
  ];

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [statsData, collectionsData, loanRequestsData] = await Promise.all([
        apiService.getCollectorDashboardStats(),
        apiService.getCollectionRecords(),
        apiService.getCollectorLoanRequests(null, 'REQUEST')
      ]);
      
      setStats(statsData);
      setCollections(collectionsData);
      setLoanRequests(loanRequestsData);
    } catch (err) {
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Update total collected amount when collection items change
  useEffect(() => {
    const total = collectionForm.collection_items.reduce((sum, item) => sum + calculateTotalCollectionAmount(item), 0);
    setCollectionForm(prev => ({ ...prev, grand_total: total }));
  }, [collectionForm.collection_items]);

  // Load group members when group is selected
  const loadGroupMembers = async (groupId, forLoanRequest = false) => {
    try {
      setLoadingMembers(true);
      
      // Load members, loans, and collection records for the group
      const [members, loans, collectionRecords] = await Promise.all([
        apiService.getCollectorGroupMembers(groupId, 'ACTIVE'), // Always load all active members
        apiService.getCollectorGroupLoans(groupId), // Load all loans for the group
        apiService.getCollectionRecords(groupId) // Load collection records to check monthly payments
      ]);
      
      
      // For both loan requests and collections, show all active members
      // The payment type will determine what information to show
      const filteredMembers = members;
      
      // Add EMI calculation for each member
      const membersWithEMI = await Promise.all(filteredMembers.map(async (member) => {
        // Find the member's active loan - include all relevant loan statuses
        const memberLoan = loans.find(loan => 
          loan.member_id === member.id && 
          (loan.status === 'ACTIVE' || loan.status === 'DISBURSED' || loan.status === 'APPROVED' || loan.status === 'REQUEST' || loan.status === 'PENDING')
        );
        
        
        // Get payments made from stored aggregated amount (fast, no API call needed)
        let paymentsMade = 0;
        if (memberLoan && memberLoan.total_collected_amount !== undefined && memberLoan.total_collected_amount !== null) {
          paymentsMade = parseFloat(memberLoan.total_collected_amount) || 0;
        }
        
        // Check if member has paid this month by looking at collection records
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
        const currentYear = new Date().getFullYear();
        const currentMonthNum = new Date().getMonth() + 1;
        
        let hasPaidThisMonth = false;
        let lastPaymentDate = null;
        
        if (memberLoan) {
          // For members with loans, check if they have made EMI payments this month
          const thisMonthCollections = collectionRecords.filter(collection => {
            const collectionDate = new Date(collection.collection_date);
            const collectionYear = collectionDate.getFullYear();
            const collectionMonth = collectionDate.getMonth() + 1;
            return collectionYear === currentYear && collectionMonth === currentMonthNum;
          });
          
          // Check if any collection items for this member contain EMI payments this month
          for (const collection of thisMonthCollections) {
            if (collection.collection_items) {
              const memberEMIPayments = collection.collection_items.filter(item => 
                item.member_id === member.id && 
                (item.payment_type === 'LOAN_PRINCIPAL' || item.payment_type === 'LOAN_INTEREST')
              );
              if (memberEMIPayments.length > 0) {
                hasPaidThisMonth = true;
                lastPaymentDate = collection.collection_date;
                break;
              }
            }
          }
        }
        
        const emiDue = calculateEMIDue(member, memberLoan);
        const emiBreakdown = calculateEMIBreakdown(member, memberLoan);
        
        return {
          ...member,
          current_emi_due: emiDue,
          carry_forward_amount: member.carry_forward_amount || 0,
          remaining_loan_amount: calculateRemainingLoanAmount({...member, payments_made: paymentsMade}, memberLoan),
          payments_made: paymentsMade,
          loan_info: memberLoan,
          payment_status: hasPaidThisMonth ? 'PAID' : 'PENDING',
          last_payment_month: hasPaidThisMonth ? currentMonth : null,
          last_payment_date: lastPaymentDate
        };
      }));
      
      setGroupMembers(membersWithEMI);
    } catch (err) {
      setError('Failed to load group members. Please try again.');
      setGroupMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  // Calculate EMI due for a member using correct compound interest formula
  const calculateEMIDue = (member, loanInfo) => {
    try {
      // If no loan info, return 0
      if (!loanInfo) {
        return 0;
      }
      
      // Only calculate EMI for loans that are approved, disbursed, or active
      // Loans with status REQUEST or PENDING might not have all required fields
      if (loanInfo.status === 'REQUEST' || loanInfo.status === 'PENDING') {
        return 0;
      }
      
      // Check if loan has required fields
      if (!loanInfo.loan_amount || loanInfo.loan_amount <= 0) {
        return 0;
      }
      
      if (!loanInfo.term_months || loanInfo.term_months <= 0) {
        return 0;
      }
      
      const loanAmount = parseFloat(loanInfo.loan_amount);
      const termMonths = parseInt(loanInfo.term_months);
      const annualInterestRate = parseFloat(loanInfo.interest_rate || 12.0);
      
      // Validate inputs
      if (isNaN(loanAmount) || isNaN(termMonths) || isNaN(annualInterestRate)) {
        console.error('Invalid loan data for EMI calculation:', loanInfo);
        return 0;
      }
      
      // Convert annual rate to monthly rate
      const monthlyRate = annualInterestRate / 100 / 12;
      
      // Prevent division by zero
      if (monthlyRate <= 0) {
        return 0;
      }
      
      // Calculate EMI using compound interest formula
      // EMI = P × r × (1+r)^n / ((1+r)^n - 1)
      const emi = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, termMonths) / 
                  (Math.pow(1 + monthlyRate, termMonths) - 1);
      
      const carryForward = parseFloat(member.carry_forward_amount || 0);
      
      // Calculate interest on carry-forward amount (monthly rate)
      const interestOnCarryForward = carryForward * monthlyRate;
      
      // Total due = This month's EMI + Carry forward + Interest on carry forward
      const totalDue = emi + carryForward + interestOnCarryForward;
      
      return isNaN(totalDue) ? 0 : totalDue;
    } catch (error) {
      console.error('Error calculating EMI due:', error, { member, loanInfo });
      return 0;
    }
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
    
    // Get payments made from stored aggregated amount (fast, no calculation needed)
    const paymentsMade = loanInfo.total_collected_amount ? parseFloat(loanInfo.total_collected_amount) || 0 : 0;
    
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

  // Calculate EMI breakdown (principal and interest components)
  const calculateEMIBreakdown = (member, loanInfo) => {
    if (!loanInfo || !loanInfo.loan_amount || !loanInfo.term_months) {
      return { principal: 0, interest: 0 };
    }
    
    // Only calculate EMI breakdown for loans that are approved, disbursed, or active
    if (loanInfo.status === 'REQUEST' || loanInfo.status === 'PENDING') {
      return { principal: 0, interest: 0 };
    }
    
    // Check if loan has required fields
    if (!loanInfo.loan_amount || loanInfo.loan_amount <= 0) {
      return { principal: 0, interest: 0 };
    }
    
    if (!loanInfo.term_months || loanInfo.term_months <= 0) {
      return { principal: 0, interest: 0 };
    }
    
    try {
      const principal = parseFloat(loanInfo.loan_amount);
      const termMonths = parseInt(loanInfo.term_months);
      const interestRate = parseFloat(loanInfo.interest_rate || 12.0) / 100 / 12; // Monthly interest rate
      
      if (termMonths <= 0 || interestRate <= 0) {
        return { principal: 0, interest: 0 };
      }
      
      // Calculate total EMI first
      const totalEMI = calculateEMIDue(member, loanInfo);
      
      // Calculate remaining principal (simplified approach)
      const paymentsMade = member.payments_made || 0;
      const remainingPrincipal = Math.max(0, principal - paymentsMade);
      
      // Calculate interest on remaining principal
      const interestAmount = remainingPrincipal * interestRate;
      
      // Calculate principal component (EMI - interest)
      const principalAmount = Math.max(0, totalEMI - interestAmount);
      
      return {
        principal: Math.min(principalAmount, remainingPrincipal),
        interest: interestAmount
      };
    } catch (error) {
      console.error('Error calculating EMI breakdown:', error);
      return { principal: 0, interest: 0 };
    }
  };

  // Calculate total collection amount for an item
  const calculateTotalCollectionAmount = (item) => {
    const principalAmount = parseFloat(item.principal_amount || 0);
    const interestAmount = parseFloat(item.interest_amount || 0);
    const depositAmount = parseFloat(item.deposit_amount || 0);
    const joiningFeeAmount = parseFloat(item.joining_fee || 0);
    const shareCapitalAmount = parseFloat(item.share_capital || 0);
    const lrfAmount = parseFloat(item.lrf || 0);
    
    return principalAmount + interestAmount + depositAmount + joiningFeeAmount + shareCapitalAmount + lrfAmount;
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
      if (!item.member_id) {
        setError(`Please select a member for collection item ${i + 1}`);
        return;
      }
      
      // Calculate total amount for this item
      const totalAmount = calculateTotalCollectionAmount(item);
      if (totalAmount <= 0) {
        setError(`Please enter at least one amount for collection item ${i + 1}`);
        return;
      }
    }

    await submitCollectionForm(async () => {
      const totalCalculated = collectionForm.collection_items.reduce((sum, item) => sum + calculateTotalCollectionAmount(item), 0);
      if (Math.abs(totalCalculated - parseFloat(collectionForm.grand_total || 0)) > 0.01) {
        throw new Error(`Total collected amount (${collectionForm.grand_total}) does not match sum of collection items (${formatIndianCurrency(totalCalculated, false)})`);
      }

      // Transform collection items to create separate items for each payment type
      const transformedCollectionItems = [];
      
      if (collectionForm.collection_items.length === 0) {
        throw new Error('Please add at least one collection item');
      }
      
      try {
        collectionForm.collection_items.forEach(item => {
        const selectedMember = getMemberById(item.member_id);
        if (!selectedMember) return;

        const principalAmount = parseFloat(item.principal_amount || 0);
        const interestAmount = parseFloat(item.interest_amount || 0);
        const depositAmount = parseFloat(item.deposit_amount || 0);
        const joiningFeeAmount = parseFloat(item.joining_fee || 0);
        const shareCapitalAmount = parseFloat(item.share_capital || 0);
        const lrfAmount = parseFloat(item.lrf || 0);
        
        // Validate amounts
        if (isNaN(principalAmount) || isNaN(interestAmount) || isNaN(depositAmount) || isNaN(joiningFeeAmount) || isNaN(shareCapitalAmount) || isNaN(lrfAmount)) {
          console.error('Invalid amount in collection item:', item);
          return;
        }

        // Handle loan payments with carry-forward logic
        if (principalAmount > 0 || interestAmount > 0) {
          const hasActiveLoan = selectedMember.loan_info && (selectedMember.loan_info.status === 'ACTIVE' || selectedMember.loan_info.status === 'DISBURSED' || selectedMember.loan_info.status === 'APPROVED');
          
          if (hasActiveLoan) {
            const currentEMI = selectedMember.current_emi_due || 0;
            const totalLoanPayment = principalAmount + interestAmount;
            const carryForwardAmount = selectedMember.carry_forward_amount || 0;
            const totalDue = currentEMI + carryForwardAmount;
            
            // Calculate how much is being paid towards the total due
            const paymentTowardsDue = Math.min(totalLoanPayment, totalDue);
            const remainingAfterPayment = totalDue - paymentTowardsDue;
            
            // Add principal payment
            if (principalAmount > 0) {
              transformedCollectionItems.push({
                member_id: item.member_id,
                loan_id: selectedMember.loan_info?.id || null,
                amount: principalAmount,
                payment_type: 'LOAN_PRINCIPAL',
                notes: `Principal payment${remainingAfterPayment > 0 ? ` (Carry forward: ${formatIndianCurrency(remainingAfterPayment)})` : ''}`
              });
            }

            // Add interest payment
            if (interestAmount > 0) {
              transformedCollectionItems.push({
                member_id: item.member_id,
                loan_id: selectedMember.loan_info?.id || null,
                amount: interestAmount,
                payment_type: 'LOAN_INTEREST',
                notes: `Interest payment${remainingAfterPayment > 0 ? ` (Carry forward: ${formatIndianCurrency(remainingAfterPayment)})` : ''}`
              });
            }

            // Add carry forward amount if there's remaining balance
            if (remainingAfterPayment > 0) {
              transformedCollectionItems.push({
                member_id: item.member_id,
                loan_id: selectedMember.loan_info?.id || null,
                amount: remainingAfterPayment,
                payment_type: 'CARRY_FORWARD',
                notes: `Carry forward to next month: ${formatIndianCurrency(remainingAfterPayment)}`
              });
            }
          } else {
            // No active loan, just add the payments as regular
            if (principalAmount > 0) {
              transformedCollectionItems.push({
                member_id: item.member_id,
                loan_id: null,
                amount: principalAmount,
                payment_type: 'LOAN_PRINCIPAL',
                notes: 'Principal payment (no active loan)'
              });
            }

            if (interestAmount > 0) {
              transformedCollectionItems.push({
                member_id: item.member_id,
                loan_id: null,
                amount: interestAmount,
                payment_type: 'LOAN_INTEREST',
                notes: 'Interest payment (no active loan)'
              });
            }
          }
        }

        // Add deposit payment if amount > 0
        if (depositAmount > 0) {
          transformedCollectionItems.push({
            member_id: item.member_id,
            loan_id: null,
            amount: depositAmount,
            payment_type: 'DEPOSIT',
            notes: 'Savings deposit'
          });
        }

        // Add joining fee if amount > 0
        if (joiningFeeAmount > 0) {
          transformedCollectionItems.push({
            member_id: item.member_id,
            loan_id: null,
            amount: joiningFeeAmount,
            payment_type: 'JOINING_FEE',
            notes: 'Joining fee'
          });
        }

        // Add share capital if amount > 0
        if (shareCapitalAmount > 0) {
          transformedCollectionItems.push({
            member_id: item.member_id,
            loan_id: null,
            amount: shareCapitalAmount,
            payment_type: 'SHARE_CAPITAL',
            notes: 'Share capital payment'
          });
        }

        // Add LRF if amount > 0
        if (lrfAmount > 0) {
          transformedCollectionItems.push({
            member_id: item.member_id,
            loan_id: null,
            amount: lrfAmount,
            payment_type: 'LRF',
            notes: 'Loan Recovery Fund payment'
          });
        }
      });
      } catch (transformError) {
        console.error('Error transforming collection items:', transformError);
        throw new Error('Failed to process collection items. Please check the data and try again.');
      }

      // Ensure we have at least one transformed item
      if (transformedCollectionItems.length === 0) {
        throw new Error('Please enter at least one payment amount for the collection items');
      }

      // Calculate totals from transformed items
      const calculatedTotals = {
        total_deposits: 0,
        total_loan_principal: 0,
        total_loan_interest: 0,
        total_joining_fees: 0,
        total_carry_forward: 0,
        total_share_capital: 0,
        total_lrf: 0
      };

      transformedCollectionItems.forEach(item => {
        if (item.payment_type === 'DEPOSIT') {
          calculatedTotals.total_deposits += parseFloat(item.amount);
        } else if (item.payment_type === 'LOAN_PRINCIPAL') {
          calculatedTotals.total_loan_principal += parseFloat(item.amount);
        } else if (item.payment_type === 'LOAN_INTEREST') {
          calculatedTotals.total_loan_interest += parseFloat(item.amount);
        } else if (item.payment_type === 'JOINING_FEE') {
          calculatedTotals.total_joining_fees += parseFloat(item.amount);
        } else if (item.payment_type === 'CARRY_FORWARD') {
          calculatedTotals.total_carry_forward += parseFloat(item.amount);
        } else if (item.payment_type === 'SHARE_CAPITAL') {
          calculatedTotals.total_share_capital += parseFloat(item.amount);
        } else if (item.payment_type === 'LRF') {
          calculatedTotals.total_lrf += parseFloat(item.amount);
        }
      });

      // Create the collection record with transformed items and calculated totals
      const collectionData = {
        group_id: parseInt(collectionForm.group_id),
        collection_date: collectionForm.collection_date,
        total_deposits: calculatedTotals.total_deposits,
        total_loan_principal: calculatedTotals.total_loan_principal,
        total_loan_interest: calculatedTotals.total_loan_interest,
        total_joining_fees: calculatedTotals.total_joining_fees,
        total_carry_forward: calculatedTotals.total_carry_forward,
        total_share_capital: calculatedTotals.total_share_capital,
        total_lrf: calculatedTotals.total_lrf,
        member_count: new Set(transformedCollectionItems.map(item => item.member_id)).size,
        transaction_count: transformedCollectionItems.length,
        notes: collectionForm.notes || null,
        collection_items: transformedCollectionItems
      };

      // Debug logging
      console.log('Collection Data being sent:', collectionData);
      console.log('Transformed Collection Items:', transformedCollectionItems);
      console.log('User token present:', !!localStorage.getItem('token'));
      console.log('API Base URL:', apiService.baseURL);

      // Test authentication first
      try {
        console.log('Testing authentication...');
        await apiService.getCollectorAssignedGroups();
        console.log('Authentication test passed');
      } catch (authError) {
        console.error('Authentication test failed:', authError);
        throw new Error('Authentication failed. Please login again.');
      }

      await apiService.createCollectionRecord(collectionData);
      
      // Reset form and refresh data
      setCollectionForm({
        group_id: '',
        collection_date: new Date().toISOString().split('T')[0],
        grand_total: 0,
        collection_items: []
      });
      setShowCollectionModal(false);
      fetchDashboardData();
      
      // Show success message
      setError(null);
      setSuccessMessage('Collection record created successfully! Receipt number will be generated and shown in the collections list.');
      
      // Auto-clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    }, {
      onError: (err) => {
        // Show more specific error messages
        if (err.message && err.message.includes('Collection date')) {
          setError(err.message);
        } else if (err.message && err.message.includes('Total collected amount')) {
          setError(err.message);
        } else if (err.message && err.message.includes('Group not found')) {
          setError('Selected group not found. Please refresh and try again.');
        } else if (err.message && err.message.includes('not the bill collector')) {
          setError('You are not authorized to collect for this group.');
        } else {
          setError(`Failed to create collection record: ${err.message || 'Please try again.'}`);
        }
      }
    });
  };

  // Add collection item
  const addCollectionItem = (memberId = null) => {
    setCollectionForm(prev => {
      const newItem = { 
        member_id: memberId || '', 
        amount: '', 
        payment_type: 'DEPOSIT', 
        loan_id: null,
        notes: ''
      };
      
      const updatedItems = [...prev.collection_items, newItem];
      
      // Calculate totals by payment type
      const totals = {
        total_deposits: 0,
        total_loan_principal: 0,
        total_loan_interest: 0,
        total_joining_fees: 0,
        total_carry_forward: 0,
        total_share_capital: 0,
        total_lrf: 0
      };
      
      updatedItems.forEach(item => {
        // For items with separate amount fields (new structure)
        const principalAmount = parseFloat(item.principal_amount || 0);
        const interestAmount = parseFloat(item.interest_amount || 0);
        const depositAmount = parseFloat(item.deposit_amount || 0);
        const joiningFeeAmount = parseFloat(item.joining_fee || 0);
        const shareCapitalAmount = parseFloat(item.share_capital || 0);
        const lrfAmount = parseFloat(item.lrf || 0);
        
        // Add amounts from separate fields
        totals.total_deposits += depositAmount;
        totals.total_loan_principal += principalAmount;
        totals.total_loan_interest += interestAmount;
        totals.total_joining_fees += joiningFeeAmount;
        totals.total_share_capital += shareCapitalAmount;
        totals.total_lrf += lrfAmount;
        
        // Also handle legacy payment_type structure if present
        const amount = parseFloat(item.amount || 0);
        if (amount > 0 && item.payment_type) {
          switch (item.payment_type) {
            case 'DEPOSIT':
              totals.total_deposits += amount;
              break;
            case 'LOAN_PRINCIPAL':
              totals.total_loan_principal += amount;
              break;
            case 'LOAN_INTEREST':
              totals.total_loan_interest += amount;
              break;
            case 'JOINING_FEE':
              totals.total_joining_fees += amount;
              break;
            case 'CARRY_FORWARD':
              totals.total_carry_forward += amount;
              break;
            case 'SHARE_CAPITAL':
              totals.total_share_capital += amount;
              break;
            case 'LRF':
              totals.total_lrf += amount;
              break;
          }
        }
      });
      
      const grand_total = Object.values(totals).reduce((sum, val) => sum + val, 0);
      const member_count = new Set(updatedItems.map(item => item.member_id)).size;
      const transaction_count = updatedItems.length;
      
      return {
        ...prev,
        collection_items: updatedItems,
        ...totals,
        grand_total,
        member_count,
        transaction_count
      };
    });
  };

  // Remove collection item
  const removeCollectionItem = (index) => {
    setCollectionForm(prev => {
      const updatedItems = prev.collection_items.filter((_, i) => i !== index);
      
      // Calculate totals by payment type
      const totals = {
        total_deposits: 0,
        total_loan_principal: 0,
        total_loan_interest: 0,
        total_joining_fees: 0,
        total_carry_forward: 0,
        total_share_capital: 0,
        total_lrf: 0
      };
      
      updatedItems.forEach(item => {
        // For items with separate amount fields (new structure)
        const principalAmount = parseFloat(item.principal_amount || 0);
        const interestAmount = parseFloat(item.interest_amount || 0);
        const depositAmount = parseFloat(item.deposit_amount || 0);
        const joiningFeeAmount = parseFloat(item.joining_fee || 0);
        const shareCapitalAmount = parseFloat(item.share_capital || 0);
        const lrfAmount = parseFloat(item.lrf || 0);
        
        // Add amounts from separate fields
        totals.total_deposits += depositAmount;
        totals.total_loan_principal += principalAmount;
        totals.total_loan_interest += interestAmount;
        totals.total_joining_fees += joiningFeeAmount;
        totals.total_share_capital += shareCapitalAmount;
        totals.total_lrf += lrfAmount;
        
        // Also handle legacy payment_type structure if present
        const amount = parseFloat(item.amount || 0);
        if (amount > 0 && item.payment_type) {
          switch (item.payment_type) {
            case 'DEPOSIT':
              totals.total_deposits += amount;
              break;
            case 'LOAN_PRINCIPAL':
              totals.total_loan_principal += amount;
              break;
            case 'LOAN_INTEREST':
              totals.total_loan_interest += amount;
              break;
            case 'JOINING_FEE':
              totals.total_joining_fees += amount;
              break;
            case 'CARRY_FORWARD':
              totals.total_carry_forward += amount;
              break;
            case 'SHARE_CAPITAL':
              totals.total_share_capital += amount;
              break;
            case 'LRF':
              totals.total_lrf += amount;
              break;
          }
        }
      });
      
      const grand_total = Object.values(totals).reduce((sum, val) => sum + val, 0);
      const member_count = new Set(updatedItems.map(item => item.member_id)).size;
      const transaction_count = updatedItems.length;
      
      return {
        ...prev,
        collection_items: updatedItems,
        ...totals,
        grand_total,
        member_count,
        transaction_count
      };
    });
  };

  // Check if member is already in collection
  const isMemberInCollection = (memberId) => {
    return collectionForm.collection_items.some(item => item.member_id === memberId);
  };

  // Check if member has already paid EMI this month (including current collection)
  const hasMemberPaidThisMonth = (member) => {
    if (!member.loan_info) return false;
    
    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      const hasPaidInDatabase = member.payment_status === 'PAID' || member.last_payment_month === currentMonth;
      
      // Also check if member is already in current collection
      const isInCurrentCollection = isMemberInCollection(member.id);
      
      return hasPaidInDatabase || isInCurrentCollection;
    } catch (error) {
      console.error('Error checking payment status:', error);
      return false;
    }
  };

  // Update collection item
  const updateCollectionItem = (index, field, value) => {
    setCollectionForm(prev => {
      const updatedItems = prev.collection_items.map((item, i) => {
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
      });
      
      // Calculate totals by payment type
      const totals = {
        total_deposits: 0,
        total_loan_principal: 0,
        total_loan_interest: 0,
        total_joining_fees: 0,
        total_carry_forward: 0,
        total_share_capital: 0,
        total_lrf: 0
      };
      
      updatedItems.forEach(item => {
        // For items with separate amount fields (new structure)
        const principalAmount = parseFloat(item.principal_amount || 0);
        const interestAmount = parseFloat(item.interest_amount || 0);
        const depositAmount = parseFloat(item.deposit_amount || 0);
        const joiningFeeAmount = parseFloat(item.joining_fee || 0);
        const shareCapitalAmount = parseFloat(item.share_capital || 0);
        const lrfAmount = parseFloat(item.lrf || 0);
        
        // Add amounts from separate fields
        totals.total_deposits += depositAmount;
        totals.total_loan_principal += principalAmount;
        totals.total_loan_interest += interestAmount;
        totals.total_joining_fees += joiningFeeAmount;
        totals.total_share_capital += shareCapitalAmount;
        totals.total_lrf += lrfAmount;
        
        // Also handle legacy payment_type structure if present
        const amount = parseFloat(item.amount || 0);
        if (amount > 0 && item.payment_type) {
          switch (item.payment_type) {
            case 'DEPOSIT':
              totals.total_deposits += amount;
              break;
            case 'LOAN_PRINCIPAL':
              totals.total_loan_principal += amount;
              break;
            case 'LOAN_INTEREST':
              totals.total_loan_interest += amount;
              break;
            case 'JOINING_FEE':
              totals.total_joining_fees += amount;
              break;
            case 'CARRY_FORWARD':
              totals.total_carry_forward += amount;
              break;
            case 'SHARE_CAPITAL':
              totals.total_share_capital += amount;
              break;
            case 'LRF':
              totals.total_lrf += amount;
              break;
          }
        }
      });
      
      const grand_total = Object.values(totals).reduce((sum, val) => sum + val, 0);
      const member_count = new Set(updatedItems.map(item => item.member_id)).size;
      const transaction_count = updatedItems.length;
      
      return {
        ...prev,
        collection_items: updatedItems,
        ...totals,
        grand_total,
        member_count,
        transaction_count
      };
    });
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
        loan_amount: parseFloat(collectionForm.requested_amount),
        purpose: collectionForm.purpose?.trim() || null,
        term_months: parseInt(collectionForm.term_months)
      };

      await apiService.createCollectorLoanRequest(loanRequestData);
      
      setShowLoanModal(false);
      resetLoanRequestForm();
      fetchDashboardData();
      
      // Show success message
      setError(null);
      setSuccessMessage('Loan request created successfully! It is now pending approval.');
      
      // Auto-clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    }, {
      onError: (err) => {
        let errorMessage = 'Failed to create loan request. Please try again.';
        
        // Translate technical error messages to user-friendly messages
        if (err.message) {
          if (err.message.includes('Member status is MemberStatus.PENDING')) {
            errorMessage = 'The member\'s account is still being reviewed. Please wait for approval before creating loan requests.';
          } else if (err.message.includes('MemberStatus.INACTIVE')) {
            errorMessage = 'The member\'s account is inactive. Please contact support to reactivate the account.';
          } else if (err.message.includes('MemberStatus.SUSPENDED')) {
            errorMessage = 'The member\'s account has been suspended. Please contact support for assistance.';
          } else if (err.message.includes('Not eligible for loan')) {
            errorMessage = 'This member is not currently eligible for a loan. Please contact support for more information.';
          } else if (err.message.includes('insufficient balance')) {
            errorMessage = 'Insufficient account balance. Please ensure the member has enough funds.';
          } else if (err.message.includes('loan limit exceeded')) {
            errorMessage = 'This member has reached their maximum loan limit. Please contact support for more information.';
          } else if (err.message.includes('Member not found')) {
            errorMessage = 'The selected member was not found. Please refresh and try again.';
          } else if (err.message.includes('Group not found')) {
            errorMessage = 'The selected group was not found. Please refresh and try again.';
          } else {
            errorMessage = 'Unable to create loan request at this time. Please try again later or contact support if the issue persists.';
          }
        } else if (err.detail) {
          errorMessage = 'Unable to create loan request at this time. Please try again later or contact support if the issue persists.';
        } else if (typeof err === 'string') {
          errorMessage = 'Unable to create loan request at this time. Please try again later or contact support if the issue persists.';
        }
        
        setError(errorMessage);
      }
    });
  };

  // Print functionality for Group Members in Collection
  const handlePrintGroupMembers = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPrintConfirmation(true);
  };

  const confirmPrintGroupMembers = (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    
    setShowPrintConfirmation(false);
    
    // Get the current group members data
    const printData = groupMembers;
    
    if (printData.length === 0) {
      setError('No group members to print');
      return;
    }

    // Get current date for the report
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Get selected group name
    const groupName = selectedGroup ? selectedGroup.name : 'Selected Group';
    const groupLocation = selectedGroup ? selectedGroup.location : 'N/A';

    // Pre-calculate EMI breakdown for all members
    const membersWithCalculations = printData.map((member, index) => {
      const hasActiveLoan = member.loan_info && (member.loan_info.status === 'ACTIVE' || member.loan_info.status === 'DISBURSED' || member.loan_info.status === 'APPROVED');
      const remainingAmount = parseFloat(member.remaining_loan_amount || 0);
      const savingsAmount = parseFloat(member.savings_balance || 0);
      const emiDue = parseFloat(member.current_emi_due || 0);

      let principalAmount = 0;
      let interestAmount = 0;
      try {
        const emiBreakdown = calculateEMIBreakdown(member, member.loan_info);
        principalAmount = emiBreakdown.principal || 0;
        interestAmount = emiBreakdown.interest || 0;
      } catch (error) {
      }

      const totalEMI = emiDue || 0;

      return {
        ...member,
        hasActiveLoan,
        remainingAmount: parseFloat(remainingAmount),
        savingsAmount: parseFloat(savingsAmount),
        emiDue: parseFloat(emiDue),
        principalAmount: parseFloat(principalAmount),
        interestAmount: parseFloat(interestAmount),
        totalEMI: parseFloat(totalEMI)
      };
    });

    // Create table rows HTML
    let tableRows = membersWithCalculations.map((member, index) => {
      // Ensure we have valid data for each field
      const memberName = member.user?.full_name || member.member_code || `Member ${member.id || index + 1}`;
      const memberCode = member.member_code || `M${member.id || index + 1}`;
      const memberStatus = member.status || 'ACTIVE';
      
      const rowHtml = `
        <tr>
          <td>${index + 1}</td>
          <td>${memberName}</td>
          <td>${memberCode}</td>
          <td>
            <span class="status status-${memberStatus.toLowerCase()}">
              ${memberStatus}
            </span>
          </td>
          <td class="amount">₹${parseFloat(member.savingsAmount || 0).toFixed(2)}</td>
          <td class="amount">₹${parseFloat(member.emiDue || 0).toFixed(2)}</td>
          <td class="amount">₹${parseFloat(member.principalAmount || 0).toFixed(2)}</td>
          <td class="amount">₹${parseFloat(member.interestAmount || 0).toFixed(2)}</td>
          <td class="amount">₹${parseFloat(member.totalEMI || 0).toFixed(2)}</td>
          <td class="amount">₹${parseFloat(member.remainingAmount || 0).toFixed(2)}</td>
        </tr>
      `;
      return rowHtml;
    }).join('');
    
    // If no table rows were generated, create a fallback
    if (!tableRows || tableRows.trim() === '') {
      const fallbackRows = `
        <tr>
          <td colspan="10" style="text-align: center; padding: 20px; color: #6b7280;">
            No member data available for printing
          </td>
        </tr>
      `;
      tableRows = fallbackRows;
    }

    // Create the print content
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Group Members Report - ${groupName}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 20px;
          }
          .header h1 {
            margin: 0;
            color: #1f2937;
            font-size: 24px;
          }
          .header p {
            margin: 5px 0 0 0;
            color: #6b7280;
            font-size: 14px;
          }
          .group-info {
            margin-bottom: 20px;
            padding: 15px;
            background-color: #f9fafb;
            border-radius: 8px;
            font-size: 14px;
          }
          .group-info h3 {
            margin: 0 0 10px 0;
            color: #374151;
            font-size: 16px;
          }
          .group-info p {
            margin: 5px 0;
            color: #6b7280;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            font-size: 12px;
          }
          th, td {
            border: 1px solid #d1d5db;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f3f4f6;
            font-weight: 600;
            color: #374151;
          }
          tr:nth-child(even) {
            background-color: #f9fafb;
          }
          .status {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 500;
          }
          .status-active { background-color: #dcfce7; color: #166534; }
          .status-pending { background-color: #fef3c7; color: #92400e; }
          .status-inactive { background-color: #f3f4f6; color: #6b7280; }
          .status-suspended { background-color: #fed7d7; color: #c53030; }
          .status-rejected { background-color: #fecaca; color: #dc2626; }
          .amount {
            text-align: right;
            font-weight: 500;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Group Members Report</h1>
          <p>Generated on ${currentDate}</p>
        </div>
        
        <div class="group-info">
          <h3>Group Information</h3>
          <p><strong>Group Name:</strong> ${groupName}</p>
          <p><strong>Location:</strong> ${groupLocation}</p>
          <p><strong>Total Members:</strong> ${printData.length}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Code</th>
              <th>Status</th>
              <th>Savings Balance</th>
              <th>EMI Due</th>
              <th>Principal</th>
              <th>Interest</th>
              <th>Total EMI</th>
              <th>Remaining Loan</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <div class="footer">
          <p>This report was generated from the Microfinance Management System</p>
          <p>Report contains ${printData.length} member(s) as of ${currentDate}</p>
        </div>
      </body>
      </html>
    `;

    // Try to create a new window for printing
    let printWindow;
    try {
      printWindow = window.open('', '_blank', 'width=800,height=600');
    } catch (error) {
      setError('Failed to create print window: ' + error.message);
      return;
    }
    
    if (!printWindow || printWindow.closed) {
      setError('Unable to open print window. Please check your popup blocker settings and allow popups for this site.');
      return;
    }

    try {
      // Write content to the new window
      printWindow.document.write(printContent);
      printWindow.document.close();
    } catch (error) {
      setError('Failed to write content to print window: ' + error.message);
      printWindow.close();
      return;
    }
    
    // Wait for content to load, then print
    setTimeout(() => {
      try {
        printWindow.focus();
        printWindow.print();
        setSuccessMessage('Print dialog opened successfully!');
      } catch (error) {
        setError('Failed to open print dialog: ' + error.message);
      }
      
      // Close the window after printing (optional)
      setTimeout(() => {
        if (printWindow && !printWindow.closed) {
          printWindow.close();
        }
      }, 2000);
    }, 1000);
  };

  const cancelPrintGroupMembers = () => {
    setShowPrintConfirmation(false);
  };

  if (loading && !stats.groups.length) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-2 sm:p-3 shadow-lg">
                <FaMoneyBillWave className="text-white text-xl sm:text-2xl" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">Bill Collector Dashboard</h1>
                <p className="text-xs sm:text-sm lg:text-base text-gray-600 mt-1 truncate">Welcome back, <span className="font-semibold text-blue-600">{user.name}</span></p>
              </div>
          </div>
          <button
            onClick={onLogout}
              className="flex items-center px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 cursor-pointer group"
          >
              <FaSignOutAlt className="mr-2 group-hover:scale-110 transition-transform duration-200" /> 
              <span className="font-medium">Logout</span>
          </button>
          </div>
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
                  className="text-red-400 hover:text-red-600 cursor-pointer"
                >
                  <FaTimesCircle className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Alert */}
      {successMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <FaCheckCircle className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <p className="text-sm text-green-800">{successMessage}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setSuccessMessage(null)}
                  className="text-green-400 hover:text-green-600 cursor-pointer"
                >
                  <FaTimesCircle className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <div className="bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-blue-100 group">
            <div className="px-3 py-4 sm:px-4 sm:py-5 lg:px-6 lg:py-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg sm:rounded-xl p-2 sm:p-3 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <FaUsers className="text-white h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
                </div>
                <div className="ml-3 sm:ml-4 w-0 flex-1 min-w-0">
                  <dl>
                    <dt className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Groups</dt>
                    <dd className="flex items-baseline">
                      <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900">{stats.assigned_groups}</div>
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="mt-3 sm:mt-4 h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"></div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-green-50 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-green-100 group">
            <div className="px-3 py-4 sm:px-4 sm:py-5 lg:px-6 lg:py-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-gradient-to-r from-green-500 to-green-600 rounded-lg sm:rounded-xl p-2 sm:p-3 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <FaMoneyBillWave className="text-white h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
                </div>
                <div className="ml-3 sm:ml-4 w-0 flex-1 min-w-0">
                  <dl>
                    <dt className="text-xs sm:text-sm font-medium text-gray-600 truncate">Today's Collection</dt>
                    <dd className="flex items-baseline">
                      <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 break-words">{formatIndianCurrency(stats.today_total)}</div>
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="mt-3 sm:mt-4 h-1 bg-gradient-to-r from-green-500 to-green-600 rounded-full"></div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-yellow-50 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-yellow-100 group">
            <div className="px-3 py-4 sm:px-4 sm:py-5 lg:px-6 lg:py-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg sm:rounded-xl p-2 sm:p-3 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <FaHandHoldingUsd className="text-white h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
                </div>
                <div className="ml-3 sm:ml-4 w-0 flex-1 min-w-0">
                  <dl>
                    <dt className="text-xs sm:text-sm font-medium text-gray-600 truncate">Month Total</dt>
                    <dd className="flex items-baseline">
                      <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 break-words">{formatIndianCurrency(stats.month_total)}</div>
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="mt-3 sm:mt-4 h-1 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full"></div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-purple-50 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-purple-100 group">
            <div className="px-3 py-4 sm:px-4 sm:py-5 lg:px-6 lg:py-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg sm:rounded-xl p-2 sm:p-3 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <FaCheckCircle className="text-white h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
                </div>
                <div className="ml-3 sm:ml-4 w-0 flex-1 min-w-0">
                  <dl>
                    <dt className="text-xs sm:text-sm font-medium text-gray-600 truncate">Pending Verifications</dt>
                    <dd className="flex items-baseline">
                      <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900">{stats.pending_verifications}</div>
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="mt-3 sm:mt-4 h-1 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Groups Section */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200">
                <div className="flex items-center">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg p-2 mr-3">
                    <FaUsers className="text-white h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Assigned Groups</h3>
                    <p className="mt-1 text-xs sm:text-sm text-gray-600 truncate">Groups you manage and collect from</p>
                  </div>
                </div>
              </div>
              {stats.groups.length > 0 ? (
                <ul className="divide-y divide-gray-100">
                  {stats.groups.map((group) => (
                    <li key={group.id} className="hover:bg-gray-50 transition-colors duration-200">
                      <div className="px-4 sm:px-6 py-4 sm:py-5">
                        <div className="flex flex-col space-y-4">
                          {/* Group Info */}
                          <div className="flex items-start space-x-3">
                            <div className="bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg p-2 flex-shrink-0">
                              <FaUsers className="h-4 w-4 text-blue-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-base sm:text-lg font-semibold text-gray-900 truncate">{group.name}</p>
                              <p className="text-xs sm:text-sm text-gray-600 flex items-center mt-1">
                                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 flex-shrink-0"></span>
                                <span className="truncate">{group.member_count} active members</span>
                              </p>
                              <p className="text-xs sm:text-sm text-gray-500 mt-1 truncate">
                                📍 {group.location}
                            </p>
                          </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                            <button 
                              onClick={async () => {
                                setSelectedGroup(group);
                                setCollectionForm(prev => ({ ...prev, group_id: group.id }));
                                setShowCollectionModal(true);
                                // Load group members when opening collection modal
                                await loadGroupMembers(group.id, false);
                              }}
                              className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer group"
                            >
                              <FaMoneyBillWave className="mr-2 group-hover:scale-110 transition-transform duration-200" />
                              Collect
                            </button>
                            <button 
                              onClick={async () => {
                                setSelectedGroup(group);
                                setShowTransactionModal(true);
                                // Load group members for transaction history display
                                await loadGroupMembers(group.id, false);
                              }}
                              className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:from-gray-200 hover:to-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer group"
                            >
                              <FaHistory className="mr-2 group-hover:scale-110 transition-transform duration-200" />
                              History
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-6 py-12 text-center">
                  <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                    <FaUsers className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No groups assigned</h3>
                  <p className="text-sm text-gray-500">You haven't been assigned to any groups yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Section */}
          <div>
            <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200">
                <div className="flex items-center">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-2 mr-3">
                    <FaHandHoldingUsd className="text-white h-4 w-4 sm:h-5 sm:w-5" />
              </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Quick Actions</h3>
                    <p className="mt-1 text-xs sm:text-sm text-gray-600 truncate">Common tasks and operations</p>
                  </div>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  <button 
                    onClick={() => {
                      setError(null); // Clear any previous errors
                      setSuccessMessage(null); // Clear any previous success messages
                      // Reset form and clear group members
                      setCollectionForm({
                        group_id: '',
                        collection_date: new Date().toISOString().split('T')[0],
                        grand_total: 0,
                        collection_items: []
                      });
                      setGroupMembers([]);
                      setShowCollectionModal(true);
                    }}
                    className="w-full flex items-center justify-center px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm sm:text-base font-semibold rounded-xl shadow-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 hover:shadow-xl cursor-pointer group"
                  >
                    <FaMoneyBillWave className="mr-2 sm:mr-3 text-lg sm:text-xl group-hover:scale-110 transition-transform duration-200" /> 
                    <span className="truncate">Collect Money</span>
                  </button>
                  <button 
                    onClick={() => {
                      setError(null); // Clear any previous errors
                      setSelectedGroup(null); // Clear selected group for general history view
                      setGroupMembers([]); // Clear group members
                      setShowTransactionModal(true);
                    }}
                    className="w-full flex items-center justify-center px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 text-sm sm:text-base font-semibold rounded-xl shadow-md hover:from-gray-200 hover:to-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 hover:shadow-lg cursor-pointer group"
                  >
                    <FaHistory className="mr-2 sm:mr-3 text-lg sm:text-xl group-hover:scale-110 transition-transform duration-200" /> 
                    <span className="truncate">View Transaction History</span>
                  </button>
                  <button 
                    onClick={() => {
                      setError(null); // Clear any previous errors
                      setShowLoanModal(true);
                    }}
                    className="w-full flex items-center justify-center px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 text-sm sm:text-base font-semibold rounded-xl shadow-md hover:from-purple-200 hover:to-purple-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 hover:shadow-lg cursor-pointer group"
                  >
                    <FaHandHoldingUsd className="mr-2 sm:mr-3 text-lg sm:text-xl group-hover:scale-110 transition-transform duration-200" /> 
                    <span className="truncate">Raise Loan Request</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Collections */}
            <div className="mt-4 sm:mt-6 bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200">
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200">
                <div className="flex items-center">
                  <div className="bg-gradient-to-r from-orange-500 to-amber-600 rounded-lg p-2 mr-3">
                    <FaHistory className="text-white h-4 w-4 sm:h-5 sm:w-5" />
              </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Recent Collections</h3>
                    <p className="mt-1 text-xs sm:text-sm text-gray-600 truncate">Latest collection records</p>
                  </div>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                {collections.slice(0, 3).length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                    {collections.slice(0, 3).map((collection) => (
                      <div key={collection.id} className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-3 sm:p-4 border border-gray-200 hover:shadow-md transition-all duration-200">
                        <div className="flex flex-col space-y-3">
                          <div className="flex items-start space-x-3">
                            <div className="bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg p-2 flex-shrink-0">
                              <FaMoneyBillWave className="h-4 w-4 text-blue-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                            {collection.group?.name || 'Unknown Group'}
                          </p>
                              <p className="text-xs sm:text-sm text-gray-600 flex items-center mt-1">
                                <span className="mr-2">📅</span>
                                <span className="truncate">{new Date(collection.collection_date).toLocaleDateString()}</span>
                          </p>
                        </div>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                            <div className="flex-1">
                              <p className="text-lg sm:text-xl font-bold text-green-600 break-words">
                            {formatIndianCurrency(collection.grand_total)}
                          </p>
                              <p className="text-xs text-gray-500 truncate">
                            Receipt: {getReceiptNumber(collection)}
                          </p>
                            </div>
                            <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold w-fit ${
                            collection.is_verified 
                                ? 'bg-green-100 text-green-800 border border-green-200' 
                                : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                          }`}>
                              {collection.is_verified ? '✅ Verified' : '⏳ Pending'}
                          </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                      <FaHistory className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No recent collections</h3>
                    <p className="text-sm text-gray-500">Start collecting to see your recent activity here.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Collection Modal */}
      {showCollectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl border border-gray-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg p-2">
                    <FaMoneyBillWave className="text-white h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">Create Collection Record</h3>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1 truncate">Record payments collected from group members</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCollectionModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200 cursor-pointer flex-shrink-0"
                >
                  <FaTimesCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>
            </div>
            {/* Form Content */}
            <div className="p-4 sm:p-6 max-h-96 overflow-y-auto">
              <form onSubmit={handleCollectionSubmit} className="space-y-6 sm:space-y-8">
                {/* Basic Information */}
                <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                  <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Basic Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Select Group</label>
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
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 font-medium cursor-pointer text-sm sm:text-base"
                        required
                      >
                        <option value="">🏢 Select Group</option>
                        {stats.groups.map(group => (
                          <option key={group.id} value={group.id}>{group.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Collection Date</label>
                      <input
                        type="date"
                        value={collectionForm.collection_date}
                        onChange={(e) => setCollectionForm(prev => ({ ...prev, collection_date: e.target.value }))}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 font-medium cursor-pointer text-sm sm:text-base"
                        required
                      />
                    </div>
                  </div>
                </div>


                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-800">Collection Items</h3>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">Add members and specify their payment amounts</p>
                    </div>
                    <button
                      type="button"
                      onClick={addCollectionItem}
                      className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 sm:py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer"
                    >
                      <FaPlus className="mr-2 w-4 h-4" /> 
                      <span className="hidden sm:inline">Add Collection Item</span>
                      <span className="sm:hidden">Add Item</span>
                    </button>
                  </div>
                  
                  {collectionForm.collection_items.map((item, index) => {
                    const selectedMember = getMemberById(item.member_id);
                    const dueAmount = selectedMember ? parseFloat(calculateEMIDue(selectedMember, selectedMember.loan_info)) : 0;
                    const amountPaid = parseFloat(item.amount || 0);
                    const remaining = dueAmount - amountPaid;
                    
                    // Calculate EMI breakdown
                    const emiBreakdown = selectedMember && selectedMember.loan_info ? calculateEMIBreakdown(selectedMember, selectedMember.loan_info) : null;
                    
                    return (
                      <div key={index} className="bg-white border-2 border-gray-200 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 shadow-lg hover:shadow-xl transition-all duration-200">
                        {/* Header with Member Selection and Remove Button */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
                          <div className="flex-1 min-w-0">
                            <label className="block text-sm font-semibold text-gray-800 mb-2">
                              Collection Item #{index + 1}
                            </label>
                            <select
                              value={item.member_id}
                              onChange={(e) => updateCollectionItem(index, 'member_id', e.target.value)}
                              className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 font-medium cursor-pointer text-sm sm:text-base"
                              required
                              disabled={loadingMembers}
                            >
                            <option value="">
                                {loadingMembers ? 'Loading members...' : '👤 Select Member'}
                            </option>
                            {groupMembers.map(member => (
                              <option 
                                key={member.id} 
                                value={member.id}
                              >
                                {member.user?.full_name || member.member_code} ({member.member_code})
                              </option>
                            ))}
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeCollectionItem(index)}
                            className="w-full sm:w-auto sm:ml-4 p-2 sm:p-3 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer flex items-center justify-center sm:justify-start"
                            title="Remove this collection item"
                          >
                            <FaTimesCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-0" />
                            <span className="sm:hidden text-sm font-medium">Remove Item</span>
                          </button>
                        </div>

                        {/* Member Information Card */}
                        {selectedMember && (
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-5 mb-4 sm:mb-6 border border-blue-200">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-3 sm:space-y-0">
                              <div className="min-w-0 flex-1">
                                <h3 className="text-lg sm:text-xl font-bold text-gray-800 truncate">
                                  {selectedMember.user?.full_name || selectedMember.member_code}
                                </h3>
                                <p className="text-sm text-gray-600">Member Code: {selectedMember.member_code}</p>
                              </div>
                              <div className="text-left sm:text-right">
                                <div className="text-xs sm:text-sm text-gray-500">Interest Rate</div>
                                <div className="text-base sm:text-lg font-bold text-blue-600">
                                  {selectedMember.loan_info?.interest_rate || 12.0}% p.a.
                                </div>
                              </div>
                            </div>

                            {/* Quick Action Buttons */}
                            <div className="flex flex-wrap gap-2 mb-4">
                              {selectedMember.loan_info && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const breakdown = calculateEMIBreakdown(selectedMember, selectedMember.loan_info);
                                    updateCollectionItem(index, 'principal_amount', breakdown.principal.toFixed(2));
                                    updateCollectionItem(index, 'interest_amount', breakdown.interest.toFixed(2));
                                  }}
                                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium cursor-pointer"
                                >
                                  💰 Fill EMI Amounts
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  updateCollectionItem(index, 'deposit_amount', '100');
                                }}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium cursor-pointer"
                              >
                                💳 Add ₹100 Deposit
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  updateCollectionItem(index, 'principal_amount', '');
                                  updateCollectionItem(index, 'interest_amount', '');
                                  updateCollectionItem(index, 'deposit_amount', '');
                                  updateCollectionItem(index, 'joining_fee', '');
                                }}
                                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium cursor-pointer"
                              >
                                🗑️ Clear All
                              </button>
                            </div>

                            {/* Member Financial Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {/* Loan Summary */}
                              {selectedMember.loan_info ? (
                                <div className="bg-white rounded-lg p-4 border border-orange-200">
                                  <div className="flex items-center mb-2">
                                    <span className="w-3 h-3 bg-orange-500 rounded-full mr-2"></span>
                                    <span className="font-semibold text-gray-800">Active Loan</span>
                                  </div>
                                  <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Principal:</span>
                                      <span className="font-medium">{formatIndianCurrency(selectedMember.loan_info.loan_amount || 0)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Paid:</span>
                                      <span className="font-medium text-green-600">{formatIndianCurrency(selectedMember.payments_made || 0)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Remaining:</span>
                                      <span className="font-medium text-orange-600">{formatIndianCurrency(selectedMember.remaining_loan_amount || 0)}</span>
                                    </div>
                                    <div className="flex justify-between border-t pt-1">
                                      <span className="text-gray-600">This Month EMI:</span>
                                      <span className="font-bold text-blue-600">{formatIndianCurrency(selectedMember.current_emi_due || 0)}</span>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-gray-100 rounded-lg p-4 text-center">
                                  <div className="text-gray-500 text-sm">
                                    {selectedMember.loan_info ? 
                                      `Loan Status: ${selectedMember.loan_info.status}` : 
                                      'No Active Loan'
                                    }
                                  </div>
                                </div>
                              )}

                                    {/* Savings Summary */}
                                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                                      <div className="flex items-center mb-2">
                                        <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                                        <span className="font-semibold text-gray-800">Savings</span>
                                      </div>
                                      <div className="text-center">
                                        <div className="text-2xl font-bold text-blue-600 mb-1">
                                          {formatIndianCurrency(selectedMember.savings_balance || 0)}
                                        </div>
                                        <div className="text-xs text-gray-500 mb-2">Available Balance</div>
                                        <div className="text-xs text-green-600">
                                          Interest Rate: {selectedMember.savings_interest_rate || 3.0}% p.a.
                                        </div>
                                        {selectedMember.first_deposit_date && (
                                          <div className="text-xs text-gray-500 mt-1">
                                            First Deposit: {new Date(selectedMember.first_deposit_date).toLocaleDateString()}
                                          </div>
                                        )}
                                        {selectedMember.total_interest_earned > 0 && (
                                          <div className="text-xs text-green-600 mt-1">
                                            Interest Earned: {formatIndianCurrency(selectedMember.total_interest_earned)}
                                          </div>
                                        )}
                                      </div>
                                    </div>

                              {/* EMI Breakdown */}
                              {emiBreakdown && (
                                <div className="bg-white rounded-lg p-4 border border-green-200">
                                  <div className="flex items-center mb-2">
                                    <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                                    <span className="font-semibold text-gray-800">EMI Breakdown</span>
                                  </div>
                                  <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Principal:</span>
                                      <span className="font-medium">{formatIndianCurrency(emiBreakdown.principal)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Interest:</span>
                                      <span className="font-medium">{formatIndianCurrency(emiBreakdown.interest)}</span>
                                    </div>
                                    <div className="flex justify-between border-t pt-1">
                                      <span className="text-gray-600">Total EMI:</span>
                                      <span className="font-bold text-green-600">{formatIndianCurrency(dueAmount)}</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Carry Forward Warning */}
                            {selectedMember.carry_forward_amount > 0 && (
                              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                                <div className="flex items-center text-red-700">
                                  <span className="mr-2">⚠️</span>
                                  <span className="font-medium">Carry Forward Amount: {formatIndianCurrency(selectedMember.carry_forward_amount)}</span>
                                </div>
                              </div>
                            )}

                            {/* Partial Payment Warning */}
                            {selectedMember && selectedMember.loan_info && (() => {
                              const totalLoanPayment = parseFloat(item.principal_amount || 0) + parseFloat(item.interest_amount || 0);
                              const totalDue = selectedMember.current_emi_due || 0;
                              const carryForward = selectedMember.carry_forward_amount || 0;
                              const totalDueWithCarryForward = totalDue + carryForward;
                              const remainingAfterPayment = totalDueWithCarryForward - totalLoanPayment;
                              
                              // Check if loan is active for EMI calculation
                              const isLoanActiveForEMI = selectedMember.loan_info.status === 'ACTIVE' || 
                                                         selectedMember.loan_info.status === 'DISBURSED' || 
                                                         selectedMember.loan_info.status === 'APPROVED';
                              
                              
                              // Only show partial payment warning if:
                              // 1. There's a loan payment being made
                              // 2. The total due is greater than 0 (loan is active for EMI calculation)
                              // 3. The remaining amount is greater than 0.01 (to avoid floating point precision issues)
                              // 4. The loan is active for EMI calculation
                              if (totalLoanPayment > 0 && totalDueWithCarryForward > 0 && remainingAfterPayment > 0.01 && isLoanActiveForEMI) {
                                return (
                                  <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                    <div className="flex items-center text-yellow-700">
                                      <span className="mr-2">💡</span>
                                      <div>
                                        <div className="font-medium">Partial Payment Detected</div>
                                        <div className="text-sm">
                                          Remaining amount ({formatIndianCurrency(remainingAfterPayment)}) will be carried forward to next month
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                              
                              // Show info message for loans not active for EMI calculation
                              if (totalLoanPayment > 0 && !isLoanActiveForEMI) {
                                return (
                                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <div className="flex items-center text-blue-700">
                                      <span className="mr-2">ℹ️</span>
                                      <div>
                                        <div className="font-medium">Manual Payment</div>
                                        <div className="text-sm">
                                          This is a manual payment for a {selectedMember.loan_info.status} loan. No EMI calculation applies.
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                              
                              return null;
                            })()}
                          </div>
                        )}

                        {/* Collection Form */}
                        {selectedMember && (
                          <div className="space-y-6">
                            {/* Payment Inputs */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Loan Payments */}
                              {selectedMember.loan_info && (
                                <div className="bg-orange-50 rounded-xl p-5 border border-orange-200">
                                  <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                                    <span className="w-4 h-4 bg-orange-500 rounded-full mr-3"></span>
                                    Loan Payments
                                  </h4>
                                  
                                  <div className="space-y-4">
                                    {/* Principal Amount */}
                                    <div>
                                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Principal Amount
                                      </label>
                                      <div className="relative">
                                        <input
                                          type="number"
                                          placeholder="0.00"
                                          value={item.principal_amount || ''}
                                          onChange={(e) => updateCollectionItem(index, 'principal_amount', e.target.value)}
                                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-lg font-medium"
                                          step="0.01"
                                          min="0"
                                        />
                                        <div className="absolute right-3 top-3 text-sm text-gray-500">
                                          Due: {formatIndianCurrency(emiBreakdown?.principal || 0)}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Interest Amount */}
                                    <div>
                                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Interest Amount
                                      </label>
                                      <div className="relative">
                                        <input
                                          type="number"
                                          placeholder="0.00"
                                          value={item.interest_amount || ''}
                                          onChange={(e) => updateCollectionItem(index, 'interest_amount', e.target.value)}
                                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-lg font-medium"
                                          step="0.01"
                                          min="0"
                                        />
                                        <div className="absolute right-3 top-3 text-sm text-gray-500">
                                          Due: {formatIndianCurrency(emiBreakdown?.interest || 0)}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Savings & Fees */}
                              <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
                                <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                                  <span className="w-4 h-4 bg-blue-500 rounded-full mr-3"></span>
                                  Savings & Fees
                                </h4>
                                
                                <div className="space-y-4">
                                  {/* Deposit Amount */}
                                  <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                      Deposit Amount
                                    </label>
                                    <div className="relative">
                                      <input
                                        type="number"
                                        placeholder="0.00"
                                        value={item.deposit_amount || ''}
                                        onChange={(e) => updateCollectionItem(index, 'deposit_amount', e.target.value)}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-medium"
                                        step="0.01"
                                        min="0"
                                      />
                                      <div className="absolute right-3 top-3 text-sm text-gray-500">
                                        Balance: {formatIndianCurrency(selectedMember.savings_balance || 0)}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Joining Fee */}
                                  <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                      Joining Fee (One-time)
                                    </label>
                                    <input
                                      type="number"
                                      placeholder="0.00"
                                      value={item.joining_fee || ''}
                                      onChange={(e) => updateCollectionItem(index, 'joining_fee', e.target.value)}
                                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-medium"
                                      step="0.01"
                                      min="0"
                                    />
                                  </div>

                                  {/* Share Capital */}
                                  <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                      Share Capital
                                    </label>
                                    <input
                                      type="number"
                                      placeholder="0.00"
                                      value={item.share_capital || ''}
                                      onChange={(e) => updateCollectionItem(index, 'share_capital', e.target.value)}
                                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-medium"
                                      step="0.01"
                                      min="0"
                                    />
                                  </div>

                                  {/* LRF */}
                                  <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                      LRF (Loan Recovery Fund)
                                    </label>
                                    <input
                                      type="number"
                                      placeholder="0.00"
                                      value={item.lrf || ''}
                                      onChange={(e) => updateCollectionItem(index, 'lrf', e.target.value)}
                                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-medium"
                                      step="0.01"
                                      min="0"
                                    />
                                  </div>

                                  {/* Savings Information */}
                                  <div className="bg-blue-50 p-3 rounded-lg mt-4">
                                    <div className="text-sm text-blue-800">
                                      <div className="font-semibold mb-1">💰 Savings Information:</div>
                                      <div className="text-xs space-y-1">
                                        <div>• Interest Rate: 3% per annum (compounded monthly)</div>
                                        <div>• Withdrawal Rule: Minimum 9 months from first deposit</div>
                                        <div>• Interest is calculated and added monthly</div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Total Amount Summary */}
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                              <div className="flex justify-between items-center">
                                <div>
                                  <h4 className="text-lg font-bold text-gray-800">Total Collection Amount</h4>
                                  <p className="text-sm text-gray-600">Sum of all payments for this member</p>
                                </div>
                                <div className="text-right">
                                  <div className="text-3xl font-bold text-green-600">
                                    {formatIndianCurrency(calculateTotalCollectionAmount(item))}
                                  </div>
                                </div>
                          </div>
                        </div>
                        
                        {/* Hidden fields for backend compatibility */}
                        <input
                          type="hidden"
                              value={item.payment_type || 'MIXED'}
                          onChange={(e) => updateCollectionItem(index, 'payment_type', e.target.value)}
                        />
                        <input
                          type="hidden"
                              value={item.loan_id || selectedMember.loan_info?.id || ''}
                          onChange={(e) => updateCollectionItem(index, 'loan_id', e.target.value)}
                        />
                            <input
                              type="hidden"
                              value={calculateTotalCollectionAmount(item)}
                              onChange={(e) => updateCollectionItem(index, 'amount', e.target.value)}
                            />
                              </div>
                            )}

                        {/* No Member Selected State */}
                        {!selectedMember && (
                          <div className="text-center py-12">
                            <div className="text-6xl mb-4">👤</div>
                            <h3 className="text-xl font-semibold text-gray-600 mb-2">Select a Member</h3>
                            <p className="text-gray-500">Choose a member from the dropdown above to start collecting payments</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Group Members Summary - Simple Version */}
                {collectionForm.group_id && (
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-medium text-gray-800">Group Members</h4>
                      <div className="flex items-center space-x-3">
                        <div className="text-sm text-gray-600">
                          {groupMembers.length} member{groupMembers.length !== 1 ? 's' : ''}
                        </div>
                        <button
                          type="button"
                          onClick={handlePrintGroupMembers}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                          Print
                        </button>
                      </div>
                    </div>
                    
                    {loadingMembers ? (
                      <div className="text-center text-gray-500 py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                        Loading...
                      </div>
                    ) : groupMembers.length > 0 ? (
                      <div className="bg-white shadow rounded-lg overflow-hidden">
                        {/* Desktop Table */}
                        <div className="hidden lg:block overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Name
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Code
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  EMI Breakdown
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Paid
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Remaining
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Savings
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Payment Status
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Action
                                </th>
                              </tr>
                            </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {groupMembers.map(member => {
                              const hasActiveLoan = member.loan_info && (member.loan_info.status === 'ACTIVE' || member.loan_info.status === 'DISBURSED' || member.loan_info.status === 'APPROVED');
                              const remainingAmount = member.remaining_loan_amount || 0;
                              const paidAmount = member.payments_made || 0;
                              const savingsAmount = member.savings_balance || 0;
                              const emiDue = member.current_emi_due || 0;
                              const emiBreakdown = calculateEMIBreakdown(member, member.loan_info);
                              const principalAmount = emiBreakdown.principal || 0;
                              const interestAmount = emiBreakdown.interest || 0;
                              const totalEMI = emiDue || 0;
                              
                              // Check if member has already paid this month (for display purposes only)
                              const hasPaidThisMonth = hasMemberPaidThisMonth(member);
                              
                              // Members can always pay (multiple payments per month allowed)
                              const canPay = true;
                              
                              return (
                                <tr key={member.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">
                                      {member.user?.full_name || 'N/A'}
                                    </div>
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500">
                                      {member.member_code}
                                    </div>
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    {hasActiveLoan ? (
                                      <div className="text-xs">
                                        <div className="text-gray-600">
                                          Total: {formatIndianCurrency(totalEMI)}
                                        </div>
                                        <div className="text-gray-500">
                                          Principal: {formatIndianCurrency(principalAmount)}
                                        </div>
                                        <div className="text-gray-500">
                                          Interest: {formatIndianCurrency(interestAmount)}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="text-xs text-gray-400">
                                        {member.loan_info ? 
                                          `Loan Status: ${member.loan_info.status}` : 
                                          'No Active Loan'
                                        }
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    <div className="text-sm text-green-600 font-medium">
                                      {formatIndianCurrency(paidAmount)}
                                    </div>
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    <div className="text-sm text-red-600 font-medium">
                                      {formatIndianCurrency(remainingAmount)}
                                    </div>
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    <div className="text-sm text-blue-600 font-medium">
                                      {formatIndianCurrency(savingsAmount)}
                                    </div>
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    {hasActiveLoan ? (
                                      hasPaidThisMonth ? (
                                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                          EMI Paid
                                        </span>
                                      ) : (
                                        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                                          EMI Due
                                        </span>
                                      )
                                    ) : (
                                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                        Savings Only
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (isMemberInCollection(member.id)) {
                                          setError('This member is already added to the collection');
                                          return;
                                        }
                                        addCollectionItem(member.id);
                                      }}
                                      disabled={isMemberInCollection(member.id)}
                                      className={`px-3 py-1 text-sm rounded ${
                                        isMemberInCollection(member.id)
                                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                          : 'bg-blue-600 text-white hover:bg-blue-700'
                                      }`}
                                    >
                                      {isMemberInCollection(member.id) ? 'Added' : 'Add'}
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          </table>
                        </div>
                        
                        {/* Mobile Cards */}
                        <div className="lg:hidden space-y-4 p-4">
                          {groupMembers.map(member => {
                            const hasActiveLoan = member.loan_info && (member.loan_info.status === 'ACTIVE' || member.loan_info.status === 'DISBURSED' || member.loan_info.status === 'APPROVED');
                            const remainingAmount = member.remaining_loan_amount || 0;
                            const paidAmount = member.payments_made || 0;
                            const savingsAmount = member.savings_balance || 0;
                            const emiDue = member.current_emi_due || 0;
                            const emiBreakdown = calculateEMIBreakdown(member, member.loan_info);
                            const principalAmount = emiBreakdown.principal || 0;
                            const interestAmount = emiBreakdown.interest || 0;
                            const totalEMI = emiDue || 0;
                            
                            // Check if member has already paid this month (for display purposes only)
                            const hasPaidThisMonth = hasMemberPaidThisMonth(member);
                            // Members can always pay (multiple payments per month allowed)
                            const canPay = true;
                            
                            return (
                              <div key={member.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                                      <span className="text-xs sm:text-sm font-medium text-gray-500">{member.member_code}</span>
                                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium w-fit ${
                                        hasPaidThisMonth ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                                      }`}>
                                        {hasPaidThisMonth ? 'Paid This Month' : 'Can Pay'}
                                      </span>
                                    </div>
                                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 break-words">
                                      {member.user?.full_name || 'N/A'}
                                    </h3>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => addCollectionItem(member.id)}
                                    className="p-2 rounded-full transition-colors text-blue-600 hover:bg-blue-50 cursor-pointer"
                                  >
                                    <FaPlus className="w-4 h-4" />
                                  </button>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                                  {hasActiveLoan ? (
                                    <>
                                      <div>
                                        <span className="text-gray-500">EMI Total:</span>
                                        <p className="font-medium text-gray-900">{formatIndianCurrency(totalEMI)}</p>
                                      </div>
                                      <div>
                                        <span className="text-gray-500">Principal:</span>
                                        <p className="font-medium text-gray-900">{formatIndianCurrency(principalAmount)}</p>
                                      </div>
                                      <div>
                                        <span className="text-gray-500">Interest:</span>
                                        <p className="font-medium text-gray-900">{formatIndianCurrency(interestAmount)}</p>
                                      </div>
                                      <div>
                                        <span className="text-gray-500">Paid:</span>
                                        <p className="font-medium text-gray-900">{formatIndianCurrency(paidAmount)}</p>
                                      </div>
                                      <div>
                                        <span className="text-gray-500">Remaining:</span>
                                        <p className="font-medium text-gray-900">{formatIndianCurrency(remainingAmount)}</p>
                                      </div>
                                      <div>
                                        <span className="text-gray-500">Savings:</span>
                                        <p className="font-medium text-gray-900">{formatIndianCurrency(savingsAmount)}</p>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <div>
                                        <span className="text-gray-500">Savings Balance:</span>
                                        <p className="font-medium text-gray-900">{formatIndianCurrency(savingsAmount)}</p>
                                      </div>
                                      <div>
                                        <span className="text-gray-500">Status:</span>
                                        <p className="font-medium text-gray-900">No Active Loan</p>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-4">
                        <p>No members found for this group</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Total Summary */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                  <div className="flex items-center justify-between">
                <div>
                      <h4 className="text-xl font-bold text-gray-800">Total Collection Amount</h4>
                      <p className="text-gray-600 mt-1">Automatically calculated from all collection items</p>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-bold text-green-600">
                        {formatIndianCurrency(collectionForm.grand_total || 0)}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {collectionForm.collection_items.length} item{collectionForm.collection_items.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-4 sm:pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowCollectionModal(false)}
                    className="w-full sm:w-auto px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingCollection || collectionForm.collection_items.length === 0}
                    className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer"
                  >
                    {isSubmittingCollection ? (
                      <span className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating Collection...
                      </span>
                    ) : (
                      'Create Collection Record'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Transaction History Modal */}
      {showTransactionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-gray-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-5 border-b border-gray-200 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg p-2">
                    <FaHistory className="text-white h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                  Transaction History
                  {selectedGroup && ` - ${selectedGroup.name}`}
                </h3>
                    <p className="text-sm text-gray-600 mt-1">View all collection transactions</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTransactionModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200 cursor-pointer"
                >
                  <FaTimesCircle className="h-6 w-6" />
                </button>
              </div>
              </div>
              
            {/* Content */}
            <div className="p-6 max-h-96 overflow-y-auto">
                {loadingMembers ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-500 text-lg">Loading transaction history...</p>
                  </div>
                ) : collections.length > 0 ? (
                <div className="space-y-4">
                    {collections
                      .filter(c => !selectedGroup || c.group_id === selectedGroup.id)
                      .map((collection) => (
                      <div key={collection.id} className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-200">
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between space-y-4 lg:space-y-0">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <div className="bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg p-2">
                                <FaMoneyBillWave className="h-4 w-4 text-blue-600" />
                              </div>
                            <div>
                                <p className="text-lg font-semibold text-gray-900">
                                {collection.group?.name || 'Unknown Group'}
                              </p>
                                <p className="text-sm text-gray-600 flex items-center mt-1">
                                  <span className="mr-2">📅</span>
                                {new Date(collection.collection_date).toLocaleDateString()}
                              </p>
                              </div>
                            </div>
                              {collection.notes && (
                              <div className="bg-white rounded-lg p-3 border border-gray-200">
                                <p className="text-sm text-gray-700">
                                  <span className="font-medium">Notes:</span> {collection.notes}
                                </p>
                              </div>
                              )}
                            </div>
                          <div className="flex flex-col lg:items-end space-y-3">
                            <div className="text-right">
                              <p className="text-2xl font-bold text-green-600">
                                {formatIndianCurrency(collection.grand_total)}
                              </p>
                              <p className="text-sm text-gray-500">
                                Receipt: {getReceiptNumber(collection)}
                              </p>
                            </div>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                collection.is_verified 
                                ? 'bg-green-100 text-green-800 border border-green-200' 
                                : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                              }`}>
                              {collection.is_verified ? '✅ Verified' : '⏳ Pending'}
                              </span>
                            </div>
                          </div>
                          
                          {collection.collection_items && collection.collection_items.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                              <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                                <span className="mr-2">📋</span>
                                Collection Items ({collection.collection_items.length})
                              </p>
                              <div className="overflow-x-auto">
                                <table className="w-full">
                                  <thead>
                                    <tr className="border-b border-gray-200">
                                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase">Member</th>
                                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase">Transaction</th>
                                      <th className="text-right py-2 px-3 text-xs font-semibold text-gray-600 uppercase">Amount</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {collection.collection_items.map((item, index) => (
                                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-2 px-3 text-sm font-semibold text-gray-700">
                                          {item.member?.user?.full_name || item.member?.member_code || `Member ${item.member_id}`}
                                        </td>
                                        <td className="py-2 px-3 text-sm font-semibold text-gray-700">
                                          {formatPaymentType(item.payment_type)}
                                        </td>
                                        <td className="py-2 px-3 text-sm font-bold text-green-600 text-right">
                                          {formatIndianCurrency(item.amount)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                          )}
                        </div>
                      ))}
                  </div>
                ) : (
                <div className="text-center py-12">
                  <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                    <FaHistory className="h-8 w-8 text-gray-400" />
              </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No transaction history</h3>
                  <p className="text-sm text-gray-500">No collections found for this group.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Loan Request Modal */}
      {showLoanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-5 border-b border-gray-200 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg p-2">
                    <FaHandHoldingUsd className="text-white h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Create Loan Request</h3>
                    <p className="text-sm text-gray-600 mt-1">Submit a new loan request for a member</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowLoanModal(false);
                    resetLoanRequestForm();
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200 cursor-pointer"
                >
                  <FaTimesCircle className="h-6 w-6" />
                </button>
              </div>
            </div>
            {/* Form Content */}
            <div className="p-6">
              <form onSubmit={handleLoanRequestSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                      <span className="mr-2">🏢</span>
                      Group
                    </label>
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
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-700 font-medium cursor-pointer transition-all duration-200"
                      required
                    >
                      <option value="">🏢 Select Group</option>
                      {stats.groups.map(group => (
                        <option key={group.id} value={group.id}>{group.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                      <span className="mr-2">👤</span>
                      Member
                    </label>
                    <select
                      value={collectionForm.member_id}
                      onChange={(e) => setCollectionForm(prev => ({ ...prev, member_id: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-700 font-medium cursor-pointer transition-all duration-200"
                      required
                      disabled={loadingMembers}
                    >
                      <option value="">
                        {loadingMembers ? '⏳ Loading members...' : '👤 Select Member'}
                      </option>
                      {groupMembers.map(member => (
                        <option key={member.id} value={member.id}>
                          {member.user?.full_name || member.member_code}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                      <span className="mr-2">💰</span>
                      Requested Amount
                    </label>
                    <input
                      type="number"
                      value={collectionForm.requested_amount}
                      onChange={(e) => setCollectionForm(prev => ({ ...prev, requested_amount: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-700 font-medium transition-all duration-200"
                      step="0.01"
                      placeholder="Enter loan amount"
                      required
                    />
                  </div>
                  <div>
                    <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                      <span className="mr-2">📅</span>
                      Term (Months)
                    </label>
                    <input
                      type="number"
                      value={collectionForm.term_months}
                      onChange={(e) => setCollectionForm(prev => ({ ...prev, term_months: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-700 font-medium transition-all duration-200"
                      min="1"
                      max="120"
                      placeholder="Loan term in months"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    <span className="mr-2">📝</span>
                    Purpose
                  </label>
                  <textarea
                    value={collectionForm.purpose}
                    onChange={(e) => setCollectionForm(prev => ({ ...prev, purpose: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-700 font-medium transition-all duration-200 resize-none"
                    placeholder="Describe the purpose of the loan (optional)"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowLoanModal(false);
                      resetLoanRequestForm();
                    }}
                    className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 text-base font-semibold rounded-xl hover:from-gray-200 hover:to-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingLoan}
                    className={`w-full sm:w-auto px-6 py-3 text-base font-semibold rounded-xl flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl ${
                      isSubmittingLoan 
                        ? 'bg-gradient-to-r from-purple-400 to-indigo-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 cursor-pointer'
                    }`}
                  >
                    {isSubmittingLoan && (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    )}
                    <span className="text-white">
                      {isSubmittingLoan ? 'Creating Request...' : 'Create Loan Request'}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Print Confirmation Modal */}
      {showPrintConfirmation && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Print Group Members Report</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Do you want to print the current group members data? This will include all {groupMembers.length} member(s) with their EMI details and financial information.
                </p>
                <div className="flex justify-center space-x-3">
                  <button
                    type="button"
                    onClick={cancelPrintGroupMembers}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={(e) => confirmPrintGroupMembers(e)}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors cursor-pointer"
                  >
                    Yes, Print
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BillCollectorDashboard;