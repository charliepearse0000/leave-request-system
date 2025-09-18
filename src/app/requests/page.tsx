'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ClockIcon, CheckCircleIcon, XCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { apiService, type LeaveRequest, type ApiError } from '../services/api';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { useBalance } from '../contexts/BalanceContext';
import Header from '../components/Header';
import Card from '../components/Card';

type SortField = keyof LeaveRequest | 'employee.name';
type SortDirection = 'asc' | 'desc';

const LeaveRequestsPage = () => {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingIds, setCancellingIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('submittedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<string | null>(null);
  const { refreshBalance } = useBalance();
  const router = useRouter();



  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/');
      return;
    }

    // Fetch leave requests from API
    const fetchRequests = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiService.getLeaveRequests();
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
  }, [router]);

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

    setCancellingIds(prev => new Set(prev).add(requestToDelete));
    setShowConfirmDialog(false);
    
    try {
      await apiService.deleteLeaveRequest(requestToDelete);
      // Refresh the requests list to show updated status
      const data = await apiService.getLeaveRequests();
      setRequests(data);
      // Refresh balance as deleting a request may affect leave balance
      await refreshBalance();
    } catch (err) {
      const apiError = err as ApiError;
      alert(apiError.message || 'Failed to delete leave request');
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
        return 'text-green-700 bg-green-50 border-green-200';
      case 'rejected':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'pending':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'rejected':
        return <XCircleIcon className="h-4 w-4" />;
      case 'pending':
        return <ClockIcon className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const filteredAndSortedRequests = requests
    .filter(request => statusFilter === 'all' || request.status === statusFilter)
    .sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;
      
      if (sortField === 'employee.name') {
        aValue = a.employee?.name || 'Unknown';
        bValue = b.employee?.name || 'Unknown';
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Header 
        title="My Leave Requests" 
        showBackButton={true}
        backButtonPath="/"
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Filters */}
          <Card variant="default" className="mb-6">
            <Card.Content className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-4 sm:mb-0">
                <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Filter by Status:
                </label>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
                >
                  <option value="all">All Requests</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredAndSortedRequests.length} of {requests.length} requests
              </div>
            </div>
            </Card.Content>
          </Card>

          {/* Table */}
          <Card variant="default">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      onClick={() => handleSort('employee.name')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      Employee
                      {sortField === 'employee.name' && (
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAndSortedRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {request.employee?.name || 'Unknown Employee'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {request.leaveType?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(request.startDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(request.endDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {request.days}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {request.reason}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(request.submittedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => handleCancelRequest(request.id)}
                          disabled={cancellingIds.has(request.id)}
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {cancellingIds.has(request.id) ? (
                            <span className="animate-spin h-3 w-3 border border-red-600 border-t-transparent rounded-full"></span>
                          ) : (
                            <XMarkIcon className="h-3 w-3" />
                          )}
                          {cancellingIds.has(request.id) ? 'Deleting...' : 'Delete'}
                        </button>
                      </td>
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
        title="Delete Leave Request"
        message="Are you sure you want to delete this leave request? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteRequest}
        onCancel={cancelDeleteRequest}
        variant="danger"
      />
    </div>
  );
};

export default LeaveRequestsPage;