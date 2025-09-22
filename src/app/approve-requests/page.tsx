'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircleIcon, XCircleIcon, ClockIcon, MinusCircleIcon } from '@heroicons/react/24/outline';
import { apiService, type LeaveRequest, type ApiError } from '../services/api';
import ConfirmationDialog from '../components/ConfirmationDialog';
import Header from '../components/Header';
import Card from '../components/Card';

type SortField = keyof LeaveRequest;
type SortDirection = 'asc' | 'desc';

const ApproveRequestsPage = () => {
  const router = useRouter();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [sortField, setSortField] = useState<SortField>('submittedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'cancelled'>('pending');
  

  

  
  // Individual comments state - remove these as they're now handled by ConfirmationDialog
  // const [approveComments, setApproveComments] = useState('');
  // const [rejectComments, setRejectComments] = useState('');
  

  

  
  // Confirmation dialog states
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [requestToApprove, setRequestToApprove] = useState<LeaveRequest | null>(null);
  const [requestToReject, setRequestToReject] = useState<LeaveRequest | null>(null);



  useEffect(() => {
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
      
      // Check if user has permission to approve requests
      // Handle both role formats: string (user.role) and object (user.role.name)
      const userRole = typeof user.role === 'string' ? user.role : user.role?.name;
      const isAdmin = userRole === 'admin';
      const isManager = userRole === 'manager';
      
      if (!isAdmin && !isManager) {
        router.push('/requests');
        return;
      }

      fetchRequests(user);
    }
  }, [router]);





  const fetchRequests = async (user: any) => {
    try {
      setLoading(true);
      setError(null);
      
      let requestsData: LeaveRequest[];
      
      // Fetch appropriate requests based on user role
      // Handle both role formats: string (user.role) and object (user.role.name)
      const userRole = typeof user.role === 'string' ? user.role : user.role?.name;
      
      if (userRole === 'admin') {
        requestsData = await apiService.getAllCompanyLeaveRequests();
      } else if (userRole === 'manager') {
        requestsData = await apiService.getTeamLeaveRequests();
      } else {
        throw new Error('Unauthorized access');
      }
      
      setRequests(requestsData);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to fetch leave requests');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = (request: LeaveRequest) => {
    setRequestToApprove(request);
    setShowApproveDialog(true);
  };

  const handleRejectRequest = (request: LeaveRequest) => {
    setRequestToReject(request);
    setShowRejectDialog(true);
  };

  const confirmApproveRequest = async (comments?: string) => {
    if (!requestToApprove) return;

    try {
      await apiService.approveLeaveRequest(requestToApprove.id, comments || undefined);
      
      // Update the request in the local state
      setRequests(prevRequests =>
        prevRequests.map(req =>
          req.id === requestToApprove.id
            ? { ...req, status: 'approved' as const }
            : req
        )
      );
      
      setShowApproveDialog(false);
      setRequestToApprove(null);
    } catch (err) {
      alert('Failed to approve request. Please try again.');
    }
  };

  const confirmRejectRequest = async (comments?: string) => {
    if (!requestToReject) return;

    try {
      await apiService.rejectLeaveRequest(requestToReject.id, comments || undefined);
      
      // Update the request in the local state
      setRequests(prevRequests =>
        prevRequests.map(req =>
          req.id === requestToReject.id
            ? { ...req, status: 'rejected' as const }
            : req
        )
      );
      
      setShowRejectDialog(false);
      setRequestToReject(null);
    } catch (err) {
      alert('Failed to reject request. Please try again.');
    }
  };





  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedRequests = requests
    .filter(request => {
      const matchesSearch = 
        request.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.leaveType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.reason.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
      
      // Date range filtering
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Handle nested properties
      if (sortField === 'user') {
        aValue = `${a.user.firstName} ${a.user.lastName}`;
        bValue = `${b.user.firstName} ${b.user.lastName}`;
      } else if (sortField === 'leaveType') {
        aValue = a.leaveType.name;
        bValue = b.leaveType.name;
      }

      // Handle dates
      if (typeof aValue === 'string' && (aValue.includes('-') || aValue.includes('T'))) {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && error.includes('Unauthorized')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Access Denied</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Header title="Approve Leave Requests" />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">

          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Approve Leave Requests
                </h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Review and approve leave requests from your team
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

        {error && !error.includes('Unauthorized') && (
          <Card variant="error" className="mb-6">
            <Card.Content>
              <div className="text-red-800 dark:text-red-200">
                Error: {error}
              </div>
            </Card.Content>
          </Card>
        )}

        <Card variant="default" className="mb-6">
          <Card.Content>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by name, email, leave type, or reason..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
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
          </Card.Content>
        </Card>



        <Card variant="default">
          {filteredAndSortedRequests.length === 0 ? (
            <div className="text-center py-12">
              <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No requests found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {statusFilter === 'pending' ? 'No pending requests to review.' : 'No requests match your current filters.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('user' as SortField)}
                        className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-100 transition-colors"
                      >
                        <span>Employee</span>
                        <svg className={`w-4 h-4 transition-colors ${
                          sortField === 'user' 
                            ? 'text-blue-600 dark:text-blue-400' 
                            : 'text-gray-400 dark:text-gray-500'
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {sortField === 'user' && sortDirection === 'desc' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          )}
                        </svg>
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('leaveType' as SortField)}
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
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        ACTIONS
                      </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                  {filteredAndSortedRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">

                      <td className="px-3 py-2 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {request.user.firstName} {request.user.lastName}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {request.user.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <span className="truncate block" title={request.leaveType.name}>
                          {request.leaveType.name}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {new Date(request.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {new Date(request.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white text-center">
                        {request.duration}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">
                        <div className="max-w-32 truncate" title={request.reason}>
                          {request.reason}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                          request.status === 'approved'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : request.status === 'rejected'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : request.status === 'cancelled'
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}>
                          {getStatusIcon(request.status)}
                          <span className="ml-1 capitalize">{request.status}</span>
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {new Date(request.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                        {request.status === 'pending' ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setRequestToApprove(request);
                                setShowApproveDialog(true);
                              }}
                              className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setRequestToReject(request);
                                setShowRejectDialog(true);
                              }}
                              className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">
                            {getStatusIcon(request.status)}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <ConfirmationDialog
        isOpen={showApproveDialog}
        title="Approve Leave Request"
        message={`Are you sure you want to approve the leave request from ${requestToApprove?.user.firstName} ${requestToApprove?.user.lastName}?`}
        confirmText="Yes, Approve"
        cancelText="No, Keep Pending"
        onConfirm={confirmApproveRequest}
        onClose={() => {
          setShowApproveDialog(false);
          setRequestToApprove(null);
        }}
        variant="success"
        showComments={true}
        commentsLabel="Comments (optional)"
        commentsPlaceholder="Add comments for this approval..."
      />

      <ConfirmationDialog
        isOpen={showRejectDialog}
        title="Reject Leave Request"
        message={`Are you sure you want to reject the leave request from ${requestToReject?.user.firstName} ${requestToReject?.user.lastName}?`}
        confirmText="Yes, Reject"
        cancelText="No, Keep Pending"
        onConfirm={confirmRejectRequest}
        onClose={() => {
          setShowRejectDialog(false);
          setRequestToReject(null);
        }}
        variant="danger"
        showComments={true}
        commentsLabel="Comments (optional)"
        commentsPlaceholder="Add comments for this rejection..."
      />

      </main>
    </div>
  );
};

export default ApproveRequestsPage;