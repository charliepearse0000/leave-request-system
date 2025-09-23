'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ClockIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { useBalance } from './contexts/BalanceContext';
import { useToast } from './contexts/ToastContext';
import Header from './components/Header';
import Card from './components/Card';
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
  
  const authState = useMemo(() => {
    if (typeof window === 'undefined') {
      return { user: null, isAuthenticated: false };
    }
    
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (!token || !userData) {
      return { user: null, isAuthenticated: false };
    }
    
    try {
      const parsedUser = JSON.parse(userData);
      return { user: parsedUser, isAuthenticated: true };
    } catch {
      return { user: null, isAuthenticated: false };
    }
  }, []);
  
  useEffect(() => {
    if (!authState.isAuthenticated) {
      router.push('/login');
    }
  }, [authState.isAuthenticated, router]);
  
  const { balance, loading: balanceLoading, refreshBalance } = useBalance();
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (authState.isAuthenticated && authState.user) {
      refreshBalance();
    }
  }, [authState.isAuthenticated, authState.user]);

  if (!authState.isAuthenticated || !authState.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Header title="Dashboard" />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Dashboard
                </h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Welcome back, {authState.user.firstName}! Manage your leave requests and view your balance.
                </p>
              </div>
            </div>
          </div>
          <Card variant="default" className="mb-6">
            <Card.Header>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Leave Balance
                </h3>
                <button
                  onClick={refreshBalance}
                  disabled={balanceLoading}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800 transition-colors duration-200"
                >
                  {balanceLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-blue-700 dark:text-blue-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <svg className="-ml-1 mr-2 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh
                    </>
                  )}
                </button>
              </div>
            </Card.Header>
            <Card.Content className="px-6 py-4">
              {balance ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">Annual Leave</h3>
                        <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                          {balance.annualLeaveBalance}/{companySettings.getDefaultAnnualLeaveAllowance()}
                        </p>
                        <p className="text-sm text-blue-600 dark:text-blue-300">days remaining</p>
                      </div>
                      <div className="text-blue-500">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-green-800 dark:text-green-200">Sick Leave</h3>
                        <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                          {balance.sickLeaveBalance}/{companySettings.getDefaultSickLeaveAllowance()}
                        </p>
                        <p className="text-sm text-green-600 dark:text-green-300">days remaining</p>
                      </div>
                      <div className="text-green-500">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 animate-pulse">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-2"></div>
                    <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-1/3 mb-1"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 animate-pulse">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-2"></div>
                    <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-1/3 mb-1"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
                  </div>
                </div>
              )}
            </Card.Content>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
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
              borderColor="green"
            >
              <Card.Content>
                <div className="flex items-center">
                  <Card.Icon 
                    color="green"
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

            {(authState.user.role === 'manager' || authState.user.role === 'admin') && (
              <Card 
                onClick={() => router.push('/approve-requests')}
                variant="clickable"
                borderColor="yellow"
              >
                <Card.Content>
                  <div className="flex items-center">
                    <Card.Icon 
                      color="yellow"
                      icon={<ClockIcon className="w-6 h-6" />}
                    />
                    <div className="ml-4">
                      <Card.Title>Approve Requests</Card.Title>
                      <Card.Description>
                        {authState.user.role === 'admin' 
                          ? 'Review and approve all company requests' 
                          : 'Review and approve team requests'
                        }
                      </Card.Description>
                    </div>
                    <Card.Arrow />
                  </div>
                </Card.Content>
              </Card>
            )}

            {authState.user.role === 'admin' && (
              <Card 
                onClick={() => router.push('/edit-users')}
                variant="clickable"
                borderColor="purple"
              >
                <Card.Content>
                  <div className="flex items-center">
                    <Card.Icon 
                      color="purple"
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
            )}

            {authState.user.role === 'admin' && (
              <Card 
                onClick={() => router.push('/company-settings')}
                variant="clickable"
                borderColor="indigo"
              >
                <Card.Content>
                  <div className="flex items-center">
                    <Card.Icon 
                      color="indigo"
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
            )}

          </div>

        </div>
      </main>
    </div>
  );
}
