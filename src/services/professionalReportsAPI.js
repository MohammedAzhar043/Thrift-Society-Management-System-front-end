/**
 * Enhanced API Service for Professional Microfinance Reports
 * Handles all professional reporting endpoints and data management
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://82.112.231.241:8000';

class ProfessionalReportsAPI {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // ============================================================================
  // ENHANCED EXISTING REPORTS
  // ============================================================================

  async getEnhancedMemberMasterReport(filters = {}) {
    const params = new URLSearchParams();
    if (filters.groupId) params.append('group_id', filters.groupId);
    if (filters.status) params.append('status', filters.status);
    
    return await this.request(`/api/v1/reports/members/master-enhanced?${params.toString()}`);
  }

  async getEnhancedLoanDisbursementReport(filters = {}) {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('start_date', filters.startDate);
    if (filters.endDate) params.append('end_date', filters.endDate);
    if (filters.groupId) params.append('group_id', filters.groupId);
    if (filters.status) params.append('status', filters.status);
    
    return await this.request(`/api/v1/reports/loans/disbursement-enhanced?${params.toString()}`);
  }

  async getEnhancedCollectionEfficiencyReport(filters = {}) {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('start_date', filters.startDate);
    if (filters.endDate) params.append('end_date', filters.endDate);
    if (filters.groupId) params.append('group_id', filters.groupId);
    
    return await this.request(`/api/v1/reports/collections/efficiency-enhanced?${params.toString()}`);
  }

  // ============================================================================
  // NEW PROFESSIONAL REPORTS
  // ============================================================================

  async getPortfolioQualityReport(filters = {}) {
    const params = new URLSearchParams();
    if (filters.asOfDate) params.append('as_of_date', filters.asOfDate);
    if (filters.groupId) params.append('group_id', filters.groupId);
    
    return await this.request(`/api/v1/reports/portfolio-quality?${params.toString()}`);
  }

  async getFinancialSustainabilityReport(filters = {}) {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('start_date', filters.startDate);
    if (filters.endDate) params.append('end_date', filters.endDate);
    
    return await this.request(`/api/v1/reports/financial-sustainability?${params.toString()}`);
  }

  async getExecutiveSummaryReport() {
    return await this.request('/api/v1/reports/executive-summary');
  }

  async getSocialImpactReport() {
    return await this.request('/api/v1/reports/social-impact');
  }

  async getRiskManagementReport() {
    return await this.request('/api/v1/reports/risk-management');
  }

  // ============================================================================
  // DASHBOARD AND ANALYTICS
  // ============================================================================

  async getDashboardMetrics() {
    return await this.request('/api/v1/reports/dashboard-metrics');
  }

  async getPerformanceIndicators() {
    return await this.request('/api/v1/reports/performance-indicators');
  }

  async getRiskAssessment() {
    return await this.request('/api/v1/reports/risk-assessment');
  }

  // ============================================================================
  // EXPORT FUNCTIONALITY
  // ============================================================================

  async exportReport(reportType, format = 'excel', filters = {}) {
    const params = new URLSearchParams();
    params.append('format', format);
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });

    try {
      const response = await fetch(`${this.baseURL}/api/v1/reports/export/${reportType}?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.status}`);
      }

      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  async getAvailableReports() {
    return await this.request('/api/v1/reports/available');
  }

  async getReportTemplates() {
    return await this.request('/api/v1/reports/templates');
  }

  async validateReportParameters(reportType, parameters) {
    return await this.request(`/api/v1/reports/validate/${reportType}`, {
      method: 'POST',
      body: JSON.stringify(parameters),
    });
  }

  // ============================================================================
  // DATA PROCESSING HELPERS
  // ============================================================================

  processReportData(data, reportType) {
    switch (reportType) {
      case 'portfolio-quality':
        return this.processPortfolioQualityData(data);
      case 'financial-sustainability':
        return this.processFinancialSustainabilityData(data);
      case 'executive-summary':
        return this.processExecutiveSummaryData(data);
      case 'social-impact':
        return this.processSocialImpactData(data);
      default:
        return data;
    }
  }

  processPortfolioQualityData(data) {
    return {
      ...data,
      charts: {
        parTrend: {
          labels: ['PAR 30', 'PAR 60', 'PAR 90'],
          datasets: [{
            label: 'Portfolio at Risk (%)',
            data: [
              data.portfolio_at_risk?.par_30_days?.percentage || 0,
              data.portfolio_at_risk?.par_60_days?.percentage || 0,
              data.portfolio_at_risk?.par_90_days?.percentage || 0
            ],
            backgroundColor: ['#ef4444', '#f59e0b', '#10b981']
          }]
        }
      }
    };
  }

  processFinancialSustainabilityData(data) {
    return {
      ...data,
      charts: {
        sustainability: {
          labels: ['OSS', 'FSS', 'ROA'],
          datasets: [{
            label: 'Sustainability Ratios (%)',
            data: [
              data.sustainability_ratios?.operational_self_sufficiency || 0,
              data.sustainability_ratios?.financial_self_sufficiency || 0,
              data.sustainability_ratios?.return_on_assets || 0
            ],
            backgroundColor: ['#3b82f6', '#10b981', '#f59e0b']
          }]
        }
      }
    };
  }

  processExecutiveSummaryData(data) {
    return {
      ...data,
      charts: {
        keyMetrics: {
          labels: ['Members', 'Groups', 'Loans', 'Portfolio'],
          datasets: [{
            label: 'Count',
            data: [
              data.key_metrics?.members?.total || 0,
              data.key_metrics?.groups?.total || 0,
              data.key_metrics?.portfolio?.active_loans || 0,
              Math.round((data.key_metrics?.portfolio?.total_amount || 0) / 1000) // Convert to thousands
            ],
            backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']
          }]
        }
      }
    };
  }

  processSocialImpactData(data) {
    return {
      ...data,
      charts: {
        geographicDistribution: {
          labels: data.geographic_distribution?.map(g => g.location) || [],
          datasets: [{
            label: 'Members',
            data: data.geographic_distribution?.map(g => g.member_count) || [],
            backgroundColor: '#3b82f6'
          }]
        },
        loanSizeDistribution: {
          labels: data.loan_size_distribution?.map(l => l.category) || [],
          datasets: [{
            label: 'Count',
            data: data.loan_size_distribution?.map(l => l.count) || [],
            backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']
          }]
        }
      }
    };
  }

  // ============================================================================
  // ERROR HANDLING AND VALIDATION
  // ============================================================================

  validateFilters(filters, reportType) {
    const errors = [];
    
    switch (reportType) {
      case 'financial-sustainability':
        if (filters.startDate && filters.endDate) {
          const start = new Date(filters.startDate);
          const end = new Date(filters.endDate);
          if (start > end) {
            errors.push('Start date cannot be after end date');
          }
        }
        break;
      case 'portfolio-quality':
        if (filters.asOfDate) {
          const date = new Date(filters.asOfDate);
          if (date > new Date()) {
            errors.push('Report date cannot be in the future');
          }
        }
        break;
    }
    
    return errors;
  }

  formatError(error) {
    if (error.message.includes('401')) {
      return 'Authentication required. Please log in again.';
    } else if (error.message.includes('403')) {
      return 'You do not have permission to access this report.';
    } else if (error.message.includes('404')) {
      return 'Report not found. Please check the report type.';
    } else if (error.message.includes('500')) {
      return 'Server error. Please try again later.';
    } else {
      return error.message || 'An unexpected error occurred.';
    }
  }
}

// Create singleton instance
const professionalReportsAPI = new ProfessionalReportsAPI();

export default professionalReportsAPI;
