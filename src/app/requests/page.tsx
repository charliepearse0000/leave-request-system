'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ClockIcon, CheckCircleIcon, XCircleIcon, MinusCircleIcon } from '@heroicons/react/24/outline';
import { apiService, type LeaveRequest, type ApiError } from '../services/api';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { useBalance } from '../contexts/BalanceContext';
import Header from '../components/Header';
import Card from '../components/Card';

type SortField = keyof LeaveRequest | 'user.name' | 'leaveType';
type SortDirection = 'asc' | 'desc';

const LeaveRequestsPage = () => {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingIds, setCancellingIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('submittedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'cancelled'>('all');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<string | null>(null);
  const [isAdminView, setIsAdminView] = useState(false);
  const [currentUser, setCurrentUser] = useState<{id: string; role: string} | null>(null);
  const { refreshBalance } = useBalance();
  const router = useRouter();
  const searchParams = useSearchParams();



  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/');
      return;
    }

    // Get current user data
    const userData = localStorage.getItem('userData');
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUser(user);
      
      // Check if this is admin view
      const viewParam = searchParams.get('view');
      const isAdmin = user.role === 'admin';
      const isManager = user.role === 'manager';
      const shouldShowAdminView = (viewParam === 'all' || viewParam === 'approve') && (isAdmin || isManager);
      setIsAdminView(shouldShowAdminView);
    }

    // Fetch leave requests from API
    const fetchRequests = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Determine which API endpoint to use
        const viewParam = searchParams.get('view');
        const isAdmin = currentUser?.role === 'admin';
        const isManager = currentUser?.role === 'manager';
        
        let data: LeaveRequest[];
        if (viewParam === 'approve' && (isAdmin || isManager)) {
          // Approve view - get requests that need approval
          if (isAdmin) {
            // Admin can see all company requests for approval
            data = await apiService.getAllCompanyLeaveRequests();
          } else {
            // Manager sees their team's requests (using regular endpoint for now)
            data = await apiService.getLeaveRequests();
          }
        } else if (viewParam === 'all' && isAdmin) {
          // Admin view - get all company requests
          data = await apiService.getAllCompanyLeaveRequests();
        } else {
          // Regular view - get user's own requests
          data = await apiService.getLeaveRequests();
        }
        
        setRequests(data);
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.message || 'Failed to fetch leave requests');
        
        // If unauthorized, redirect to login
        if (apiError.status === 401) {
          localStorage.removeItem('authToken');
          router.push('/');
          return;
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [router, searchParams, currentUser?.role]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleCancelRequest = (requestId: string) => {
    setRequestToDelete(requestId);
    setShowConfirmDialog(true);
  };

  const confirmDeleteRequest = async () => {
    if (!requestToDelete) return;
    
    // Safety check - ensure we have current user data
    if (!currentUser) {
      alert('User data not available. Please refresh the page and try again.');
      return;
    }

    setCancellingIds(prev => new Set(prev).add(requestToDelete));
    setShowConfirmDialog(false);
    
    try {
      // Check if user is admin to determine which API to call
      const isAdmin = currentUser?.role === 'admin';
      
      if (isAdmin) {
        // Admin can delete (permanent removal)
        await apiService.deleteLeaveRequest(requestToDelete);
      } else {
        // Regular users can only cancel
        await apiService.cancelLeaveRequest(requestToDelete);
      }
      
      // Refresh the requests list using the same logic as initial fetch
      const viewParam = searchParams.get('view');
      const isManager = currentUser?.role === 'manager';
      
      let data: LeaveRequest[];
      if (viewParam === 'approve' && (isAdmin || isManager)) {
        // Approve view - get requests that need approval
        if (isAdmin) {
          // Admin can see all company requests for approval
          data = await apiService.getAllCompanyLeaveRequests();
        } else {
          // Manager sees their team's requests (using regular endpoint for now)
          data = await apiService.getLeaveRequests();
        }
      } else if (viewParam === 'all' && isAdmin) {
        // Admin view - get all company requests
        data = await apiService.getAllCompanyLeaveRequests();
      } else {
        // Regular view - get user's own requests
        data = await apiService.getLeaveRequests();
      }
      
      setRequests(data);
      
      // Refresh balance as deleting a request may affect leave balance
      try {
        await refreshBalance();
      } catch {
        // Don't fail the whole operation if balance refresh fails
      }
    } catch (err) {
      const apiError = err as ApiError;
      alert(apiError.message || 'Failed to cancel leave request');
    } finally {
      setCancellingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestToDelete);
        return newSet;
      });
      setRequestToDelete(null);
    }
  };

  const cancelDeleteRequest = () => {
    setShowConfirmDialog(false);
    setRequestToDelete(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'cancelled':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'cancelled':
        return <MinusCircleIcon className="h-5 w-5 text-orange-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
    }
  };

  const filteredAndSortedRequests = requests
    .filter(request => {
      const matchesSearch = 
        request.leaveType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.reason.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;
      
      if (sortField === 'user.name') {
        aValue = `${a.user?.firstName} ${a.user?.lastName}` || 'Unknown';
        bValue = `${b.user?.firstName} ${b.user?.lastName}` || 'Unknown';
      } else if (sortField === 'leaveType') {
        aValue = a.leaveType?.name || 'Unknown';
        bValue = b.leaveType?.name || 'Unknown';
      } else {
        const fieldValue = a[sortField as keyof LeaveRequest];
        const fieldValueB = b[sortField as keyof LeaveRequest];
        aValue = typeof fieldValue === 'string' || typeof fieldValue === 'number' ? fieldValue : String(fieldValue);
        bValue = typeof fieldValueB === 'string' || typeof fieldValueB === 'number' ? fieldValueB : String(fieldValueB);
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });

  

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Error Loading Requests</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Get current view and user info for display
  const viewParam = searchParams.get('view');
  const userData = localStorage.getItem('userData');
  const user = userData ? JSON.parse(userData) : null;
  
  const getPageTitle = () => {
    if (viewParam === 'approve') {
      return user?.role === 'admin' ? "Approve Company Requests" : "Approve Team Requests";
    } else if (viewParam === 'all') {
      return "All Company Leave Requests";
    }
    return "My Leave Requests";
  };

  const getViewIndicator = () => {
    if (viewParam === 'approve') {
      return {
        title: user?.role === 'admin' ? "Admin Approval View" : "Manager Approval View",
        description: user?.role === 'admin' 
          ? "You are viewing all company requests that need approval."
          : "You are viewing your team's requests that need approval."
      };
    } else if (viewParam === 'all') {
      return {
        title: "Admin View Active",
        description: "You are viewing all company leave requests. This view is only available to administrators."
      };
    }
    return null;
  };

  const viewIndicator = getViewIndicator();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Header title={getPageTitle()} />

      <main role="main" className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8" aria-label="Leave requests management">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {getPageTitle()}
                </h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {viewParam === 'approve' 
                    ? 'Review and manage leave requests that require approval'
                    : viewParam === 'all'
                    ? 'View and manage all company leave requests'
                    : 'View and manage your leave requests'
                  }
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

          {viewIndicator && (
            <div className="mb-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-5 w-5 text-yellow-400">
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      {viewIndicator.title}
                    </h3>
                    <div className="mt-1 text-sm text-yellow-700">
                      {viewIndicator.description}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <Card variant="default" className="mb-6">
              <div className="px-6 py-4 flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search by leave type or reason..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'approved' | 'rejected' | 'cancelled')}
                    className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
          </Card>

          <Card variant="default">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('leaveType')}
                        className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-100 transition-colors"
                      >
                        <span>Leave Type</span>
                        <svg className={`w-4 h-4 transition-colors ${
                          sortField === 'leaveType' 
                            ? 'text-blue-600 dark:text-blue-400' 
                            : 'text-gray-400 dark:text-gray-500'
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {sortField === 'leaveType' && sortDirection === 'desc' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          )}
                        </svg>
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('startDate')}
                        className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-100 transition-colors"
                      >
                        <span>Start Date</span>
                        <svg className={`w-4 h-4 transition-colors ${
                          sortField === 'startDate' 
                            ? 'text-blue-600 dark:text-blue-400' 
                            : 'text-gray-400 dark:text-gray-500'
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {sortField === 'startDate' && sortDirection === 'desc' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          )}
                        </svg>
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('endDate')}
                        className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-100 transition-colors"
                      >
                        <span>End Date</span>
                        <svg className={`w-4 h-4 transition-colors ${
                          sortField === 'endDate' 
                            ? 'text-blue-600 dark:text-blue-400' 
                            : 'text-gray-400 dark:text-gray-500'
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {sortField === 'endDate' && sortDirection === 'desc' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          )}
                        </svg>
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('duration')}
                        className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-100 transition-colors"
                      >
                        <span>Days</span>
                        <svg className={`w-4 h-4 transition-colors ${
                          sortField === 'duration' 
                            ? 'text-blue-600 dark:text-blue-400' 
                            : 'text-gray-400 dark:text-gray-500'
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {sortField === 'duration' && sortDirection === 'desc' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          )}
                        </svg>
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('status')}
                        className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-100 transition-colors"
                      >
                        <span>Status</span>
                        <svg className={`w-4 h-4 transition-colors ${
                          sortField === 'status' 
                            ? 'text-blue-600 dark:text-blue-400' 
                            : 'text-gray-400 dark:text-gray-500'
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {sortField === 'status' && sortDirection === 'desc' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          )}
                        </svg>
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('submittedAt')}
                        className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-100 transition-colors"
                      >
                        <span>Submitted</span>
                        <svg className={`w-4 h-4 transition-colors ${
                          sortField === 'submittedAt' 
                            ? 'text-blue-600 dark:text-blue-400' 
                            : 'text-gray-400 dark:text-gray-500'
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {sortField === 'submittedAt' && sortDirection === 'desc' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          )}
                        </svg>
                      </button>
                    </th>
                    {!isAdminView && (
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                  {filteredAndSortedRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {request.leaveType?.name || 'Unknown'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {new Date(request.startDate).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {new Date(request.endDate).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {request.duration}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-500 dark:text-gray-300 max-w-32 truncate">
                        {request.reason}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          <span className="ml-1 capitalize">{request.status}</span>
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {new Date(request.submittedAt).toLocaleDateString()}
                      </td>
                      {!isAdminView && (
                        <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                          {request.status === 'pending' && (
                            <button
                              onClick={() => handleCancelRequest(request.id)}
                              disabled={cancellingIds.has(request.id)}
                              className="inline-flex items-center px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-red-500 dark:hover:bg-red-600 dark:focus:ring-red-400"
                            >
                              {cancellingIds.has(request.id) ? (
                                <span className="animate-spin h-4 w-4 mr-1.5 border-2 border-white border-t-transparent rounded-full"></span>
                              ) : (
                                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              )}
                              {cancellingIds.has(request.id) 
                                ? 'Cancelling...' 
                                : 'Cancel'}
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {filteredAndSortedRequests.length === 0 && (
            <Card variant="default" className="text-center">
              <Card.Content className="p-6">
                <p className="text-gray-500">No leave requests found matching your criteria.</p>
              </Card.Content>
            </Card>
          )}
        </div>
      </main>
      
      <ConfirmationDialog
        isOpen={showConfirmDialog}
        title="Cancel Leave Request"
        message="Are you sure you want to cancel this leave request? This action cannot be undone and your request will be permanently cancelled."
        confirmText="Yes, Cancel Request"
        cancelText="No, Keep Request"
        onConfirm={confirmDeleteRequest}
        onClose={cancelDeleteRequest}
        variant="danger"
      />
    </div>
  );
};

export default LeaveRequestsPage;