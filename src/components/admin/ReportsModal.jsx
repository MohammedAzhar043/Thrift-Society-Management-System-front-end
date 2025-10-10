import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaTimes, FaChartBar, FaUsers, FaMoneyBillWave, 
  FaExclamationTriangle, FaChevronRight, FaCheckCircle,
  FaTable, FaChartLine, FaClipboardList
} from 'react-icons/fa';

function ReportsModal({ isOpen, onClose, groups = [], user }) {
  const navigate = useNavigate();

  const reportTypes = {
    members: [
      { 
        id: 'master', 
        name: 'Member Master', 
        icon: 'FaUsers', 
        description: 'Complete member database', 
        color: 'blue',
        category: 'Database'
      },
      { 
        id: 'registration', 
        name: 'Registration Report', 
        icon: 'FaClipboardList', 
        description: 'New member registrations', 
        color: 'green',
        category: 'Activity'
      },
      { 
        id: 'active-inactive', 
        name: 'Status Summary', 
        icon: 'FaChartLine', 
        description: 'Active vs Inactive members', 
        color: 'purple',
        category: 'Analytics'
      }
    ],
    loans: [
      { 
        id: 'disbursement', 
        name: 'Disbursement Report', 
        icon: 'FaMoneyBillWave', 
        description: 'All loan disbursements', 
        color: 'orange',
        category: 'Financial'
      },
      { 
        id: 'emi', 
        name: 'EMI Schedule', 
        icon: 'FaTable', 
        description: 'Payment schedules', 
        color: 'teal',
        category: 'Financial'
      },
      { 
        id: 'overdue', 
        name: 'Overdue Report', 
        icon: 'FaExclamationTriangle', 
        description: 'Defaulters and overdue loans', 
        color: 'red',
        category: 'Risk'
      }
    ]
  };

  const generateReport = (reportType) => {
    // Find the report details
    let reportDetails = null;
    for (const category of Object.values(reportTypes)) {
      const report = category.find(r => r.id === reportType);
      if (report) {
        reportDetails = report;
        break;
      }
    }

    if (reportDetails) {
      // Navigate to the full-page report with state
      navigate(`/reports/${reportType}`, {
        state: {
          reportType,
          reportName: reportDetails.name,
          reportDescription: reportDetails.description,
          reportIcon: reportDetails.icon,
          user: user // Pass user information for proper navigation
        }
      });
      // Close the modal
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] sm:h-[85vh] overflow-hidden">
        {/* Reports Menu */}
        <div className="bg-gradient-to-b from-blue-50 to-indigo-50 h-full flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <FaChartBar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-gray-800">Reports Center</h2>
                  <p className="text-gray-600 text-xs hidden sm:block">Generate & analyze data</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-all cursor-pointer"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Report Categories */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-6">
            <div className="space-y-6 sm:space-y-8">
              {Object.keys(reportTypes).map(category => (
                <div key={category} className="space-y-3 sm:space-y-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-600 uppercase tracking-wider">
                    {category}
                  </h3>
                  <div className="space-y-2 sm:space-y-3">
                    {reportTypes[category]?.map(report => (
                      <button
                        key={report.id}
                        onClick={() => generateReport(report.id)}
                        className="w-full text-left p-4 sm:p-6 rounded-xl transition-all duration-200 group bg-white hover:bg-gray-50 border border-gray-200 hover:border-blue-300 hover:shadow-lg cursor-pointer"
                      >
                        <div className="flex items-center space-x-3 sm:space-x-4 cursor-pointer">
                          <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center bg-gray-100 group-hover:bg-blue-100 transition-colors">
                            {report.icon === 'FaUsers' && <FaUsers className="w-5 h-5 sm:w-7 sm:h-7 text-gray-600 group-hover:text-blue-600" />}
                            {report.icon === 'FaClipboardList' && <FaClipboardList className="w-5 h-5 sm:w-7 sm:h-7 text-gray-600 group-hover:text-blue-600" />}
                            {report.icon === 'FaChartLine' && <FaChartLine className="w-5 h-5 sm:w-7 sm:h-7 text-gray-600 group-hover:text-blue-600" />}
                            {report.icon === 'FaMoneyBillWave' && <FaMoneyBillWave className="w-5 h-5 sm:w-7 sm:h-7 text-gray-600 group-hover:text-blue-600" />}
                            {report.icon === 'FaTable' && <FaTable className="w-5 h-5 sm:w-7 sm:h-7 text-gray-600 group-hover:text-blue-600" />}
                            {report.icon === 'FaExclamationTriangle' && <FaExclamationTriangle className="w-5 h-5 sm:w-7 sm:h-7 text-gray-600 group-hover:text-blue-600" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm sm:text-lg text-gray-800 group-hover:text-blue-800 truncate">{report.name}</div>
                            <div className="text-xs sm:text-sm text-gray-500 group-hover:text-blue-600 truncate">{report.description}</div>
                          </div>
                          <FaChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-blue-500 flex-shrink-0" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportsModal;