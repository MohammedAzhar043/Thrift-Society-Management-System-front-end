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
import BonusManagement from "./admin/BonusManagement";

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
  const { isSubmitting: isGeneratingReport, submitForm: submitGenerateReportForm } = useFormSubmission();
  
  // Modal states
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showUserManagementModal, setShowUserManagementModal] = useState(false);
  const [showBonusManagement, setShowBonusManagement] = useState(false);
  const [selectedLoanForApproval, setSelectedLoanForApproval] = useState(null);
  const [interestRate, setInterestRate] = useState("");
  const [showInterestRateModal, setShowInterestRateModal] = useState(false);
  
  
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
      console.error("Error loading additional data:", error);
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
        console.warn("No team leaders found with role 'teamleader'. Showing all active users for debugging.");
        const activeUsers = users.filter(user => user.is_active);
        setTeamLeaders(activeUsers);
      } else {
        setTeamLeaders(teamLeadersList);
      }
      
      if (billCollectorsList.length === 0) {
        console.warn("No bill collectors found with role 'billcollector'. Showing all active users for debugging.");
        const activeUsers = users.filter(user => user.is_active);
        setBillCollectors(activeUsers);
      } else {
        setBillCollectors(billCollectorsList);
      }
      
      // Debug logging
      console.log("All users loaded:", users.length);
      console.log("Users with roles:", users.map(u => ({ 
        id: u.id, 
        name: u.full_name || u.username, 
        roles: u.roles?.map(r => r.name) || [],
        is_active: u.is_active 
      })));
      console.log("Team leaders found:", teamLeadersList.length, teamLeadersList.map(u => ({ id: u.id, name: u.full_name || u.username, roles: u.roles?.map(r => r.name) })));
      console.log("Bill collectors found:", billCollectorsList.length, billCollectorsList.map(u => ({ id: u.id, name: u.full_name || u.username, roles: u.roles?.map(r => r.name) })));
      
    } catch (error) {
      console.error("Error loading users:", error);
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
      console.error("Error processing loan approval:", error);
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
      console.error("Error processing approval:", error);
      toast.error(`Failed to ${action}: ${error.message}`);
    }
  };

  const handleLogout = async () => {
    try {
      await apiService.logout();
      onLogout();
    } catch (error) {
      console.error("Logout error:", error);
      onLogout(); // Still logout even if API call fails
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    
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
      
      console.log("Creating group with data:", groupData);
      console.log("API Service:", apiService);
      console.log("API Base URL:", apiService.baseURL);
      
      // Test the API call
      const response = await apiService.createGroup(groupData);
      console.log("API Response:", response);
      
      toast.success("Group created successfully!");
      setShowCreateGroupModal(false);
      setGroupForm({ name: "", location: "", bill_collector_name: "" });
      await loadAdditionalData();
      refreshDashboard();
    }, {
      onError: (error) => {
        console.error("Error creating group:", error);
        console.error("Error details:", {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
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
        console.error('Updating team leader roles failed:', e);
        toast.error('Group updated but role assignment failed');
      }
      
      // Refresh groups list
      await loadAdditionalData();
      refreshDashboard();
      
      // Close modal and show success message
      setShowEditGroupModal(false);
      setEditingGroup(null);
      setGroupForm({
        name: "",
        location: "",
        bill_collector_name: ""
      });
      
      toast.success("Group updated successfully!");
    }, {
      onError: (error) => {
        console.error("Error updating group:", error);
        toast.error(error.message || "Failed to update group");
      }
    });
  };

  const handleDeleteGroup = async (groupId) => {
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
    try {
      await apiService.deleteGroup(groupId);
      toast.success("Group deleted successfully!", {
        duration: 3000,
        position: "top-center",
      });
      await loadAdditionalData();
      refreshDashboard();
    } catch (error) {
      console.error("Error deleting group:", error);
      const errorMessage = error.message || "Failed to delete group. Please try again.";
      toast.error(errorMessage, {
        duration: 5000,
        position: "top-center",
      });
    }
  };

  const handleViewReports = () => {
    setShowReportsModal(true);
  };

  const handleViewMembers = () => {
    setShowMembersModal(true);
  };

  const handleManageBonuses = () => {
    setShowBonusManagement(true);
  };




  const refreshReportsData = async () => {
    try {
      setIsRefreshingReports(true);
      await loadAdditionalData();
      refreshDashboard();
      toast.success("Reports data refreshed successfully!");
    } catch (error) {
      console.error("Error refreshing reports data:", error);
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
        console.error("Error generating report:", error);
        toast.error("Failed to generate report. Please try again.");
      }
    });
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
                          <Button
                            onClick={() => handleApproval("member", item.id, "approve")}
                            variant="primary"
                            size="sm"
                            icon={FaCheck}
                            className="w-full sm:w-auto text-xs px-2 py-1"
                          >
                            <span className="hidden sm:inline">Approve</span>
                            <span className="sm:hidden">✓</span>
                          </Button>
                          <Button
                            onClick={() => handleApproval("member", item.id, "reject")}
                            variant="danger"
                            size="sm"
                            icon={FaTimes}
                            className="w-full sm:w-auto text-xs px-2 py-1"
                          >
                            <span className="hidden sm:inline">Reject</span>
                            <span className="sm:hidden">✗</span>
                          </Button>
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
                          <Button
                            onClick={() => handleApproval("loan", loan.id, "approve")}
                            variant="primary"
                            size="sm"
                            icon={FaCheck}
                            className="w-full sm:w-auto text-xs px-2 py-1"
                          >
                            <span className="hidden sm:inline">Approve</span>
                            <span className="sm:hidden">✓</span>
                          </Button>
                          <Button
                            onClick={() => handleApproval("loan", loan.id, "reject")}
                            variant="danger"
                            size="sm"
                            icon={FaTimes}
                            className="w-full sm:w-auto text-xs px-2 py-1"
                          >
                            <span className="hidden sm:inline">Reject</span>
                            <span className="sm:hidden">✗</span>
                          </Button>
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
          onManageBonuses={handleManageBonuses}
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
                        <Button
                          onClick={() => handleEditGroup(group)}
                          variant="primary"
                          size="sm"
                          icon={FaEdit}
                          className="w-full sm:w-auto text-xs px-2 py-1"
                        >
                          <span className="hidden sm:inline">Edit</span>
                          <span className="sm:hidden">✏</span>
                        </Button>
                        <Button
                          onClick={() => handleDeleteGroup(group.id)}
                          variant="danger"
                          size="sm"
                          icon={FaTrash}
                          className="w-full sm:w-auto text-xs px-2 py-1"
                        >
                          <span className="hidden sm:inline">Delete</span>
                          <span className="sm:hidden">🗑</span>
                        </Button>
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
           <>
         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
           <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
             <div className="mt-3">
               <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-medium text-gray-900">Members Management</h3>
                 <button
                   onClick={() => setShowMembersModal(false)}
                   className="text-gray-400 hover:text-gray-600"
                 >
                   <FaTimes className="h-6 w-6" />
                 </button>
               </div>
                <div className="mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                      <input
                        type="text"
                        value={memberFilter}
                        onChange={(e) => setMemberFilter(e.target.value)}
                        placeholder="Search by name, email, code..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Group Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Group</label>
                      <select
                        value={groupFilter}
                        onChange={(e) => setGroupFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                      <select
                        value={locationFilter}
                        onChange={(e) => setLocationFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <div className="mt-4 flex justify-between items-center">
                    <button
                      onClick={() => {
                        setMemberFilter("");
                        setGroupFilter("");
                        setStatusFilter("");
                        setLocationFilter("");
                      }}
                      className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Clear All Filters
                    </button>
                    <p className="text-sm text-gray-500">
                      Showing {filteredMembers.length} of {members.length} members
                    </p>
                  </div>
                </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Member Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Group
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Active Loans
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Joined Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                                         {filteredMembers.length === 0 ? (
                       <tr>
                         <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                           {memberFilter.trim() === "" ? "No members found" : "No members match your search"}
                         </td>
                       </tr>
                     ) : (
                       filteredMembers.map((member, index) => (
                        <tr key={member.id}>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {member.member_code || "N/A"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {member.user?.full_name || member.user?.username || "N/A"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {member.group?.name || "N/A"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {member.group?.location || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
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
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {loans.filter(loan => loan.member_id === member.id && (loan.status === 'ACTIVE' || loan.status === 'DISBURSED' || loan.status === 'APPROVED')).length}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {member.joined_date ? new Date(member.joined_date).toLocaleDateString() : "N/A"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              </div>
            </div>
          </div>
          </>
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

      {/* Bonus Management Modal */}
      {showBonusManagement && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-5 border w-11/12 max-w-7xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Bonus Management</h3>
                <button
                  onClick={() => setShowBonusManagement(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="h-6 w-6" />
                </button>
              </div>
              <BonusManagement />
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

    </div>
  );
}

export default AdminDashboard;
