'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircleIcon, XCircleIcon, ClockIcon, MinusCircleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { apiService, type LeaveRequest } from '../services/api';
import ConfirmationDialog from '../components/ConfirmationDialog';
import Header from '../components/Header';
import Card from '../components/Card';
import RouteGuard from '../components/RouteGuard';

type SortField = keyof LeaveRequest;
type SortDirection = 'asc' | 'desc';

const ApproveRequestsContent = () => {
  const router = useRouter();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('submittedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'cancelled'>('pending');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [, setCurrentUser] = useState<{id: string; role: string | {name: string}} | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  
  
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [requestToApprove, setRequestToApprove] = useState<LeaveRequest | null>(null);
  const [requestToReject, setRequestToReject] = useState<LeaveRequest | null>(null);



  useEffect(() => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUser(user);
      fetchRequests(user);
    }
  }, [router]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.dropdown-container')) {
        setShowFilterDropdown(false);
        setShowSortDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);





  const fetchRequests = async (user: {id: string; role: string | {name: string}}) => {
    try {
      setLoading(true);
      setError(null);
      
      let requestsData: LeaveRequest[];
      
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

  const confirmApproveRequest = async (comments?: string) => {
    if (!requestToApprove) return;

    try {
      await apiService.approveLeaveRequest(requestToApprove.id, comments || undefined);
      
      
      setRequests(prevRequests =>
        prevRequests.map(req =>
          req.id === requestToApprove.id
            ? { ...req, status: 'approved' as const }
            : req
        )
      );
      
      setShowApproveDialog(false);
      setRequestToApprove(null);
    } catch {
      alert('Failed to approve request. Please try again.');
    }
  };

  const confirmRejectRequest = async (comments?: string) => {
    if (!requestToReject) return;

    try {
      await apiService.rejectLeaveRequest(requestToReject.id, comments || undefined);
      
      
      setRequests(prevRequests =>
        prevRequests.map(req =>
          req.id === requestToReject.id
            ? { ...req, status: 'rejected' as const }
            : req
        )
      );
      
      setShowRejectDialog(false);
      setRequestToReject(null);
    } catch {
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
      
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aValue: string | number | Date;
      let bValue: string | number | Date;

      
      if (sortField === 'user') {
        aValue = `${a.user.firstName} ${a.user.lastName}`;
        bValue = `${b.user.firstName} ${b.user.lastName}`;
      } else if (sortField === 'leaveType') {
        aValue = a.leaveType.name;
        bValue = b.leaveType.name;
      } else {
        
        const rawAValue = a[sortField];
        const rawBValue = b[sortField];
        
        if (typeof rawAValue === 'string' || typeof rawAValue === 'number') {
          aValue = rawAValue;
        } else {
          aValue = String(rawAValue);
        }
        
        if (typeof rawBValue === 'string' || typeof rawBValue === 'number') {
          bValue = rawBValue;
        } else {
          bValue = String(rawBValue);
        }
      }

      
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

      <main role="main" className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8" aria-label="Approve leave requests page">
        <div className="px-4 py-6 sm:px-0">

          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  Approve Leave Requests
                </h1>
              </div>
              <button
                onClick={() => {
                  setIsNavigating(true);
                  router.push('/');
                }}
                disabled={isNavigating}
                className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600 min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isNavigating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Navigating...
                  </>
                ) : (
                  <>
                    <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Dashboard
                  </>
                )}
              </button>
            </div>
          </div>

        {error && !error.includes('Unauthorized') && (
          <Card variant="bordered" borderColor="red" className="mb-6">
            <Card.Content>
              <div className="text-red-800 dark:text-red-200">
                Error: {error}
              </div>
            </Card.Content>
          </Card>
        )}

        <Card variant="default" className="mb-6 overflow-visible">
            <Card.Content className="overflow-visible">
            <div className="flex flex-row gap-2 sm:gap-4">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by name, email, leave type, or reason..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
              <div className="relative dropdown-container">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFilterDropdown(!showFilterDropdown);
                    setShowSortDropdown(false);
                  }}
                  className={`px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer flex items-center gap-2 text-sm whitespace-nowrap transition-colors ${
                    statusFilter !== 'all' 
                      ? 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-600'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <span className="hidden sm:inline">
                    {statusFilter === 'all' ? 'All Status' : 
                     statusFilter === 'pending' ? 'Pending' :
                     statusFilter === 'approved' ? 'Approved' :
                     statusFilter === 'rejected' ? 'Rejected' : 'Cancelled'}
                  </span>
                </button>
                {showFilterDropdown && (
                  <div className="absolute top-12 left-0 w-48 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50">
                    <button
                      onClick={() => {
                        setStatusFilter('all');
                        setShowFilterDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 text-sm flex items-center justify-between ${statusFilter === 'all' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''}`}
                    >
                      All Status
                      {statusFilter === 'all' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setStatusFilter('pending');
                        setShowFilterDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 text-sm flex items-center justify-between ${statusFilter === 'pending' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''}`}
                    >
                      Pending
                      {statusFilter === 'pending' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setStatusFilter('approved');
                        setShowFilterDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 text-sm flex items-center justify-between ${statusFilter === 'approved' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''}`}
                    >
                      Approved
                      {statusFilter === 'approved' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setStatusFilter('rejected');
                        setShowFilterDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 text-sm flex items-center justify-between ${statusFilter === 'rejected' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''}`}
                    >
                      Rejected
                      {statusFilter === 'rejected' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setStatusFilter('cancelled');
                        setShowFilterDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 text-sm flex items-center justify-between ${statusFilter === 'cancelled' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''}`}
                    >
                      Cancelled
                      {statusFilter === 'cancelled' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  </div>
                )}
              </div>
              <div className="relative dropdown-container">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSortDropdown(!showSortDropdown);
                    setShowFilterDropdown(false);
                  }}
                  className="px-4 py-3 border border-gray-200 rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-600 text-sm whitespace-nowrap text-gray-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
                  </svg>
                  <span className="hidden sm:inline">
                    {sortField === 'user' ? `Employee (${sortDirection === 'asc' ? 'A-Z' : 'Z-A'})` :
                     sortField === 'leaveType' ? `Leave Type (${sortDirection === 'asc' ? 'A-Z' : 'Z-A'})` :
                     sortField === 'startDate' ? `Start Date (${sortDirection === 'asc' ? 'Old-New' : 'New-Old'})` :
                     sortField === 'endDate' ? `End Date (${sortDirection === 'asc' ? 'Old-New' : 'New-Old'})` :
                     sortField === 'submittedAt' ? `Submitted (${sortDirection === 'asc' ? 'Old-New' : 'New-Old'})` :
                     `Status (${sortDirection === 'asc' ? 'A-Z' : 'Z-A'})`}
                  </span>
                </button>
                {showSortDropdown && (
                  <div className="absolute top-12 left-0 w-48 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50">
                    <button
                      onClick={() => {
                        setSortField('user');
                        setSortDirection('asc');
                        setShowSortDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 text-sm flex items-center justify-between ${sortField === 'user' && sortDirection === 'asc' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''}`}
                    >
                      Employee (A-Z)
                      {sortField === 'user' && sortDirection === 'asc' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setSortField('user');
                        setSortDirection('desc');
                        setShowSortDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 text-sm flex items-center justify-between ${sortField === 'user' && sortDirection === 'desc' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''}`}
                    >
                      Employee (Z-A)
                      {sortField === 'user' && sortDirection === 'desc' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setSortField('leaveType');
                        setSortDirection('asc');
                        setShowSortDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 text-sm flex items-center justify-between ${sortField === 'leaveType' && sortDirection === 'asc' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''}`}
                    >
                      Leave Type (A-Z)
                      {sortField === 'leaveType' && sortDirection === 'asc' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setSortField('leaveType');
                        setSortDirection('desc');
                        setShowSortDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 text-sm flex items-center justify-between ${sortField === 'leaveType' && sortDirection === 'desc' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''}`}
                    >
                      Leave Type (Z-A)
                      {sortField === 'leaveType' && sortDirection === 'desc' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setSortField('startDate');
                        setSortDirection('asc');
                        setShowSortDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 text-sm flex items-center justify-between ${sortField === 'startDate' && sortDirection === 'asc' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''}`}
                    >
                      Start Date (Old-New)
                      {sortField === 'startDate' && sortDirection === 'asc' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setSortField('startDate');
                        setSortDirection('desc');
                        setShowSortDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 text-sm flex items-center justify-between ${sortField === 'startDate' && sortDirection === 'desc' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''}`}
                    >
                      Start Date (New-Old)
                      {sortField === 'startDate' && sortDirection === 'desc' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setSortField('endDate');
                        setSortDirection('asc');
                        setShowSortDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 text-sm flex items-center justify-between ${sortField === 'endDate' && sortDirection === 'asc' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''}`}
                    >
                      End Date (Old-New)
                      {sortField === 'endDate' && sortDirection === 'asc' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setSortField('endDate');
                        setSortDirection('desc');
                        setShowSortDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 text-sm flex items-center justify-between ${sortField === 'endDate' && sortDirection === 'desc' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''}`}
                    >
                      End Date (New-Old)
                      {sortField === 'endDate' && sortDirection === 'desc' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setSortField('submittedAt');
                        setSortDirection('asc');
                        setShowSortDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 text-sm flex items-center justify-between ${sortField === 'submittedAt' && sortDirection === 'asc' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''}`}
                    >
                      Submitted (Old-New)
                      {sortField === 'submittedAt' && sortDirection === 'asc' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setSortField('submittedAt');
                        setSortDirection('desc');
                        setShowSortDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 text-sm flex items-center justify-between ${sortField === 'submittedAt' && sortDirection === 'desc' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''}`}
                    >
                      Submitted (New-Old)
                      {sortField === 'submittedAt' && sortDirection === 'desc' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setSortField('status');
                        setSortDirection('asc');
                        setShowSortDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 text-sm flex items-center justify-between ${sortField === 'status' && sortDirection === 'asc' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''}`}
                    >
                      Status (A-Z)
                      {sortField === 'status' && sortDirection === 'asc' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setSortField('status');
                        setSortDirection('desc');
                        setShowSortDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 text-sm flex items-center justify-between ${sortField === 'status' && sortDirection === 'desc' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''}`}
                    >
                      Status (Z-A)
                      {sortField === 'status' && sortDirection === 'desc' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  </div>
                )}
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
            <>
              
              <div className="block lg:hidden space-y-6">
                {filteredAndSortedRequests.map((request) => (
                  <div key={request.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white leading-tight">
                          {request.user.firstName} {request.user.lastName}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{request.user.email}</p>
                      </div>
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide ${
                        request.status === 'approved'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : request.status === 'rejected'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : request.status === 'cancelled'
                          ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {getStatusIcon(request.status)}
                        <span className="ml-1">{request.status}</span>
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-5 text-sm">
                      <div>
                        <span className="text-xs uppercase tracking-wide font-medium text-gray-500 dark:text-gray-400">Leave Type</span>
                        <p className="font-semibold text-gray-900 dark:text-white mt-1">
                          {request.leaveType.name}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs uppercase tracking-wide font-medium text-gray-500 dark:text-gray-400">Duration</span>
                        <p className="font-semibold text-gray-900 dark:text-white mt-1">
                          {request.duration} {request.duration === 1 ? 'day' : 'days'}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs uppercase tracking-wide font-medium text-gray-500 dark:text-gray-400">Start Date</span>
                        <p className="font-semibold text-gray-900 dark:text-white mt-1">
                          {new Date(request.startDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs uppercase tracking-wide font-medium text-gray-500 dark:text-gray-400">End Date</span>
                        <p className="font-semibold text-gray-900 dark:text-white mt-1">
                          {new Date(request.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    {request.reason && (
                      <div className="mb-5">
                        <span className="text-xs uppercase tracking-wide font-medium text-gray-500 dark:text-gray-400">Reason</span>
                        <p className="text-sm text-gray-900 dark:text-white mt-2 leading-relaxed">
                          {request.reason}
                        </p>
                      </div>
                    )}
                    
                    {request.status === 'pending' && (
                      <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <button
                          onClick={() => {
                            setRequestToApprove(request);
                            setShowApproveDialog(true);
                          }}
                          className="flex-1 inline-flex items-center justify-center px-4 py-3 min-h-[48px] bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:bg-green-500 dark:hover:bg-green-600 dark:focus:ring-green-400"
                        >
                          <CheckCircleIcon className="w-4 h-4 mr-2" />
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            setRequestToReject(request);
                            setShowRejectDialog(true);
                          }}
                          className="flex-1 inline-flex items-center justify-center px-4 py-3 min-h-[48px] bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:bg-red-500 dark:hover:bg-red-600 dark:focus:ring-red-400"
                        >
                          <XCircleIcon className="w-4 h-4 mr-2" />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              
              <div className="hidden lg:block overflow-x-auto">
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
                              className="inline-flex items-center justify-center px-3 py-1.5 min-h-[36px] bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:bg-green-500 dark:hover:bg-green-600 dark:focus:ring-green-400"
                            >
                              <CheckCircleIcon className="w-3 h-3 mr-1" />
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setRequestToReject(request);
                                setShowRejectDialog(true);
                              }}
                              className="inline-flex items-center justify-center px-3 py-1.5 min-h-[36px] bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-md transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:bg-red-500 dark:hover:bg-red-600 dark:focus:ring-red-400"
                            >
                              <XCircleIcon className="w-3 h-3 mr-1" />
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
            </>
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

export default function ApproveRequestsPage() {
  return (
    <RouteGuard requiredRoles={['admin', 'manager']}>
      <ApproveRequestsContent />
    </RouteGuard>
  );
}