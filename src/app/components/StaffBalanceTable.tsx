'use client';

import React, { useState, useEffect } from 'react';
import { apiService, TeamBalance } from '../services/api';
import { useToast } from '../contexts/ToastContext';

interface StaffBalanceTableProps {
  className?: string;
}

const StaffBalanceTable: React.FC<StaffBalanceTableProps> = ({ className = '' }) => {
  const [balances, setBalances] = useState<TeamBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const { showError } = useToast();

  useEffect(() => {
    const fetchTeamBalances = async () => {
      try {
        setLoading(true);
        const teamBalances = await apiService.getTeamBalances();
        setBalances(teamBalances);
      } catch (error) {
        console.error('Error fetching team balances:', error);
        showError('Failed to load team balances');
      } finally {
        setLoading(false);
      }
    };

    fetchTeamBalances();
  }, [showError]);

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Staff Leave Balances</h2>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading balances...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Staff Leave Balances</h2>
      
      {balances.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No staff balance data available
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Staff Member
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Annual Leave
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Sick Leave
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {balances.map((balance) => (
                <tr key={balance.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {balance.firstName} {balance.lastName}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
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