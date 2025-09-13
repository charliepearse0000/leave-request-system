'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import StaffBalanceTable from '../components/StaffBalanceTable';

const StaffBalancesPage = () => {
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/');
      return;
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Header title="Staff Balances" />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Page Description */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
            <div className="mb-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Team Leave Balances</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                View remaining leave allowances for all team members
              </p>
            </div>
          </div>

          {/* Staff Balance Table */}
          <StaffBalanceTable />
        </div>
      </div>
    </div>
  );
};

export default StaffBalancesPage;