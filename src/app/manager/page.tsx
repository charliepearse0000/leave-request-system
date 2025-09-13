'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ClockIcon, CheckCircleIcon, XCircleIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { apiService, type LeaveRequest, type ApiError } from '../services/api';
import { useBalance } from '../contexts/BalanceContext';
import { useToast } from '../contexts/ToastContext';
import Header from '../components/Header';

type SortField = keyof LeaveRequest | 'user.name';
type SortDirection = 'asc' | 'desc';

const ManagerDashboardPage = () => {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('submittedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [dateFilter, setDateFilter] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [staffFilter, setStaffFilter] = useState<string>('');
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const { refreshBalance } = useBalance();
  const { showSuccess, showError } = useToast();
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/');
      return;
    }

    // Fetch team leave requests from API
    const fetchTeamRequests = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiService.getTeamLeaveRequests();
        setRequests(data);
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.message || 'Failed to fetch team leave requests');
        
        // If unauthorized, redirect to login
        if (apiError.status === 401) {
          localStorage.removeItem('authToken');
          router.push('/');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTeamRequests();
  }, [router]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleApprove = async (requestId: string) => {
    setProcessingIds(prev => new Set(prev).add(requestId));
    try {
      await apiService.approveLeaveRequest(requestId);
      // Refresh the requests list
      const data = await apiService.getTeamLeaveRequests();
      setRequests(data);
      refreshBalance();
      showSuccess('Request Approved', 'The leave request has been successfully approved.');
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage = apiError.message || 'Failed to approve request';
      setError(errorMessage);
      showError('Approval Failed', errorMessage);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleReject = async (requestId: string) => {
    setProcessingIds(prev => new Set(prev).add(requestId));
    try {
      await apiService.rejectLeaveRequest(requestId);
      // Refresh the requests list
      const data = await apiService.getTeamLeaveRequests();
      setRequests(data);
      refreshBalance();
      showSuccess('Request Rejected', 'The leave request has been successfully rejected.');
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage = apiError.message || 'Failed to reject request';
      setError(errorMessage);
      showError('Rejection Failed', errorMessage);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  // Get unique staff members for filter dropdown
  const uniqueStaffMembers = Array.from(
    new Set(requests.map(request => `${request.user.firstName} ${request.user.lastName}`))
  ).sort();

  const filteredAndSortedRequests = requests
    .filter(request => {
      // Date filter
      if (dateFilter.start || dateFilter.end) {
        const requestDate = new Date(request.startDate);
        if (dateFilter.start && requestDate < new Date(dateFilter.start)) return false;
        if (dateFilter.end && requestDate > new Date(dateFilter.end)) return false;
      }
      
      // Staff member filter
      if (staffFilter && `${request.user.firstName} ${request.user.lastName}` !== staffFilter) return false;
      
      return true;
    })
    .sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;
      
      if (sortField === 'user.name') {
        aValue = `${a.user?.firstName || ''} ${a.user?.lastName || ''}`.trim() || 'Unknown';
        bValue = `${b.user?.firstName || ''} ${b.user?.lastName || ''}`.trim() || 'Unknown';
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



  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'approved':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    switch (status) {
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'approved':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-600 dark:text-gray-400">Loading pending requests...</span>
          </div>
        </div>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Header title="Manager Dashboard" />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-4 sm:mb-0">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Pending Leave Requests</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Review and approve pending leave requests from your team</p>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                {/* Date Range Filter */}
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date Range:</label>
                  <input
                    type="date"
                    value={dateFilter.start}
                    onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
                    className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-white"
                    placeholder="Start Date"
                  />
                  <span className="text-gray-500 dark:text-gray-400">to</span>
                  <input
                    type="date"
                    value={dateFilter.end}
                    onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
                    className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-white"
                    placeholder="End Date"
                  />
                </div>
                
                {/* Staff Member Filter */}
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Staff:</label>
                  <select
                    value={staffFilter}
                    onChange={(e) => setStaffFilter(e.target.value)}
                    className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">All Staff</option>
                    {uniqueStaffMembers.map(staffName => (
                      <option key={staffName} value={staffName}>{staffName}</option>
                    ))}
                  </select>
                </div>
                
                {/* Clear Filters Button */}
                {(dateFilter.start || dateFilter.end || staffFilter) && (
                  <button
                    onClick={() => {
                      setDateFilter({ start: '', end: '' });
                      setStaffFilter('');
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    Clear Filters
                  </button>
                )}
                
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Pending Requests Only
                </span>
              </div>
            </div>
          </div>

          {/* Requests Table */}
          {filteredAndSortedRequests.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg p-6 text-center">
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No pending leave requests found for your team.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th
                        onClick={() => handleSort('user.name')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                      >
                        Employee
                        {sortField === 'user.name' && (
                          <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </th>
                      <th
                        onClick={() => handleSort('leaveType')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        Leave Type
                        {sortField === 'leaveType' && (
                          <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </th>
                      <th
                        onClick={() => handleSort('startDate')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        Start Date
                        {sortField === 'startDate' && (
                          <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </th>
                      <th
                        onClick={() => handleSort('endDate')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        End Date
                        {sortField === 'endDate' && (
                          <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </th>
                      <th
                        onClick={() => handleSort('days')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        Days
                        {sortField === 'days' && (
                          <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </th>
                      <th
                        onClick={() => handleSort('status')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        Status
                        {sortField === 'status' && (
                          <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reason
                      </th>
                      <th
                        onClick={() => handleSort('submittedAt')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        Submitted
                        {sortField === 'submittedAt' && (
                          <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredAndSortedRequests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {`${request.user.firstName} ${request.user.lastName}`}
                              </div>
                              <div className="text-sm text-gray-500">
                                {request.user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {request.leaveType?.name || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(request.startDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(request.endDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {request.days}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getStatusIcon(request.status)}
                            <span className={`ml-2 ${getStatusBadge(request.status)}`}>
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                          {request.reason}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(request.submittedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {request.status === 'pending' && (
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => handleApprove(request.id)}
                                disabled={processingIds.has(request.id)}
                                className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {processingIds.has(request.id) ? (
                                  <span className="animate-spin h-3 w-3 border border-white border-t-transparent rounded-full"></span>
                                ) : (
                                  'Approve'
                                )}
                              </button>
                              <button
                                onClick={() => handleReject(request.id)}
                                disabled={processingIds.has(request.id)}
                                className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {processingIds.has(request.id) ? (
                                  <span className="animate-spin h-3 w-3 border border-white border-t-transparent rounded-full"></span>
                                ) : (
                                  'Reject'
                                )}
                              </button>
                            </div>
                          )}
                          {request.status !== 'pending' && (
                            <span className="text-gray-400 text-xs">No actions available</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboardPage;