'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiService, UserProfile } from '../services/api';
import { getRoleCardClasses, getRoleTextClasses } from '../utils/roleColors';
import Header from '../components/Header';
import RoleDistributionChart from '../components/RoleDistributionChart';
import RouteGuard from '../components/RouteGuard';
import { useToast } from '../contexts/ToastContext';

function MetricsContent() {
  const router = useRouter();
  const { showError } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const usersData = await apiService.getUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      showError('Failed to load user metrics');
    } finally {
      setIsLoading(false);
    }
  };

  const totalUsers = users.length;
  const employees = users.filter(u => u.role.name === 'employee').length;
  const managers = users.filter(u => u.role.name === 'manager').length;
  const admins = users.filter(u => u.role.name === 'admin').length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <Header title="User Metrics" />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Header title="User Metrics" />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Metrics</h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Overview of all users and roles in the system
                </p>
              </div>
              <button
                onClick={() => router.push('/')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200">Total Users</h3>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalUsers}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">all users</p>
                </div>
                <div className="text-gray-500">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2m8-10a4 4 0 11-8 0 4 4 0 018 0zm8-2a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className={`${getRoleCardClasses('employee')} rounded-lg p-4 border`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-sm font-medium ${getRoleTextClasses('employee')}`}>Employees</h3>
                  <p className={`text-2xl font-bold ${getRoleTextClasses('employee')}`}>{employees}</p>
                  <p className={`text-sm ${getRoleTextClasses('employee')} opacity-75`}>total employees</p>
                </div>
                <div className={`${getRoleTextClasses('employee')} opacity-60`}>
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className={`${getRoleCardClasses('manager')} rounded-lg p-4 border`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-sm font-medium ${getRoleTextClasses('manager')}`}>Managers</h3>
                  <p className={`text-2xl font-bold ${getRoleTextClasses('manager')}`}>{managers}</p>
                  <p className={`text-sm ${getRoleTextClasses('manager')} opacity-75`}>total managers</p>
                </div>
                <div className={`${getRoleTextClasses('manager')} opacity-60`}>
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
            </div>
            <div className={`${getRoleCardClasses('admin')} rounded-lg p-4 border`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-sm font-medium ${getRoleTextClasses('admin')}`}>Admins</h3>
                  <p className={`text-2xl font-bold ${getRoleTextClasses('admin')}`}>{admins}</p>
                  <p className={`text-sm ${getRoleTextClasses('admin')} opacity-75`}>total admins</p>
                </div>
                <div className={`${getRoleTextClasses('admin')} opacity-60`}>
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Role Distribution</h2>
                <button
                  onClick={() => router.push('/edit-users')}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                  <svg className="-ml-0.5 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Manage Users
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 text-center">Visual Distribution</h3>
                  <RoleDistributionChart 
                    employees={employees} 
                    managers={managers} 
                    admins={admins} 
                  />
                </div>
                
                {/* Statistics */}
                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 text-center">Statistics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {totalUsers > 0 ? Math.round((employees / totalUsers) * 100) : 0}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Employees</div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">({employees} users)</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {totalUsers > 0 ? Math.round((managers / totalUsers) * 100) : 0}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Managers</div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">({managers} users)</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {totalUsers > 0 ? Math.round((admins / totalUsers) * 100) : 0}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Admins</div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">({admins} users)</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {totalUsers}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Total Users</div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">all roles</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function MetricsPage() {
  return (
    <RouteGuard requiredRoles={['admin']}>
      <MetricsContent />
    </RouteGuard>
  );
}