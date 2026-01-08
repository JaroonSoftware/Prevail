import { useState, useEffect, useCallback } from 'react';
import OptionService from '../service/Options.service';

const optionService = OptionService();

// Simple hook for banks data without Redux
export const useBanksSimple = (options = {}) => {
  const {
    autoFetch = true,
    cacheTime = 5 * 60 * 1000, // 5 minutes cache
    keyValue = 'key',
  } = options;

  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  // Check if data is stale
  const isDataStale = useCallback(() => {
    if (!lastFetch) return true;
    return Date.now() - lastFetch > cacheTime;
  }, [lastFetch, cacheTime]);

  // Fetch banks data
  const fetchBanks = useCallback(async (params = {}, force = false) => {
    if (!force && !isDataStale() && banks.length > 0) {
      return; // Use cached data
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await optionService.optionsBanks(params);
      const banksData = response.data.data || [];
      
      setBanks(banksData);
      setLastFetch(Date.now());
    } catch (err) {
      const errorMessage = err.message || 'เกิดข้อผิดพลาดจากการดึงข้อมูลธนาคาร';
      setError({ message: errorMessage });
      console.error('Error fetching banks:', err);
    } finally {
      setLoading(false);
    }
  }, [isDataStale, banks.length]);

  // Auto fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchBanks();
    }
  }, [autoFetch, fetchBanks]);

  // Utility functions
  const getBankByKey = useCallback((key) => {
    return banks.find(bank => bank.key === key);
  }, [banks]);

  const getBankByValue = useCallback((value) => {
    return banks.find(bank => bank[keyValue] === value);
  }, [banks, keyValue]);

  const searchBanks = useCallback((searchTerm) => {
    if (!searchTerm) return banks;
    
    const term = searchTerm.toLowerCase();
    return banks.filter(bank => 
      (bank.official_name?.toLowerCase() || '').includes(term) ||
      (bank.thai_name?.toLowerCase() || '').includes(term) ||
      (bank.key?.toLowerCase() || '').includes(term)
    );
  }, [banks]);

  // Bank options for Select components
  const bankOptions = banks.map(bank => ({
    value: bank[keyValue] || bank.key,
    label: bank.official_name || bank.thai_name,
    record: bank,
  }));

  // Clear functions
  const clearBanks = useCallback(() => {
    setBanks([]);
    setError(null);
    setLastFetch(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Data
    banks,
    bankOptions,
    loading,
    error,
    lastFetch,
    
    // Actions
    fetchBanks,
    clearBanks,
    clearError,
    
    // Utilities
    getBankByKey,
    getBankByValue,
    searchBanks,
    isDataStale,
    
    // State helpers
    hasData: banks.length > 0,
    isEmpty: banks.length === 0 && !loading,
    hasError: !!error,
  };
};