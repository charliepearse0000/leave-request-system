'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '../contexts/ToastContext';
import { apiService, UserProfile } from '../services/api';
import { companySettings } from '../services/company-settings';
import Header from '../components/Header';
import EditUserForm from '../components/EditUserForm';
import AddStaffForm from '../components/AddStaffForm';
import Card from '../components/Card';
import ConfirmationDialog from '../components/ConfirmationDialog';
import RouteGuard from '../components/RouteGuard';
import { getRoleBadgeClasses, getRoleCardClasses, getRoleTextClasses } from '../utils/roleColors';

function EditUsersContent() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showAddStaffForm, setShowAddStaffForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'} | null>(null);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { showError, showSuccess } = useToast();
  const router = useRouter();

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const usersData = await apiService.getUsers();
      setUsers(usersData);
    } catch {
      showError('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    const handleClickOutside = () => {
      setShowFilterDropdown(false);
      setShowSortDropdown(false);
    };

    if (showFilterDropdown || showSortDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showFilterDropdown, showSortDropdown]);

  const handleEditUser = (user: UserProfile) => {
    setSelectedUser(user);
    setShowEditForm(true);
  };

  const handleUserUpdated = (updatedUser: UserProfile) => {
    setUsers(prev => prev.map(user => 
      user.id === updatedUser.id ? updatedUser : user
    ));
    setShowEditForm(false);
    setSelectedUser(null);
  };

  const handleCancelEdit = () => {
    setShowEditForm(false);
    setSelectedUser(null);
  };

  const handleDeleteUser = (user: UserProfile) => {
    setUserToDelete(user);
    setShowDeleteDialog(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    try {
      await apiService.deleteUser(userToDelete.id);
      setUsers(prev => prev.filter(user => user.id !== userToDelete.id));
      showSuccess(`User ${userToDelete.firstName} ${userToDelete.lastName} has been deleted successfully.`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete user';
      showError(errorMessage);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setUserToDelete(null);
    }
  };



  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };



  const filteredUsers = users
    .filter(user => {
      const matchesSearch = `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || user.role.name === roleFilter;
      
      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;
      
      switch (sortBy) {
        case 'name':
          aValue = `${a.firstName} ${a.lastName}`;
          bValue = `${b.firstName} ${b.lastName}`;
          break;
        case 'email':
          aValue = a.email;
          bValue = b.email;
          break;
        case 'role':
          aValue = a.role.name;
          bValue = b.role.name;
          break;
        case 'annualLeave':
          aValue = a.annualLeaveBalance;
          bValue = b.annualLeaveBalance;
          break;
        case 'sickLeave':
          aValue = a.sickLeaveBalance;
          bValue = b.sickLeaveBalance;
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) {
        return sortOrder === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortOrder === 'asc' ? 1 : -1;
      }
      return 0;
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Header title="Manage Users" />

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                User Management
              </h1>
              <p className="mt-1 text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Manage users, roles, information, and create new staff accounts
              </p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center justify-center px-4 py-2 min-h-[44px] border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600 transition-colors"
            >
              <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-4 sm:p-6">
              <div className="mb-6">
                <button
                  onClick={() => setShowAddStaffForm(true)}
                  className="inline-flex items-center justify-center px-4 py-2 min-h-[44px] bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-indigo-500 dark:hover:bg-indigo-600 w-full sm:w-auto"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Add New Staff
                </button>
              </div>

              <div className="mb-6 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Search users by name, email, or role..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="block w-full pl-10 pr-3 py-3 min-h-[44px] border border-gray-300 rounded-lg leading-5 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowFilterDropdown(!showFilterDropdown);
                          setShowSortDropdown(false);
                        }}
                        className="px-3 py-2 h-11 border border-gray-300 rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-600 text-sm whitespace-nowrap"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        <span>
                          {roleFilter === 'all' ? 'All Roles' : 
                           roleFilter === 'employee' ? 'Employees' :
                           roleFilter === 'manager' ? 'Managers' : 'Admins'}
                        </span>
                      </button>
                      {showFilterDropdown && (
                        <div className="absolute top-12 left-0 w-48 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10">
                          <button
                            onClick={() => {
                              setRoleFilter('all');
                              setShowFilterDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 text-sm flex items-center justify-between ${roleFilter === 'all' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''}`}
                          >
                            All Roles
                            {roleFilter === 'all' && (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setRoleFilter('employee');
                              setShowFilterDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 text-sm flex items-center justify-between ${roleFilter === 'employee' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''}`}
                          >
                            Employees
                            {roleFilter === 'employee' && (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setRoleFilter('manager');
                              setShowFilterDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 text-sm flex items-center justify-between ${roleFilter === 'manager' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''}`}
                          >
                            Managers
                            {roleFilter === 'manager' && (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setRoleFilter('admin');
                              setShowFilterDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 text-sm flex items-center justify-between ${roleFilter === 'admin' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''}`}
                          >
                            Admins
                            {roleFilter === 'admin' && (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowSortDropdown(!showSortDropdown);
                          setShowFilterDropdown(false);
                        }}
                        className="px-3 py-2 h-11 border border-gray-300 rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-600 text-sm whitespace-nowrap"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
                        </svg>
                        <span>
                          {sortBy === 'name' ? `Name (${sortOrder === 'asc' ? 'A-Z' : 'Z-A'})` :
                           sortBy === 'email' ? `Email (${sortOrder === 'asc' ? 'A-Z' : 'Z-A'})` :
                           sortBy === 'role' ? `Role (${sortOrder === 'asc' ? 'A-Z' : 'Z-A'})` :
                           sortBy === 'annualLeave' ? `Annual Leave (${sortOrder === 'asc' ? 'Low-High' : 'High-Low'})` :
                           `Sick Leave (${sortOrder === 'asc' ? 'Low-High' : 'High-Low'})`}
                        </span>
                      </button>
                      {showSortDropdown && (
                        <div className="absolute top-12 left-0 w-48 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10">
                          <button
                            onClick={() => {
                              setSortBy('name');
                              setSortOrder('asc');
                              setShowSortDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 text-sm flex items-center justify-between ${sortBy === 'name' && sortOrder === 'asc' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''}`}
                          >
                            Name (A-Z)
                            {sortBy === 'name' && sortOrder === 'asc' && (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setSortBy('name');
                              setSortOrder('desc');
                              setShowSortDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 text-sm flex items-center justify-between ${sortBy === 'name' && sortOrder === 'desc' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''}`}
                          >
                            Name (Z-A)
                            {sortBy === 'name' && sortOrder === 'desc' && (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setSortBy('email');
                              setSortOrder('asc');
                              setShowSortDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 text-sm flex items-center justify-between ${sortBy === 'email' && sortOrder === 'asc' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''}`}
                          >
                            Email (A-Z)
                            {sortBy === 'email' && sortOrder === 'asc' && (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setSortBy('email');
                              setSortOrder('desc');
                              setShowSortDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 text-sm flex items-center justify-between ${sortBy === 'email' && sortOrder === 'desc' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''}`}
                          >
                            Email (Z-A)
                            {sortBy === 'email' && sortOrder === 'desc' && (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setSortBy('role');
                              setSortOrder('asc');
                              setShowSortDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 text-sm flex items-center justify-between ${sortBy === 'role' && sortOrder === 'asc' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''}`}
                          >
                            Role (A-Z)
                            {sortBy === 'role' && sortOrder === 'asc' && (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setSortBy('role');
                              setSortOrder('desc');
                              setShowSortDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 text-sm flex items-center justify-between ${sortBy === 'role' && sortOrder === 'desc' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''}`}
                          >
                            Role (Z-A)
                            {sortBy === 'role' && sortOrder === 'desc' && (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setSortBy('annualLeave');
                              setSortOrder('asc');
                              setShowSortDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 text-sm flex items-center justify-between ${sortBy === 'annualLeave' && sortOrder === 'asc' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''}`}
                          >
                            Annual Leave (Low-High)
                            {sortBy === 'annualLeave' && sortOrder === 'asc' && (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setSortBy('annualLeave');
                              setSortOrder('desc');
                              setShowSortDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 text-sm flex items-center justify-between ${sortBy === 'annualLeave' && sortOrder === 'desc' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''}`}
                          >
                            Annual Leave (High-Low)
                            {sortBy === 'annualLeave' && sortOrder === 'desc' && (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setSortBy('sickLeave');
                              setSortOrder('asc');
                              setShowSortDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 text-sm flex items-center justify-between ${sortBy === 'sickLeave' && sortOrder === 'asc' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''}`}
                          >
                            Sick Leave (Low-High)
                            {sortBy === 'sickLeave' && sortOrder === 'asc' && (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setSortBy('sickLeave');
                              setSortOrder('desc');
                              setShowSortDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 text-sm flex items-center justify-between ${sortBy === 'sickLeave' && sortOrder === 'desc' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''}`}
                          >
                            Sick Leave (High-Low)
                            {sortBy === 'sickLeave' && sortOrder === 'desc' && (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>




              <div className="overflow-hidden">
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    {searchTerm ? 'No users found matching your search.' : 'No users found.'}
                  </div>
                ) : (
                  <>
                    {/* Mobile Card Layout */}
                    <div className="block lg:hidden space-y-4">
                      {filteredUsers.map((user) => (
                        <div key={user.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {user.firstName} {user.lastName}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                            </div>
                            <span className={getRoleBadgeClasses(user.role.name)}>
                              {user.role.name.charAt(0).toUpperCase() + user.role.name.slice(1)}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Annual Leave:</span>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {user.annualLeaveBalance}/{companySettings.getDefaultAnnualLeaveAllowance()} days
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Sick Leave:</span>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {user.sickLeaveBalance}/{companySettings.getDefaultSickLeaveAllowance()} days
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              onClick={() => handleEditUser(user)}
                              className="flex-1 inline-flex items-center justify-center px-3 py-2 min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-400"
                            >
                              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="flex-1 inline-flex items-center justify-center px-3 py-2 min-h-[44px] bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:bg-red-500 dark:hover:bg-red-600 dark:focus:ring-red-400"
                            >
                              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop Table Layout */}
                    <div className="hidden lg:block overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          <button
                            onClick={() => handleSort('name')}
                            className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-100 transition-colors"
                          >
                            <span>Name</span>
                            <svg className={`w-4 h-4 transition-colors ${
                              sortConfig?.key === 'name' 
                                ? 'text-blue-600 dark:text-blue-400' 
                                : 'text-gray-400 dark:text-gray-500'
                            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              {sortConfig?.key === 'name' && sortConfig.direction === 'desc' ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              )}
                            </svg>
                          </button>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          <button
                            onClick={() => handleSort('email')}
                            className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-100 transition-colors"
                          >
                            <span>Email</span>
                            <svg className={`w-4 h-4 transition-colors ${
                              sortConfig?.key === 'email' 
                                ? 'text-blue-600 dark:text-blue-400' 
                                : 'text-gray-400 dark:text-gray-500'
                            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              {sortConfig?.key === 'email' && sortConfig.direction === 'desc' ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              )}
                            </svg>
                          </button>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          <button
                            onClick={() => handleSort('role')}
                            className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-100 transition-colors"
                          >
                            <span>Role</span>
                            <svg className={`w-4 h-4 transition-colors ${
                              sortConfig?.key === 'role' 
                                ? 'text-blue-600 dark:text-blue-400' 
                                : 'text-gray-400 dark:text-gray-500'
                            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              {sortConfig?.key === 'role' && sortConfig.direction === 'desc' ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              )}
                            </svg>
                          </button>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          <button
                            onClick={() => handleSort('annualLeaveBalance')}
                            className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-100 transition-colors"
                          >
                            <span>Annual Leave</span>
                            <svg className={`w-4 h-4 transition-colors ${
                              sortConfig?.key === 'annualLeaveBalance' 
                                ? 'text-blue-600 dark:text-blue-400' 
                                : 'text-gray-400 dark:text-gray-500'
                            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              {sortConfig?.key === 'annualLeaveBalance' && sortConfig.direction === 'desc' ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              )}
                            </svg>
                          </button>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          <button
                            onClick={() => handleSort('sickLeaveBalance')}
                            className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-100 transition-colors"
                          >
                            <span>Sick Leave</span>
                            <svg className={`w-4 h-4 transition-colors ${
                              sortConfig?.key === 'sickLeaveBalance' 
                                ? 'text-blue-600 dark:text-blue-400' 
                                : 'text-gray-400 dark:text-gray-500'
                            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              {sortConfig?.key === 'sickLeaveBalance' && sortConfig.direction === 'desc' ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              )}
                            </svg>
                          </button>
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.firstName} {user.lastName}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {user.email}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={getRoleBadgeClasses(user.role.name)}>
                              {user.role.name.charAt(0).toUpperCase() + user.role.name.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {user.annualLeaveBalance}/{companySettings.getDefaultAnnualLeaveAllowance()} days
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {user.sickLeaveBalance}/{companySettings.getDefaultSickLeaveAllowance()} days
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => handleEditUser(user)}
                                className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-400"
                              >
                                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user)}
                                className="inline-flex items-center px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:bg-red-500 dark:hover:bg-red-600 dark:focus:ring-red-400"
                              >
                                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                    </div>
                  </>
                )}
              </div>
              </div>
          </div>
        </div>
      </main>

      {showEditForm && selectedUser && (
        <EditUserForm
          user={selectedUser}
          onUserUpdated={handleUserUpdated}
          onCancel={handleCancelEdit}
        />
      )}

      <AddStaffForm
        isOpen={showAddStaffForm}
        onCancel={() => setShowAddStaffForm(false)}
        onStaffAdded={() => {
          setShowAddStaffForm(false);
          fetchUsers();
        }}
      />

      <ConfirmationDialog
        isOpen={showDeleteDialog}
        title="Delete User"
        message={`Are you sure you want to delete ${userToDelete?.firstName} ${userToDelete?.lastName}? This action cannot be undone and will permanently remove the user and all their data.`}
        confirmText={isDeleting ? "Deleting..." : "Yes, Delete User"}
        cancelText="No, Keep User"
        onConfirm={confirmDeleteUser}
        onClose={() => {
          setShowDeleteDialog(false);
          setUserToDelete(null);
        }}
        variant="danger"
      />
    </div>
  );
}

export default function EditUsersPage() {
  return (
    <RouteGuard requiredRoles={['admin']}>
      <EditUsersContent />
    </RouteGuard>
  );
}