'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getRoleBadgeClasses } from '../utils/roleColors';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: {
    id: string;
    name: string;
  };
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
  showBackButton = false, 
  backButtonPath = '/',
  user,
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
        } catch {
  
        }
      }
    }
  }, [user]);

  
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

  return (
    <header role="banner" className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            {(showBackButton || backButton) && (
              <nav role="navigation" aria-label="Breadcrumb navigation">
                <button
                  onClick={() => router.push(backButton?.href || backButtonPath)}
                  className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
                  aria-label={`Go back to ${backButton?.label || 'previous page'}`}
                >
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  {backButton?.label || 'Back'}
                </button>
              </nav>
            )}
            
            <div className="flex items-center space-x-3">
              <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true" style={{ color: 'var(--primary)' }}>
                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                <circle cx="16" cy="12" r="2" fill="currentColor" opacity="0.7"/>
              </svg>
              <div>
                <span className="text-xl font-semibold text-gray-900 dark:text-white">
                  Leave Management System
                </span>
              </div>
            </div>


          </div>

          {currentUser && (
            <nav role="navigation" aria-label="User account menu">
              <div className="relative dropdown-container">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-0 sm:space-x-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-md transition-all duration-200"
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                  aria-label={`User menu for ${currentUser.firstName} ${currentUser.lastName}`}
                >
                  <div className="flex items-center space-x-0 sm:space-x-3">
        
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: 'var(--primary)' }}>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="8" r="4" />
                        <path d="M12 14c-4.42 0-8 2.69-8 6v2h16v-2c0-3.31-3.58-6-8-6z" />
                      </svg>
                    </div>
        
                    <span className="hidden sm:inline text-sm text-gray-700 dark:text-gray-300">
                      {currentUser.firstName} {currentUser.lastName}
                    </span>
        
                    <svg className={`w-4 h-4 sm:w-4 sm:h-4 transition-transform duration-200 text-gray-500 dark:text-gray-400 flex-shrink-0 ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                
                {dropdownOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-72 sm:w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50"
                    role="menu"
                    aria-label="User account information and actions"
                  >
                    <div className="px-3 sm:px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        Account Information
                      </h3>
                    </div>
                    <div className="px-3 sm:px-4 py-3">
                      <dl className="space-y-3 sm:space-y-3">
                        <div>
                          <dt className="text-xs sm:text-xs font-medium text-gray-500 dark:text-gray-400">
                            Full Name
                          </dt>
                          <dd className="mt-1 text-sm sm:text-sm text-gray-900 dark:text-white break-words">
                            {currentUser.firstName} {currentUser.lastName}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs sm:text-xs font-medium text-gray-500 dark:text-gray-400">
                            Email
                          </dt>
                          <dd className="mt-1 text-sm sm:text-sm text-gray-900 dark:text-white break-all">
                            {currentUser.email}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs sm:text-xs font-medium text-gray-500 dark:text-gray-400">
                            Role
                          </dt>
                          <dd className="mt-1">
                            <span className={getRoleBadgeClasses(typeof currentUser.role === 'string' ? currentUser.role : currentUser.role?.name)}>
                              {(() => {
                                const roleName = typeof currentUser.role === 'string' ? currentUser.role : currentUser.role?.name;
                                return roleName ? 
                                  roleName.charAt(0).toUpperCase() + roleName.slice(1) : 
                                  'Employee';
                              })()}
                            </span>
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs sm:text-xs font-medium text-gray-500 dark:text-gray-400">
                            User ID
                          </dt>
                          <dd className="mt-1 text-xs sm:text-sm text-gray-900 dark:text-white font-mono break-all">
                            {currentUser.id}
                          </dd>
                        </div>
                      </dl>
                    </div>
                    <div className="px-3 sm:px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={handleLogout}
                        className="w-full text-right text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors duration-200 py-2 px-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 min-h-[44px] flex items-center justify-end"
                        role="menuitem"
                        aria-label="Sign out of your account"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}