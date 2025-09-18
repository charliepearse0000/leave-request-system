'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import StaffBalanceTable from '../components/StaffBalanceTable';
import Card from '../components/Card';

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
      <Header 
        title="Employee Balances" 
        showBackButton={true}
        backButtonPath="/"
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Employee Balances Card */}
          <Card variant="default" borderColor="purple">
            <Card.Header>
              <div className="flex items-center">
                <Card.Icon 
                  color="purple"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  }
                />
                <div className="ml-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Employee Leave Balances</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">View and manage all employee leave balances</p>
                </div>
              </div>
            </Card.Header>
            
            <Card.Content className="p-6">
              <StaffBalanceTable />
            </Card.Content>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StaffBalancesPage;