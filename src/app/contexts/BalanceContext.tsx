'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { apiService } from '../services/api';

interface BalanceData {
  annualLeaveBalance: number;
  sickLeaveBalance: number;
}

interface BalanceContextType {
  balance: BalanceData | null;
  loading: boolean;
  refreshBalance: () => Promise<void>;
  setBalance: (balance: BalanceData | null) => void;
}

const BalanceContext = createContext<BalanceContextType | undefined>(undefined);

export const useBalance = () => {
  const context = useContext(BalanceContext);
  if (context === undefined) {
    throw new Error('useBalance must be used within a BalanceProvider');
  }
  return context;
};

interface BalanceProviderProps {
  children: ReactNode;
}

export const BalanceProvider: React.FC<BalanceProviderProps> = ({ children }) => {
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshBalance = useCallback(async () => {
    setLoading(true);
    try {
      const balanceData = await apiService.getLeaveBalance();
      setBalance(balanceData);
    } catch (error) {
      // Error handling without console logs
    } finally {
      setLoading(false);
    }
  }, []);

  const value: BalanceContextType = {
    balance,
    loading,
    refreshBalance,
    setBalance,
  };

  return (
    <BalanceContext.Provider value={value}>
      {children}
    </BalanceContext.Provider>
  );
};