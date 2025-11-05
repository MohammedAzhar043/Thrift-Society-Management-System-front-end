import { useState, useEffect } from "react";
import { toast, Toaster } from "react-hot-toast";
import { FaCheck, FaFileAlt,FaTimes, FaEdit, FaTrash, FaEye, FaUsers, FaPlus, FaMapMarkerAlt,FaInfoCircle, FaUserTie, FaDownload, FaMoneyBillWave, FaHistory, FaSync, FaFileDownload, FaSearch, FaFilter, FaCalendarAlt, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import apiService from "../services/api";
import { useDashboardData } from "../hooks/useDashboardData";
import { formatIndianCurrency } from "../utils/formatters";
import useFormSubmission from "../hooks/useFormSubmission";
import {
  DashboardHeader,
  StatsCards,
  QuickActions,
  Card,
  SectionHeader,
  SectionContent,
  Button,
  Table,
  CreateGroupModal,
  UserManagementModal,
  generateCSV,
  downloadCSV,
  generateFilename,
} from "./admin";
import PayableManagement from "./admin/PayableManagement";
import MemberStatementModal from "./admin/MemberStatementModal";
import ReportsModal from "./admin/ReportsModal";

function AdminDashboard({ user, onLogout }) {
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [groups, setGroups] = useState([]);
  const [members, setMembers] = useState([]);
  const [loans, setLoans] = useState([]);
  const [teamLeaders, setTeamLeaders] = useState([]);
  const [billCollectors, setBillCollectors] = useState([]);
  const [error, setError] = useState("");

  // Use custom hook for dashboard data
  const {
    data: dashboardStats,
    loading: isLoading,
    refreshData: refreshDashboard,
  } = useDashboardData("admin");

  // Form submission hooks
  const {
    isSubmitting: isCreatingGroup,
    submitForm: submitGroupForm,
    resetForm: resetGroupForm,
  } = useFormSubmission();
  const {
    isSubmitting: isUpdatingGroup,
    submitForm: submitUpdateGroupForm,
    resetForm: resetUpdateGroupForm,
  } = useFormSubmission();
  const {
    isSubmitting: isDeletingGroup,
    submitForm: submitDeleteGroupForm,
    resetForm: resetDeleteGroupForm,
  } = useFormSubmission();
  
  // Track which specific group is being deleted
  const [deletingGroupId, setDeletingGroupId] = useState(null);
  const {
    isSubmitting: isGeneratingReport,
    submitForm: submitGenerateReportForm,
  } = useFormSubmission();

  // Modal states
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showUserManagementModal, setShowUserManagementModal] = useState(false);
  const [showPayableManagement, setShowPayableManagement] = useState(false);
  const [selectedLoanForApproval, setSelectedLoanForApproval] = useState(null);
  const [interestRate, setInterestRate] = useState("");
  const [showInterestRateModal, setShowInterestRateModal] = useState(false);
  const [showMemberStatement, setShowMemberStatement] = useState(false);
  const [selectedMemberForStatement, setSelectedMemberForStatement] = useState(null);
  const [showPrintConfirmation, setShowPrintConfirmation] = useState(false);
  
  // Transaction History states
  const [collections, setCollections] = useState([]);
  const [loadingCollections, setLoadingCollections] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalCollections, setTotalCollections] = useState(0);
  
  // Filter states
  const [filters, setFilters] = useState({
    group_id: '',
    start_date: '',
    end_date: '',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Edit collection states
  const [showEditCollectionModal, setShowEditCollectionModal] = useState(false);
  const [selectedCollectionForEdit, setSelectedCollectionForEdit] = useState(null);
  const [collectionItems, setCollectionItems] = useState([]);
  const [editingCollection, setEditingCollection] = useState(false);
  
  // Receipt modal states
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState(null);
  const [receiptFileName, setReceiptFileName] = useState('');
 // const [showReportsModal, setShowReportsModal] = useState(false);

  // Form states
  const [groupForm, setGroupForm] = useState({
    name: "",
    location: "",
    bill_collector_name: "",
  });

  // Reports state
  const [reportType, setReportType] = useState("members");
  const [reportDate, setReportDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [isRefreshingReports, setIsRefreshingReports] = useState(false);

  // Members filter state
  const [memberFilter, setMemberFilter] = useState("");
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [groupFilter, setGroupFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  useEffect(() => {
    loadAdditionalData();
    loadUsers();
    loadAdminTransactionHistory(1, true);
  }, []);

  useEffect(() => {
    let filtered = members;

    // Text search filter
    if (memberFilter.trim() !== "") {
      const searchTerm = memberFilter.toLowerCase();
      filtered = filtered.filter((member) => {
        const memberName = (
          member.user?.full_name ||
          member.user?.username ||
          ""
        ).toLowerCase();
        const memberEmail = (member.user?.email || "").toLowerCase();
        const groupName = (member.group?.name || "").toLowerCase();
        const location = (member.group?.location || "").toLowerCase();
        const memberCode = (member.member_code || "").toLowerCase();

        return (
          memberName.includes(searchTerm) ||
          memberEmail.includes(searchTerm) ||
          groupName.includes(searchTerm) ||
          location.includes(searchTerm) ||
          memberCode.includes(searchTerm)
        );
      });
    }

    // Group filter
    if (groupFilter !== "") {
      filtered = filtered.filter(
        (member) => member.group?.id?.toString() === groupFilter
      );
    }

    // Status filter
    if (statusFilter !== "") {
      filtered = filtered.filter(
        (member) => member.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Location filter
    if (locationFilter !== "") {
      filtered = filtered.filter(
        (member) => member.group?.location === locationFilter
      );
    }

    setFilteredMembers(filtered);
  }, [memberFilter, groupFilter, statusFilter, locationFilter, members]);

  const loadAdditionalData = async () => {
    try {
      setError("");

      // Load pending approvals
      const approvals = await apiService.getPendingApprovals();
      setPendingApprovals(approvals);

      // Clerk collections are now auto-verified, so no need to load pending collections

      // Load groups
      const groupsData = await apiService.getGroups();
      setGroups(groupsData);

      // Load members (use high limit to get all members for management)
      const membersData = await apiService.getMembers(null, 10000);
      setMembers(membersData);

      // Load loans
      const loansData = await apiService.getLoans();
      setLoans(loansData);
    } catch (error) {
      setError("Failed to load additional data. Please try again.");
    }
  };

  const loadUsers = async () => {
    try {
      // Load all users (increase limit to avoid pagination hiding newer users)
      const users = await apiService.getUsers(0, 1000);

      // Filter users by specific roles
      const teamLeadersList = users.filter(
        (user) =>
          user.is_active &&
          user.roles &&
          user.roles.some((role) => role.name === "teamleader")
      );

      // Bill collectors: must have 'billcollector' role and must NOT be members
      const billCollectorsList = users
        .filter(
          (user) =>
            user.is_active &&
            user.roles &&
            user.roles.some((role) => role.name === "billcollector")
        )
        .filter((user) => !user.member);

      // Fallback: if no users with specific roles found, show all active users
      // This helps with debugging and development
      if (teamLeadersList.length === 0) {
        const activeUsers = users.filter((user) => user.is_active);
        setTeamLeaders(activeUsers);
      } else {
        setTeamLeaders(teamLeadersList);
      }

      // Do not fallback to all active users; keep empty to avoid showing members
      setBillCollectors(billCollectorsList);
    } catch (error) {
      // Don't set error state here as it's not critical for main functionality
    }
  };

  const handleApproval = async (approvalType, recordId, action, notes = "") => {
    // If approving a loan, show interest rate modal first
    if (approvalType === "loan" && action === "approve") {
      const loan = loanApprovals.find((l) => l.id === recordId);
      if (loan) {
        setSelectedLoanForApproval(loan);
        setInterestRate(""); // Reset interest rate
        setShowInterestRateModal(true);
        return;
      }
    }

    // For other cases, show confirmation toast
    const actionText = action === "approve" ? "approve" : "reject";
    const recordType = approvalType === "member" ? "member" : "loan request";

    toast(
      (t) => (
        <div className="flex items-center space-x-4">
          <span>
            Are you sure you want to {actionText} this {recordType}?
          </span>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                confirmApproval(approvalType, recordId, action, notes);
              }}
              className={`px-3 py-1 text-white text-sm rounded hover:opacity-80 ${
                action === "approve"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              Yes
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
            >
              No
            </button>
          </div>
        </div>
      ),
      {
        duration: 10000,
        position: "top-center",
      }
    );
  };

  const handleInterestRateApproval = async () => {
    let rate = null;

    // If interest rate is provided, validate it
    if (interestRate && interestRate.trim() !== "") {
      if (isNaN(parseFloat(interestRate))) {
        toast.error("Please enter a valid interest rate");
        return;
      }

      rate = parseFloat(interestRate);
      if (rate < 0 || rate > 100) {
        toast.error("Interest rate must be between 0 and 100");
        return;
      }
    }

    try {
      const approvalData = {
        approval_type: "loan",
        record_id: selectedLoanForApproval.id,
        action: "approve",
        notes: rate
          ? `Interest rate set to ${interestRate}%`
          : "Using default interest rate",
        interest_rate: rate,
      };

      await apiService.approveRecord(approvalData);

      // Close modal and reset
      setShowInterestRateModal(false);
      setSelectedLoanForApproval(null);
      setInterestRate("");

      // Reload data after approval
      await loadAdditionalData();
      refreshDashboard();

      // Show success message
      const rateMessage = rate ? `${interestRate}%` : "default";
      toast.success(`Loan approved with ${rateMessage} interest rate!`);
    } catch (error) {
      let errorMessage = 'Failed to approve loan. Please try again.';
      
      if (error.message) {
        if (error.message.includes('Loan not found')) {
          errorMessage = 'The loan request was not found. Please refresh and try again.';
        } else if (error.message.includes('Already approved')) {
          errorMessage = 'This loan has already been approved.';
        } else if (error.message.includes('Permission denied')) {
          errorMessage = 'You do not have permission to approve this loan.';
        } else if (error.message.includes('Member status')) {
          errorMessage = 'Cannot approve loan: The member\'s account status does not allow loan approval.';
        } else {
          errorMessage = 'Unable to approve loan at this time. Please try again later or contact support if the issue persists.';
        }
      }
      
      toast.error(errorMessage);
    }
  };


  const confirmApproval = async (
    approvalType,
    recordId,
    action,
    notes = ""
  ) => {
    try {
      const approvalData = {
        approval_type: approvalType,
        record_id: recordId,
        action: action,
        notes: notes,
      };

      await apiService.approveRecord(approvalData);

      // Reload data after approval
      await loadAdditionalData();
      refreshDashboard();

      // Show success message using toast
      const recordType = approvalType === "member" ? "Member" : "Loan request";
      toast.success(
        `${recordType} ${action === "approve" ? "approved" : "rejected"} successfully!`
      );
    } catch (error) {
      const recordType = approvalType === "member" ? "member" : "loan request";
      let errorMessage = `Failed to ${action} ${recordType}. Please try again.`;
      
      if (error.message) {
        if (error.message.includes('not found')) {
          errorMessage = `The ${recordType} was not found. Please refresh and try again.`;
        } else if (error.message.includes('Already')) {
          errorMessage = `This ${recordType} has already been ${action}d.`;
        } else if (error.message.includes('Permission denied')) {
          errorMessage = `You do not have permission to ${action} this ${recordType}.`;
        } else if (error.message.includes('Member status')) {
          errorMessage = `Cannot ${action}: The member's account status does not allow this action.`;
        } else {
          errorMessage = `Unable to ${action} ${recordType} at this time. Please try again later or contact support if the issue persists.`;
        }
      }
      
      toast.error(errorMessage);
    }
  };

  const handleLogout = async () => {
    try {
      await apiService.logout();
      onLogout();
    } catch (error) {
      onLogout(); // Still logout even if API call fails
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Prevent multiple submissions
    if (isCreatingGroup) {
      return;
    }

    // Basic validation
    if (!groupForm.name.trim()) {
      toast.error("Group name is required");
      return;
    }

    if (!groupForm.location.trim()) {
      toast.error("Location is required");
      return;
    }

    await submitGroupForm(
      async () => {
        // Prepare form data, handling optional fields properly
        const groupData = {
          name: groupForm.name.trim(),
          location: groupForm.location.trim(),
        };

        // Convert bill collector name to ID if selected
        if (
          groupForm.bill_collector_name &&
          groupForm.bill_collector_name.trim() !== ""
        ) {
          const billCollector = billCollectors.find(
            (user) =>
              (user.full_name || user.username) ===
              groupForm.bill_collector_name
          );
          if (billCollector) {
            groupData.bill_collector_id = billCollector.id;
          } else {
            throw new Error("Selected bill collector not found");
          }
        }

        // Test the API call
        const response = await apiService.createGroup(groupData);

        // Close modal and reset form
        setShowCreateGroupModal(false);
        setGroupForm({ name: "", location: "", bill_collector_name: "" });
        await loadAdditionalData();
        refreshDashboard();

        // Show success message after all operations are complete
        toast.success("Group created successfully!");
      },
      {
        onError: (error) => {
          const errorMessage =
            error.message || "Failed to create group. Please try again.";
          toast.error(errorMessage);
        },
      }
    );
  };

  const handleEditGroup = (group) => {
    console.log("Edit group clicked:", group);
    setEditingGroup(group);
    setGroupForm({
      name: group.name || "",
      location: group.location || "",
      team_leader_name:
        group.team_leader?.full_name || group.team_leader?.username || "",
      bill_collector_name:
        group.bill_collector?.full_name || group.bill_collector?.username || "",
    });
    setShowEditGroupModal(true);
  };

  const handleUpdateGroup = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Prevent multiple submissions
    if (isUpdatingGroup) {
      return;
    }

    // Basic validation
    if (!groupForm.name.trim()) {
      toast.error("Group name is required");
      return;
    }

    if (!groupForm.location.trim()) {
      toast.error("Location is required");
      return;
    }

    await submitUpdateGroupForm(
      async () => {
        // Prepare form data, handling optional integer fields properly
        const groupData = {
          name: groupForm.name.trim(),
          location: groupForm.location.trim(),
        };

        // Convert team leader name to ID if selected (from group members)
        let selectedTeamLeaderUserId = null;
        if (
          groupForm.team_leader_name &&
          groupForm.team_leader_name.trim() !== ""
        ) {
          const teamLeaderMember = members.find(
            (member) =>
              member.group_id === editingGroup.id &&
              (member.user?.full_name || member.user?.username) ===
                groupForm.team_leader_name
          );
          if (teamLeaderMember) {
            groupData.team_leader_id = teamLeaderMember.user_id;
            selectedTeamLeaderUserId = teamLeaderMember.user_id;
          } else {
            throw new Error("Selected team leader not found in this group");
          }
        }

        // Convert bill collector name to ID if selected
        if (
          groupForm.bill_collector_name &&
          groupForm.bill_collector_name.trim() !== ""
        ) {
          const billCollector = billCollectors.find(
            (user) =>
              (user.full_name || user.username) ===
              groupForm.bill_collector_name
          );
          if (billCollector) {
            groupData.bill_collector_id = billCollector.id;
          } else {
            throw new Error("Selected bill collector not found");
          }
        }

        await apiService.updateGroup(editingGroup.id, groupData);

        // Handle role changes for team leader assignment
        try {
          const roles = await apiService.getRoles();
          const teamLeaderRole = roles.find((r) => r.name === "teamleader");
          const memberRole = roles.find((r) => r.name === "member");

          if (teamLeaderRole && memberRole) {
            // If there was a previous team leader, revert them to member role
            if (
              editingGroup.team_leader &&
              editingGroup.team_leader.id !== selectedTeamLeaderUserId
            ) {
              await apiService.replaceUserRole(
                editingGroup.team_leader.id,
                memberRole.id
              );
            }

            // If a new team leader was selected, change their role to teamleader
            if (selectedTeamLeaderUserId) {
              await apiService.replaceUserRole(
                selectedTeamLeaderUserId,
                teamLeaderRole.id
              );
            }
          }
        } catch (e) {
          toast.error("Group updated but role assignment failed");
        }

        // Refresh groups list
        await loadAdditionalData();
        refreshDashboard();

        // Close modal and reset form
        setShowEditGroupModal(false);
        setEditingGroup(null);
        setGroupForm({
          name: "",
          location: "",
          bill_collector_name: "",
        });

        // Show success message after all operations are complete
        toast.success("Group updated successfully!");
      },
      {
        onError: (error) => {
          toast.error(error.message || "Failed to update group");
        },
      }
    );
  };

  const handleDeleteGroup = async (groupId) => {
    console.log("Delete group clicked:", groupId);
    // Prevent multiple confirmation dialogs
    if (deletingGroupId === groupId) {
      return;
    }

    // Show confirmation toast instead of alert
    toast(
      (t) => (
        <div className="flex items-center space-x-4">
          <span>Are you sure you want to delete this group?</span>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                confirmDeleteGroup(groupId);
              }}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
              Yes
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
            >
              No
            </button>
          </div>
        </div>
      ),
      {
        duration: 10000,
        position: "top-center",
      }
    );
  };

  const confirmDeleteGroup = async (groupId) => {
    setDeletingGroupId(groupId);
    
    // Safety timeout to clear deleting state after 30 seconds
    const timeoutId = setTimeout(() => {
      setDeletingGroupId(null);
    }, 30000);
    
    await submitDeleteGroupForm(
      async () => {
        await apiService.deleteGroup(groupId);

        // Refresh data after successful deletion
        await loadAdditionalData();
        refreshDashboard();

        // Show success message after all operations are complete
        toast.success("Group deleted successfully!", {
          duration: 2000,
          position: "top-center",
        });
      },
      {
        onError: (error) => {
          const errorMessage =
            error.message || "Failed to delete group. Please try again.";
          const toastId = toast(
            (t) => (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <span>{errorMessage}</span>
                <button
                  onClick={() => {
                    toast.dismiss(t.id);
                    clearTimeout(timeoutId);
                    setDeletingGroupId(null); // Clear the deleting state when error is dismissed
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "white",
                    cursor: "pointer",
                    padding: "0",
                    marginLeft: "10px",
                    fontSize: "18px",
                    fontWeight: "bold",
                  }}
                >
                  ✕
                </button>
              </div>
            ),
            {
              duration: 2000,
              position: "top-center",
              style: {
                background: "#EF4444",
                color: "#fff",
                padding: "12px 16px",
                fontSize: "14px",
              },
            }
          );
        },
        onFinally: () => {
          clearTimeout(timeoutId);
          setDeletingGroupId(null);
        },
      }
    );
  };

  const handleViewReports = () => {
    setShowReportsModal(true);
  };

  const handleViewMembers = () => {
    setShowMembersModal(true);
  };

  const handleManagePayables = () => {
    setShowPayableManagement(true);
  };

  const handleViewMemberStatement = (member) => {
    setSelectedMemberForStatement(member);
    setShowMemberStatement(true);
  };

  // Format payment type helper
  const formatPaymentType = (paymentType) => {
    if (!paymentType) return 'N/A';
    const typeMap = {
      'LOAN_PRINCIPAL': 'EMI',
      'LOAN_INTEREST': 'Interest',
      'DEPOSIT': 'Deposit',
      'JOINING_FEE': 'Joining Fee',
      'CARRY_FORWARD': 'Carry Forward'
    };
    return typeMap[paymentType] || paymentType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Load admin transaction history (collections) with pagination
  const loadAdminTransactionHistory = async (page = currentPage, resetPage = false) => {
    setLoadingCollections(true);
    try {
      const skip = resetPage ? 0 : (page - 1) * itemsPerPage;
      const filterParams = {
        skip: skip,
        limit: itemsPerPage,
      };
      
      // Add filters if set
      if (filters.group_id) filterParams.group_id = parseInt(filters.group_id);
      if (filters.start_date) filterParams.start_date = filters.start_date;
      if (filters.end_date) filterParams.end_date = filters.end_date;
      
      const collectionsData = await apiService.getAdminTransactionHistory(filterParams);
      
      // If we get a response with pagination info, use it; otherwise estimate
      if (Array.isArray(collectionsData)) {
        setCollections(collectionsData);
        // Estimate total: if we got full page, there might be more
        if (collectionsData.length === itemsPerPage) {
          setTotalCollections((page * itemsPerPage) + 1); // At least this many
        } else {
          setTotalCollections((page - 1) * itemsPerPage + collectionsData.length);
        }
      } else {
        setCollections(collectionsData.items || collectionsData.data || []);
        setTotalCollections(collectionsData.total || collectionsData.count || 0);
      }
    } catch (err) {
      console.error('Error loading admin transaction history:', err);
      toast.error('Failed to load transaction history');
      setCollections([]);
      setTotalCollections(0);
    } finally {
      setLoadingCollections(false);
    }
  };
  
  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  // Apply filters
  const applyFilters = () => {
    setCurrentPage(1);
    loadAdminTransactionHistory(1, true);
  };
  
  // Clear filters
  const clearFilters = () => {
    setFilters({
      group_id: '',
      start_date: '',
      end_date: '',
      search: ''
    });
    setCurrentPage(1);
    loadAdminTransactionHistory(1, true);
  };
  
  // Handle page change
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    loadAdminTransactionHistory(newPage);
    // Scroll to top of transaction history section
    const element = document.getElementById('transaction-history-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  
  // Handle items per page change
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
    loadAdminTransactionHistory(1, true);
  };
  
  // Calculate pagination info
  const totalPages = Math.ceil(totalCollections / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalCollections);

  // Handle view receipt
  const handleViewReceipt = async (recordId, receiptFilePath) => {
    try {
      if (!receiptFilePath) {
        toast.error('No receipt available for this collection');
        return;
      }
      
      // Get receipt blob URL
      const url = await apiService.getAdminCollectionReceipt(recordId);
      
      // Set modal state to show receipt
      setReceiptUrl(url);
      setReceiptFileName(receiptFilePath.split('/').pop() || 'receipt');
      setShowReceiptModal(true);
    } catch (err) {
      console.error('Error viewing receipt:', err);
      toast.error(err.message || 'Failed to view receipt');
    }
  };

  // Handle close receipt modal
  const handleCloseReceiptModal = () => {
    if (receiptUrl) {
      URL.revokeObjectURL(receiptUrl);
    }
    setShowReceiptModal(false);
    setReceiptUrl(null);
    setReceiptFileName('');
  };

  // Handle edit collection
  const handleEditCollection = (collection) => {
    if (!collection.is_verified) {
      toast.error('Cannot edit unverified collections. Please verify the collection first.');
      return;
    }
    
    setSelectedCollectionForEdit(collection);
    // Create editable items array with original amounts
    const items = collection.collection_items?.map(item => ({
      ...item,
      editedAmount: item.amount.toString(),
      hasChanged: false
    })) || [];
    setCollectionItems(items);
    setShowEditCollectionModal(true);
  };
  
  // Handle collection item amount change
  const handleCollectionItemAmountChange = (index, newAmount) => {
    const updatedItems = [...collectionItems];
    const originalAmount = parseFloat(updatedItems[index].amount);
    updatedItems[index].editedAmount = newAmount;
    updatedItems[index].hasChanged = parseFloat(newAmount) !== originalAmount;
    setCollectionItems(updatedItems);
  };
  
  // Handle save collection edits
  const handleSaveCollectionEdits = async () => {
    if (!selectedCollectionForEdit) return;
    
    // Find all changed items
    const changedItems = collectionItems.filter(item => item.hasChanged);
    
    if (changedItems.length === 0) {
      toast.error('No changes to save');
      return;
    }
    
    // Validate all amounts
    for (const item of changedItems) {
      const newAmount = parseFloat(item.editedAmount);
      if (isNaN(newAmount) || newAmount < 0) {
        toast.error(`Please enter a valid amount for ${item.member?.user?.full_name || 'Member'}`);
        return;
      }
    }
    
    setEditingCollection(true);
    try {
      // Update all changed items sequentially
      for (const item of changedItems) {
        const newAmount = parseFloat(item.editedAmount);
        await apiService.updateCollectionItem(item.id, newAmount);
      }
      
      toast.success(`Successfully updated ${changedItems.length} transaction${changedItems.length > 1 ? 's' : ''}!`);
      setShowEditCollectionModal(false);
      setSelectedCollectionForEdit(null);
      setCollectionItems([]);
      
      // Reload transaction history
      await loadAdminTransactionHistory(currentPage);
      await loadAdditionalData();
      refreshDashboard();
    } catch (err) {
      console.error('Error updating collection:', err);
      toast.error(err.message || 'Failed to update collection transactions');
    } finally {
      setEditingCollection(false);
    }
  };

  const refreshReportsData = async () => {
    try {
      setIsRefreshingReports(true);
      await loadAdditionalData();
      refreshDashboard();
      toast.success("Reports data refreshed successfully!");
    } catch (error) {
      toast.error("Failed to refresh reports data. Please try again.");
    } finally {
      setIsRefreshingReports(false);
    }
  };

  const generateReport = async () => {
    await submitGenerateReportForm(
      async () => {
        let reportData = [];
        let reportTitle = "";

        switch (reportType) {
          case "members":
            reportData = members;
            reportTitle = "Members Report";
            break;
          case "loans":
            reportData = loans;
            reportTitle = "Loans Report";
            break;
          case "groups":
            reportData = groups;
            reportTitle = "Groups Report";
            break;
          default:
            reportData = [];
            reportTitle = "Report";
        }

        // Generate CSV content using utility function
        const csvContent = generateCSV(reportData, reportType);

        // Download the CSV file using utility function
        const filename = generateFilename(reportType, reportDate);
        downloadCSV(csvContent, filename);

        toast.success(`${reportTitle} generated and downloaded successfully!`);
      },
      {
        onError: (error) => {
          toast.error("Failed to generate report. Please try again.");
        },
      }
    );
  };

  // Print functionality for Members Management
  const handlePrintMembers = () => {
    setShowPrintConfirmation(true);
  };

  const confirmPrint = () => {
    setShowPrintConfirmation(false);

    // Get the current filtered members data
    const printData = filteredMembers;

    if (printData.length === 0) {
      toast.error("No members to print");
      return;
    }

    // Create a new window for printing
    const printWindow = window.open("", "_blank");

    // Get current date for the report
    const currentDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Get selected group name if filtered
    const selectedGroup = groups.find((g) => g.id === parseInt(groupFilter));
    const groupName = selectedGroup ? selectedGroup.name : "All Groups";

    // Create the print content
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Members Report - ${groupName}</title>
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
          .filters {
            margin-bottom: 20px;
            padding: 15px;
            background-color: #f9fafb;
            border-radius: 8px;
            font-size: 14px;
          }
          .filters h3 {
            margin: 0 0 10px 0;
            color: #374151;
            font-size: 16px;
          }
          .filters p {
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
          <h1>Members Management Report</h1>
          <p>Generated on ${currentDate}</p>
        </div>
        
        <div class="filters">
          <h3>Report Filters</h3>
          <p><strong>Group:</strong> ${groupName}</p>
          <p><strong>Status:</strong> ${statusFilter || "All Status"}</p>
          <p><strong>Location:</strong> ${locationFilter || "All Locations"}</p>
          <p><strong>Search:</strong> ${memberFilter || "No search filter"}</p>
          <p><strong>Total Members:</strong> ${printData.length}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Code</th>
              <th>Name</th>
              <th>Group</th>
              <th>Location</th>
              <th>Status</th>
              <th>Loans</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            ${printData
              .map(
                (member, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${member.member_code || "N/A"}</td>
                <td>${
                  member.user?.full_name || member.user?.username || "N/A"
                }</td>
                <td>${member.group?.name || "N/A"}</td>
                <td>${member.group?.location || "N/A"}</td>
                <td>
                  <span class="status status-${(
                    member.status || ""
                  ).toLowerCase()}">
                    ${member.status || "N/A"}
                  </span>
                </td>
                <td>${
                  loans.filter(
                    (loan) =>
                      loan.member_id === member.id &&
                      (loan.status === "ACTIVE" ||
                        loan.status === "DISBURSED" ||
                        loan.status === "APPROVED")
                  ).length
                }</td>
                <td>${
                  member.joined_date
                    ? new Date(member.joined_date).toLocaleDateString()
                    : "N/A"
                }</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>

        <div class="footer">
          <p>This report was generated from the Microfinance Management System</p>
          <p>Report contains ${
            printData.length
          } member(s) as of ${currentDate}</p>
        </div>
      </body>
      </html>
    `;

    // Write content to the new window
    printWindow.document.write(printContent);
    printWindow.document.close();

    // Wait for content to load, then print
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      // Close the window after a short delay to allow printing to complete
      setTimeout(() => {
        printWindow.close();
      }, 1000);
    };

    // Show success message with auto-dismiss
    toast.success("Print dialog opened successfully!", {
      duration: 2000,
      position: "top-center",
    });
  };

  const cancelPrint = () => {
    setShowPrintConfirmation(false);
  };

  // Split members and loans
  const memberApprovals = pendingApprovals.filter(
    (item) => item.type === "member"
  );
  const loanApprovals = pendingApprovals.filter((item) => item.type === "loan");

  if (isLoading) {
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
            onClick={() => {
              loadAdditionalData();
              refreshDashboard();
            }}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Toaster for notifications */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 2000,
          style: {
            background: "#363636",
            color: "#fff",
            borderRadius: "8px",
            padding: "16px",
            fontSize: "14px",
            boxShadow:
              "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
          },
          success: {
            duration: 2000,
            iconTheme: {
              primary: "#10B981",
              secondary: "#fff",
            },
            style: {
              background: "#10B981",
              color: "#fff",
            },
          },
          error: {
            duration: 2000,
            iconTheme: {
              primary: "#EF4444",
              secondary: "#fff",
            },
            style: {
              background: "#EF4444",
              color: "#fff",
              zIndex: 9999,
            },
          },
          info: {
            duration: 2000,
            iconTheme: {
              primary: "#3B82F6",
              secondary: "#fff",
            },
            style: {
              background: "#3B82F6",
              color: "#fff",
            },
          },
        }}
      />

      <style
        dangerouslySetInnerHTML={{
          __html: `
          [data-hot-toast] button {
            pointer-events: auto !important;
            cursor: pointer !important;
            z-index: 9999 !important;
          }
          [data-hot-toast] button:hover {
            opacity: 0.8 !important;
          }
        `,
        }}
      />

      <DashboardHeader
        title="Admin Dashboard"
        userName={user.name}
        onLogout={handleLogout}
      />

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
        {/* Enhanced Stats Cards */}
        <div className="mb-8">
        <StatsCards
          dashboardStats={dashboardStats}
          memberApprovals={memberApprovals}
          loanApprovals={loanApprovals}
        />
        </div>
        {/* Pending Approvals Section */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 mb-8">
          {/* Pending Member Approvals */}
          <Card>
            <SectionHeader
              title="Pending Member Approvals"
              description="Members awaiting approval"
            />
            <SectionContent>
              {memberApprovals.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500 text-lg">No pending member approvals</div>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden lg:block overflow-x-auto">
                <Table
                  headers={[
                    "Name",
                    "Group",
                    "Location",
                    "Team Leader",
                    "Bill Collector",
                    "Date",
                    "Action",
                  ]}
                >
                      {memberApprovals.map((item, index) => (
                      <Table.Row key={item.id} className={`hover:bg-gray-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <Table.Cell className="px-4 sm:px-6 py-4 text-sm font-semibold text-gray-900 whitespace-nowrap">
                          {item.name}
                        </Table.Cell>
                        <Table.Cell className="px-4 sm:px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                          {item.group_name || "N/A"}
                        </Table.Cell>
                        <Table.Cell className="px-4 sm:px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                          {item.location || "N/A"}
                        </Table.Cell>
                        <Table.Cell className="px-4 sm:px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                          {item.team_leader || "Not assigned"}
                        </Table.Cell>
                        <Table.Cell className="px-4 sm:px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                          {item.bill_collector || "Not assigned"}
                        </Table.Cell>
                        <Table.Cell className="px-4 sm:px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                          {item.date}
                        </Table.Cell>
                        <Table.Cell className="px-4 sm:px-6 py-4 text-sm font-medium">
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              onClick={() =>
                                handleApproval("member", item.id, "approve")
                              }
                                className="w-full sm:w-auto text-xs px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center gap-1 font-semibold shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
                            >
                              <FaCheck className="w-3 h-3" />
                              <span className="hidden sm:inline">Approve</span>
                            </button>
                            <button
                              onClick={() =>
                                handleApproval("member", item.id, "reject")
                              }
                                className="w-full sm:w-auto text-xs px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center gap-1 font-semibold shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
                            >
                              <FaTimes className="w-3 h-3" />
                              <span className="hidden sm:inline">Reject</span>
                            </button>
                          </div>
                        </Table.Cell>
                      </Table.Row>
                      ))}
                </Table>
              </div>

                  {/* Mobile Card View */}
                  <div className="lg:hidden space-y-4">
                    {memberApprovals.map((item, index) => (
                      <div key={item.id} className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                        {/* Card Header */}
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-bold text-gray-900 mb-2 truncate">
                              {item.name}
                            </h3>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 w-fit">
                                {item.group_name || "N/A"}
                              </span>
                              <span className="text-xs text-gray-500">{item.date}</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 ml-4 flex-shrink-0">
                            <button
                              onClick={() => handleApproval("member", item.id, "approve")}
                              className="px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl flex items-center justify-center gap-2 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 min-w-[100px] cursor-pointer"
                            >
                              <FaCheck className="w-4 h-4" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleApproval("member", item.id, "reject")}
                              className="px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl flex items-center justify-center gap-2 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 min-w-[100px] cursor-pointer"
                            >
                              <FaTimes className="w-4 h-4" />
                              Reject
                            </button>
                          </div>
                        </div>
                        
                        {/* Card Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="flex items-center space-x-3 p-4 bg-white/70 rounded-xl border border-gray-100">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <FaUsers className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Group</p>
                              <p className="text-sm font-semibold text-gray-900 truncate">{item.group_name || "N/A"}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3 p-4 bg-white/70 rounded-xl border border-gray-100">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Location</p>
                              <p className="text-sm font-semibold text-gray-900 truncate">{item.location || "N/A"}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3 p-4 bg-white/70 rounded-xl border border-gray-100">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <FaUsers className="w-5 h-5 text-purple-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Team Leader</p>
                              <p className="text-sm font-semibold text-gray-900 truncate">{item.team_leader || "Not assigned"}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3 p-4 bg-white/70 rounded-xl border border-gray-100">
                            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <FaUsers className="w-5 h-5 text-orange-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Bill Collector</p>
                              <p className="text-sm font-semibold text-gray-900 truncate">{item.bill_collector || "Not assigned"}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </SectionContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 mb-8">
          {/* Pending Loan Approvals */}
          <Card>
            <SectionHeader
              title="Pending Loan Approvals"
              description="Loans awaiting approval"
            />
            <SectionContent>
              {loanApprovals.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500 text-lg">No pending loan approvals</div>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden lg:block overflow-x-auto">
                <Table
                  headers={[
                    "Name",
                    "Group",
                    "Amount",
                    "Location",
                    "Team Leader",
                    "Bill Collector",
                    "Date",
                    "Action",
                  ]}
                >
                      {loanApprovals.map((loan, index) => (
                      <Table.Row key={loan.id} className={`hover:bg-gray-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <Table.Cell className="px-4 sm:px-6 py-4 text-sm font-semibold text-gray-900 whitespace-nowrap">
                          {loan.name}
                        </Table.Cell>
                        <Table.Cell className="px-4 sm:px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                          {loan.group_name || "N/A"}
                        </Table.Cell>
                        <Table.Cell className="px-4 sm:px-6 py-4 text-sm font-bold text-green-600 whitespace-nowrap">
                          {formatIndianCurrency(loan.amount)}
                        </Table.Cell>
                        <Table.Cell className="px-4 sm:px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                          {loan.location}
                        </Table.Cell>
                        <Table.Cell className="px-4 sm:px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                          {loan.team_leader || "Not assigned"}
                        </Table.Cell>
                        <Table.Cell className="px-4 sm:px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                          {loan.bill_collector || "Not assigned"}
                        </Table.Cell>
                        <Table.Cell className="px-4 sm:px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                          {loan.date}
                        </Table.Cell>
                        <Table.Cell className="px-4 sm:px-6 py-4 text-sm font-medium">
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              onClick={() =>
                                handleApproval("loan", loan.id, "approve")
                              }
                                className="w-full sm:w-auto text-xs px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center gap-1 font-semibold shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
                            >
                              <FaCheck className="w-3 h-3" />
                              <span className="hidden sm:inline">Approve</span>
                            </button>
                            <button
                              onClick={() =>
                                handleApproval("loan", loan.id, "reject")
                              }
                                className="w-full sm:w-auto text-xs px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center gap-1 font-semibold shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
                            >
                              <FaTimes className="w-3 h-3" />
                              <span className="hidden sm:inline">Reject</span>
                            </button>
                          </div>
                        </Table.Cell>
                      </Table.Row>
                      ))}
                </Table>
              </div>

                  {/* Mobile Card View */}
                  <div className="lg:hidden space-y-4">
                    {loanApprovals.map((loan, index) => (
                      <div key={loan.id} className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                        {/* Card Header */}
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-bold text-gray-900 mb-2 truncate">
                              {loan.name}
                            </h3>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 w-fit">
                                {loan.group_name || "N/A"}
                              </span>
                              <span className="text-xs text-gray-500">{loan.date}</span>
                            </div>
                          </div>
                          <div className="text-right ml-4 flex-shrink-0">
                            <div className="text-2xl font-bold text-green-600 mb-3">
                              {formatIndianCurrency(loan.amount)}
                            </div>
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={() => handleApproval("loan", loan.id, "approve")}
                                className="px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl flex items-center justify-center gap-2 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 min-w-[100px] cursor-pointer"
                              >
                                <FaCheck className="w-4 h-4" />
                                Approve
                              </button>
                              <button
                                onClick={() => handleApproval("loan", loan.id, "reject")}
                                className="px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl flex items-center justify-center gap-2 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 min-w-[100px] cursor-pointer"
                              >
                                <FaTimes className="w-4 h-4" />
                                Reject
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Card Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="flex items-center space-x-3 p-4 bg-white/70 rounded-xl border border-gray-100">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <FaUsers className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Group</p>
                              <p className="text-sm font-semibold text-gray-900 truncate">{loan.group_name || "N/A"}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3 p-4 bg-white/70 rounded-xl border border-gray-100">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Location</p>
                              <p className="text-sm font-semibold text-gray-900 truncate">{loan.location}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3 p-4 bg-white/70 rounded-xl border border-gray-100">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <FaUsers className="w-5 h-5 text-purple-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Team Leader</p>
                              <p className="text-sm font-semibold text-gray-900 truncate">{loan.team_leader || "Not assigned"}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3 p-4 bg-white/70 rounded-xl border border-gray-100">
                            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <FaUsers className="w-5 h-5 text-orange-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Bill Collector</p>
                              <p className="text-sm font-semibold text-gray-900 truncate">{loan.bill_collector || "Not assigned"}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </SectionContent>
          </Card>
        </div>

        {/* Enhanced Quick Actions */}
        <div className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl mb-8 border border-gray-200/50 hover:shadow-2xl transition-all duration-300">
          <div className="p-6">
        <QuickActions
          onCreateGroup={() => setShowCreateGroupModal(true)}
          onViewReports={handleViewReports}
          onViewMembers={handleViewMembers}
          onManageUsers={() => setShowUserManagementModal(true)}
          onManagePayables={handleManagePayables}
        />
          </div>
        </div>


        {/* Enhanced Groups Management Section */}
        <div className="bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl mb-8 border border-gray-200/50 hover:shadow-2xl transition-all duration-300">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-4 rounded-t-2xl">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <FaUsers className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Group Management</h3>
                <p className="text-emerald-100 text-sm">Manage groups, members, and team assignments</p>
              </div>
            </div>
          </div>
          
          <div className="p-0">
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto rounded-b-2xl">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-emerald-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center space-x-2">
                        <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span>Group Name</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center space-x-2">
                        <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>Location</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center space-x-2">
                        <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                        <span>Members</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center space-x-2">
                        <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>Team Leader</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center space-x-2">
                        <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Bill Collector</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                {groups.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <div className="p-4 bg-gray-100 rounded-full mb-4">
                            <FaUsers className="h-8 w-8 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No Groups Found</h3>
                          <p className="text-gray-500 mb-4">Get started by creating your first group</p>
                          <button
                            onClick={() => setShowCreateGroupModal(true)}
                            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-lg hover:from-emerald-700 hover:to-teal-800 transition-all duration-200 flex items-center space-x-2 cursor-pointer"
                          >
                            <FaPlus className="h-4 w-4" />
                            <span>Create First Group</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                ) : (
                  groups.map((group, index) => (
                      <tr key={group.id} className="hover:bg-emerald-50 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="p-2 bg-emerald-100 rounded-lg mr-3">
                              <FaUsers className="h-4 w-4 text-emerald-600" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">{group.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <svg className="h-4 w-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-sm text-gray-600">{group.location}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                              {group.member_count || 0} members
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {group.team_leader ? (
                              <div className="flex items-center">
                                <div className="p-1 bg-green-100 rounded-full mr-2">
                                  <svg className="h-3 w-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                </div>
                                <span className="text-sm text-gray-900">
                                  {group.team_leader.full_name || group.team_leader.username}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400 italic">Not assigned</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {group.bill_collector ? (
                              <div className="flex items-center">
                                <div className="p-1 bg-purple-100 rounded-full mr-2">
                                  <svg className="h-3 w-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <span className="text-sm text-gray-900">
                                  {group.bill_collector.full_name || group.bill_collector.username}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400 italic">Not assigned</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center justify-center space-x-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-2 border border-gray-200">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleEditGroup(group);
                              }}
                              className="p-2 text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg transition-all duration-200 cursor-pointer group shadow-sm hover:shadow-md transform hover:scale-105"
                              title="Edit Group"
                            >
                              <FaEdit className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDeleteGroup(group.id);
                              }}
                              disabled={deletingGroupId === group.id}
                              className={`p-2 text-white rounded-lg transition-all duration-200 cursor-pointer group shadow-sm hover:shadow-md transform hover:scale-105 ${
                                deletingGroupId === group.id
                                  ? "bg-red-400 cursor-not-allowed"
                                  : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                              }`}
                              title="Delete Group"
                            >
                              {deletingGroupId === group.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                <FaTrash className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                  ))
                )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-3 p-4">
              {groups.length === 0 ? (
                <div className="text-center py-8">
                  <div className="p-4 bg-gray-100 rounded-full mb-4 mx-auto w-fit">
                    <FaUsers className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Groups Found</h3>
                  <p className="text-gray-500 mb-4">Get started by creating your first group</p>
                  <button
                    onClick={() => setShowCreateGroupModal(true)}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-lg hover:from-emerald-700 hover:to-teal-800 transition-all duration-200 flex items-center space-x-2 cursor-pointer mx-auto"
                  >
                    <FaPlus className="h-4 w-4" />
                    <span>Create First Group</span>
                  </button>
                </div>
              ) : (
                groups.map((group) => (
                  <div key={group.id} className="bg-white rounded-lg border border-gray-300 shadow-sm p-3">
                    {/* Header with Group Name and Actions */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className="p-2 bg-emerald-100 rounded-lg mr-3">
                          <FaUsers className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{group.name}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleEditGroup(group);
                          }}
                          className="p-2 text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg transition-all duration-200 cursor-pointer group shadow-sm hover:shadow-md transform hover:scale-105"
                          title="Edit Group"
                        >
                          <FaEdit className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteGroup(group.id);
                          }}
                          disabled={deletingGroupId === group.id}
                          className={`p-2 text-white rounded-lg transition-all duration-200 cursor-pointer group shadow-sm hover:shadow-md transform hover:scale-105 ${
                            deletingGroupId === group.id
                              ? "bg-red-400 cursor-not-allowed"
                              : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                          }`}
                          title="Delete Group"
                        >
                          {deletingGroupId === group.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <FaTrash className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Location and Members */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <svg className="h-4 w-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-sm text-gray-600">{group.location}</span>
                      </div>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                        {group.member_count || 0} members
                      </span>
                    </div>

                    {/* Team Leader and Bill Collector */}
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <div className="p-1 bg-green-100 rounded-full mr-2">
                          <svg className="h-3 w-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <span className="text-xs text-gray-500">Team Leader:</span>
                        <span className="text-xs text-gray-900 ml-1">
                          {group.team_leader
                            ? group.team_leader.full_name || group.team_leader.username
                            : "Not assigned"}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <div className="p-1 bg-purple-100 rounded-full mr-2">
                          <svg className="h-3 w-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <span className="text-xs text-gray-500">Bill Collector:</span>
                        <span className="text-xs text-gray-900 ml-1">
                          {group.bill_collector?.full_name || group.bill_collector?.username || "Not assigned"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <CreateGroupModal
          isOpen={showCreateGroupModal}
          onClose={() => {
            setShowCreateGroupModal(false);
            setGroupForm({ name: "", location: "", bill_collector_name: "" });
            resetGroupForm();
          }}
          groupForm={groupForm}
          onFormChange={(field, value) =>
            setGroupForm({ ...groupForm, [field]: value })
          }
          onSubmit={handleCreateGroup}
          billCollectors={billCollectors}
          isLoading={isCreatingGroup}
        />

        {/* Edit Group Modal */}
        {showEditGroupModal && editingGroup && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-4 mx-auto p-0 border w-11/12 max-w-2xl shadow-2xl rounded-xl bg-white overflow-hidden">
              {/* Enhanced Modal Header */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <FaEdit className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">
                        Edit Group
                      </h3>
                      <p className="text-emerald-100 text-sm">
                        Update group information and assignments
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowEditGroupModal(false);
                      setEditingGroup(null);
                      setGroupForm({
                        name: "",
                        location: "",
                        bill_collector_name: "",
                      });
                    }}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200 cursor-pointer"
                    title="Close Edit Group"
                  >
                    <FaTimes className="h-6 w-6 text-white" />
                  </button>
                </div>
              </div>
              
              {/* Modal Content */}
              <div className="p-6">
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-1">
                  <div className="bg-white rounded-xl p-6">
                    <form onSubmit={handleUpdateGroup}>
                      {/* Group Name Field */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Group Name *
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaUsers className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            required
                            value={groupForm.name}
                            onChange={(e) =>
                              setGroupForm({ ...groupForm, name: e.target.value })
                            }
                            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                            placeholder="Enter group name"
                          />
                        </div>
                      </div>

                      {/* Location Field */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Location *
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaMapMarkerAlt className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            required
                            value={groupForm.location}
                            onChange={(e) =>
                              setGroupForm({ ...groupForm, location: e.target.value })
                            }
                            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                            placeholder="Enter location"
                          />
                        </div>
                      </div>

                      {/* Team Leader Field */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Team Leader (Optional)
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <select
                            value={groupForm.team_leader_name || ""}
                            onChange={(e) =>
                              setGroupForm({
                                ...groupForm,
                                team_leader_name: e.target.value,
                              })
                            }
                            className="w-full pl-12 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 appearance-none bg-white cursor-pointer"
                          >
                            <option value="">Select a team leader</option>
                            {editingGroup &&
                            members.filter((m) => m.group_id === editingGroup.id)
                              .length > 0 ? (
                              members
                                .filter((m) => m.group_id === editingGroup.id)
                                .map((member) => (
                                  <option
                                    key={member.id}
                                    value={
                                      member.user?.full_name || member.user?.username
                                    }
                                  >
                                    {member.user?.full_name || member.user?.username}
                                    {member.user?.email
                                      ? ` (${member.user.email})`
                                      : ""}
                                  </option>
                                ))
                            ) : (
                              <option value="" disabled>
                                No members in this group
                              </option>
                            )}
                          </select>
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Bill Collector Field */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bill Collector (Optional)
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaUserTie className="h-5 w-5 text-gray-400" />
                          </div>
                          <select
                            value={groupForm.bill_collector_name || ""}
                            onChange={(e) =>
                              setGroupForm({
                                ...groupForm,
                                bill_collector_name: e.target.value,
                              })
                            }
                            className="w-full pl-12 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 appearance-none bg-white cursor-pointer"
                          >
                            <option value="">Select a bill collector</option>
                            {billCollectors.length > 0 ? (
                              billCollectors.map((user) => (
                                <option
                                  key={user.id}
                                  value={user.full_name || user.username}
                                >
                                  {user.full_name || user.username}
                                </option>
                              ))
                            ) : (
                              <option value="" disabled>
                                No bill collectors available
                              </option>
                            )}
                          </select>
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Information Note */}
                      <div className="mb-8 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl">
                        <div className="flex items-start">
                          <FaInfoCircle className="w-5 h-5 text-emerald-600 mr-3 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-emerald-800 leading-relaxed">
                            <span className="font-semibold">Note:</span> Team leader can only be selected from existing group members. Add members to the group first if you want to assign a team leader.
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
                        <button
                          type="button"
                          onClick={() => {
                            setShowEditGroupModal(false);
                            setEditingGroup(null);
                            setGroupForm({
                              name: "",
                              location: "",
                              bill_collector_name: "",
                            });
                          }}
                          className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span>Cancel</span>
                        </button>
                        <button
                          type="submit"
                          disabled={isUpdatingGroup}
                          className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-700 border border-transparent rounded-lg hover:from-emerald-700 hover:to-teal-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-2 cursor-pointer disabled:cursor-not-allowed"
                        >
                          {isUpdatingGroup ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>Updating...</span>
                            </>
                          ) : (
                            <>
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              <span>Update Group</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reports Modal */}
        {showReportsModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-1">
                  <div className="bg-white rounded-xl p-6 sm:p-8">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-gray-900 flex items-center">
                        <svg className="w-6 h-6 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    Generate Report
                  </h3>
                  <button
                    onClick={() => setShowReportsModal(false)}
                        className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors duration-200 p-2 rounded-lg hover:bg-gray-100"
                  >
                    <FaTimes className="h-6 w-6" />
                  </button>
                </div>
                    
                    {/* Report Type Field - Fixed CSS warnings */}
                    <div className="mb-6">
                      <label className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    Report Type *
                  </label>
                      <div className="relative">
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                          className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white text-gray-800 appearance-none cursor-pointer"
                  >
                    <option value="members">Members</option>
                    <option value="loans">Loans</option>
                    <option value="groups">Groups</option>
                  </select>
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                </div>
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    {/* Date Field */}
                    <div className="mb-6">
                      <label className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    Date (for Members/Loans)
                  </label>
                      <div className="relative">
                  <input
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                          className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-gray-50 focus:bg-white text-gray-800"
                  />
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                </div>
                </div>
                    </div>
                    
                    {/* Report Summary */}
                    <div className="mb-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                      <div className="flex items-start">
                        <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <div>
                          <p className="text-sm font-semibold text-blue-800 mb-2">Report Summary:</p>
                          <ul className="text-sm text-blue-700 space-y-1">
                            <li><span className="font-medium">Type:</span> {reportType.charAt(0).toUpperCase() + reportType.slice(1)}</li>
                            <li><span className="font-medium">Date:</span> {reportDate}</li>
                            <li><span className="font-medium">Records:</span> {reportType === "members" ? members.length : reportType === "loans" ? loans.length : groups.length}</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
                  <button
                    type="button"
                    onClick={refreshReportsData}
                    disabled={isRefreshingReports}
                        className={`w-full sm:w-auto px-4 py-3 text-sm font-semibold rounded-xl flex items-center justify-center transition-all duration-200 ${
                      isRefreshingReports
                            ? "bg-gray-400 cursor-not-allowed text-gray-600"
                            : "bg-gray-200 hover:bg-gray-300 text-gray-700 cursor-pointer"
                        }`}
                  >
                    {isRefreshingReports ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                        Refreshing...
                      </>
                    ) : (
                      "Refresh Data"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReportsModal(false)}
                        className="w-full sm:w-auto px-6 py-3 text-sm font-semibold text-gray-700 bg-gray-200 rounded-xl hover:bg-gray-300 cursor-pointer transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={generateReport}
                    disabled={isGeneratingReport}
                        className={`w-full sm:w-auto px-6 py-3 text-sm font-semibold rounded-xl flex items-center justify-center transition-all duration-200 ${
                      isGeneratingReport
                            ? "bg-gray-400 cursor-not-allowed text-gray-600"
                            : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white cursor-pointer shadow-lg hover:shadow-xl"
                        }`}
                  >
                    {isGeneratingReport && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    )}
                    {isGeneratingReport ? "Generating..." : "Generate Report"}
                  </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Members Management Modal */}
        {showMembersModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-2 sm:top-4 lg:top-20 mx-auto p-2 sm:p-4 lg:p-6 border w-11/12 max-w-7xl shadow-2xl rounded-2xl bg-white">
              <div className="mt-2 sm:mt-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 space-y-4 sm:space-y-0">
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                    Members Management
                  </h3>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                    <button
                      onClick={handlePrintMembers}
                      className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm sm:text-base font-bold rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 w-full sm:w-auto cursor-pointer"
                    >
                      <svg
                        className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                        />
                      </svg>
                      <span className="hidden sm:inline">Print Members</span>
                      <span className="sm:hidden">Print</span>
                    </button>
                    <button
                      onClick={() => setShowMembersModal(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors p-2 sm:p-1 self-end sm:self-auto cursor-pointer"
                    >
                      <FaTimes className="h-6 w-6 sm:h-5 sm:w-5" />
                    </button>
                  </div>
                </div>

                {/* Enhanced Filter Section */}
                <div className="mb-12">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 shadow-sm border border-blue-100 animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {/* Search Filter */}
                      <div className="sm:col-span-2 lg:col-span-1">
                        <label className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                          <svg
                            className="w-4 h-4 mr-2 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                          </svg>
                          Search Members
                        </label>
                        <input
                          type="text"
                          value={memberFilter}
                          onChange={(e) => setMemberFilter(e.target.value)}
                          placeholder="Search by name, email, code..."
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                        />
                      </div>

                      {/* Group Filter */}
                      <div>
                        <label className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                          <svg
                            className="w-4 h-4 mr-2 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                          Filter by Group
                        </label>
                        <select
                          value={groupFilter}
                          onChange={(e) => setGroupFilter(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
                        >
                          <option value="">All Groups</option>
                          {groups.map((group) => (
                            <option key={group.id} value={group.id}>
                              {group.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Status Filter */}
                      <div>
                        <label className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                          <svg
                            className="w-4 h-4 mr-2 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Filter by Status
                        </label>
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
                        >
                          <option value="">All Status</option>
                          <option value="ACTIVE">Active</option>
                          <option value="PENDING">Pending</option>
                          <option value="INACTIVE">Inactive</option>
                          <option value="SUSPENDED">Suspended</option>
                          <option value="REJECTED">Rejected</option>
                        </select>
                      </div>

                      {/* Location Filter */}
                      <div>
                        <label className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                          <svg
                            className="w-4 h-4 mr-2 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          Filter by Location
                        </label>
                        <select
                          value={locationFilter}
                          onChange={(e) => setLocationFilter(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
                        >
                          <option value="">All Locations</option>
                          {[
                            ...new Set(
                              groups
                                .map((group) => group.location)
                                .filter(Boolean)
                            ),
                          ].map((location) => (
                            <option key={location} value={location}>
                              {location}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Clear Filters Button */}
                    <div className="mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
                      <button
                        onClick={() => {
                          setMemberFilter("");
                          setGroupFilter("");
                          setStatusFilter("");
                          setLocationFilter("");
                        }}
                        className="px-6 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md flex items-center cursor-pointer"
                      >
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                        Clear All Filters
                      </button>
                      <p className="text-sm text-gray-500">
                        Showing {filteredMembers.length} of {members.length}{" "}
                        members
                      </p>
                    </div>
                  </div>
                  
                  {/* Spacing between filter and table */}
                  <div className="mt-8"></div>
                  
                  {/* Desktop Table View */}
                  <div className="hidden lg:block overflow-x-auto shadow-sm border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            #
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Code
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Group
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Location
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Loans
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Joined
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredMembers.length === 0 ? (
                          <tr>
                            <td
                              colSpan="9"
                              className="px-4 py-8 text-center text-sm text-gray-500"
                            >
                              <div className="flex flex-col items-center">
                                <div className="text-gray-400 mb-2">
                                  <svg
                                    className="w-12 h-12"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={1}
                                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                    />
                                  </svg>
                                </div>
                                <p className="text-lg font-medium text-gray-900 mb-1">
                                  {memberFilter.trim() === ""
                                    ? "No members found"
                                    : "No members match your search"}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {memberFilter.trim() === ""
                                    ? "Try adjusting your filters or add new members."
                                    : "Try adjusting your search criteria."}
                                </p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filteredMembers.map((member, index) => (
                            <tr
                              key={member.id}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td className="px-4 py-4 text-sm text-gray-900">
                                {index + 1}
                              </td>
                              <td className="px-4 py-4 text-sm font-medium text-gray-900">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {member.member_code || "N/A"}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-900">
                                <div className="font-medium">
                                  {member.user?.full_name ||
                                    member.user?.username ||
                                    "N/A"}
                                </div>
                                {member.user?.email && (
                                  <div className="text-xs text-gray-500">
                                    {member.user.email}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-500">
                                {member.group?.name || "N/A"}
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-500">
                                {member.group?.location || "N/A"}
                              </td>
                              <td className="px-4 py-4">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    member.status?.toLowerCase() === "active"
                                      ? "bg-green-100 text-green-800"
                                      : member.status?.toLowerCase() ===
                                        "pending"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : member.status?.toLowerCase() ===
                                        "suspended"
                                      ? "bg-orange-100 text-orange-800"
                                      : member.status?.toLowerCase() ===
                                        "rejected"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {member.status}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-center">
                                <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
                                  {
                                    loans.filter(
                                      (loan) =>
                                        loan.member_id === member.id &&
                                        (loan.status === "ACTIVE" ||
                                          loan.status === "DISBURSED" ||
                                          loan.status === "APPROVED")
                                    ).length
                                  }
                                </span>
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-500">
                                {member.joined_date
                                  ? new Date(
                                      member.joined_date
                                    ).toLocaleDateString()
                                  : "N/A"}
                              </td>
                              <td className="px-4 py-4 text-center">
                                <button
                                  onClick={() => handleViewMemberStatement(member)}
                                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 cursor-pointer"
                                  title="View Financial Statement"
                                >
                                  <FaFileAlt className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="lg:hidden space-y-4">
                    {filteredMembers.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-gray-400 mb-4">
                          <svg
                            className="w-12 h-12 mx-auto"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1}
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                        </div>
                        <p className="text-lg font-medium text-gray-900 mb-1">
                          {memberFilter.trim() === ""
                            ? "No members found"
                            : "No members match your search"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {memberFilter.trim() === ""
                            ? "Try adjusting your filters or add new members."
                            : "Try adjusting your search criteria."}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {filteredMembers.map((member, index) => (
                          <div
                            key={member.id}
                            className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group animate-slide-up"
                            style={{ animationDelay: `${index * 0.1}s` }}
                          >
                            {/* Card Header */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3 mb-2">
                                    <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-600 text-white text-sm font-bold rounded-full">
                                      {index + 1}
                                    </span>
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-600 text-white shadow-sm">
                                      {member.member_code || "N/A"}
                                    </span>
                                  </div>
                                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                                    {member.user?.full_name ||
                                      member.user?.username ||
                                      "N/A"}
                                  </h3>
                                  {member.user?.email && (
                                    <p className="text-sm text-gray-600">
                                      {member.user.email}
                                    </p>
                                  )}
                                </div>
                                <span
                                  className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold shadow-sm ${
                                    member.status?.toLowerCase() === "active"
                                      ? "bg-green-500 text-white"
                                      : member.status?.toLowerCase() ===
                                        "pending"
                                      ? "bg-yellow-500 text-white"
                                      : member.status?.toLowerCase() ===
                                        "suspended"
                                      ? "bg-orange-500 text-white"
                                      : member.status?.toLowerCase() ===
                                        "rejected"
                                      ? "bg-red-500 text-white"
                                      : "bg-gray-500 text-white"
                                  }`}
                                >
                                  {member.status}
                                </span>
                              </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-6">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {/* Group Info */}
                                <div className="flex items-start space-x-3">
                                  <div className="flex-shrink-0">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-100">
                                      <svg
                                        className="w-5 h-5 text-blue-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                        />
                                      </svg>
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                                      Group
                                    </p>
                                    <p className="text-lg font-semibold text-gray-900 truncate">
                                      {member.group?.name || "N/A"}
                                    </p>
                                  </div>
                                </div>

                                {/* Location Info */}
                                <div className="flex items-start space-x-3">
                                  <div className="flex-shrink-0">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-100">
                                      <svg
                                        className="w-5 h-5 text-green-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                        />
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                      </svg>
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                                      Location
                                    </p>
                                    <p className="text-lg font-semibold text-gray-900 truncate">
                                      {member.group?.location || "N/A"}
                                    </p>
                                  </div>
                                </div>

                                {/* Active Loans Info */}
                                <div className="flex items-start space-x-3">
                                  <div className="flex-shrink-0">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-100">
                                      <svg
                                        className="w-5 h-5 text-purple-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                                        />
                                      </svg>
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                                      Active Loans
                                    </p>
                                    <p className="text-lg font-semibold text-gray-900">
                                      {
                                        loans.filter(
                                          (loan) =>
                                            loan.member_id === member.id &&
                                            (loan.status === "ACTIVE" ||
                                              loan.status === "DISBURSED" ||
                                              loan.status === "APPROVED")
                                        ).length
                                      }
                                    </p>
                                  </div>
                                </div>

                                {/* Joined Date Info */}
                                <div className="flex items-start space-x-3">
                                  <div className="flex-shrink-0">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-orange-100">
                                      <svg
                                        className="w-5 h-5 text-orange-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                        />
                                      </svg>
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                                      Joined
                                    </p>
                                    <p className="text-lg font-semibold text-gray-900">
                                      {member.joined_date
                                        ? new Date(
                                            member.joined_date
                                          ).toLocaleDateString()
                                        : "N/A"}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Card Actions */}
                            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                              <button
                                onClick={() => handleViewMemberStatement(member)}
                                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 cursor-pointer"
                              >
                                <FaFileAlt className="h-4 w-4 mr-2" />
                                View Financial Statement
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transaction History Section */}
        <div id="transaction-history-section" className="grid grid-cols-1 lg:grid-cols-1 gap-8 mb-8">
          <Card>
            <SectionHeader
              title="Transaction History"
              description="View all collection transactions with receipts and edit options"
            />
            <SectionContent>
              {/* Filters and Controls */}
              <div className="mb-6 space-y-4">
                {/* Filter Toggle and Actions */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                    >
                      <FaFilter className="mr-2" />
                      {showFilters ? 'Hide Filters' : 'Show Filters'}
                    </button>
                    {showFilters && (
                      <button
                        onClick={clearFilters}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {/* Items per page selector */}
                    <div className="flex items-center space-x-2">
                      <label className="text-sm text-gray-600">Show:</label>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                      </select>
                    </div>
                    
                    <button
                      onClick={() => {
                        loadAdminTransactionHistory(currentPage);
                        loadAdditionalData();
                        refreshDashboard();
                      }}
                      disabled={loadingCollections}
                      className="p-2 sm:p-3 text-gray-400 hover:text-blue-600 disabled:opacity-50 rounded-lg hover:bg-blue-50 transition-all duration-200 cursor-pointer"
                      title="Refresh transaction data"
                    >
                      <FaSync className={`h-4 w-4 sm:h-5 sm:w-5 ${loadingCollections ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>
                
                {/* Filter Panel */}
                {showFilters && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {/* Group Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Group
                        </label>
                        <select
                          value={filters.group_id}
                          onChange={(e) => handleFilterChange('group_id', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                        >
                          <option value="">All Groups</option>
                          {groups.map((group) => (
                            <option key={group.id} value={group.id}>
                              {group.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Start Date Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <FaCalendarAlt className="inline mr-1" />
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={filters.start_date}
                          onChange={(e) => handleFilterChange('start_date', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      {/* End Date Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <FaCalendarAlt className="inline mr-1" />
                          End Date
                        </label>
                        <input
                          type="date"
                          value={filters.end_date}
                          onChange={(e) => handleFilterChange('end_date', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      {/* Apply Filter Button */}
                      <div className="flex items-end">
                        <button
                          onClick={applyFilters}
                          className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-200 cursor-pointer"
                        >
                          Apply Filters
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Results Count */}
                {totalCollections > 0 && (
                  <div className="text-sm text-gray-600">
                    Showing {startItem} to {endItem} of {totalCollections} transactions
                  </div>
                )}
              </div>
              
              {loadingCollections ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-500 text-lg">Loading transaction history...</p>
                </div>
              ) : collections.length > 0 ? (
                <div className="space-y-4">
                  {collections.map((collection) => (
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
                              Receipt: {collection.receipt_number || 'N/A'}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {collection.is_verified && (
                              <button
                                onClick={() => handleEditCollection(collection)}
                                className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors duration-200 cursor-pointer"
                                title="Edit Collection"
                              >
                                <FaEdit className="mr-1" />
                                Edit Collection
                              </button>
                            )}
                            {collection.receipt_file_path && (
                              <button
                                onClick={() => handleViewReceipt(collection.id, collection.receipt_file_path)}
                                className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors duration-200 cursor-pointer"
                                title="View/Download Receipt"
                              >
                                <FaFileDownload className="mr-1" />
                                Receipt
                              </button>
                            )}
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                              collection.is_verified 
                                ? 'bg-green-100 text-green-800 border border-green-200' 
                                : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                            }`}>
                              {collection.is_verified ? '✅ Verified' : '⏳ Pending'}
                            </span>
                          </div>
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
                  <p className="text-sm text-gray-500">
                    {showFilters && (filters.group_id || filters.start_date || filters.end_date)
                      ? 'No collections found matching your filters.'
                      : 'No collections found.'}
                  </p>
                </div>
              )}
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200 pt-4">
                  <div className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* Previous Button */}
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1 || loadingCollections}
                      className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors duration-200"
                    >
                      <FaChevronLeft className="h-4 w-4" />
                    </button>
                    
                    {/* Page Numbers */}
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            disabled={loadingCollections}
                            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 cursor-pointer ${
                              currentPage === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    {/* Next Button */}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages || loadingCollections}
                      className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors duration-200"
                    >
                      <FaChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </SectionContent>
          </Card>
        </div>
      </main>

      {/* User Management Modal */}
      <UserManagementModal
        isOpen={showUserManagementModal}
        onClose={() => setShowUserManagementModal(false)}
        onDataChanged={async () => {
          await loadAdditionalData();
        }}
      />

      {/* Payable Management Modal */}
      {showPayableManagement && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-0 border w-11/12 max-w-7xl shadow-2xl rounded-xl bg-white overflow-hidden">
            {/* Enhanced Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                  Payable Management
                </h3>
                    <p className="text-purple-100 text-sm">
                      Manage member bonuses, incentives, and payable amounts
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPayableManagement(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200 cursor-pointer"
                  title="Close Payable Management"
                >
                  <FaTimes className="h-6 w-6 text-white" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <PayableManagement />
            </div>
          </div>
        </div>
      )}

      {/* Interest Rate Modal */}
      {showInterestRateModal && selectedLoanForApproval && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Set Interest Rate
                </h3>
                <button
                  onClick={() => {
                    setShowInterestRateModal(false);
                    setSelectedLoanForApproval(null);
                    setInterestRate("");
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-4">
                <div className="bg-blue-50 p-3 rounded-md mb-4">
                  <h4 className="font-medium text-blue-900">Loan Details:</h4>
                  <p className="text-sm text-blue-800">
                    <strong>Member:</strong> {selectedLoanForApproval.name}
                    <br />
                    <strong>Amount:</strong>{" "}
                    {formatIndianCurrency(selectedLoanForApproval.amount)}
                    <br />
                    <strong>Group:</strong> {selectedLoanForApproval.group_name}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interest Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 12.5"
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the interest rate percentage (e.g., 12.5 for 12.5%).
                    Leave empty to use default rate.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowInterestRateModal(false);
                    setSelectedLoanForApproval(null);
                    setInterestRate("");
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInterestRateApproval}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                >
                  {interestRate
                    ? `Approve with ${interestRate}% Rate`
                    : "Approve with Default Rate"}
                </button>
              </div>
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
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Print Members Report
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Do you want to print the current member data? This will
                  include all {filteredMembers.length} member(s) currently
                  displayed in the table.
                </p>
                <div className="flex justify-center space-x-3">
                  <button
                    onClick={cancelPrint}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmPrint}
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

      {/* Reports Modal */}
      <ReportsModal
        isOpen={showReportsModal}
        onClose={() => setShowReportsModal(false)}
        groups={groups}
        user={user}
      />

      {/* Edit Collection Modal */}
      {showEditCollectionModal && selectedCollectionForEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-gray-200 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-5 border-b border-gray-200 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg p-2">
                    <FaEdit className="text-white h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Edit Collection</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedCollectionForEdit.group?.name || 'Unknown Group'} - {new Date(selectedCollectionForEdit.collection_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowEditCollectionModal(false);
                    setSelectedCollectionForEdit(null);
                    setCollectionItems([]);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200 cursor-pointer"
                >
                  <FaTimes className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> You can edit multiple transaction amounts at once. Only changed amounts will be saved.
                  </p>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Member</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Transaction Type</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Current Amount</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">New Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {collectionItems.map((item, index) => (
                        <tr key={item.id} className={`border-b border-gray-100 ${item.hasChanged ? 'bg-yellow-50' : 'hover:bg-gray-50'}`}>
                          <td className="py-3 px-4 text-sm font-semibold text-gray-700">
                            {item.member?.user?.full_name || item.member?.member_code || `Member ${item.member_id}`}
                          </td>
                          <td className="py-3 px-4 text-sm font-semibold text-gray-700">
                            {formatPaymentType(item.payment_type)}
                          </td>
                          <td className="py-3 px-4 text-sm font-semibold text-gray-900 text-right">
                            {formatIndianCurrency(item.amount)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.editedAmount}
                              onChange={(e) => handleCollectionItemAmountChange(index, e.target.value)}
                              className={`w-32 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-right ${
                                item.hasChanged ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'
                              }`}
                              placeholder="Enter amount"
                            />
                            {item.hasChanged && (
                              <span className="ml-2 text-xs text-yellow-600">Changed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {collectionItems.filter(item => item.hasChanged).length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>{collectionItems.filter(item => item.hasChanged).length}</strong> transaction(s) will be updated.
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-2xl flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowEditCollectionModal(false);
                  setSelectedCollectionForEdit(null);
                  setCollectionItems([]);
                }}
                disabled={editingCollection}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCollectionEdits}
                disabled={editingCollection || collectionItems.filter(item => item.hasChanged).length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {editingCollection ? 'Saving...' : `Save ${collectionItems.filter(item => item.hasChanged).length > 0 ? `${collectionItems.filter(item => item.hasChanged).length} Change(s)` : 'Changes'}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Member Statement Modal */}
      <MemberStatementModal
        isOpen={showMemberStatement}
        onClose={() => setShowMemberStatement(false)}
        memberId={selectedMemberForStatement?.id}
        memberData={selectedMemberForStatement}
      />

      {/* Receipt Viewer Modal */}
      {showReceiptModal && receiptUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-gray-200 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg p-2">
                  <FaFileDownload className="text-white h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Receipt</h3>
                  <p className="text-sm text-gray-600 mt-1">{receiptFileName}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = receiptUrl;
                    link.download = receiptFileName;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 cursor-pointer"
                  title="Download Receipt"
                >
                  <FaDownload className="h-5 w-5" />
                </button>
                <button
                  onClick={handleCloseReceiptModal}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200 cursor-pointer"
                >
                  <FaTimes className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-auto p-6 bg-gray-50">
              <div className="flex items-center justify-center min-h-full">
                {receiptFileName.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/) ? (
                  // Display image
                  <img
                    src={receiptUrl}
                    alt="Receipt"
                    className="max-w-full max-h-[70vh] rounded-lg shadow-lg border border-gray-200 object-contain"
                  />
                ) : receiptFileName.toLowerCase().endsWith('.pdf') ? (
                  // Display PDF
                  <iframe
                    src={receiptUrl}
                    className="w-full h-[70vh] rounded-lg shadow-lg border border-gray-200"
                    title="Receipt PDF"
                  />
                ) : (
                  // Download link for other file types
                  <div className="text-center">
                    <div className="bg-white rounded-lg p-8 border border-gray-200 shadow-lg">
                      <FaFileDownload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg font-semibold text-gray-900 mb-2">Receipt File</p>
                      <p className="text-sm text-gray-600 mb-4">{receiptFileName}</p>
                      <button
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = receiptUrl;
                          link.download = receiptFileName;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-semibold cursor-pointer"
                      >
                        Download Receipt
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

export default AdminDashboard;
