/**
 * API service for communicating with the backend
 */

// const API_BASE_URL = 'http://82.112.231.241:8000/api/v1';
const API_BASE_URL = 'http://localhost:8000/api/v1';
class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Always get the latest token from localStorage
    const currentToken = localStorage.getItem('token');
    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
      // Update the instance token as well
      this.token = currentToken;
    }
    
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    console.log('API Request - URL:', url);
    console.log('API Request - Config:', config);

    try {
      console.log('Making fetch request...');
      const response = await fetch(url, config);
      console.log('API Response - Status:', response.status);
      console.log('API Response - OK:', response.ok);
      console.log('API Response - Headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.status === 401) {
        // Token expired or invalid
        this.clearToken();
        window.location.href = '/login';
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle validation errors (422) with detailed field errors
        if (response.status === 422 && errorData.errors) {
          const validationErrors = errorData.errors.map(error => {
            const field = error.loc ? error.loc.slice(1).join('.') : 'field';
            return `${field}: ${error.msg}`;
          }).join(', ');
          throw new Error(validationErrors);
        }
        
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request Error:', error);
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      
      // Handle specific error types
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        console.error('Network error detected - possible causes:');
        console.error('1. Backend server not running');
        console.error('2. CORS issues');
        console.error('3. Network connectivity problems');
        console.error('4. Wrong API URL');
        throw new Error('Network error: Unable to connect to server. Please check if the backend is running.');
      }
      
      throw error;
    }
  }

  // Authentication
  async login(credentials) {
    try {
    const response = await this.request('/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (response.access_token) {
      this.setToken(response.access_token);
    }
    
    return response;
    } catch (error) {
      console.error('API login error:', error);
      throw error;
    }
  }

  async logout() {
    try {
      await this.request('/logout', { method: 'POST' });
    } catch (error) {
    } finally {
      this.clearToken();
    }
  }

  async getCurrentUser() {
    return await this.request('/me');
  }

  // Admin APIs
  async getAdminDashboardStats() {
    return await this.request('/admin/dashboard/stats');
  }

  async getPendingApprovals() {
    return await this.request('/admin/dashboard/pending-approvals');
  }

  async approveRecord(approvalData) {
    return await this.request('/admin/approve', {
      method: 'POST',
      body: JSON.stringify(approvalData),
    });
  }

  async getGroups() {
    return await this.request('/admin/groups');
  }

  async createGroup(groupData) {
    return await this.request('/admin/groups', {
      method: 'POST',
      body: JSON.stringify(groupData),
    });
  }

  async updateGroup(groupId, groupData) {
    return await this.request(`/admin/groups/${groupId}`, {
      method: 'PUT',
      body: JSON.stringify(groupData),
    });
  }

  async deleteGroup(groupId) {
    return await this.request(`/admin/groups/${groupId}`, {
      method: 'DELETE',
    });
  }

  async getMembers(groupId = null) {
    const params = groupId ? `?group_id=${groupId}` : '';
    return await this.request(`/admin/members${params}`);
  }

  async getMemberLoans(memberId) {
    return await this.request(`/admin/loans?member_id=${memberId}`);
  }

  async getMemberLoanRequests(memberId) {
    return await this.request(`/admin/loans?member_id=${memberId}&status=REQUEST`);
  }

  async createMember(memberData) {
    return await this.request('/admin/members', {
      method: 'POST',
      body: JSON.stringify(memberData),
    });
  }

  async getLoans(status = null, groupId = null) {
    let params = [];
    if (status) params.push(`status=${status}`);
    if (groupId) params.push(`group_id=${groupId}`);
    
    const queryString = params.length > 0 ? `?${params.join('&')}` : '';
    return await this.request(`/admin/loans${queryString}`);
  }

  async disburseLoan(loanId) {
    return await this.request(`/admin/loans/${loanId}/disburse`, {
      method: 'POST',
    });
  }

  async getLoanRequests(status = null, groupId = null) {
    let params = [];
    if (status) params.push(`status=${status}`);
    if (groupId) params.push(`group_id=${groupId}`);
    
    const queryString = params.length > 0 ? `?${params.join('&')}` : '';
    return await this.request(`/admin/loans${queryString}`);
  }

  // Admin Clerk APIs
  async getClerkDashboardStats() {
    return await this.request('/clerk/dashboard/stats');
  }

  async getClerkPendingApprovals() {
    return await this.request('/clerk/dashboard/pending-approvals');
  }

  async getDailyCollectionReport(date) {
    return await this.request(`/clerk/reports/collections/daily?report_date=${date}`);
  }

  async getWeeklyCollectionReport(startDate, endDate) {
    return await this.request(`/clerk/reports/collections/weekly?start_date=${startDate}&end_date=${endDate}`);
  }

  async getMonthlyCollectionReport(year, month) {
    return await this.request(`/clerk/reports/collections/monthly?year=${year}&month=${month}`);
  }

  async getPendingVerificationCollections() {
    return await this.request('/clerk/collections/pending-verification');
  }

  async verifyCollectionRecord(recordId) {
    return await this.request(`/clerk/collections/${recordId}/verify`, {
      method: 'POST',
    });
  }

  async getCollectionMonitoringData(days = 30) {
    return await this.request(`/clerk/monitoring/collections?days=${days}`);
  }

  async getAuditLogs(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return await this.request(`/clerk/monitoring/audit-logs?${queryString}`);
  }

  async getTransactionHistory(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return await this.request(`/clerk/transactions/history?${queryString}`);
  }

  // Team Leader APIs
  async getAssignedGroups() {
    return await this.request('/teamleader/groups');
  }

  async getAvailableUsers() {
    return await this.request('/teamleader/users/available');
  }

  async getAssignedGroup(groupId) {
    return await this.request(`/teamleader/groups/${groupId}`);
  }

  async getGroupMembers(groupId, status = null) {
    const params = status ? `?status=${status}` : '';
    return await this.request(`/teamleader/groups/${groupId}/members${params}`);
  }

  async getPendingMembers(groupId) {
    return await this.request(`/teamleader/groups/${groupId}/members/pending`);
  }

  async requestAddMember(groupId, memberData) {
    return await this.request(`/teamleader/groups/${groupId}/members`, {
      method: 'POST',
      body: JSON.stringify(memberData),
    });
  }

  async getGroupLoans(groupId, status = null) {
    const params = status ? `?status=${status}` : '';
    return await this.request(`/teamleader/groups/${groupId}/loans${params}`);
  }

  async getLoanOverview() {
    return await this.request('/teamleader/loans/overview');
  }

  async createLoanRequest(loanRequestData) {
    return await this.request('/teamleader/loan-requests', {
      method: 'POST',
      body: JSON.stringify(loanRequestData),
    });
  }

  async getGroupLoanRequests(groupId = null, status = null) {
    let params = [];
    if (groupId) params.push(`group_id=${groupId}`);
    if (status) params.push(`status=${status}`);
    
    const queryString = params.length > 0 ? `?${params.join('&')}` : '';
    return await this.request(`/teamleader/loan-requests${queryString}`);
  }

  async getGroupTransactionHistory(groupId = null) {
    const params = groupId ? `?group_id=${groupId}` : '';
    return await this.request(`/teamleader/transactions/history${params}`);
  }

  // Bill Collector APIs
  async getCollectorAssignedGroups() {
    return await this.request('/collector/groups');
  }

  async getCollectorAssignedGroup(groupId) {
    return await this.request(`/collector/groups/${groupId}`);
  }

  async getCollectorGroupMembers(groupId, status = null) {
    const params = status ? `?status=${status}` : '';
    return await this.request(`/collector/groups/${groupId}/members${params}`);
  }

  async getCollectorGroupLoans(groupId, status = null) {
    const params = status ? `?status=${status}` : '';
    return await this.request(`/collector/groups/${groupId}/loans${params}`);
  }

  async createCollectionRecord(collectionData) {
    console.log('API Service - Creating collection record:', collectionData);
    console.log('API Service - Token:', this.token ? 'Present' : 'Missing');
    console.log('API Service - Base URL:', this.baseURL);
    
    try {
      const result = await this.request('/collector/collections', {
        method: 'POST',
        body: JSON.stringify(collectionData),
      });
      console.log('API Service - Collection created successfully:', result);
      return result;
    } catch (error) {
      console.error('API Service - Collection creation failed:', error);
      throw error;
    }
  }

  async getCollectionRecords(groupId = null, startDate = null, endDate = null) {
    let params = [];
    if (groupId) params.push(`group_id=${groupId}`);
    if (startDate) params.push(`start_date=${startDate}`);
    if (endDate) params.push(`end_date=${endDate}`);
    
    const queryString = params.length > 0 ? `?${params.join('&')}` : '';
    return await this.request(`/collector/collections${queryString}`);
  }

  async getCollectionRecord(recordId) {
    return await this.request(`/collector/collections/${recordId}`);
  }

  // Savings Management
  async getGroupSavingsSummary(groupId) {
    return await this.request(`/collector/groups/${groupId}/savings/summary`);
  }

  async getMemberSavingsBalance(memberId) {
    return await this.request(`/collector/members/${memberId}/savings/balance`);
  }

  async getMemberSavingsHistory(memberId, skip = 0, limit = 100) {
    return await this.request(`/collector/members/${memberId}/savings/history?skip=${skip}&limit=${limit}`);
  }

  async getLoanPayments(loanId) {
    return await this.request(`/collector/loans/${loanId}/payments`);
  }

  async getCollectionItems(recordId) {
    return await this.request(`/collector/collections/${recordId}/items`);
  }

  async createCollectorLoanRequest(loanRequestData) {
    return await this.request('/collector/loan-requests', {
      method: 'POST',
      body: JSON.stringify(loanRequestData),
    });
  }

  async getCollectorLoanRequests(groupId = null, status = null) {
    let params = [];
    if (groupId) params.push(`group_id=${groupId}`);
    if (status) params.push(`status=${status}`);
    
    const queryString = params.length > 0 ? `?${params.join('&')}` : '';
    return await this.request(`/collector/loan-requests${queryString}`);
  }

  async getCollectionTransactionHistory(groupId = null, startDate = null, endDate = null) {
    let params = [];
    if (groupId) params.push(`group_id=${groupId}`);
    if (startDate) params.push(`start_date=${startDate}`);
    if (endDate) params.push(`end_date=${endDate}`);
    
    const queryString = params.length > 0 ? `?${params.join('&')}` : '';
    return await this.request(`/collector/transactions/history${queryString}`);
  }

  async getCollectorDashboardStats() {
    return await this.request('/collector/dashboard/stats');
  }

  // Member APIs
  async getMemberProfile() {
    return await this.request('/member/profile');
  }

  async getCurrentLoans() {
    return await this.request('/member/loans/current');
  }

  async getLoanDetails(loanId) {
    return await this.request(`/member/loans/${loanId}`);
  }

  async checkLoanEligibility() {
    return await this.request('/member/loans/eligibility');
  }

  async getMemberTransactionHistory() {
    return await this.request('/member/transactions/history');
  }

  async applyForLoan(loanRequestData) {
    return await this.request('/member/loan-requests', {
      method: 'POST',
      body: JSON.stringify(loanRequestData),
    });
  }

  async getMemberLoanRequests(status = null) {
    const params = status ? `?status=${status}` : '';
    return await this.request(`/member/loan-requests${params}`);
  }

  async getMemberLoanRequest(requestId) {
    return await this.request(`/member/loan-requests/${requestId}`);
  }

  async getMemberDashboardSummary() {
    return await this.request('/member/dashboard/summary');
  }

  // User Management APIs
  async getUsers(skip = 0, limit = 100) {
    const data = await this.request(`/users?skip=${skip}&limit=${limit}`);
    return data;
  }

  async getUser(userId) {
    return await this.request(`/users/${userId}`);
  }

  async createUser(userData) {
    return await this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async updateUser(userId, userData) {
    return await this.request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  }

  async updateMember(memberId, memberData) {
    return await this.request(`/admin/members/${memberId}`, {
      method: 'PUT',
      body: JSON.stringify(memberData)
    });
  }

  async deleteUser(userId) {
    return await this.request(`/users/${userId}`, {
      method: 'DELETE'
    });
  }

  async activateUser(userId) {
    return await this.request(`/users/${userId}/activate`, {
      method: 'POST'
    });
  }

  async deactivateUser(userId) {
    return await this.request(`/users/${userId}/deactivate`, {
      method: 'POST'
    });
  }

  // Role Management APIs
  async getRoles() {
    return await this.request('/roles');
  }

  async createRole(roleData) {
    return await this.request('/roles', {
      method: 'POST',
      body: JSON.stringify(roleData)
    });
  }

  async assignRoleToUser(userId, roleId) {
    return await this.request(`/users/${userId}/roles/${roleId}`, {
      method: 'POST'
    });
  }

  async removeRoleFromUser(userId, roleId) {
    return await this.request(`/users/${userId}/roles/${roleId}`, {
      method: 'DELETE'
    });
  }

  async replaceUserRole(userId, newRoleId) {
    // First get user's current roles
    const users = await this.getUsers();
    const user = users.find(u => u.id === userId);
    
    if (user && user.roles) {
      // Remove all existing roles
      for (const role of user.roles) {
        try {
          await this.removeRoleFromUser(userId, role.id);
        } catch (error) {
        }
      }
    }
    
    // Assign new role
    return await this.assignRoleToUser(userId, newRoleId);
  }

  // File upload API
  async uploadUserDocument(userId, file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${this.baseURL}/users/${userId}/upload-document?document_type=aadhar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`
      },
      body: formData
    });
    
    if (response.status === 401) {
      this.clearToken();
      window.location.href = '/login';
      return;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Handle validation errors (422) with detailed field errors
      if (response.status === 422 && errorData.errors) {
        const validationErrors = errorData.errors.map(error => {
          const field = error.loc ? error.loc.slice(1).join('.') : 'field';
          return `${field}: ${error.msg}`;
        }).join(', ');
        throw new Error(validationErrors);
      }
      
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  async uploadBankPassbook(userId, file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${this.baseURL}/users/${userId}/upload-bank-passbook`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`
      },
      body: formData
    });
    
    if (response.status === 401) {
      this.clearToken();
      window.location.href = '/login';
      return;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Handle validation errors (422) with detailed field errors
      if (response.status === 422 && errorData.errors) {
        const validationErrors = errorData.errors.map(error => {
          const field = error.loc ? error.loc.slice(1).join('.') : 'field';
          return `${field}: ${error.msg}`;
        }).join(', ');
        throw new Error(validationErrors);
      }
      
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  // Payable Management APIs
  async createMemberBonus(payableData) {
    return await this.request('/admin/payablees', {
      method: 'POST',
      body: JSON.stringify(payableData),
    });
  }

  async getMemberBonuses(filters = {}) {
    const params = new URLSearchParams();
    if (filters.member_id && filters.member_id !== '') params.append('member_id', filters.member_id);
    if (filters.status && filters.status !== '') params.append('status', filters.status);
    if (filters.payable_type && filters.payable_type !== '') params.append('payable_type', filters.payable_type);
    if (filters.skip !== undefined) params.append('skip', filters.skip);
    if (filters.limit !== undefined) params.append('limit', filters.limit);
    
    const queryString = params.toString();
    return await this.request(`/admin/payablees${queryString ? `?${queryString}` : ''}`);
  }

  async getMemberBonus(payableId) {
    return await this.request(`/admin/payablees/${payableId}`);
  }

  async updateMemberBonus(payableId, payableData) {
    return await this.request(`/admin/payablees/${payableId}`, {
      method: 'PUT',
      body: JSON.stringify(payableData),
    });
  }

  async approveMemberBonus(payableId) {
    return await this.request(`/admin/payablees/${payableId}/approve`, {
      method: 'POST',
    });
  }

  async markBonusPaid(payableId) {
    return await this.request(`/admin/payablees/${payableId}/mark-paid`, {
      method: 'POST',
    });
  }

  async cancelMemberBonus(payableId) {
    return await this.request(`/admin/payablees/${payableId}/cancel`, {
      method: 'POST',
    });
  }

  async getBonusSummary(memberId = null) {
    const params = memberId ? `?member_id=${memberId}` : '';
    return await this.request(`/admin/payablees/summary${params}`);
  }


}

// Create and export a single instance
const apiService = new ApiService();
export default apiService;
