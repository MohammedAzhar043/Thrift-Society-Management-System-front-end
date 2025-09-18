import { useState, useEffect } from 'react';
import apiService from '../services/api';

/**
 * Custom hook for managing dashboard data loading
 * Reduces duplicate code across dashboard components
 */
export const useDashboardData = (dashboardType, options = {}) => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const {
    autoRefresh = false,
    refreshInterval = 30000, // 30 seconds
    onDataLoad = null,
    onError = null
  } = options;

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      let dashboardData = {};

      switch (dashboardType) {
        case 'admin':
          dashboardData = await apiService.getAdminDashboardStats();
          break;
        case 'clerk':
          dashboardData = await apiService.getClerkDashboardStats();
          break;
        case 'teamleader':
          dashboardData = await apiService.getLoanOverview();
          break;
        case 'member':
          dashboardData = await apiService.getMemberDashboardSummary();
          break;
        default:
          throw new Error(`Unknown dashboard type: ${dashboardType}`);
      }

      setData(dashboardData);
      setLastUpdated(new Date());
      
      if (onDataLoad) {
        onDataLoad(dashboardData);
      }
    } catch (err) {
      const errorMessage = `Failed to load ${dashboardType} dashboard data: ${err.message}`;
      setError(errorMessage);
      
      if (onError) {
        onError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    loadData();
  };

  // Initial load
  useEffect(() => {
    loadData();
  }, [dashboardType]);

  // Auto-refresh if enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(loadData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, dashboardType]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refreshData,
    setData
  };
};

/**
 * Custom hook for managing list data with pagination and filtering
 */
export const useListData = (fetchFunction, options = {}) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(options.initialFilters || {});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: options.defaultLimit || 20,
    total: 0
  });

  const loadItems = async (newFilters = null, newPagination = null) => {
    try {
      setLoading(true);
      setError(null);

      const currentFilters = newFilters || filters;
      const currentPagination = newPagination || pagination;

      const response = await fetchFunction({
        ...currentFilters,
        ...currentPagination
      });

      // Handle different response formats
      if (Array.isArray(response)) {
        setItems(response);
        setPagination(prev => ({ ...prev, total: response.length }));
      } else if (response.items && Array.isArray(response.items)) {
        setItems(response.items);
        setPagination(prev => ({ 
          ...prev, 
          total: response.total || response.items.length 
        }));
      } else {
        setItems([]);
        setPagination(prev => ({ ...prev, total: 0 }));
      }

      if (newFilters) setFilters(currentFilters);
      if (newPagination) setPagination(currentPagination);
    } catch (err) {
      setError(`Failed to load data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateFilters = (newFilters) => {
    setFilters(newFilters);
    loadItems(newFilters, { ...pagination, page: 1 });
  };

  const updatePagination = (newPagination) => {
    loadItems(filters, newPagination);
  };

  const refresh = () => {
    loadItems();
  };

  // Initial load
  useEffect(() => {
    loadItems();
  }, []);

  return {
    items,
    loading,
    error,
    filters,
    pagination,
    updateFilters,
    updatePagination,
    refresh,
    setItems
  };
};
