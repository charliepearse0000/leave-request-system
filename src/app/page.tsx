'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ClockIcon } from '@heroicons/react/24/outline';
import { useBalance } from './contexts/BalanceContext';
import Header from './components/Header';
import Card from './components/Card';
import { AdminOnly, AdminOrManager } from './components/RoleBasedAccess';
import { companySettings } from './services/company-settings';


interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: {
    id: string;
    name: string;
  };
  annualLeaveBalance?: number;
  sickLeaveBalance?: number;
}

export default function Home() {
  const router = useRouter();
  const [authState, setAuthState] = useState<{ user: User | null; isAuthenticated: boolean }>({ user: null, isAuthenticated: false });
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
    
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (!token || !userData) {
      setAuthState({ user: null, isAuthenticated: false });
      router.push('/login');
      return;
    }
    
    try {
      const parsedUser = JSON.parse(userData);
      setAuthState({ user: parsedUser, isAuthenticated: true });
    } catch {
      setAuthState({ user: null, isAuthenticated: false });
      router.push('/login');
    }
  }, [router]);
  
  const { balance, loading: balanceLoading, refreshBalance } = useBalance();

  useEffect(() => {
    if (authState.isAuthenticated && authState.user) {
      refreshBalance();
    }
  }, [authState.isAuthenticated, authState.user, refreshBalance]);

  // Show loading state during initial client-side hydration
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!authState.isAuthenticated || !authState.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Header title="Dashboard" />

      <main id="main-content" role="main" className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8" aria-label="Dashboard content" tabIndex={-1}>
        <div className="px-4 py-6 sm:px-0">
          <section aria-labelledby="leave-balance-heading">
            <Card variant="default" className="mb-6">
              <Card.Header>
                <div className="flex justify-end">
                <button
                  onClick={refreshBalance}
                  disabled={balanceLoading}
                  className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2.5 border border-transparent text-sm sm:text-xs font-medium rounded-lg text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800 transition-colors duration-200 min-h-[44px] sm:min-h-[36px] touch-manipulation"
                  aria-label="Refresh leave balance"
                >
                  {balanceLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 sm:h-3 sm:w-3 text-blue-700 dark:text-blue-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="hidden sm:inline">Refreshing...</span>
                      <span className="sm:hidden">...</span>
                    </>
                  ) : (
                    <>
                      <svg className="-ml-1 mr-2 h-4 w-4 sm:h-3 sm:w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span className="hidden sm:inline">Refresh</span>
                      <span className="sm:hidden">Refresh</span>
                    </>
                  )}
                </button>
              </div>
            </Card.Header>
            <Card.Content className="px-6 py-4">
              {balance ? (
                <div className="grid grid-cols-2 gap-2 sm:gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 sm:p-4 border border-blue-200 dark:border-blue-700" role="region" aria-labelledby="annual-leave-heading">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 id="annual-leave-heading" className="text-sm font-medium text-blue-800 dark:text-blue-200">Annual Leave</h3>
                        <p className="text-2xl font-bold text-blue-900 dark:text-blue-100" aria-label={`${balance.annualLeaveBalance} out of ${companySettings.getDefaultAnnualLeaveAllowance()} annual leave days remaining`}>
                          {balance.annualLeaveBalance}/{companySettings.getDefaultAnnualLeaveAllowance()}
                        </p>
                        <p className="text-sm text-blue-600 dark:text-blue-300">days remaining</p>
                      </div>
                      <div className="text-blue-500" aria-hidden="true">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 sm:p-4 border border-blue-200 dark:border-blue-700" role="region" aria-labelledby="sick-leave-heading">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 id="sick-leave-heading" className="text-sm font-medium text-blue-800 dark:text-blue-200">Sick Leave</h3>
                        <p className="text-2xl font-bold text-blue-900 dark:text-blue-100" aria-label={`${balance.sickLeaveBalance} out of ${companySettings.getDefaultSickLeaveAllowance()} sick leave days remaining`}>
                          {balance.sickLeaveBalance}/{companySettings.getDefaultSickLeaveAllowance()}
                        </p>
                        <p className="text-sm text-blue-600 dark:text-blue-300">days remaining</p>
                      </div>
                      <div className="text-blue-500" aria-hidden="true">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2 sm:p-4 border border-gray-200 dark:border-gray-600 animate-pulse">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-2"></div>
                    <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-1/3 mb-1"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2 sm:p-4 border border-gray-200 dark:border-gray-600 animate-pulse">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-2"></div>
                    <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-1/3 mb-1"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
                  </div>
                </div>
              )}
            </Card.Content>
          </Card>
          </section>

          <section aria-labelledby="navigation-heading">
            <h2 id="navigation-heading" className="sr-only">Navigation Options</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6 auto-rows-fr">
            <Card 
              onClick={() => router.push('/new-request')}
              variant="clickable"
              borderColor="blue"
            >
              <Card.Content>
                <div className="flex items-center">
                  <Card.Icon 
                    color="blue"
                    icon={
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    }
                  />
                  <div className="ml-4">
                    <Card.Title>New Request</Card.Title>
                    <Card.Description>Submit a new leave request</Card.Description>
                  </div>
                  <Card.Arrow />
                </div>
              </Card.Content>
            </Card>

            <Card 
              onClick={() => router.push('/requests')}
              variant="clickable"
              borderColor="blue"
            >
              <Card.Content>
                <div className="flex items-center">
                  <Card.Icon 
                    color="blue"
                    icon={
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    }
                  />
                  <div className="ml-4">
                    <Card.Title>My Requests</Card.Title>
                    <Card.Description>View and manage your leave requests</Card.Description>
                  </div>
                  <Card.Arrow />
                </div>
              </Card.Content>
            </Card>

            <AdminOrManager>
              <Card 
                onClick={() => router.push('/approve-requests')}
                variant="clickable"
                borderColor="orange"
              >
                <Card.Content>
                  <div className="flex items-center">
                    <Card.Icon 
                      color="orange"
                      icon={<ClockIcon className="w-6 h-6" />}
                    />
                    <div className="ml-4">
                      <Card.Title>Approve Requests</Card.Title>
                      <Card.Description>
                        {authState.user?.role?.name === 'admin' 
                          ? 'Review and approve all company requests' 
                          : 'Review and approve team requests'
                        }
                      </Card.Description>
                    </div>
                    <Card.Arrow />
                  </div>
                </Card.Content>
              </Card>
            </AdminOrManager>

            <AdminOnly>
              <Card 
                onClick={() => router.push('/edit-users')}
                variant="clickable"
                borderColor="red"
              >
                <Card.Content>
                  <div className="flex items-center">
                    <Card.Icon 
                      color="red"
                      icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      }
                    />
                    <div className="ml-4">
                      <Card.Title>Manage Users</Card.Title>
                      <Card.Description>Manage users, roles, and create new staff accounts</Card.Description>
                    </div>
                    <Card.Arrow />
                  </div>
                </Card.Content>
              </Card>
            </AdminOnly>

            <AdminOnly>
              <Card 
                onClick={() => router.push('/metrics')}
                variant="clickable"
                borderColor="red"
              >
                <Card.Content>
                  <div className="flex items-center">
                    <Card.Icon 
                      color="red"
                      icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      }
                    />
                    <div className="ml-4">
                      <Card.Title>Metrics</Card.Title>
                      <Card.Description>View user statistics and role distribution</Card.Description>
                    </div>
                    <Card.Arrow />
                  </div>
                </Card.Content>
              </Card>
            </AdminOnly>

            <AdminOnly>
              <Card 
                onClick={() => router.push('/company-settings')}
                variant="clickable"
                borderColor="red"
              >
                <Card.Content>
                  <div className="flex items-center">
                    <Card.Icon 
                      color="red"
                      icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      }
                    />
                    <div className="ml-4">
                      <Card.Title>Company Settings</Card.Title>
                      <Card.Description>Configure company-wide leave allowances and settings</Card.Description>
                    </div>
                    <Card.Arrow />
                  </div>
                </Card.Content>
              </Card>
            </AdminOnly>

          </div>
          </section>

        </div>
      </main>
    </div>
  );
}
