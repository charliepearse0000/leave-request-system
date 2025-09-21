'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserGroupIcon } from '@heroicons/react/24/outline';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface HeaderProps {
  title: string;
  showNavigation?: boolean;
  showBackButton?: boolean;
  backButtonPath?: string;
  user?: User | null;
  navigation?: Array<{
    label: string;
    href: string;
    variant?: 'default' | 'primary' | 'danger';
  }>;
  backButton?: {
    href: string;
    label: string;
  };
}

export default function Header({ 
  title, 
  showNavigation = true, 
  showBackButton = false, 
  backButtonPath = '/',
  user,
  navigation,
  backButton
}: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(user || null);
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      const userData = localStorage.getItem('userData');
      if (userData) {
        try {
          setCurrentUser(JSON.parse(userData));
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }
    }
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (dropdownOpen && !target.closest('.dropdown-container')) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setCurrentUser(null);
    router.push('/');
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const isManager = currentUser?.role === 'manager';
  const isAdmin = currentUser?.role === 'admin';
  const canSeeNavigation = isManager || isAdmin;

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            {(showBackButton || backButton) && (
              <button
                onClick={() => router.push(backButton?.href || backButtonPath)}
                className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {backButton?.label || 'Back'}
              </button>
            )}
            
            <div className="flex items-center space-x-3">
              <UserGroupIcon className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Leave Management System
                </h1>
              </div>
            </div>


          </div>

          {currentUser && (
            <div className="flex items-center space-x-4">
              <div className="relative dropdown-container">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
                >
                  <span>Welcome, {currentUser.firstName} {currentUser.lastName}</span>
                  <svg className={`w-4 h-4 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        Account Information
                      </h3>
                    </div>
                    <div className="px-4 py-3">
                      <dl className="space-y-3">
                        <div>
                          <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            Full Name
                          </dt>
                          <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                            {currentUser.firstName} {currentUser.lastName}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            Email
                          </dt>
                          <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                            {currentUser.email}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            Role
                          </dt>
                          <dd className="mt-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              {currentUser.role}
                            </span>
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            User ID
                          </dt>
                          <dd className="mt-1 text-sm text-gray-900 dark:text-white font-mono">
                            {currentUser.id}
                          </dd>
                        </div>
                      </dl>
                    </div>
                    <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors duration-200"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}