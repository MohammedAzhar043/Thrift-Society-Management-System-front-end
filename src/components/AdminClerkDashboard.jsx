import { useState, useEffect } from 'react';
import { 
  FaEye, 
  FaChartLine, 
  FaFileAlt, 
  FaSignOutAlt, 
  FaSearch, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaDownload, 
  FaCalendarAlt,
  FaMoneyBillWave,
  FaUsers,
  FaClock,
  FaExclamationTriangle,
  FaFilter,
  FaSync,
  FaClipboardList,
  FaHistory,
  FaShieldAlt,
  FaTimes
} from 'react-icons/fa';
import { toast, Toaster } from 'react-hot-toast';
import apiService from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import * as XLSX from 'xlsx';

function AdminClerkDashboard({ user, onLogout }) {
  const [loading, setLoading] = useState(true);
  
  // Dashboard data states
  const [dashboardStats, setDashboardStats] = useState({
    total_groups: 0,
    total_members: 0,
    active_loans: 0,
    pending_approvals: 0,
    total_collections_today: 0,
    total_collections_month: 0,
    daily_collection: 0,
    weekly_collection: 0,
    monthly_collection: 0,
    pending_verifications: 0
  });
  
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [pendingCollections, setPendingCollections] = useState([]);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [collectionMonitoring, setCollectionMonitoring] = useState([]);
  
  // UI states
  const [activeTab, setActiveTab] = useState('overview');
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showCollectionDetailsModal, setShowCollectionDetailsModal] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState(null);
  
  // Report states
  const [reportType, setReportType] = useState('collections');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportStartDate, setReportStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportEndDate, setReportEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isRefreshingData, setIsRefreshingData] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    
    try {
      const stats = await apiService.getClerkDashboardStats();
      setDashboardStats(stats);
    } catch (err) {
      // Set fallback data
      setDashboardStats({
        total_groups: 0,
        total_members: 0,
        active_loans: 0,
        pending_approvals: 0,
        total_collections_today: 0,
        total_collections_month: 0,
        daily_collection: 0,
        weekly_collection: 0,
        monthly_collection: 0,
        pending_verifications: 0
      });
    }

    try {
      const approvals = await apiService.getClerkPendingApprovals();
      setPendingApprovals(approvals);
    } catch (err) {
      setPendingApprovals([]);
    }

    try {
      const pending = await apiService.getPendingVerificationCollections();
      setPendingCollections(pending);
    } catch (err) {
      setPendingCollections([]);
    }

    try {
      const history = await apiService.getTransactionHistory();
      setTransactionHistory(history);
    } catch (err) {
      setTransactionHistory([]);
    }

    try {
      const monitoring = await apiService.getCollectionMonitoringData(30);
      setCollectionMonitoring(monitoring.daily_data || []);
    } catch (err) {
      setCollectionMonitoring([]);
    }

    // Populate recent activities from existing data
    try {
      const activities = [];
      
      // Add pending approvals as activities
      if (pendingApprovals.length > 0) {
        pendingApprovals.slice(0, 3).forEach((approval, index) => {
          activities.push({
            id: `approval_${index}`,
            action: `Pending ${approval.type} approval`,
            group: approval.name || 'N/A',
            amount: approval.amount ? formatCurrency(approval.amount) : 'N/A',
            time: approval.date || 'Today',
            type: approval.type // Add type information for styling
          });
        });
      }
      
      // Add pending collections as activities
      if (pendingCollections.length > 0) {
        pendingCollections.slice(0, 3).forEach((collection, index) => {
          activities.push({
            id: `collection_${index}`,
            action: 'Collection pending verification',
            group: collection.group?.name || 'N/A',
            amount: formatCurrency(collection.grand_total || 0),
            time: new Date(collection.collection_date).toLocaleDateString(),
            type: 'collection' // Add type information for styling
          });
        });
      }
      
      // Add transaction history as activities
      if (transactionHistory.length > 0) {
        transactionHistory.slice(0, 3).forEach((transaction, index) => {
          activities.push({
            id: `transaction_${index}`,
            action: `${transaction.transaction_type} transaction`,
            group: transaction.description || 'N/A',
            amount: formatCurrency(transaction.amount || 0),
            time: new Date(transaction.created_at).toLocaleDateString(),
            type: 'transaction' // Add type information for styling
          });
        });
      }
      
      // If no activities, add a default message
      if (activities.length === 0) {
        activities.push({
          id: 'no_activity',
          action: 'No recent activities',
          group: 'System',
          amount: 'N/A',
          time: 'Today',
          type: 'system' // Add type information for styling
        });
      }
      
      setRecentActivities(activities);
    } catch (err) {
      setRecentActivities([]);
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    try {
      await apiService.logout();
      onLogout();
    } catch (error) {
      onLogout(); // Still logout even if API call fails
    }
  };

  const verifyCollectionRecord = async (recordId) => {
    try {
      await apiService.verifyCollectionRecord(recordId);
      toast.success('Collection record verified successfully!');
      await loadDashboardData(); // Refresh data
    } catch (err) {
      toast((t) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <span>Failed to verify collection: {err.message}</span>
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
  };

  const generateReport = async () => {
    // Validate based on report type
    if (!reportType) {
      toast((t) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <span>Please select a report type</span>
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

    if (reportType === 'weekly' && (!reportStartDate || !reportEndDate)) {
      toast((t) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <span>Please fill in start and end dates for weekly report</span>
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

    if ((reportType === 'daily' || reportType === 'monthly') && !reportDate) {
      toast((t) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <span>Please select a date for the report</span>
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

    setIsGeneratingReport(true);
    console.log('Starting report generation:', { reportType, reportDate, reportStartDate, reportEndDate });
    
    try {
      let reportData;
      let reportTitle = "";
      let worksheetData = [];
      
      switch (reportType) {
        case "daily":
          // Daily report
          console.log('Fetching daily report for date:', reportDate);
          reportData = await apiService.getDailyCollectionReport(reportDate);
          console.log('Daily report data received:', reportData);
          reportTitle = "Daily Collection Report";
          // Format collections data for Excel
          if (reportData && reportData.collections && reportData.collections.length > 0) {
            worksheetData = [
              ['Date', 'Group', 'Collector', 'Amount', 'Status', 'Notes'],
              ...reportData.collections.map(collection => [
                new Date(collection.collection_date).toLocaleDateString(),
                collection.group?.name || 'N/A',
                collection.collector?.username || 'N/A',
                parseFloat(collection.grand_total || 0).toFixed(2),
                collection.is_verified ? 'Verified' : 'Pending',
                collection.notes || ''
              ])
            ];
          } else {
            worksheetData = [
              ['Date', 'Group', 'Collector', 'Amount', 'Status', 'Notes'],
              ['No collections found for the selected date']
            ];
          }
          break;
        case "weekly":
          // Weekly report
          console.log('Fetching weekly report for dates:', reportStartDate, 'to', reportEndDate);
          reportData = await apiService.getWeeklyCollectionReport(reportStartDate, reportEndDate);
          console.log('Weekly report data received:', reportData);
          reportTitle = "Weekly Collection Report";
          // Format collections data for Excel
          if (reportData && reportData.collections && reportData.collections.length > 0) {
            worksheetData = [
              ['Date', 'Group', 'Collector', 'Amount', 'Status', 'Notes'],
              ...reportData.collections.map(collection => [
                new Date(collection.collection_date).toLocaleDateString(),
                collection.group?.name || 'N/A',
                collection.collector?.username || 'N/A',
                parseFloat(collection.grand_total || 0).toFixed(2),
                collection.is_verified ? 'Verified' : 'Pending',
                collection.notes || ''
              ])
            ];
          } else {
            worksheetData = [
              ['Date', 'Group', 'Collector', 'Amount', 'Status', 'Notes'],
              ['No collections found for the selected period']
            ];
          }
          break;
        case "monthly":
          // Monthly report
          // reportDate is in format "YYYY-MM" from month input
          const [year, month] = reportDate.split('-').map(Number);
          console.log('Fetching monthly report for year:', year, 'month:', month);
          reportData = await apiService.getMonthlyCollectionReport(year, month);
          console.log('Monthly report data received:', reportData);
          reportTitle = "Monthly Collection Report";
          // Format collections data for Excel
          if (reportData && reportData.collections && reportData.collections.length > 0) {
            worksheetData = [
              ['Date', 'Group', 'Collector', 'Amount', 'Status', 'Notes'],
              ...reportData.collections.map(collection => [
                new Date(collection.collection_date).toLocaleDateString(),
                collection.group?.name || 'N/A',
                collection.collector?.username || 'N/A',
                parseFloat(collection.grand_total || 0).toFixed(2),
                collection.is_verified ? 'Verified' : 'Pending',
                collection.notes || ''
              ])
            ];
          } else {
            worksheetData = [
              ['Date', 'Group', 'Collector', 'Amount', 'Status', 'Notes'],
              ['No collections found for the selected month']
            ];
          }
          break;
        case "members":
          // For now, use existing data
          reportData = { count: pendingApprovals.filter(a => a.type === 'member').length };
          reportTitle = "Members Report";
          // Format members data for Excel
          const memberApprovals = pendingApprovals.filter(a => a.type === 'member');
          worksheetData = [
            ['Name', 'Type', 'Amount', 'Location', 'Date', 'Status'],
            ...memberApprovals.map(approval => [
              approval.name || 'N/A',
              approval.type,
              approval.amount || 'N/A',
              approval.location || 'N/A',
              approval.date,
              approval.status
            ])
          ];
          break;
        case "loans":
          // For now, use existing data
          reportData = { count: pendingApprovals.filter(a => a.type === 'loan').length };
          reportTitle = "Loans Report";
          // Format loans data for Excel
          const loanApprovals = pendingApprovals.filter(a => a.type === 'loan');
          worksheetData = [
            ['Name', 'Type', 'Amount', 'Location', 'Date', 'Status'],
            ...loanApprovals.map(approval => [
              approval.name || 'N/A',
              approval.type,
              approval.amount || 'N/A',
              approval.location || 'N/A',
              approval.date,
              approval.status
            ])
          ];
          break;
        case "groups":
          // For now, use existing data
          reportData = { count: dashboardStats.total_groups };
          reportTitle = "Groups Report";
          // Format groups data for Excel
          worksheetData = [
            ['Metric', 'Count', 'Description'],
            ['Total Groups', dashboardStats.total_groups, 'Total number of groups in the system'],
            ['Total Members', dashboardStats.total_members, 'Total number of members across all groups'],
            ['Active Loans', dashboardStats.active_loans, 'Total number of active loans'],
            ['Pending Approvals', dashboardStats.pending_approvals, 'Total pending approvals'],
            ['Daily Collection', formatCurrency(dashboardStats.daily_collection), 'Today\'s total collections'],
            ['Monthly Collection', formatCurrency(dashboardStats.monthly_collection), 'This month\'s total collections']
          ];
          break;
        case "collections":
          // Collections report - use today's data
          console.log('Fetching collections report for today:', reportDate);
          reportData = await apiService.getDailyCollectionReport(reportDate);
          console.log('Collections report data received:', reportData);
          reportTitle = "Collections Report";
          // Format collections data for Excel
          if (reportData && reportData.collections && reportData.collections.length > 0) {
            worksheetData = [
              ['Date', 'Group', 'Collector', 'Amount', 'Status', 'Notes'],
              ...reportData.collections.map(collection => [
                new Date(collection.collection_date).toLocaleDateString(),
                collection.group?.name || 'N/A',
                collection.collector?.username || 'N/A',
                parseFloat(collection.grand_total || 0).toFixed(2),
                collection.is_verified ? 'Verified' : 'Pending',
                collection.notes || ''
              ])
            ];
          } else {
            worksheetData = [
              ['Date', 'Group', 'Collector', 'Amount', 'Status', 'Notes'],
              ['No collections found for the selected date']
            ];
          }
          break;
        default:
          reportData = [];
          reportTitle = "Report";
          worksheetData = [['No data available']];
      }
      
      // Validate worksheet data
      if (!worksheetData || worksheetData.length === 0) {
        throw new Error('No data available to generate report');
      }

      // Create Excel workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      
      // Auto-size columns
      if (worksheetData.length > 0) {
        const columnWidths = worksheetData[0].map((_, index) => {
          const maxLength = Math.max(...worksheetData.map(row => String(row[index] || '').length));
          return Math.min(Math.max(maxLength + 2, 10), 50); // Min 10, Max 50
        });
        worksheet['!cols'] = columnWidths.map(width => ({ width }));
      }
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, reportTitle);
      
      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Generate filename based on report type
      let filename;
      if (reportType === 'daily') {
        filename = `${reportType}_report_${reportDate}.xlsx`;
      } else if (reportType === 'weekly') {
        filename = `${reportType}_report_${reportStartDate}_to_${reportEndDate}.xlsx`;
      } else if (reportType === 'monthly') {
        // reportDate is in format "YYYY-MM"
        const [year, month] = reportDate.split('-');
        filename = `${reportType}_report_${year}_${month}.xlsx`;
      } else {
        filename = `${reportType}_report_${new Date().toISOString().split('T')[0]}.xlsx`;
      }

      // Download the file
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success(`${reportTitle} generated and downloaded successfully as Excel file!`);
      setShowReportsModal(false);
    } catch (err) {
      console.error('Report generation error:', err);
      
      let errorMessage = 'Failed to generate report';
      if (err.message) {
        errorMessage += `: ${err.message}`;
      } else if (err.response?.data?.detail) {
        errorMessage += `: ${err.response.data.detail}`;
      } else if (err.response?.status) {
        errorMessage += `: HTTP ${err.response.status}`;
      }
      
      // Check for specific error types
      if (err.message && err.message.includes('Network error')) {
        errorMessage = 'Network error: Unable to connect to server. Please check if the backend is running.';
      } else if (err.message && err.message.includes('Failed to fetch')) {
        errorMessage = 'Connection error: Please check your internet connection and try again.';
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
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const refreshData = async () => {
    try {
      setIsRefreshingData(true);
      await loadDashboardData();
      toast.success('Data refreshed successfully!');
    } catch (err) {
      toast((t) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <span>Failed to refresh data</span>
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
    } finally {
      setIsRefreshingData(false);
    }
  };

  // Using shared utility function from ../utils/formatters

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
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
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4 gap-4">
            {/* Left side - Title and User info */}
            <div className="flex-1 min-w-0 overflow-hidden">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                Admin Clerk Dashboard
              </h1>
              <p className="text-sm text-gray-600 mt-1 truncate">
                Welcome, {user.name}
              </p>
          </div>
            
            {/* Right side - Action buttons */}
            <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            <button
              onClick={refreshData}
              disabled={isRefreshingData}
                className={`inline-flex items-center px-1.5 sm:px-2 py-1.5 sm:py-2 rounded text-xs sm:text-sm font-medium transition-colors duration-200 ${
                isRefreshingData 
                  ? 'bg-gray-400 cursor-not-allowed text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-blue-500'
              }`}
            >
                <FaSync className={`w-3 h-3 sm:w-4 sm:h-4 sm:mr-1 ${isRefreshingData ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">
              {isRefreshingData ? 'Refreshing...' : 'Refresh'}
                </span>
            </button>
            <button
              onClick={handleLogout}
                className="inline-flex items-center px-1.5 sm:px-2 py-1.5 sm:py-2 border border-transparent text-xs sm:text-sm font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-red-500 transition-colors duration-200"
            >
                <FaSignOutAlt className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                <span className="hidden sm:inline">Logout</span>
            </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
        
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {/* Stats Cards */}
          <div className="stats-card bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500 rounded-xl p-3 sm:p-4 shadow-lg">
                  <FaEye className="text-white h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="ml-4 sm:ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-xs sm:text-sm font-semibold text-blue-700 truncate">Daily Collection</dt>
                    <dd className="flex items-baseline">
                      <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-900">{formatCurrency(dashboardStats.daily_collection)}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="stats-card bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500 rounded-xl p-3 sm:p-4 shadow-lg">
                  <FaChartLine className="text-white h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="ml-4 sm:ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-xs sm:text-sm font-semibold text-green-700 truncate">Weekly Collection</dt>
                    <dd className="flex items-baseline">
                      <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-900">{formatCurrency(dashboardStats.weekly_collection)}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="stats-card bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-500 rounded-xl p-3 sm:p-4 shadow-lg">
                  <FaFileAlt className="text-white h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="ml-4 sm:ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-xs sm:text-sm font-semibold text-yellow-700 truncate">Monthly Collection</dt>
                    <dd className="flex items-baseline">
                      <div className="text-lg sm:text-xl lg:text-2xl font-bold text-yellow-900">{formatCurrency(dashboardStats.monthly_collection)}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="stats-card bg-gradient-to-br from-red-50 to-red-100 border border-red-200">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-red-500 rounded-xl p-3 sm:p-4 shadow-lg">
                  <FaExclamationTriangle className="text-white h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="ml-4 sm:ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-xs sm:text-sm font-semibold text-red-700 truncate">Pending Verifications</dt>
                    <dd className="flex items-baseline">
                      <div className="text-lg sm:text-xl lg:text-2xl font-bold text-red-900">{dashboardStats.pending_verifications}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <div className="stats-card bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-indigo-500 rounded-xl p-3 sm:p-4 shadow-lg">
                  <FaUsers className="text-white h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="ml-4 sm:ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-xs sm:text-sm font-semibold text-indigo-700 truncate">Total Groups</dt>
                    <dd className="flex items-baseline">
                      <div className="text-lg sm:text-xl lg:text-2xl font-bold text-indigo-900">{dashboardStats.total_groups}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="stats-card bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-500 rounded-xl p-3 sm:p-4 shadow-lg">
                  <FaUsers className="text-white h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="ml-4 sm:ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-xs sm:text-sm font-semibold text-purple-700 truncate">Total Members</dt>
                    <dd className="flex items-baseline">
                      <div className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-900">{dashboardStats.total_members}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="stats-card bg-gradient-to-br from-teal-50 to-teal-100 border border-teal-200 sm:col-span-2 lg:col-span-1">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-teal-500 rounded-xl p-3 sm:p-4 shadow-lg">
                  <FaMoneyBillWave className="text-white h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="ml-4 sm:ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-xs sm:text-sm font-semibold text-teal-700 truncate">Active Loans</dt>
                    <dd className="flex items-baseline">
                      <div className="text-lg sm:text-xl lg:text-2xl font-bold text-teal-900">{dashboardStats.active_loans}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white shadow-lg rounded-xl mb-8 sticky top-0 z-10">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-1 sm:space-x-2 lg:space-x-4 px-2 sm:px-4 lg:px-6 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-3 sm:py-4 px-2 sm:px-3 border-b-2 font-semibold text-xs sm:text-sm whitespace-nowrap transition-all duration-200 rounded-t-lg ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <FaEye className="inline mr-1 sm:mr-2 w-3 h-3 sm:w-4 sm:h-4" />
                Overview
              </button>
              <button
                onClick={() => setActiveTab('pending-approvals')}
                className={`py-3 sm:py-4 px-2 sm:px-3 border-b-2 font-semibold text-xs sm:text-sm whitespace-nowrap transition-all duration-200 rounded-t-lg ${
                  activeTab === 'pending-approvals'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <FaClipboardList className="inline mr-1 sm:mr-2 w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Pending Approvals</span>
                <span className="sm:hidden">Pending</span>
              </button>
              <button
                onClick={() => setActiveTab('collections')}
                className={`py-3 sm:py-4 px-2 sm:px-3 border-b-2 font-semibold text-xs sm:text-sm whitespace-nowrap transition-all duration-200 rounded-t-lg ${
                  activeTab === 'collections'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <FaCheckCircle className="inline mr-1 sm:mr-2 w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Collection Verification</span>
                <span className="sm:hidden">Collections</span>
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`py-3 sm:py-4 px-2 sm:px-3 border-b-2 font-semibold text-xs sm:text-sm whitespace-nowrap transition-all duration-200 rounded-t-lg ${
                  activeTab === 'reports'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <FaFileAlt className="inline mr-1 sm:mr-2 w-3 h-3 sm:w-4 sm:h-4" />
                Reports
              </button>
              <button
                onClick={() => setActiveTab('monitoring')}
                className={`py-3 sm:py-4 px-2 sm:px-3 border-b-2 font-semibold text-xs sm:text-sm whitespace-nowrap transition-all duration-200 rounded-t-lg ${
                  activeTab === 'monitoring'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <FaChartLine className="inline mr-1 sm:mr-2 w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Monitoring</span>
                <span className="sm:hidden">Monitor</span>
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className={`py-3 sm:py-4 px-2 sm:px-3 border-b-2 font-semibold text-xs sm:text-sm whitespace-nowrap transition-all duration-200 rounded-t-lg ${
                  activeTab === 'transactions'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <FaHistory className="inline mr-1 sm:mr-2 w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Transactions</span>
                <span className="sm:hidden">Transactions</span>
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Activities */}
                  <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Recent Activities</h3>
                      <button
                        onClick={() => loadDashboardData()}
                        disabled={loading}
                        className="p-2 sm:p-3 text-gray-400 hover:text-blue-600 disabled:opacity-50 rounded-lg hover:bg-blue-50 transition-all duration-200"
                        title="Refresh activities"
                      >
                        <FaSync className={`h-4 w-4 sm:h-5 sm:w-5 ${loading ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                    {loading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-sm text-gray-500">Loading activities...</p>
                      </div>
                    ) : recentActivities.length > 0 ? (
                      <div className="space-y-4">
                        {recentActivities.map((activity, index) => (
                          <div 
                            key={activity.id} 
                            className="bg-white rounded-xl p-4 sm:p-5 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 animate-fade-in"
                            style={{ animationDelay: `${index * 0.1}s` }}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start flex-1 min-w-0">
                                <div className="flex-shrink-0 mr-3 sm:mr-4">
                                  {activity.type === 'member' ? (
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                      <FaUsers className="text-blue-600 w-4 h-4 sm:w-5 sm:h-5" />
                                    </div>
                                  ) : activity.type === 'collection' ? (
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                      <FaMoneyBillWave className="text-green-600 w-4 h-4 sm:w-5 sm:h-5" />
                                    </div>
                                  ) : activity.type === 'transaction' ? (
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                      <FaHistory className="text-purple-600 w-4 h-4 sm:w-5 sm:h-5" />
                                    </div>
                                  ) : (
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                      <FaClock className="text-gray-600 w-4 h-4 sm:w-5 sm:h-5" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm sm:text-base font-semibold text-gray-900 mb-1">{activity.action}</p>
                                  <p className="text-xs sm:text-sm text-gray-600 truncate">{activity.group}</p>
                                  <p className="text-xs text-gray-400 mt-1 flex items-center">
                                    <FaClock className="w-3 h-3 mr-1" />
                                    {activity.time}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right ml-3 flex-shrink-0">
                                {activity.type === 'member' ? (
                                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-blue-500 text-white shadow-sm">
                                    Member Request
                                  </span>
                                ) : (
                                  <div className="text-right">
                                    <div className="text-sm sm:text-base font-bold text-green-600">
                                      {activity.amount && activity.amount !== 'N/A' ? activity.amount : 'N/A'}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FaClock className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
                        </div>
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No recent activities</h3>
                        <p className="text-sm text-gray-500 mb-4">Activities will appear here as they occur.</p>
                        <div className="space-y-1 text-xs sm:text-sm text-gray-400">
                          <p>• Pending approvals</p>
                          <p>• Collection verifications</p>
                          <p>• Transaction history</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-gradient-to-br from-gray-50 to-green-50 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6">Quick Actions</h3>
                    <div className="space-y-4">
                      <button
                        onClick={() => setShowReportsModal(true)}
                        className="w-full flex items-center justify-center px-4 py-3 sm:py-4 border border-transparent rounded-xl shadow-md text-sm sm:text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
                      >
                        <FaFileAlt className="mr-2 sm:mr-3 w-4 h-4 sm:w-5 sm:h-5" />
                        Generate Excel Report
                      </button>
                      <button
                        onClick={() => setShowVerificationModal(true)}
                        className="w-full flex items-center justify-center px-4 py-3 sm:py-4 border border-transparent rounded-xl shadow-md text-sm sm:text-base font-semibold text-white bg-green-600 hover:bg-green-700 hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
                      >
                        <FaCheckCircle className="mr-2 sm:mr-3 w-4 h-4 sm:w-5 sm:h-5" />
                        Verify Collections
                      </button>
                      <button
                        onClick={() => setActiveTab('monitoring')}
                        className="w-full flex items-center justify-center px-4 py-3 sm:py-4 border border-transparent rounded-xl shadow-md text-sm sm:text-base font-semibold text-white bg-purple-600 hover:bg-purple-700 hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
                      >
                        <FaChartLine className="mr-2 sm:mr-3 w-4 h-4 sm:w-5 sm:h-5" />
                        View Monitoring
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Pending Approvals Tab */}
            {activeTab === 'pending-approvals' && (
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6">Pending Approvals</h3>
                {pendingApprovals.length > 0 ? (
                  <>
                    {/* Desktop Table View */}
                    <div className="hidden lg:block overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                          <tr>
                            <th className="px-4 lg:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                              <div className="flex items-center">
                                <FaUsers className="w-4 h-4 mr-2" />
                                Type
                              </div>
                            </th>
                            <th className="px-4 lg:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Name</th>
                            <th className="px-4 lg:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Amount</th>
                            <th className="px-4 lg:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Location</th>
                            <th className="px-4 lg:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Date</th>
                            <th className="px-4 lg:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {pendingApprovals.map((approval, index) => (
                            <tr key={approval.id} className={`hover:bg-gray-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                              <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-full ${
                                  approval.type === 'member' ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'
                                }`}>
                                  {approval.type === 'member' ? (
                                    <FaUsers className="w-3 h-3 mr-1" />
                                  ) : (
                                    <FaMoneyBillWave className="w-3 h-3 mr-1" />
                                  )}
                                  {approval.type}
                                </span>
                              </td>
                              <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{approval.name}</td>
                              <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {approval.type === 'member' ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    Not Applicable
                                  </span>
                                ) : (
                                  <span className="font-bold text-green-600 text-base">
                                    {approval.amount ? `₹${parseFloat(approval.amount).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : 'N/A'}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{approval.location || 'N/A'}</td>
                              <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{approval.date}</td>
                              <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-full bg-yellow-500 text-white">
                                  <FaClock className="w-3 h-3 mr-1" />
                                  {approval.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="lg:hidden space-y-4">
                      {pendingApprovals.map((approval, index) => (
                        <div key={approval.id} className="bg-white rounded-xl p-4 sm:p-5 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 animate-fade-in">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                                approval.type === 'member' ? 'bg-blue-100' : 'bg-green-100'
                              }`}>
                                {approval.type === 'member' ? (
                                  <FaUsers className="text-blue-600 w-5 h-5" />
                                ) : (
                                  <FaMoneyBillWave className="text-green-600 w-5 h-5" />
                                )}
                              </div>
                              <div>
                                <h4 className="text-base sm:text-lg font-bold text-gray-900">{approval.name}</h4>
                                <p className="text-sm text-gray-600">{approval.location || 'N/A'}</p>
                              </div>
                            </div>
                            <span className={`inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-full ${
                              approval.type === 'member' ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'
                            }`}>
                              {approval.type}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Amount</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {approval.type === 'member' ? (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    Not Applicable
                                  </span>
                                ) : (
                                  <span className="font-bold text-green-600 text-base">
                                    {approval.amount ? `₹${parseFloat(approval.amount).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : 'N/A'}
                                  </span>
                                )}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Date</p>
                              <p className="text-sm font-semibold text-gray-900">{approval.date}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-full bg-yellow-500 text-white">
                              <FaClock className="w-3 h-3 mr-1" />
                              {approval.status}
                            </span>
                            <div className="text-xs text-gray-400">
                              Pending Review
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FaClipboardList className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No pending approvals</h3>
                    <p className="text-sm text-gray-500">All approvals have been processed.</p>
                  </div>
                )}
              </div>
            )}

            {/* Collection Verification Tab */}
            {activeTab === 'collections' && (
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6">Collection Verification</h3>
                {pendingCollections.length > 0 ? (
                  <>
                    {/* Desktop Table View */}
                    <div className="hidden lg:block overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-gray-50 to-green-50">
                          <tr>
                            <th className="px-4 lg:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                              <div className="flex items-center">
                                <FaCalendarAlt className="w-4 h-4 mr-2" />
                                Date
                              </div>
                            </th>
                            <th className="px-4 lg:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Group</th>
                            <th className="px-4 lg:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Members</th>
                            <th className="px-4 lg:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Amount</th>
                            <th className="px-4 lg:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Collector</th>
                            <th className="px-4 lg:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Status</th>
                            <th className="px-4 lg:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {pendingCollections.map((collection, index) => (
                            <tr key={collection.id} className={`hover:bg-gray-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                              <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                {new Date(collection.collection_date).toLocaleDateString()}
                              </td>
                              <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                {collection.group?.name || 'N/A'}
                              </td>
                              <td className="px-4 lg:px-6 py-4 text-sm text-gray-500">
                                {collection.collection_items && collection.collection_items.length > 0 ? (
                                  <div className="space-y-2 max-h-24 overflow-y-auto">
                                    {(() => {
                                      // Group collection items by member to avoid duplicates
                                      const memberMap = new Map();
                                      collection.collection_items.forEach((item) => {
                                        const memberId = item.member_id;
                                        if (!memberMap.has(memberId)) {
                                          memberMap.set(memberId, {
                                            member: item.member,
                                            totalAmount: 0,
                                            paymentTypes: []
                                          });
                                        }
                                        const memberData = memberMap.get(memberId);
                                        memberData.totalAmount += parseFloat(item.amount || 0);
                                        memberData.paymentTypes.push(item.payment_type);
                                      });
                                      
                                      return Array.from(memberMap.values()).map((memberData, index) => (
                                        <div key={index} className="break-words">
                                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                                            <FaUsers className="w-3 h-3 mr-1" />
                                            {memberData.member?.user?.full_name || memberData.member?.user?.username || `Member ${memberData.member?.id || 'Unknown'}`}
                                          </span>
                                          <div className="text-xs text-gray-500 mt-1">
                                            ₹{memberData.totalAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})} ({memberData.paymentTypes.join(', ')})
                                          </div>
                                        </div>
                                      ));
                                    })()}
                                  </div>
                                ) : (
                                  <span className="text-gray-400">No members</span>
                                )}
                              </td>
                              <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-base font-bold text-green-600">
                                {formatCurrency(collection.grand_total)}
                              </td>
                              <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {collection.collector?.username || 'N/A'}
                              </td>
                              <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-full bg-yellow-500 text-white">
                                  <FaClock className="w-3 h-3 mr-1" />
                                  Pending Verification
                                </span>
                              </td>
                              <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => verifyCollectionRecord(collection.id)}
                                    className="text-green-600 hover:text-green-900 text-xs px-3 py-1.5 rounded-lg hover:bg-green-50 transition-colors duration-200 font-semibold"
                                    title="Verify Collection"
                                  >
                                    <FaCheckCircle className="inline mr-1" /> Verify
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedCollection(collection);
                                      setShowCollectionDetailsModal(true);
                                    }}
                                    className="text-blue-600 hover:text-blue-900 text-xs px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors duration-200 font-semibold"
                                    title="View Details"
                                  >
                                    <FaEye className="inline mr-1" /> View
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="lg:hidden space-y-4">
                      {pendingCollections.map((collection, index) => (
                        <div key={collection.id} className="bg-white rounded-xl p-4 sm:p-5 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 animate-fade-in">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                                <FaMoneyBillWave className="text-green-600 w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="text-base sm:text-lg font-bold text-gray-900">{collection.group?.name || 'N/A'}</h4>
                                <p className="text-sm text-gray-600">{collection.collector?.username || 'N/A'}</p>
                              </div>
                            </div>
                            <span className="inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-full bg-yellow-500 text-white">
                              <FaClock className="w-3 h-3 mr-1" />
                              Pending
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Date</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {new Date(collection.collection_date).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Amount</p>
                              <p className="text-base font-bold text-green-600">
                                {formatCurrency(collection.grand_total)}
                              </p>
                            </div>
                          </div>
                          
                          {collection.collection_items && collection.collection_items.length > 0 && (
                            <div className="mb-4">
                              <p className="text-xs text-gray-500 mb-2">Members ({collection.collection_items.length})</p>
                              <div className="space-y-2 max-h-24 overflow-y-auto">
                                {(() => {
                                  // Group collection items by member to avoid duplicates
                                  const memberMap = new Map();
                                  collection.collection_items.forEach((item) => {
                                    const memberId = item.member_id;
                                    if (!memberMap.has(memberId)) {
                                      memberMap.set(memberId, {
                                        member: item.member,
                                        totalAmount: 0,
                                        paymentTypes: []
                                      });
                                    }
                                    const memberData = memberMap.get(memberId);
                                    memberData.totalAmount += parseFloat(item.amount || 0);
                                    memberData.paymentTypes.push(item.payment_type);
                                  });
                                  
                                  return Array.from(memberMap.values()).slice(0, 3).map((memberData, index) => (
                                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                      <div className="flex items-center">
                                        <FaUsers className="w-3 h-3 text-blue-600 mr-2" />
                                        <span className="text-xs font-semibold text-gray-900 truncate">
                                          {memberData.member?.user?.full_name || memberData.member?.user?.username || `Member ${memberData.member?.id || 'Unknown'}`}
                                        </span>
                                      </div>
                                      <div className="text-right">
                                        <div className="text-xs font-bold text-green-600">
                                          ₹{memberData.totalAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {memberData.paymentTypes.join(', ')}
                                        </div>
                                      </div>
                                    </div>
                                  ));
                                })()}
                                {collection.collection_items.length > 3 && (
                                  <div className="text-xs text-gray-500 text-center py-1">
                                    +{collection.collection_items.length - 3} more members
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => verifyCollectionRecord(collection.id)}
                              className="flex-1 flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 text-sm font-semibold"
                            >
                              <FaCheckCircle className="w-4 h-4 mr-2" />
                              Verify
                            </button>
                            <button
                              onClick={() => {
                                setSelectedCollection(collection);
                                setShowCollectionDetailsModal(true);
                              }}
                              className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-semibold"
                            >
                              <FaEye className="w-4 h-4 mr-2" />
                              View
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FaCheckCircle className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No collections pending verification</h3>
                    <p className="text-sm text-gray-500">All collections have been verified.</p>
                  </div>
                )}
              </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Generate Reports</h3>
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
                      <select
                        value={reportType}
                        onChange={(e) => setReportType(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="daily">Daily Report</option>
                        <option value="weekly">Weekly Report</option>
                        <option value="monthly">Monthly Report</option>
                      </select>
                    </div>

                    {reportType === 'daily' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                        <input
                          type="date"
                          value={reportDate}
                          onChange={(e) => setReportDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    )}

                    {reportType === 'weekly' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                          <input
                            type="date"
                            value={reportStartDate}
                            onChange={(e) => setReportStartDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                          <input
                            type="date"
                            value={reportEndDate}
                            onChange={(e) => setReportEndDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </>
                    )}

                    {reportType === 'monthly' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                        <input
                          type="month"
                          value={reportDate}
                          onChange={(e) => setReportDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    )}
                  </div>

                  <div className="mt-6">
                    <button
                      onClick={generateReport}
                      disabled={isGeneratingReport}
                      className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                        isGeneratingReport 
                          ? 'bg-blue-400 cursor-not-allowed' 
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {isGeneratingReport ? 'Generating...' : 'Generate Report'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Monitoring Tab */}
            {activeTab === 'monitoring' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Collection Monitoring</h3>
                  <button
                    onClick={() => loadDashboardData()}
                    disabled={loading}
                    className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    title="Refresh monitoring data"
                  >
                    <FaSync className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500">Loading monitoring data...</p>
                  </div>
                ) : collectionMonitoring.length > 0 ? (
                  <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center">
                          <FaChartLine className="h-8 w-8 text-blue-600" />
                          <div className="ml-4">
                            <p className="text-sm font-medium text-blue-600">Total Collections</p>
                            <p className="text-2xl font-bold text-blue-900">
                              {collectionMonitoring.reduce((sum, day) => sum + day.collection_count, 0)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="flex items-center">
                          <FaMoneyBillWave className="h-8 w-8 text-green-600" />
                          <div className="ml-4">
                            <p className="text-sm font-medium text-green-600">Total Amount</p>
                            <p className="text-2xl font-bold text-green-900">
                              {formatCurrency(collectionMonitoring.reduce((sum, day) => sum + day.grand_total, 0))}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4">
                        <div className="flex items-center">
                          <FaCalendarAlt className="h-8 w-8 text-purple-600" />
                          <div className="ml-4">
                            <p className="text-sm font-medium text-purple-600">Days Monitored</p>
                            <p className="text-2xl font-bold text-purple-900">
                              {collectionMonitoring.length}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Daily Data */}
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">Daily Collection Data (Last 30 Days)</h4>
                      <div className="space-y-3">
                        {collectionMonitoring.map((day, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {new Date(day.date).toLocaleDateString('en-US', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                  })}
                                </p>
                                <p className="text-xs text-gray-500">{day.collection_count} collections</p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-semibold text-gray-900">
                                  {formatCurrency(day.grand_total)}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {day.collection_count > 0 ? 
                                    `Avg: ${formatCurrency(day.grand_total / day.collection_count)}` : 
                                    'No collections'
                                  }
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FaChartLine className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No monitoring data available</h3>
                    <p className="mt-1 text-sm text-gray-500">Collection monitoring data will appear here.</p>
                    <button
                      onClick={() => loadDashboardData()}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Refresh Data
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Transactions Tab */}
            {activeTab === 'transactions' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Transaction History</h3>
                  <button
                    onClick={() => loadDashboardData()}
                    disabled={loading}
                    className="p-2 sm:p-3 text-gray-400 hover:text-blue-600 disabled:opacity-50 rounded-lg hover:bg-blue-50 transition-all duration-200"
                    title="Refresh transaction data"
                  >
                    <FaSync className={`h-4 w-4 sm:h-5 sm:w-5 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500">Loading transaction history...</p>
                  </div>
                ) : transactionHistory.length > 0 ? (
                  <div className="space-y-6">
                    {/* Enhanced Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      <div className="transaction-summary-card bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 bg-blue-500 rounded-xl p-3 sm:p-4 shadow-lg">
                            <FaHistory className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                          </div>
                          <div className="ml-4 sm:ml-5">
                            <p className="text-xs sm:text-sm font-semibold text-blue-700">Total Transactions</p>
                            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-900">{transactionHistory.length}</p>
                          </div>
                        </div>
                      </div>
                      <div className="transaction-summary-card bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 bg-green-500 rounded-xl p-3 sm:p-4 shadow-lg">
                            <FaMoneyBillWave className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                          </div>
                          <div className="ml-4 sm:ml-5">
                            <p className="text-xs sm:text-sm font-semibold text-green-700">Total Amount</p>
                            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-900">
                              {formatCurrency(transactionHistory.reduce((sum, t) => sum + (t.amount || 0), 0))}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="transaction-summary-card bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 sm:col-span-2 lg:col-span-1">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 bg-purple-500 rounded-xl p-3 sm:p-4 shadow-lg">
                            <FaChartLine className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                          </div>
                          <div className="ml-4 sm:ml-5">
                            <p className="text-xs sm:text-sm font-semibold text-purple-700">Collection Transactions</p>
                            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-900">
                              {transactionHistory.filter(t => t.transaction_type === 'collection').length}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Desktop Transaction Table */}
                    <div className="hidden lg:block bg-white shadow-xl rounded-xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                            <tr>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                <div className="flex items-center">
                                  <FaCalendarAlt className="w-4 h-4 mr-2" />
                                  Date
                                </div>
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                <div className="flex items-center">
                                  <FaFileAlt className="w-4 h-4 mr-2" />
                                  Type
                                </div>
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Description
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                <div className="flex items-center">
                                  <FaMoneyBillWave className="w-4 h-4 mr-2" />
                                  Amount
                                </div>
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Reference
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {transactionHistory.map((transaction, index) => (
                              <tr key={transaction.id} className={`hover:bg-gray-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                                  {new Date(transaction.created_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`collection-tag inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${
                                    transaction.transaction_type === 'collection' 
                                      ? 'bg-green-500 text-white' 
                                      : 'bg-blue-500 text-white'
                                  }`}>
                                    {transaction.transaction_type === 'collection' ? (
                                      <FaMoneyBillWave className="w-3 h-3 mr-1" />
                                    ) : (
                                      <FaFileAlt className="w-3 h-3 mr-1" />
                                    )}
                                    {transaction.transaction_type}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                                  {transaction.description}
                                </td>
                                <td className="px-6 py-4 text-sm font-bold text-green-600 text-lg">
                                  {formatCurrency(transaction.amount)}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                  {transaction.reference || 'N/A'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Enhanced Mobile Transaction Cards */}
                    <div className="lg:hidden space-y-4">
                      {transactionHistory.map((transaction, index) => (
                        <div key={transaction.id} className="transaction-card bg-white rounded-xl p-4 sm:p-5 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                                <span className={`collection-tag inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold w-fit ${
                                  transaction.transaction_type === 'collection' 
                                    ? 'bg-green-500 text-white' 
                                    : 'bg-blue-500 text-white'
                                }`}>
                                  {transaction.transaction_type === 'collection' ? (
                                    <FaMoneyBillWave className="w-3 h-3 mr-1" />
                                  ) : (
                                    <FaFileAlt className="w-3 h-3 mr-1" />
                                  )}
                                  {transaction.transaction_type}
                                </span>
                                <span className="text-xs sm:text-sm text-gray-600 font-medium">
                                  {new Date(transaction.created_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </span>
                              </div>
                              <h3 className="text-sm sm:text-base font-bold text-gray-900 break-words mb-2">
                                {transaction.description}
                              </h3>
                            </div>
                            <div className="text-right ml-3 flex-shrink-0">
                              <div className="transaction-amount text-base sm:text-lg font-bold text-green-600">
                                {formatCurrency(transaction.amount)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                            <div className="flex items-center">
                              <span className="transaction-detail-label text-gray-500 mr-2">Reference:</span>
                              <p className="font-semibold text-gray-900 break-words">
                                {transaction.reference || 'N/A'}
                              </p>
                            </div>
                            <div className="flex items-center">
                              <FaClock className="w-3 h-3 text-gray-400 mr-1" />
                              <span className="transaction-detail-label text-gray-500 mr-2">Time:</span>
                              <p className="font-semibold text-gray-900">
                                {new Date(transaction.created_at).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-state-icon">
                      <FaHistory className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
                    </div>
                    <h3 className="empty-state-title">No transaction history</h3>
                    <p className="empty-state-description">Transaction history will appear here.</p>
                    <button
                      onClick={() => loadDashboardData()}
                      className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 font-semibold shadow-lg hover:shadow-xl"
                    >
                      Refresh Data
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Collection Details Modal */}
      {showCollectionDetailsModal && selectedCollection && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Collection Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Date</p>
                    <p className="text-sm text-gray-900">{new Date(selectedCollection.collection_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Group</p>
                    <p className="text-sm text-gray-900">{selectedCollection.group?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Amount</p>
                    <p className="text-sm font-semibold text-green-600">{formatCurrency(selectedCollection.grand_total)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Collector</p>
                    <p className="text-sm text-gray-900">{selectedCollection.collector?.username || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Notes</p>
                    <p className="text-sm text-gray-900">{selectedCollection.notes || 'No notes'}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-3">Collection Items</p>
                  {selectedCollection.collection_items && selectedCollection.collection_items.length > 0 ? (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {selectedCollection.collection_items.map((item, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-md">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {item.member?.user?.full_name || item.member?.user?.username || `Member ${item.member_id}`}
                              </p>
                              <p className="text-xs text-gray-500">
                                Member ID: {item.member_id}
                              </p>
                              {item.loan_id && (
                                <p className="text-xs text-gray-500">
                                  Loan ID: {item.loan_id}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-green-600">
                                ₹{parseFloat(item.amount).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                              </p>
                              <p className="text-xs text-gray-500 capitalize">
                                {item.payment_type}
                              </p>
                            </div>
                          </div>
                          {item.notes && (
                            <p className="text-xs text-gray-400 mt-1">
                              Note: {item.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">No collection items found</p>
                  )}
                </div>
              </div>
              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => setShowCollectionDetailsModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    verifyCollectionRecord(selectedCollection.id);
                    setShowCollectionDetailsModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  <FaCheckCircle className="inline mr-2" />
                  Verify
                </button>
              </div>
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
                <h3 className="text-lg font-medium text-gray-900">Generate Excel Report</h3>
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
                  <option value="collections">Collections</option>
                  <option value="members">Members</option>
                  <option value="loans">Loans</option>
                  <option value="groups">Groups</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={reportStartDate}
                    onChange={(e) => setReportStartDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Start Date"
                  />
                  <input
                    type="date"
                    value={reportEndDate}
                    onChange={(e) => setReportEndDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="End Date"
                  />
                </div>
              </div>
              <div className="mb-4 p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-600">
                  <strong>Report Summary:</strong><br />
                  • Type: {reportType.charAt(0).toUpperCase() + reportType.slice(1)}<br />
                  • Period: {reportStartDate} to {reportEndDate}<br />
                  • Format: Excel (.xlsx) with auto-sized columns<br />
                  • Status: Ready to generate
                </p>
              </div>
              <div className="flex justify-end space-x-3">
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
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    isGeneratingReport 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-green-600 hover:bg-green-700'
                  } text-white`}
                >
                  {isGeneratingReport ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    'Generate Excel Report'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verification Modal */}
      {showVerificationModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Collection Verification</h3>
                <button
                  onClick={() => setShowVerificationModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="h-6 w-6" />
                </button>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-3">
                  You have <strong>{pendingCollections.length}</strong> collections pending verification.
                </p>
                <div className="space-y-2">
                  {pendingCollections.slice(0, 3).map((collection) => (
                    <div key={collection.id} className="p-3 bg-gray-50 rounded-md">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {collection.group?.name || 'Unknown Group'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(collection.collection_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {formatCurrency(collection.grand_total)}
                          </p>
                          <button
                            onClick={() => {
                              verifyCollectionRecord(collection.id);
                              setShowVerificationModal(false);
                            }}
                            className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                          >
                            Verify
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {pendingCollections.length > 3 && (
                    <p className="text-xs text-gray-500 text-center">
                      ... and {pendingCollections.length - 3} more
                    </p>
                  )}
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowVerificationModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('collections');
                    setShowVerificationModal(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  View All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminClerkDashboard;