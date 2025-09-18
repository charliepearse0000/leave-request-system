'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiService, TeamBalance } from '../services/api';
import { useToast } from '../contexts/ToastContext';

interface StaffBalanceTableProps {
  className?: string;
}

const StaffBalanceTable: React.FC<StaffBalanceTableProps> = ({ className = '' }) => {
  const [balances, setBalances] = useState<TeamBalance[]>([]);
  const [filteredBalances, setFilteredBalances] = useState<TeamBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { showError } = useToast();

  useEffect(() => {
    const fetchTeamBalances = async () => {
      try {
        setLoading(true);
        setError(null);
        const teamBalances = await apiService.getTeamBalances();
        setBalances(teamBalances);
        setFilteredBalances(teamBalances);
      } catch (error: any) {
        console.error('Error fetching team balances:', error);
        if (error.status === 404) {
          setError('Access denied. Admin privileges required to view employee balances.');
        } else if (error.status === 401) {
          setError('Please log in to access this page.');
        } else {
          setError('Failed to load employee balances. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTeamBalances();
  }, []);

  // Filter balances based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredBalances(balances);
    } else {
      const filtered = balances.filter(balance => 
        balance.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        balance.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        balance.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${balance.firstName} ${balance.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredBalances(filtered);
    }
  }, [searchTerm, balances]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  if (loading) {
    return (
      <div className={className}>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-300">Loading balances...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Search Input */}
      <div className="mb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search employees by name or email..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm"
          />
        </div>
      </div>
      
      {balances.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No employee balance data available
        </div>
      ) : filteredBalances.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No employees found matching your search criteria
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Annual Leave
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Sick Leave
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredBalances.map((balance) => (
                <tr key={balance.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {balance.firstName} {balance.lastName}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {balance.email}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                      balance.annualLeaveBalance > 10 
                        ? 'bg-green-100 text-green-800'
                        : balance.annualLeaveBalance > 5
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {balance.annualLeaveBalance} days
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                      balance.sickLeaveBalance > 5 
                        ? 'bg-green-100 text-green-800'
                        : balance.sickLeaveBalance > 2
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {balance.sickLeaveBalance} days
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StaffBalanceTable;