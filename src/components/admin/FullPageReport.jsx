import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FaArrowLeft, FaDownload, FaFilter, FaSearch, FaRedo, FaExclamationTriangle,
  FaCheckCircle, FaTimes, FaSort, FaSortUp, FaSortDown, FaArrowRight,
  FaPrint, FaChartBar, FaUsers, FaMoneyBillWave, FaExclamationTriangle as FaWarning,
  FaTable, FaClipboardList, FaChartLine, FaEye, FaFileExport
} from 'react-icons/fa';
import apiService from '../../services/api';
import { formatIndianCurrency } from '../../utils/formatters';

function FullPageReport() {
  const navigate = useNavigate();
  const location = useLocation();
  const { reportType, reportName, reportDescription, reportIcon, filters: initialFilters } = location.state || {};
  
  // Get user from location state or props
  const user = location.state?.user || window.location.state?.user;
  
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Optimized for better mobile experience
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [groups, setGroups] = useState([]);
  const [filters, setFilters] = useState(initialFilters || {
    group_id: '',
    status: '',
    start_date: '',
    end_date: '',
    days_overdue: 30
  });

  // Helper function to get the correct dashboard route based on user role
  const getDashboardRoute = () => {
    if (!user?.role) return '/admin'; // Default fallback
    
    switch (user.role.toLowerCase()) {
      case 'admin':
        return '/admin';
      case 'adminclerk':
      case 'clerk':
        return '/adminclerk';
      case 'teamleader':
      case 'team_leader':
        return '/teamleader';
      case 'billcollector':
      case 'collector':
        return '/billcollector';
      case 'member':
      case 'individual_member':
        return '/member';
      default:
        return '/admin'; // Default fallback
    }
  };

  // Redirect if no report data
  useEffect(() => {
    if (!reportType) {
      navigate(getDashboardRoute());
    }
  }, [reportType, navigate]);

  // Load groups for filters
  useEffect(() => {
    const loadGroups = async () => {
      try {
        // Use the correct API method based on user role
        let groupsData;
        if (user?.role) {
          const role = user.role.toLowerCase();
          if (role === 'adminclerk' || role === 'clerk') {
            groupsData = await apiService.getClerkGroups();
          } else {
            groupsData = await apiService.getGroups();
          }
        } else {
          // Default to admin method if user role is not available
          groupsData = await apiService.getGroups();
        }
        setGroups(groupsData);
      } catch (error) {
        console.error('Error loading groups:', error);
      }
    };
    loadGroups();
  }, [user]);

  // Generate report on component mount
  const generateReport = useCallback(async () => {
    if (!reportType) return;
    
    setLoading(true);
    setError(null);
    setCurrentPage(1);
    setSearchTerm('');
    setSortConfig({ key: null, direction: 'asc' });
    
    try {
      let data = [];
      
      switch (reportType) {
        case 'master':
          data = await apiService.getMemberMasterReport(filters);
          break;
        case 'registration':
          data = await apiService.getMemberRegistrationReport(filters);
          break;
        case 'active-inactive':
          data = await apiService.getActiveInactiveMembersReport(filters);
          break;
        case 'disbursement':
          data = await apiService.getLoanDisbursementReport(filters);
          break;
        case 'emi':
          data = await apiService.getLoanEMIReport(filters);
          break;
        case 'overdue':
          data = await apiService.getOverdueReport(filters);
          break;
        default:
          data = [];
      }
      
      setReportData(data);
    } catch (error) {
      console.error('Error generating report:', error);
      setError(error.message || 'Failed to generate report. Please try again.');
      setReportData([]);
    } finally {
      setLoading(false);
    }
  }, [reportType, filters]);

  useEffect(() => {
    if (reportType) {
      generateReport();
    }
  }, [reportType, generateReport]);

  // Utility functions
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedData = (data) => {
    if (!Array.isArray(data) || !sortConfig.key) return data || [];
    
    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const getFilteredData = (data) => {
    if (!Array.isArray(data) || !searchTerm) return data || [];
    
    return data.filter(row => 
      Object.values(row).some(value => 
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  };

  const getPaginatedData = (data) => {
    if (!Array.isArray(data)) return [];
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const renderReportData = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-6"></div>
          <h3 className="text-xl font-semibold text-gray-700 mb-3">Generating Report...</h3>
          <p className="text-gray-500 text-lg">Please wait while we process your data</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-20">
          <div className="mx-auto w-32 h-32 bg-red-100 rounded-full flex items-center justify-center mb-8">
            <FaExclamationTriangle className="w-16 h-16 text-red-500" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">Error Generating Report</h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">{error}</p>
          <button
            onClick={() => {
              setError(null);
              generateReport();
            }}
            className="inline-flex items-center px-8 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-lg cursor-pointer"
          >
            <FaRedo className="mr-3" />
            Try Again
          </button>
        </div>
      );
    }

    if (!reportData || reportData.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center max-w-lg">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
              <FaChartBar className="w-16 h-16 text-white" />
            </div>
            <h3 className="text-3xl font-bold text-gray-800 mb-4">No Data Available</h3>
            <p className="text-gray-600 mb-8 text-xl leading-relaxed">
              No data found for the selected criteria. Try adjusting your filters or date range.
            </p>
            <button
              onClick={() => setShowFilters(true)}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-lg cursor-pointer"
            >
              Adjust Filters
            </button>
          </div>
        </div>
      );
    }

    // Handle special case for active-inactive report
    if (reportData && typeof reportData === 'object' && !Array.isArray(reportData) && reportData.total_members !== undefined) {
      const data = reportData;
      return (
        <div className="space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-blue-800 text-sm uppercase tracking-wide">Total Members</h3>
                  <p className="text-4xl font-bold text-blue-600 mt-3">{data.total_members}</p>
                </div>
                <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center">
                  <FaUsers className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-xl border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-green-800 text-sm uppercase tracking-wide">Active Members</h3>
                  <p className="text-4xl font-bold text-green-600 mt-3">{data.active_members}</p>
                </div>
                <div className="w-16 h-16 bg-green-500 rounded-lg flex items-center justify-center">
                  <FaCheckCircle className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 p-8 rounded-xl border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-red-800 text-sm uppercase tracking-wide">Inactive Members</h3>
                  <p className="text-4xl font-bold text-red-600 mt-3">{data.inactive_members}</p>
                </div>
                <div className="w-16 h-16 bg-red-500 rounded-lg flex items-center justify-center">
                  <FaTimes className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Group Breakdown Table */}
          {data.group_breakdown && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-200 bg-gray-50">
                <h3 className="text-xl font-semibold text-gray-800">Group-wise Breakdown</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full table-fixed">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-8 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap w-1/5">Group</th>
                      <th className="px-8 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap w-1/5">Location</th>
                      <th className="px-8 py-4 text-center text-sm font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap w-1/5">Total</th>
                      <th className="px-8 py-4 text-center text-sm font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap w-1/5">Active</th>
                      <th className="px-8 py-4 text-center text-sm font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap w-1/5">Inactive</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.group_breakdown.map((group, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-8 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{group.group_name}</td>
                        <td className="px-8 py-4 whitespace-nowrap text-sm text-gray-500">{group.location}</td>
                        <td className="px-8 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-900">{group.total}</td>
                        <td className="px-8 py-4 whitespace-nowrap text-sm text-center text-green-600 font-medium">{group.active}</td>
                        <td className="px-8 py-4 whitespace-nowrap text-sm text-center text-red-600 font-medium">{group.inactive}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Regular table for other reports
    const headers = Array.isArray(reportData) && reportData.length > 0 ? Object.keys(reportData[0]) : [];
    const filteredData = getFilteredData(reportData);
    const sortedData = getSortedData(filteredData);
    const paginatedData = getPaginatedData(sortedData);
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    
    return (
      <div className="space-y-8">
        {/* Search and Stats */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center justify-between">
            <div className="flex-1 w-full">
              <div className="relative max-w-lg">
                <FaSearch className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  type="text"
                  placeholder="Search in report data..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 sm:pl-12 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-6">
              <div className="text-xs sm:text-sm text-gray-600">
                <span className="font-semibold text-gray-900">{filteredData.length}</span> of {reportData.length} records
                {searchTerm && <span className="text-blue-600"> (filtered)</span>}
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-3 sm:px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs sm:text-sm transition-colors flex items-center space-x-1 sm:space-x-2 cursor-pointer"
              >
                <FaFilter className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Filters</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Data Display */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed">
              <thead className="bg-gray-50">
                <tr>
                  {headers.map(header => (
                    <th 
                      key={header} 
                      className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap"
                      onClick={() => handleSort(header)}
                    >
                      <div className="flex items-center space-x-2 min-w-0">
                        <span className="truncate">{header.replace(/_/g, ' ')}</span>
                        {sortConfig.key === header && (
                          sortConfig.direction === 'asc' ? <FaSortUp className="flex-shrink-0" /> : <FaSortDown className="flex-shrink-0" />
                        )}
                        {sortConfig.key !== header && <FaSort className="text-gray-300 flex-shrink-0" />}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedData.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    {headers.map(header => (
                      <td key={header} className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap overflow-hidden">
                        <div className="truncate">
                          {header.includes('amount') || header.includes('balance') || header.includes('emi') 
                            ? formatIndianCurrency(row[header] || 0)
                            : row[header] || '-'
                          }
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
                <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} results
                </div>
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-2 sm:px-3 py-2 border border-gray-300 rounded text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 cursor-pointer"
                  >
                    <FaArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-2 sm:px-4 py-2 text-xs sm:text-sm rounded-md cursor-pointer ${
                        page === currentPage 
                          ? 'bg-blue-600 text-white' 
                          : 'border border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-2 sm:px-3 py-2 border border-gray-300 rounded text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 cursor-pointer"
                  >
                    <FaArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!reportType) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 sm:py-6 space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => navigate(getDashboardRoute())}
                className="flex items-center space-x-1 sm:space-x-2 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
              >
                <FaArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-lg font-medium">Back to Dashboard</span>
              </button>
              <div className="h-6 sm:h-8 w-px bg-gray-300"></div>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  {reportIcon === 'FaUsers' && <FaUsers className="w-4 h-4 sm:w-6 sm:h-6 text-white" />}
                  {reportIcon === 'FaClipboardList' && <FaClipboardList className="w-4 h-4 sm:w-6 sm:h-6 text-white" />}
                  {reportIcon === 'FaChartLine' && <FaChartLine className="w-4 h-4 sm:w-6 sm:h-6 text-white" />}
                  {reportIcon === 'FaMoneyBillWave' && <FaMoneyBillWave className="w-4 h-4 sm:w-6 sm:h-6 text-white" />}
                  {reportIcon === 'FaTable' && <FaTable className="w-4 h-4 sm:w-6 sm:h-6 text-white" />}
                  {reportIcon === 'FaExclamationTriangle' && <FaExclamationTriangle className="w-4 h-4 sm:w-6 sm:h-6 text-white" />}
                </div>
                <div>
                  <h1 className="text-lg sm:text-2xl font-bold text-gray-900">{reportName}</h1>
                  <p className="text-sm sm:text-base text-gray-600 hidden sm:block">{reportDescription}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => exportToCSV(reportData, `${reportType}_${new Date().toISOString().split('T')[0]}`)}
                className="px-3 sm:px-6 py-2 sm:py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs sm:text-sm transition-colors flex items-center space-x-1 sm:space-x-2 cursor-pointer"
              >
                <FaDownload className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">Export</span>
              </button>
              <button
                onClick={() => window.print()}
                className="px-3 sm:px-6 py-2 sm:py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xs sm:text-sm transition-colors flex items-center space-x-1 sm:space-x-2 cursor-pointer"
              >
                <FaPrint className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Print</span>
                <span className="sm:hidden">Print</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Group</label>
                <select
                  value={filters.group_id}
                  onChange={(e) => setFilters({...filters, group_id: e.target.value})}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Groups</option>
                  {groups.map(group => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => setFilters({...filters, start_date: e.target.value})}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => setFilters({...filters, end_date: e.target.value})}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mt-4 sm:mt-6 space-y-3 sm:space-y-0 sm:space-x-4">
              <button
                onClick={() => {
                  setFilters({
                    group_id: '',
                    status: '',
                    start_date: '',
                    end_date: '',
                    days_overdue: 30
                  });
                  setReportData([]);
                }}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
              <button
                onClick={() => {
                  generateReport();
                  setShowFilters(false);
                }}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors cursor-pointer"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderReportData()}
      </div>
    </div>
  );
}

export default FullPageReport;