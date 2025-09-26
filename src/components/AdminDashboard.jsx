import { useState, useEffect } from "react";
import { toast, Toaster } from "react-hot-toast";
import {
  FaCheck,
  FaTimes,
  FaEdit,
  FaTrash,
  FaEye,
} from "react-icons/fa";
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
  generateFilename
} from "./admin";
import PayableManagement from "./admin/PayableManagement";

function AdminDashboard({ user, onLogout }) {
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [groups, setGroups] = useState([]);
  const [members, setMembers] = useState([]);
  const [loans, setLoans] = useState([]);
  const [teamLeaders, setTeamLeaders] = useState([]);
  const [billCollectors, setBillCollectors] = useState([]);
  const [error, setError] = useState("");
  
  // Use custom hook for dashboard data
  const { data: dashboardStats, loading: isLoading, refreshData: refreshDashboard } = useDashboardData('admin');
  
  // Form submission hooks
  const { isSubmitting: isCreatingGroup, submitForm: submitGroupForm, resetForm: resetGroupForm } = useFormSubmission();
  const { isSubmitting: isUpdatingGroup, submitForm: submitUpdateGroupForm, resetForm: resetUpdateGroupForm } = useFormSubmission();
  const { isSubmitting: isDeletingGroup, submitForm: submitDeleteGroupForm, resetForm: resetDeleteGroupForm } = useFormSubmission();
  const { isSubmitting: isGeneratingReport, submitForm: submitGenerateReportForm } = useFormSubmission();
  
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
  const [showPrintConfirmation, setShowPrintConfirmation] = useState(false);
  
  
  // Form states
  const [groupForm, setGroupForm] = useState({
    name: "",
    location: "",
    bill_collector_name: ""
  });

  // Reports state
  const [reportType, setReportType] = useState("members");
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
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
  }, []);

  useEffect(() => {
    let filtered = members;

    // Text search filter
    if (memberFilter.trim() !== "") {
      const searchTerm = memberFilter.toLowerCase();
      filtered = filtered.filter(member => {
        const memberName = (member.user?.full_name || member.user?.username || "").toLowerCase();
        const memberEmail = (member.user?.email || "").toLowerCase();
        const groupName = (member.group?.name || "").toLowerCase();
        const location = (member.group?.location || "").toLowerCase();
        const memberCode = (member.member_code || "").toLowerCase();
        
        return memberName.includes(searchTerm) || 
               memberEmail.includes(searchTerm) ||
               groupName.includes(searchTerm) || 
               location.includes(searchTerm) ||
               memberCode.includes(searchTerm);
      });
    }

    // Group filter
    if (groupFilter !== "") {
      filtered = filtered.filter(member => 
        member.group?.id?.toString() === groupFilter
      );
    }

    // Status filter
    if (statusFilter !== "") {
      filtered = filtered.filter(member => 
        member.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Location filter
    if (locationFilter !== "") {
      filtered = filtered.filter(member => 
        member.group?.location === locationFilter
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
      
      // Load groups
      const groupsData = await apiService.getGroups();
      setGroups(groupsData);
      
      // Load members
      const membersData = await apiService.getMembers();
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
      // Load all users
      const users = await apiService.getUsers();
      
      // Filter users by specific roles
      const teamLeadersList = users.filter(user => 
        user.is_active && 
        user.roles && 
        user.roles.some(role => role.name === "teamleader")
      );
      
      const billCollectorsList = users.filter(user => 
        user.is_active && 
        user.roles && 
        user.roles.some(role => role.name === "billcollector")
      );
      
      // Fallback: if no users with specific roles found, show all active users
      // This helps with debugging and development
      if (teamLeadersList.length === 0) {
        const activeUsers = users.filter(user => user.is_active);
        setTeamLeaders(activeUsers);
      } else {
        setTeamLeaders(teamLeadersList);
      }
      
      if (billCollectorsList.length === 0) {
        const activeUsers = users.filter(user => user.is_active);
        setBillCollectors(activeUsers);
      } else {
        setBillCollectors(billCollectorsList);
      }
      
      
    } catch (error) {
      // Don't set error state here as it's not critical for main functionality
    }
  };

  const handleApproval = async (approvalType, recordId, action, notes = "") => {
    // If approving a loan, show interest rate modal first
    if (approvalType === 'loan' && action === 'approve') {
      const loan = loanApprovals.find(l => l.id === recordId);
      if (loan) {
        setSelectedLoanForApproval(loan);
        setInterestRate(""); // Reset interest rate
        setShowInterestRateModal(true);
        return;
      }
    }
    
    // For other cases, show confirmation toast
    const actionText = action === 'approve' ? 'approve' : 'reject';
    const recordType = approvalType === 'member' ? 'member' : 'loan request';
    
    toast((t) => (
      <div className="flex items-center space-x-4">
        <span>Are you sure you want to {actionText} this {recordType}?</span>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              toast.dismiss(t.id);
              confirmApproval(approvalType, recordId, action, notes);
            }}
            className={`px-3 py-1 text-white text-sm rounded hover:opacity-80 ${
              action === 'approve' 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-red-600 hover:bg-red-700'
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
    ), {
      duration: 10000,
      position: "top-center",
    });
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
        approval_type: 'loan',
        record_id: selectedLoanForApproval.id,
        action: 'approve',
        notes: rate ? `Interest rate set to ${interestRate}%` : 'Using default interest rate',
        interest_rate: rate
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
      const rateMessage = rate ? `${interestRate}%` : 'default';
      toast.success(`Loan approved with ${rateMessage} interest rate!`);
      
    } catch (error) {
      toast.error(`Failed to approve loan: ${error.message}`);
    }
  };

  const confirmApproval = async (approvalType, recordId, action, notes = "") => {
    try {
      const approvalData = {
        approval_type: approvalType,
        record_id: recordId,
        action: action,
        notes: notes
      };
      
      await apiService.approveRecord(approvalData);
      
      // Reload data after approval
      await loadAdditionalData();
      refreshDashboard();
      
      // Show success message using toast
      toast.success(`${action === 'approve' ? 'Approved' : 'Rejected'} successfully!`);
      
    } catch (error) {
      toast.error(`Failed to ${action}: ${error.message}`);
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
    
    await submitGroupForm(async () => {
      // Prepare form data, handling optional fields properly
      const groupData = {
        name: groupForm.name.trim(),
        location: groupForm.location.trim()
      };
      
      // Convert bill collector name to ID if selected
      if (groupForm.bill_collector_name && groupForm.bill_collector_name.trim() !== "") {
        const billCollector = billCollectors.find(user => 
          (user.full_name || user.username) === groupForm.bill_collector_name
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
    }, {
      onError: (error) => {
        const errorMessage = error.message || "Failed to create group. Please try again.";
        toast.error(errorMessage);
      }
    });
  };

  const handleEditGroup = (group) => {
    setEditingGroup(group);
    setGroupForm({
      name: group.name || "",
      location: group.location || "",
      team_leader_name: group.team_leader?.full_name || group.team_leader?.username || "",
      bill_collector_name: group.bill_collector?.full_name || group.bill_collector?.username || ""
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
    
    await submitUpdateGroupForm(async () => {
      // Prepare form data, handling optional integer fields properly
      const groupData = {
        name: groupForm.name.trim(),
        location: groupForm.location.trim()
      };
      
      // Convert team leader name to ID if selected (from group members)
      let selectedTeamLeaderUserId = null;
      if (groupForm.team_leader_name && groupForm.team_leader_name.trim() !== "") {
        const teamLeaderMember = members.find(member => 
          member.group_id === editingGroup.id && 
          (member.user?.full_name || member.user?.username) === groupForm.team_leader_name
        );
        if (teamLeaderMember) {
          groupData.team_leader_id = teamLeaderMember.user_id;
          selectedTeamLeaderUserId = teamLeaderMember.user_id;
        } else {
          throw new Error("Selected team leader not found in this group");
        }
      }
      
      // Convert bill collector name to ID if selected
      if (groupForm.bill_collector_name && groupForm.bill_collector_name.trim() !== "") {
        const billCollector = billCollectors.find(user => 
          (user.full_name || user.username) === groupForm.bill_collector_name
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
        const teamLeaderRole = roles.find(r => r.name === 'teamleader');
        const memberRole = roles.find(r => r.name === 'member');
        
        if (teamLeaderRole && memberRole) {
          // If there was a previous team leader, revert them to member role
          if (editingGroup.team_leader && editingGroup.team_leader.id !== selectedTeamLeaderUserId) {
            await apiService.replaceUserRole(editingGroup.team_leader.id, memberRole.id);
          }
          
          // If a new team leader was selected, change their role to teamleader
          if (selectedTeamLeaderUserId) {
            await apiService.replaceUserRole(selectedTeamLeaderUserId, teamLeaderRole.id);
          }
        }
      } catch (e) {
        toast.error('Group updated but role assignment failed');
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
        bill_collector_name: ""
      });
      
      // Show success message after all operations are complete
      toast.success("Group updated successfully!");
    }, {
      onError: (error) => {
        toast.error(error.message || "Failed to update group");
      }
    });
  };

  const handleDeleteGroup = async (groupId) => {
    // Prevent multiple confirmation dialogs
    if (isDeletingGroup) {
      return;
    }
    
    // Show confirmation toast instead of alert
    toast((t) => (
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
    ), {
      duration: 10000,
      position: "top-center",
    });
  };

  const confirmDeleteGroup = async (groupId) => {
    await submitDeleteGroupForm(async () => {
      await apiService.deleteGroup(groupId);
      
      // Refresh data after successful deletion
      await loadAdditionalData();
      refreshDashboard();
      
      // Show success message after all operations are complete
      toast.success("Group deleted successfully!", {
        duration: 3000,
        position: "top-center",
      });
    }, {
      onError: (error) => {
        const errorMessage = error.message || "Failed to delete group. Please try again.";
        const toastId = toast((t) => (
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

  const handleViewReports = () => {
    setShowReportsModal(true);
  };

  const handleViewMembers = () => {
    setShowMembersModal(true);
  };

  const handleManagePayables = () => {
    setShowPayableManagement(true);
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
    await submitGenerateReportForm(async () => {
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
    }, {
      onError: (error) => {
        toast.error("Failed to generate report. Please try again.");
      }
    });
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
    const printWindow = window.open('', '_blank');
    
    // Get current date for the report
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Get selected group name if filtered
    const selectedGroup = groups.find(g => g.id === parseInt(groupFilter));
    const groupName = selectedGroup ? selectedGroup.name : 'All Groups';

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
          <p><strong>Status:</strong> ${statusFilter || 'All Status'}</p>
          <p><strong>Location:</strong> ${locationFilter || 'All Locations'}</p>
          <p><strong>Search:</strong> ${memberFilter || 'No search filter'}</p>
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
            ${printData.map((member, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${member.member_code || 'N/A'}</td>
                <td>${member.user?.full_name || member.user?.username || 'N/A'}</td>
                <td>${member.group?.name || 'N/A'}</td>
                <td>${member.group?.location || 'N/A'}</td>
                <td>
                  <span class="status status-${(member.status || '').toLowerCase()}">
                    ${member.status || 'N/A'}
                  </span>
                </td>
                <td>${loans.filter(loan => loan.member_id === member.id && (loan.status === 'ACTIVE' || loan.status === 'DISBURSED' || loan.status === 'APPROVED')).length}</td>
                <td>${member.joined_date ? new Date(member.joined_date).toLocaleDateString() : 'N/A'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>This report was generated from the Microfinance Management System</p>
          <p>Report contains ${printData.length} member(s) as of ${currentDate}</p>
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
      position: "top-center"
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
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
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
            duration: 6000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
            style: {
              background: '#EF4444',
              color: '#fff',
              zIndex: 9999,
            },
          },
          info: {
            duration: 4000,
            iconTheme: {
              primary: '#3B82F6',
              secondary: '#fff',
            },
            style: {
              background: '#3B82F6',
              color: '#fff',
            },
          },
        }}
      />
      
      <style dangerouslySetInnerHTML={{
        __html: `
          [data-hot-toast] button {
            pointer-events: auto !important;
            cursor: pointer !important;
            z-index: 9999 !important;
          }
          [data-hot-toast] button:hover {
            opacity: 0.8 !important;
          }
        `
      }} />
      
      <DashboardHeader 
        title="Admin Dashboard"
        userName={user.name}
        onLogout={handleLogout}
      />

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
        {/* Main Content */}
            <StatsCards 
              dashboardStats={dashboardStats}
              memberApprovals={memberApprovals}
              loanApprovals={loanApprovals}
            />

            {/* Pending Approvals Section */}
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 mb-8">
              {/* Pending Member Approvals */}
              <Card>
            <SectionHeader
              title="Pending Member Approvals"
              description="Members awaiting approval"
            />
            <SectionContent>
              <div className="overflow-x-auto">
                <Table headers={["Name", "Group", "Location", "Team Leader", "Bill Collector", "Date", "Action"]}>
                {memberApprovals.length === 0 ? (
                  <Table.EmptyRow message="No pending member approvals" colSpan={7} />
                ) : (
                  memberApprovals.map((item) => (
                    <Table.Row key={item.id}>
                      <Table.Cell className="px-2 sm:px-4 lg:px-6 py-4 text-xs sm:text-sm font-medium text-gray-900 whitespace-nowrap">
                        {item.name}
                      </Table.Cell>
                      <Table.Cell className="px-2 sm:px-4 lg:px-6 py-4 text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                        {item.group_name || 'N/A'}
                      </Table.Cell>
                      <Table.Cell className="px-2 sm:px-4 lg:px-6 py-4 text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                        {item.location || 'N/A'}
                      </Table.Cell>
                      <Table.Cell className="px-2 sm:px-4 lg:px-6 py-4 text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                        {item.team_leader || 'Not assigned'}
                      </Table.Cell>
                      <Table.Cell className="px-2 sm:px-4 lg:px-6 py-4 text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                        {item.bill_collector || 'Not assigned'}
                      </Table.Cell>
                      <Table.Cell className="px-2 sm:px-4 lg:px-6 py-4 text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                        {item.date}
                      </Table.Cell>
                      <Table.Cell className="px-2 sm:px-4 lg:px-6 py-4 text-xs sm:text-sm font-medium">
                        <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                          <button
                            onClick={() => handleApproval("member", item.id, "approve")}
                            className="w-full sm:w-auto text-xs px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded flex items-center justify-center gap-1"
                          >
                            <FaCheck className="w-3 h-3" />
                            <span className="hidden sm:inline">Approve</span>
                          </button>
                          <button
                            onClick={() => handleApproval("member", item.id, "reject")}
                            className="w-full sm:w-auto text-xs px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded flex items-center justify-center gap-1"
                          >
                            <FaTimes className="w-3 h-3" />
                            <span className="hidden sm:inline">Reject</span>
                          </button>
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  ))
                )}
                </Table>
              </div>
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
              <div className="overflow-x-auto">
                <Table headers={["Name", "Group", "Amount", "Location", "Team Leader", "Bill Collector", "Date", "Action"]}>
                {loanApprovals.length === 0 ? (
                  <Table.EmptyRow message="No pending loan approvals" colSpan={8} />
                ) : (
                  loanApprovals.map((loan) => (
                    <Table.Row key={loan.id}>
                      <Table.Cell className="px-2 sm:px-4 lg:px-6 py-4 text-xs sm:text-sm font-medium text-gray-900 whitespace-nowrap">
                        {loan.name}
                      </Table.Cell>
                      <Table.Cell className="px-2 sm:px-4 lg:px-6 py-4 text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                        {loan.group_name || 'N/A'}
                      </Table.Cell>
                      <Table.Cell className="px-2 sm:px-4 lg:px-6 py-4 text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                        {formatIndianCurrency(loan.amount)}
                      </Table.Cell>
                      <Table.Cell className="px-2 sm:px-4 lg:px-6 py-4 text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                        {loan.location}
                      </Table.Cell>
                      <Table.Cell className="px-2 sm:px-4 lg:px-6 py-4 text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                        {loan.team_leader || 'Not assigned'}
                      </Table.Cell>
                      <Table.Cell className="px-2 sm:px-4 lg:px-6 py-4 text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                        {loan.bill_collector || 'Not assigned'}
                      </Table.Cell>
                      <Table.Cell className="px-2 sm:px-4 lg:px-6 py-4 text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                        {loan.date}
                      </Table.Cell>
                      <Table.Cell className="px-2 sm:px-4 lg:px-6 py-4 text-xs sm:text-sm font-medium">
                        <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                          <button
                            onClick={() => handleApproval("loan", loan.id, "approve")}
                            className="w-full sm:w-auto text-xs px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded flex items-center justify-center gap-1"
                          >
                            <FaCheck className="w-3 h-3" />
                            <span className="hidden sm:inline">Approve</span>
                          </button>
                          <button
                            onClick={() => handleApproval("loan", loan.id, "reject")}
                            className="w-full sm:w-auto text-xs px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded flex items-center justify-center gap-1"
                          >
                            <FaTimes className="w-3 h-3" />
                            <span className="hidden sm:inline">Reject</span>
                          </button>
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  ))
                )}
                </Table>
              </div>
            </SectionContent>
          </Card>
        </div>

        <QuickActions
          onCreateGroup={() => setShowCreateGroupModal(true)}
          onViewReports={handleViewReports}
          onViewMembers={handleViewMembers}
          onManageUsers={() => setShowUserManagementModal(true)}
          onManagePayables={handleManagePayables}
        />







        {/* Groups Management Section */}
        <Card>
          <SectionHeader
            title="Group Management"
            description="All groups in the system"
          />
          <SectionContent padding="p-0">
            <div className="overflow-x-auto">
              <Table headers={["Group Name", "Location", "Members", "Team Leader", "Bill Collector", "Action"]}>
              {groups.length === 0 ? (
                <Table.EmptyRow message="No groups found" colSpan={6} />
              ) : (
                groups.map((group) => (
                  <Table.Row key={group.id}>
                    <Table.Cell className="px-2 sm:px-4 lg:px-6 py-4 text-xs sm:text-sm font-medium text-gray-900 whitespace-nowrap">
                      {group.name}
                    </Table.Cell>
                    <Table.Cell className="px-2 sm:px-4 lg:px-6 py-4 text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                      {group.location}
                    </Table.Cell>
                    <Table.Cell className="px-2 sm:px-4 lg:px-6 py-4 text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                      {group.member_count || 0}
                    </Table.Cell>
                    <Table.Cell className="px-2 sm:px-4 lg:px-6 py-4 text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                      {group.team_leader
                        ? `${group.team_leader.full_name || group.team_leader.username} (Team Leader)`
                        : 'Not assigned'}
                    </Table.Cell>
                    <Table.Cell className="px-2 sm:px-4 lg:px-6 py-4 text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                      {group.bill_collector?.full_name || group.bill_collector?.username || 'Not assigned'}
                    </Table.Cell>
                    <Table.Cell className="px-2 sm:px-4 lg:px-6 py-4 text-xs sm:text-sm font-medium">
                      <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                        <button
                          onClick={() => handleEditGroup(group)}
                          className="w-full sm:w-auto text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center justify-center gap-1"
                        >
                          <FaEdit className="w-3 h-3" />
                          <span className="hidden sm:inline">Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteGroup(group.id)}
                          disabled={isDeletingGroup}
                          className={`w-full sm:w-auto text-xs px-2 py-1 rounded flex items-center justify-center gap-1 ${
                            isDeletingGroup 
                              ? 'bg-red-400 cursor-not-allowed' 
                              : 'bg-red-600 hover:bg-red-700'
                          } text-white`}
                        >
                          {isDeletingGroup ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                          ) : (
                            <FaTrash className="w-3 h-3" />
                          )}
                          <span className="hidden sm:inline">
                            {isDeletingGroup ? 'Deleting...' : 'Delete'}
                          </span>
                        </button>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                                  ))
                )}
                </Table>
              </div>
            </SectionContent>
        </Card>

      <CreateGroupModal
        isOpen={showCreateGroupModal}
        onClose={() => {
          setShowCreateGroupModal(false);
          setGroupForm({ name: "", location: "", bill_collector_name: "" });
          resetGroupForm();
        }}
        groupForm={groupForm}
        onFormChange={(field, value) => setGroupForm({...groupForm, [field]: value})}
        onSubmit={handleCreateGroup}
        billCollectors={billCollectors}
        isLoading={isCreatingGroup}
      />


      {/* Edit Group Modal */}
      {showEditGroupModal && editingGroup && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Edit Group: {editingGroup.name}</h3>
                <button
                  onClick={() => {
                    setShowEditGroupModal(false);
                    setEditingGroup(null);
                    setGroupForm({ name: "", location: "", bill_collector_name: "" });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="h-6 w-6" />
                </button>
              </div>
              <form onSubmit={handleUpdateGroup}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Group Name *</label>
                  <input
                    type="text"
                    required
                    value={groupForm.name}
                    onChange={(e) => setGroupForm({...groupForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter group name"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                  <input
                    type="text"
                    required
                    value={groupForm.location}
                    onChange={(e) => setGroupForm({...groupForm, location: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter location"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Team Leader (Optional)</label>
                  <select
                    value={groupForm.team_leader_name || ""}
                    onChange={(e) => setGroupForm({...groupForm, team_leader_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a team leader</option>
                    {editingGroup && members.filter(m => m.group_id === editingGroup.id).length > 0 ? (
                      members.filter(m => m.group_id === editingGroup.id).map((member) => (
                        <option key={member.id} value={member.user?.full_name || member.user?.username}>
                          {member.user?.full_name || member.user?.username}
                          {member.user?.email ? ` (${member.user.email})` : ''}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No members in this group</option>
                    )}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bill Collector (Optional)</label>
                  <select
                    value={groupForm.bill_collector_name || ""}
                    onChange={(e) => setGroupForm({...groupForm, bill_collector_name: e.target.value})}
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
                    <strong>Note:</strong> Team leader can only be selected from existing group members. 
                    Add members to the group first if you want to assign a team leader.
                  </p>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditGroupModal(false);
                      setEditingGroup(null);
                      setGroupForm({ name: "", location: "", bill_collector_name: "" });
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingGroup}
                    className={`px-4 py-2 text-sm font-medium rounded-md flex items-center ${
                      isUpdatingGroup 
                        ? 'bg-blue-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    } text-white`}
                  >
                    {isUpdatingGroup && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    )}
                    {isUpdatingGroup ? 'Updating...' : 'Update Group'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

             {/* Reports Modal */}
       {showReportsModal && (
         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
           <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
             <div className="mt-3">
               <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-medium text-gray-900">Generate Report</h3>
                 <button
                   onClick={() => setShowReportsModal(false)}
                   className="text-gray-400 hover:text-gray-600"
                 >
                   <FaTimes className="h-6 w-6" />
                 </button>
               </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Report Type *</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="members">Members</option>
                  <option value="loans">Loans</option>
                  <option value="groups">Groups</option>
                </select>
              </div>
                               <div className="mb-4">
                   <label className="block text-sm font-medium text-gray-700 mb-2">Date (for Members/Loans)</label>
                   <input
                     type="date"
                     value={reportDate}
                     onChange={(e) => setReportDate(e.target.value)}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                   />
                 </div>
                 <div className="mb-4 p-3 bg-gray-50 rounded-md">
                   <p className="text-sm text-gray-600">
                     <strong>Report Summary:</strong><br />
                     • Type: {reportType.charAt(0).toUpperCase() + reportType.slice(1)}<br />
                     • Date: {reportDate}<br />
                     • Records: {reportType === 'members' ? members.length : reportType === 'loans' ? loans.length : groups.length}
                   </p>
                 </div>
                             <div className="flex justify-end space-x-3">
                 <button
                   type="button"
                   onClick={refreshReportsData}
                   disabled={isRefreshingReports}
                   className={`px-4 py-2 text-sm font-medium rounded-md ${
                     isRefreshingReports 
                       ? 'bg-gray-400 cursor-not-allowed' 
                       : 'bg-gray-200 hover:bg-gray-300'
                   } text-gray-700`}
                 >
                   {isRefreshingReports ? (
                     <>
                       <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                       Refreshing...
                     </>
                   ) : (
                     'Refresh Data'
                   )}
                 </button>
                 <button
                   type="button"
                   onClick={() => setShowReportsModal(false)}
                   className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                 >
                   Cancel
                 </button>
                 <button
                   type="button"
                   onClick={generateReport}
                   disabled={isGeneratingReport}
                   className={`px-4 py-2 text-sm font-medium rounded-md flex items-center ${
                     isGeneratingReport 
                       ? 'bg-gray-400 cursor-not-allowed' 
                       : 'bg-green-600 hover:bg-green-700'
                   } text-white`}
                 >
                   {isGeneratingReport && (
                     <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                   )}
                   {isGeneratingReport ? 'Generating...' : 'Generate Report'}
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Members Management Modal */}
       {showMembersModal && (
         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 sm:top-20 mx-auto p-3 sm:p-5 border w-11/12 max-w-7xl shadow-lg rounded-md bg-white">
             <div className="mt-3">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Members Management</h3>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handlePrintMembers}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print
                  </button>
                 <button
                   onClick={() => setShowMembersModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                 >
                    <FaTimes className="h-5 w-5 sm:h-6 sm:w-6" />
                 </button>
               </div>
              </div>
              
                <div className="mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search Filter */}
                  <div className="sm:col-span-2 lg:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Search Members</label>
                      <input
                        type="text"
                        value={memberFilter}
                        onChange={(e) => setMemberFilter(e.target.value)}
                        placeholder="Search by name, email, code..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>

                    {/* Group Filter */}
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Group</label>
                      <select
                        value={groupFilter}
                        onChange={(e) => setGroupFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        <option value="">All Groups</option>
                        {groups.map(group => (
                          <option key={group.id} value={group.id}>
                            {group.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Status Filter */}
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Location</label>
                      <select
                        value={locationFilter}
                        onChange={(e) => setLocationFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        <option value="">All Locations</option>
                        {[...new Set(groups.map(group => group.location).filter(Boolean))].map(location => (
                          <option key={location} value={location}>
                            {location}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Clear Filters Button */}
                <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
                    <button
                      onClick={() => {
                        setMemberFilter("");
                        setGroupFilter("");
                        setStatusFilter("");
                        setLocationFilter("");
                      }}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Clear All Filters
                    </button>
                    <p className="text-sm text-gray-500">
                      Showing {filteredMembers.length} of {members.length} members
                    </p>
                  </div>
                </div>
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
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                                         {filteredMembers.length === 0 ? (
                       <tr>
                        <td colSpan="8" className="px-4 py-8 text-center text-sm text-gray-500">
                          <div className="flex flex-col items-center">
                            <div className="text-gray-400 mb-2">
                              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                            </div>
                            <p className="text-lg font-medium text-gray-900 mb-1">
                           {memberFilter.trim() === "" ? "No members found" : "No members match your search"}
                            </p>
                            <p className="text-sm text-gray-500">
                              {memberFilter.trim() === "" ? "Try adjusting your filters or add new members." : "Try adjusting your search criteria."}
                            </p>
                          </div>
                         </td>
                       </tr>
                     ) : (
                       filteredMembers.map((member, index) => (
                        <tr key={member.id} className="hover:bg-gray-50 transition-colors">
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
                              {member.user?.full_name || member.user?.username || "N/A"}
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
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              member.status?.toLowerCase() === 'active' 
                                ? "bg-green-100 text-green-800" 
                                : member.status?.toLowerCase() === 'pending'
                                ? "bg-yellow-100 text-yellow-800"
                                : member.status?.toLowerCase() === 'suspended'
                                ? "bg-orange-100 text-orange-800"
                                : member.status?.toLowerCase() === 'rejected'
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}>
                              {member.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
                            {loans.filter(loan => loan.member_id === member.id && (loan.status === 'ACTIVE' || loan.status === 'DISBURSED' || loan.status === 'APPROVED')).length}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-500">
                              {member.joined_date ? new Date(member.joined_date).toLocaleDateString() : "N/A"}
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
                      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
              </div>
                    <p className="text-lg font-medium text-gray-900 mb-1">
                      {memberFilter.trim() === "" ? "No members found" : "No members match your search"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {memberFilter.trim() === "" ? "Try adjusting your filters or add new members." : "Try adjusting your search criteria."}
                    </p>
            </div>
                ) : (
                  filteredMembers.map((member, index) => (
                    <div key={member.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-sm font-medium text-gray-500">{index + 1}</span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {member.member_code || "N/A"}
                            </span>
          </div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {member.user?.full_name || member.user?.username || "N/A"}
                          </h3>
                          {member.user?.email && (
                            <p className="text-sm text-gray-500">{member.user.email}</p>
                          )}
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          member.status?.toLowerCase() === 'active' 
                            ? "bg-green-100 text-green-800" 
                            : member.status?.toLowerCase() === 'pending'
                            ? "bg-yellow-100 text-yellow-800"
                            : member.status?.toLowerCase() === 'suspended'
                            ? "bg-orange-100 text-orange-800"
                            : member.status?.toLowerCase() === 'rejected'
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {member.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Group:</span>
                          <p className="font-medium text-gray-900">{member.group?.name || "N/A"}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Location:</span>
                          <p className="font-medium text-gray-900">{member.group?.location || "N/A"}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Active Loans:</span>
                          <p className="font-medium text-gray-900">
                            {loans.filter(loan => loan.member_id === member.id && (loan.status === 'ACTIVE' || loan.status === 'DISBURSED' || loan.status === 'APPROVED')).length}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Joined:</span>
                          <p className="font-medium text-gray-900">
                            {member.joined_date ? new Date(member.joined_date).toLocaleDateString() : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              </div>
            </div>
          </div>
        )}

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
          <div className="relative top-4 mx-auto p-5 border w-11/12 max-w-7xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Payable Management</h3>
                <button
                  onClick={() => setShowPayableManagement(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="h-6 w-6" />
                </button>
              </div>
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
                <h3 className="text-lg font-medium text-gray-900">Set Interest Rate</h3>
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
                    <strong>Member:</strong> {selectedLoanForApproval.name}<br/>
                    <strong>Amount:</strong> {formatIndianCurrency(selectedLoanForApproval.amount)}<br/>
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
                    Enter the interest rate percentage (e.g., 12.5 for 12.5%). Leave empty to use default rate.
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
                  {interestRate ? `Approve with ${interestRate}% Rate` : 'Approve with Default Rate'}
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
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Print Members Report</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Do you want to print the current member data? This will include all {filteredMembers.length} member(s) currently displayed in the table.
                </p>
                <div className="flex justify-center space-x-3">
                  <button
                    onClick={cancelPrint}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmPrint}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
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

export default AdminDashboard;
