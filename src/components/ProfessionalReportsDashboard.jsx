import React, { useState } from 'react';
import apiService from '../services/api';
import { toast } from 'react-hot-toast';
import { 
  FaChartBar, FaUsers, FaMoneyBillWave, FaExclamationTriangle, 
  FaCheckCircle, FaTimes, FaDownload, FaFilter, FaCalendarAlt,
  FaEye, FaFileExcel, FaFilePdf, FaTable, FaChartLine, FaInfo
} from 'react-icons/fa';

function ProfessionalReportsDashboard({ user, onClose }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    groupId: '',
    reportType: ''
  });

  // Report categories with professional descriptions
  const reportCategories = {
    overview: {
      title: 'Executive Overview',
      icon: FaChartBar,
      color: 'blue',
      reports: [
        {
          id: 'executive-summary',
          name: 'Executive Summary',
          description: 'Key performance indicators and management insights',
          endpoint: '/reports/executive-summary',
          format: 'dashboard'
        }
      ]
    },
    financial: {
      title: 'Financial Performance',
      icon: FaMoneyBillWave,
      color: 'green',
      reports: [
        {
          id: 'portfolio-quality',
          name: 'Portfolio Quality',
          description: 'PAR analysis and portfolio health assessment',
          endpoint: '/reports/portfolio-quality',
          format: 'detailed'
        },
        {
          id: 'financial-sustainability',
          name: 'Financial Sustainability',
          description: 'OSS, FSS, ROA, and financial health metrics',
          endpoint: '/reports/financial-sustainability',
          format: 'detailed'
        }
      ]
    },
    operational: {
      title: 'Operational Efficiency',
      icon: FaChartLine,
      color: 'orange',
      reports: [
        {
          id: 'collection-efficiency-enhanced',
          name: 'Collection Efficiency',
          description: 'Performance metrics for field staff and groups',
          endpoint: '/reports/collections/efficiency-enhanced',
          format: 'detailed'
        }
      ]
    },
    social: {
      title: 'Social Impact',
      icon: FaUsers,
      color: 'purple',
      reports: [
        {
          id: 'social-impact',
          name: 'Social Impact Report',
          description: 'Outreach metrics and social impact assessment',
          endpoint: '/reports/social-impact',
          format: 'detailed'
        }
      ]
    }
  };

  const generateReport = async (report) => {
    setLoading(true);
    setSelectedReport(report);
    
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('start_date', filters.startDate);
      if (filters.endDate) params.append('end_date', filters.endDate);
      if (filters.groupId) params.append('group_id', filters.groupId);
      
      const endpointWithQuery = `${report.endpoint}?${params.toString()}`;
      const data = await apiService.request(endpointWithQuery);
      setReportData(data);
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = (format) => {
    if (!reportData) return;
    
    const filename = `${selectedReport.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`;
    
    if (format === 'excel') {
      // Convert to CSV format
      const csvContent = convertToCSV(reportData);
      downloadCSV(csvContent, `${filename}.csv`);
      toast.success('Excel file downloaded successfully');
    } else if (format === 'pdf') {
      exportToPDF(filename);
    }
  };

  const exportToPDF = (filename) => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    
    // Generate HTML content for the report
    const htmlContent = generateReportHTML();
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${selectedReport.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .section { margin-bottom: 25px; }
          .section h3 { color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
          .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 15px 0; }
          .metric-card { background: #f9fafb; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; }
          .metric-card h4 { margin: 0 0 10px 0; color: #374151; font-size: 14px; }
          .metric-value { font-size: 18px; font-weight: bold; color: #111827; }
          .recommendations { background: #eff6ff; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .recommendations ul { margin: 0; padding-left: 20px; }
          .alerts { margin: 15px 0; }
          .alert { padding: 10px; margin: 5px 0; border-radius: 5px; }
          .alert.warning { background: #fef3c7; border-left: 4px solid #f59e0b; }
          .alert.error { background: #fee2e2; border-left: 4px solid #ef4444; }
          .alert.success { background: #d1fae5; border-left: 4px solid #10b981; }
          .alert.info { background: #dbeafe; border-left: 4px solid #3b82f6; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
      </html>
    `);
    
    printWindow.document.close();
    
    // Wait for content to load, then trigger print dialog
    setTimeout(() => {
      printWindow.print();
      toast.success('PDF export initiated - use browser print dialog to save as PDF');
    }, 500);
  };

  const generateReportHTML = () => {
    if (!reportData) return '';
    
    let html = `
      <div class="header">
        <h1>${selectedReport.name}</h1>
        <p>${selectedReport.description}</p>
        <p><strong>Generated:</strong> ${reportData.generated_at ? new Date(reportData.generated_at).toLocaleString() : 'N/A'}</p>
      </div>
    `;
    
    // Key Metrics
    if (reportData.key_metrics) {
      html += '<div class="section"><h3>Key Metrics</h3>';
      Object.entries(reportData.key_metrics).forEach(([category, metrics]) => {
        html += `<h4>${category.replace(/_/g, ' ').toUpperCase()}</h4><div class="metrics-grid">`;
        Object.entries(metrics).forEach(([key, value]) => {
          const formattedValue = typeof value === 'number' ? 
            (key.includes('rate') || key.includes('percentage') ? `${value.toFixed(1)}%` : value.toLocaleString()) 
            : value;
          html += `
            <div class="metric-card">
              <h4>${key.replace(/_/g, ' ')}</h4>
              <div class="metric-value">${formattedValue}</div>
            </div>
          `;
        });
        html += '</div>';
      });
      html += '</div>';
    }
    
    // Performance Indicators
    if (reportData.performance_indicators) {
      html += '<div class="section"><h3>Performance Indicators</h3><div class="metrics-grid">';
      Object.entries(reportData.performance_indicators).forEach(([key, value]) => {
        html += `
          <div class="metric-card">
            <h4>${key.replace(/_/g, ' ')}</h4>
            <div class="metric-value">${value}</div>
          </div>
        `;
      });
      html += '</div></div>';
    }
    
    // Recommendations
    if (reportData.recommendations && reportData.recommendations.length > 0) {
      html += '<div class="section"><h3>Recommendations</h3><div class="recommendations"><ul>';
      reportData.recommendations.forEach(rec => {
        html += `<li>${rec}</li>`;
      });
      html += '</ul></div></div>';
    }
    
    // Alerts
    if (reportData.alerts && reportData.alerts.length > 0) {
      html += '<div class="section"><h3>Alerts & Notifications</h3><div class="alerts">';
      reportData.alerts.forEach(alert => {
        if (alert) {
          html += `<div class="alert ${alert.type}"><strong>${alert.type.toUpperCase()}:</strong> ${alert.message}</div>`;
        }
      });
      html += '</div></div>';
    }
    
    return html;
  };

  const convertToCSV = (data) => {
    const csvRows = [];
    
    // Add report header
    csvRows.push(['Report Type', data.report_type || '']);
    csvRows.push(['Generated At', data.generated_at ? new Date(data.generated_at).toLocaleString() : '']);
    csvRows.push(['Summary Date', data.summary_date || '']);
    csvRows.push(['Report Date', data.report_date || '']);
    csvRows.push(['']); // Empty row
    
    // Portfolio Summary
    if (data.portfolio_summary) {
      csvRows.push(['PORTFOLIO SUMMARY']);
      Object.entries(data.portfolio_summary).forEach(([key, value]) => {
        const formattedValue = typeof value === 'number' ? 
          (key.includes('amount') ? `₹${value.toLocaleString()}` : value.toLocaleString()) 
          : value;
        csvRows.push([key.replace(/_/g, ' '), formattedValue]);
      });
      csvRows.push(['']); // Empty row
    }
    
    // Portfolio at Risk
    if (data.portfolio_at_risk) {
      csvRows.push(['PORTFOLIO AT RISK (PAR)']);
      Object.entries(data.portfolio_at_risk).forEach(([par_period, par_data]) => {
        csvRows.push([par_period.replace(/_/g, ' ').toUpperCase()]);
        csvRows.push(['  Count', par_data.count]);
        csvRows.push(['  Percentage', `${par_data.percentage}%`]);
        csvRows.push(['  Status', par_data.status]);
      });
      csvRows.push(['']); // Empty row
    }
    
    // Risk Indicators
    if (data.risk_indicators) {
      csvRows.push(['RISK ASSESSMENT']);
      Object.entries(data.risk_indicators).forEach(([key, value]) => {
        csvRows.push([key.replace(/_/g, ' '), value]);
      });
      csvRows.push(['']); // Empty row
    }
    
    // Revenue & Costs
    if (data.revenue) {
      csvRows.push(['REVENUE']);
      Object.entries(data.revenue).forEach(([key, value]) => {
        csvRows.push([key.replace(/_/g, ' '), `₹${typeof value === 'number' ? value.toLocaleString() : value}`]);
      });
      csvRows.push(['']); // Empty row
    }
    
    if (data.costs) {
      csvRows.push(['COSTS']);
      Object.entries(data.costs).forEach(([key, value]) => {
        csvRows.push([key.replace(/_/g, ' '), `₹${typeof value === 'number' ? value.toLocaleString() : value}`]);
      });
      csvRows.push(['']); // Empty row
    }
    
    // Sustainability Ratios
    if (data.sustainability_ratios) {
      csvRows.push(['SUSTAINABILITY RATIOS']);
      Object.entries(data.sustainability_ratios).forEach(([key, value]) => {
        const formattedValue = typeof value === 'number' ? 
          (key.includes('ratio') || key.includes('sufficiency') ? `${value.toFixed(1)}%` : `₹${value.toLocaleString()}`) 
          : value;
        csvRows.push([key.replace(/_/g, ' '), formattedValue]);
      });
      csvRows.push(['']); // Empty row
    }
    
    // Assessment
    if (data.assessment) {
      csvRows.push(['ASSESSMENT']);
      Object.entries(data.assessment).forEach(([key, value]) => {
        if (key !== 'recommendations') {
          csvRows.push([key.replace(/_/g, ' '), value]);
        }
      });
      if (data.assessment.recommendations) {
        csvRows.push(['']);
        csvRows.push(['RECOMMENDATIONS']);
        data.assessment.recommendations.forEach((rec, index) => {
          csvRows.push([`${index + 1}.`, rec]);
        });
      }
      csvRows.push(['']); // Empty row
    }
    
    // Outreach Metrics
    if (data.outreach_metrics) {
      csvRows.push(['OUTREACH METRICS']);
      Object.entries(data.outreach_metrics).forEach(([key, value]) => {
        const formattedValue = typeof value === 'number' ? 
          (key.includes('rate') ? `${value.toFixed(1)}%` : value.toLocaleString()) 
          : value;
        csvRows.push([key.replace(/_/g, ' '), formattedValue]);
      });
      csvRows.push(['']); // Empty row
    }
    
    // Geographic Distribution
    if (data.geographic_distribution) {
      csvRows.push(['GEOGRAPHIC DISTRIBUTION']);
      csvRows.push(['Location', 'Members', 'Loans', 'Total Disbursed', 'Avg Loan Size', 'Penetration Rate']);
      data.geographic_distribution.forEach(location => {
        csvRows.push([
          location.location,
          location.member_count,
          location.loan_count,
          `₹${location.total_disbursed.toLocaleString()}`,
          `₹${location.avg_loan_size.toLocaleString()}`,
          `${location.penetration_rate}%`
        ]);
      });
      csvRows.push(['']); // Empty row
    }
    
    // Loan Size Distribution
    if (data.loan_size_distribution) {
      csvRows.push(['LOAN SIZE DISTRIBUTION']);
      csvRows.push(['Category', 'Count', 'Total Amount', 'Percentage']);
      data.loan_size_distribution.forEach(category => {
        csvRows.push([
          category.category,
          category.count,
          `₹${category.total_amount.toLocaleString()}`,
          `${category.percentage}%`
        ]);
      });
      csvRows.push(['']); // Empty row
    }
    
    // Impact Indicators
    if (data.impact_indicators) {
      csvRows.push(['IMPACT INDICATORS']);
      Object.entries(data.impact_indicators).forEach(([key, value]) => {
        const formattedValue = typeof value === 'number' ? 
          (key.includes('score') ? value.toFixed(1) : 
           key.includes('size') || key.includes('disbursed') ? `₹${value.toLocaleString()}` : 
           value.toLocaleString()) 
          : value;
        csvRows.push([key.replace(/_/g, ' '), formattedValue]);
      });
      csvRows.push(['']); // Empty row
    }
    
    // Social Impact Assessment
    if (data.social_impact_assessment) {
      csvRows.push(['SOCIAL IMPACT ASSESSMENT']);
      Object.entries(data.social_impact_assessment).forEach(([key, value]) => {
        csvRows.push([key.replace(/_/g, ' '), value]);
      });
      csvRows.push(['']); // Empty row
    }
    
    // Summary (for Collection Efficiency)
    if (data.summary) {
      csvRows.push(['SUMMARY']);
      Object.entries(data.summary).forEach(([key, value]) => {
        csvRows.push([key.replace(/_/g, ' '), typeof value === 'number' ? value.toLocaleString() : value]);
      });
      csvRows.push(['']); // Empty row
    }
    
    // Group Performance (for Collection Efficiency)
    if (data.group_performance) {
      csvRows.push(['GROUP PERFORMANCE']);
      csvRows.push(['Group', 'Location', 'Collection Days', 'Total Collected', 'Avg Daily Collection']);
      data.group_performance.forEach(group => {
        csvRows.push([
          group.name,
          group.location,
          group.collection_days,
          `₹${group.total_collected.toLocaleString()}`,
          `₹${group.avg_daily_collection.toLocaleString()}`
        ]);
      });
      csvRows.push(['']); // Empty row
    }
    
    // Key Metrics (for Executive Summary)
    if (data.key_metrics) {
      csvRows.push(['KEY METRICS']);
      Object.entries(data.key_metrics).forEach(([category, metrics]) => {
        csvRows.push([category.replace(/_/g, ' ').toUpperCase()]);
        Object.entries(metrics).forEach(([key, value]) => {
          const formattedValue = typeof value === 'number' ? 
            (key.includes('rate') || key.includes('percentage') ? `${value.toFixed(1)}%` : value.toLocaleString()) 
            : value;
          csvRows.push([`  ${key.replace(/_/g, ' ')}`, formattedValue]);
        });
        csvRows.push(['']); // Empty row after each category
      });
    }
    
    // Performance Indicators
    if (data.performance_indicators) {
      csvRows.push(['PERFORMANCE INDICATORS']);
      Object.entries(data.performance_indicators).forEach(([key, value]) => {
        csvRows.push([key.replace(/_/g, ' '), value]);
      });
      csvRows.push(['']); // Empty row
    }
    
    // Recommendations
    if (data.recommendations && data.recommendations.length > 0) {
      csvRows.push(['RECOMMENDATIONS']);
      data.recommendations.forEach((rec, index) => {
        csvRows.push([`${index + 1}.`, rec]);
      });
      csvRows.push(['']); // Empty row
    }
    
    // Alerts
    if (data.alerts && data.alerts.length > 0) {
      csvRows.push(['ALERTS & NOTIFICATIONS']);
      data.alerts.forEach((alert, index) => {
        if (alert) {
          csvRows.push([`${index + 1}.`, alert.type, alert.message]);
        }
      });
    }
    
    // Convert to CSV format
    return csvRows.map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
  };

  const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const renderReportData = () => {
    if (!reportData) return null;

    return (
      <div className="bg-white rounded-lg shadow-lg p-6 max-h-full overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-800">{selectedReport.name}</h3>
            <p className="text-gray-600">{selectedReport.description}</p>
            {reportData.generated_at && (
              <p className="text-sm text-gray-500 mt-1">
                Generated: {new Date(reportData.generated_at).toLocaleString()}
              </p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <button
              onClick={() => exportReport('excel')}
              className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer text-sm sm:text-base"
            >
              <FaFileExcel className="w-4 h-4" />
              <span>Excel</span>
            </button>
            <button
              onClick={() => exportReport('pdf')}
              className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer text-sm sm:text-base"
            >
              <FaFilePdf className="w-4 h-4" />
              <span>PDF</span>
            </button>
          </div>
        </div>

        {/* Portfolio Summary */}
        {reportData.portfolio_summary && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold mb-4 text-gray-800">Portfolio Summary</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(reportData.portfolio_summary).map(([key, value]) => (
                <div key={key} className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-700 mb-2 capitalize">{key.replace(/_/g, ' ')}</h5>
                  <p className="text-2xl font-bold text-gray-900">
                    {typeof value === 'number' ? 
                      (key.includes('amount') ? `₹${value.toLocaleString()}` : value.toLocaleString()) 
                      : value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Portfolio at Risk */}
        {reportData.portfolio_at_risk && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold mb-4 text-gray-800">Portfolio at Risk (PAR)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(reportData.portfolio_at_risk).map(([par_period, data]) => (
                <div key={par_period} className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-700 mb-2">{par_period.replace(/_/g, ' ').toUpperCase()}</h5>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Count:</span>
                      <span className="font-medium">{data.count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Percentage:</span>
                      <span className="font-medium">{data.percentage}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        data.status === 'Good' ? 'bg-green-100 text-green-800' :
                        data.status === 'Concerning' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {data.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Risk Indicators */}
        {reportData.risk_indicators && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold mb-4 text-gray-800">Risk Assessment</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(reportData.risk_indicators).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="font-medium capitalize text-gray-700">{key.replace(/_/g, ' ')}</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    value === 'Low' || value === 'Excellent' || value === 'Good' ? 'bg-green-100 text-green-800' :
                    value === 'Medium' || value === 'Moderate' || value === 'Concerning' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Revenue & Costs */}
        {reportData.revenue && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold mb-4 text-gray-800">Revenue & Costs</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-green-50 rounded-lg p-4">
                <h5 className="font-semibold text-green-800 mb-3">Revenue</h5>
                <div className="space-y-2">
                  {Object.entries(reportData.revenue).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-sm text-green-700 capitalize">{key.replace(/_/g, ' ')}</span>
                      <span className="font-medium text-green-800">₹{typeof value === 'number' ? value.toLocaleString() : value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <h5 className="font-semibold text-red-800 mb-3">Costs</h5>
                <div className="space-y-2">
                  {Object.entries(reportData.costs).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-sm text-red-700 capitalize">{key.replace(/_/g, ' ')}</span>
                      <span className="font-medium text-red-800">₹{typeof value === 'number' ? value.toLocaleString() : value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sustainability Ratios */}
        {reportData.sustainability_ratios && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold mb-4 text-gray-800">Sustainability Ratios</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(reportData.sustainability_ratios).map(([key, value]) => (
                <div key={key} className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-700 mb-2 capitalize">{key.replace(/_/g, ' ')}</h5>
                  <p className="text-2xl font-bold text-gray-900">
                    {typeof value === 'number' ? 
                      (key.includes('ratio') || key.includes('sufficiency') ? `${value.toFixed(1)}%` : `₹${value.toLocaleString()}`) 
                      : value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assessment */}
        {reportData.assessment && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold mb-4 text-gray-800">Assessment</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(reportData.assessment).map(([key, value]) => {
                if (key === 'recommendations') return null; // Handle separately
                return (
                  <div key={key} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <span className="font-medium capitalize text-gray-700">{key.replace(/_/g, ' ')}</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      value === 'Self-sufficient' || value === 'Financially sustainable' || value === 'Good' || value === 'Sustainable' ? 'bg-green-100 text-green-800' :
                      value === 'Subsidized' || value === 'Needs improvement' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {value}
                    </span>
                  </div>
                );
              })}
            </div>
            {reportData.assessment.recommendations && (
              <div className="mt-4">
                <h5 className="font-semibold text-gray-700 mb-2">Recommendations</h5>
                <div className="space-y-2">
                  {reportData.assessment.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                      <FaCheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Outreach Metrics */}
        {reportData.outreach_metrics && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold mb-4 text-gray-800">Outreach Metrics</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {Object.entries(reportData.outreach_metrics).map(([key, value]) => (
                <div key={key} className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-700 mb-2 capitalize">{key.replace(/_/g, ' ')}</h5>
                  <p className="text-2xl font-bold text-gray-900">
                    {typeof value === 'number' ? 
                      (key.includes('rate') ? `${value.toFixed(1)}%` : value.toLocaleString()) 
                      : value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Geographic Distribution */}
        {reportData.geographic_distribution && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold mb-4 text-gray-800">Geographic Distribution</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-700">Location</th>
                    <th className="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-700">Members</th>
                    <th className="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-700">Loans</th>
                    <th className="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-700">Total Disbursed</th>
                    <th className="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-700">Avg Loan Size</th>
                    <th className="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-700">Penetration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reportData.geographic_distribution.map((location, index) => (
                    <tr key={index}>
                      <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-900">{location.location}</td>
                      <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-900">{location.member_count}</td>
                      <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-900">{location.loan_count}</td>
                      <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-900">₹{location.total_disbursed.toLocaleString()}</td>
                      <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-900">₹{location.avg_loan_size.toLocaleString()}</td>
                      <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-900">{location.penetration_rate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Loan Size Distribution */}
        {reportData.loan_size_distribution && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold mb-4 text-gray-800">Loan Size Distribution</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {reportData.loan_size_distribution.map((category, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-700 mb-2">{category.category}</h5>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Count:</span>
                      <span className="font-medium">{category.count}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-medium">₹{category.total_amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Percentage:</span>
                      <span className="font-medium">{category.percentage}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Impact Indicators */}
        {reportData.impact_indicators && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold mb-4 text-gray-800">Impact Indicators</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {Object.entries(reportData.impact_indicators).map(([key, value]) => (
                <div key={key} className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-700 mb-2 capitalize">{key.replace(/_/g, ' ')}</h5>
                  <p className="text-lg font-bold text-gray-900">
                    {typeof value === 'number' ? 
                      (key.includes('score') ? value.toFixed(1) : 
                       key.includes('size') || key.includes('disbursed') ? `₹${value.toLocaleString()}` : 
                       value.toLocaleString()) 
                      : value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Social Impact Assessment */}
        {reportData.social_impact_assessment && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold mb-4 text-gray-800">Social Impact Assessment</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(reportData.social_impact_assessment).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="font-medium capitalize text-gray-700">{key.replace(/_/g, ' ')}</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    value === 'High' || value === 'Strong' || value === 'Significant' ? 'bg-green-100 text-green-800' :
                    value === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary Data (for Collection Efficiency) */}
        {reportData.summary && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold mb-4 text-gray-800">Summary</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(reportData.summary).map(([key, value]) => (
                <div key={key} className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-700 capitalize mb-2">{key.replace(/_/g, ' ')}</h5>
                  <p className="text-2xl font-bold text-gray-900">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Group Performance (for Collection Efficiency) */}
        {reportData.group_performance && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold mb-4 text-gray-800">Group Performance</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-700">Group</th>
                    <th className="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-700">Location</th>
                    <th className="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-700">Collection Days</th>
                    <th className="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-700">Total Collected</th>
                    <th className="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-700">Avg Daily</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reportData.group_performance.map((group, index) => (
                    <tr key={index}>
                      <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-900">{group.name}</td>
                      <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-900">{group.location}</td>
                      <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-900">{group.collection_days}</td>
                      <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-900">₹{group.total_collected.toLocaleString()}</td>
                      <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-900">₹{group.avg_daily_collection.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Performance Indicators */}
        {reportData.performance_indicators && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold mb-4 text-gray-800">Performance Indicators</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(reportData.performance_indicators).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="font-medium capitalize text-gray-700">{key.replace(/_/g, ' ')}</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    value === 'Good' || value === 'Excellent' || value === 'High' ? 'bg-green-100 text-green-800' :
                    value === 'Moderate' || value === 'Average' || value === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {reportData.recommendations && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold mb-4 text-gray-800">Recommendations</h4>
            <div className="space-y-3">
              {reportData.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                  <FaCheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{rec}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alerts */}
        {reportData.alerts && reportData.alerts.length > 0 && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold mb-4 text-gray-800">Alerts & Notifications</h4>
            <div className="space-y-3">
              {reportData.alerts.map((alert, index) => {
                if (!alert) return null;
                return (
                  <div key={index} className={`flex items-start space-x-3 p-3 rounded-lg ${
                    alert.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                    alert.type === 'error' ? 'bg-red-50 border border-red-200' :
                    alert.type === 'success' ? 'bg-green-50 border border-green-200' :
                    'bg-blue-50 border border-blue-200'
                  }`}>
                    {alert.type === 'warning' ? <FaExclamationTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" /> :
                     alert.type === 'error' ? <FaExclamationTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" /> :
                     alert.type === 'success' ? <FaCheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" /> :
                     <FaInfo className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />}
                    <span className={`text-sm ${
                      alert.type === 'warning' ? 'text-yellow-800' :
                      alert.type === 'error' ? 'text-red-800' :
                      alert.type === 'success' ? 'text-green-800' :
                      'text-blue-800'
                    }`}>
                      {alert.message}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Additional Data Sections */}
        {reportData.detailed_metrics && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold mb-4 text-gray-800">Detailed Metrics</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                {JSON.stringify(reportData.detailed_metrics, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Summary Data */}
        {reportData.summary && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold mb-4 text-gray-800">Summary</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(reportData.summary).map(([key, value]) => (
                <div key={key} className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-700 capitalize mb-2">{key.replace(/_/g, ' ')}</h5>
                  <p className="text-2xl font-bold text-gray-900">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 sm:p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <FaChartBar className="w-6 h-6 sm:w-8 sm:h-8" />
              <div>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">Professional Reports Center</h2>
                <p className="text-blue-100 text-sm sm:text-base">Industry-standard microfinance reporting</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 hover:bg-white/20 p-2 rounded-lg transition-colors cursor-pointer"
            >
              <FaTimes className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-full lg:w-1/3 bg-gray-50 border-r border-gray-200 overflow-y-auto">
            {/* Filters */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold mb-3 flex items-center">
                <FaFilter className="w-4 h-4 mr-2" />
                Filters
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Report Categories */}
            <div className="p-4">
              <h3 className="font-semibold mb-3">Report Categories</h3>
              <div className="space-y-2">
                {Object.entries(reportCategories).map(([key, category]) => (
                  <div key={key}>
                    <button
                      onClick={() => setActiveTab(key)}
                      className={`w-full text-left p-3 rounded-lg transition-colors cursor-pointer ${
                        activeTab === key 
                          ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <category.icon className="w-4 h-4" />
                        <span className="font-medium">{category.title}</span>
                      </div>
                    </button>
                    
                    {activeTab === key && (
                      <div className="mt-2 ml-6 space-y-1">
                        {category.reports.map(report => (
                          <button
                            key={report.id}
                            onClick={() => generateReport(report)}
                            disabled={loading}
                            className="w-full text-left p-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                          >
                            {report.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-2 sm:p-4">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Generating report...</p>
                </div>
              </div>
            ) : selectedReport ? (
              renderReportData()
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <FaChartBar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-xl font-semibold mb-2">Select a Report</h3>
                  <p>Choose a report from the sidebar to view detailed analytics and insights.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfessionalReportsDashboard;