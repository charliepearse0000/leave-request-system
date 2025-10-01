'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiService } from '../services/api';
import { companySettings } from '../services/company-settings';
import { useToast } from '../contexts/ToastContext';
import Header from '../components/Header';
import Card from '../components/Card';

interface LeaveType {
  id: string;
  name: string;
  category: string;
  maxDays: number;
}

interface FormData {
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason: string;
}

interface FormErrors {
  leaveTypeId?: string;
  startDate?: string;
  endDate?: string;
  reason?: string;
}

export default function NewLeaveRequest() {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [formData, setFormData] = useState<FormData>({
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    reason: ''
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/');
        return;
      }
    };

    const fetchLeaveTypes = async () => {
      try {
        const types = await apiService.getLeaveTypes();

        // Normalize, deduplicate, and add fallbacks for missing fields
        const normalized = (types || []).map((t) => {
          const cat = (t.category || '').toLowerCase();
          const fallbackMax =
            typeof t.maxDays === 'number' && !Number.isNaN(t.maxDays)
              ? t.maxDays
              : cat === 'annual'
                ? companySettings.getDefaultAnnualLeaveAllowance()
                : cat === 'sick'
                  ? companySettings.getDefaultSickLeaveAllowance()
                  : 0;
          return {
            ...t,
            category: cat || 'other',
            maxDays: fallbackMax,
          };
        });

        const deduped = normalized.filter((t, idx, arr) => {
          const key = `${(t.name || '').toLowerCase()}::${t.category}`;
          return idx === arr.findIndex((u) => `${(u.name || '').toLowerCase()}::${u.category}` === key);
        });

        // Sort for a consistent UX: Annual, Sick, then Others
        const ordered = deduped.sort((a, b) => {
          const order = (x: string) => (x === 'annual' ? 0 : x === 'sick' ? 1 : 2);
          const oa = order(a.category);
          const ob = order(b.category);
          if (oa !== ob) return oa - ob;
          return (a.name || '').localeCompare(b.name || '');
        });

        setLeaveTypes(ordered);
      } catch {
        showError('Loading Failed', 'Failed to load leave types');
      }
    };

    checkAuth();
    fetchLeaveTypes();
  }, [router, showError]);

  const formatCategory = (cat?: string) => {
    if (!cat) return 'Other';
    const c = cat.toLowerCase();
    return c.charAt(0).toUpperCase() + c.slice(1);
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.leaveTypeId) {
      errors.leaveTypeId = 'Please select a leave type';
    }

    if (!formData.startDate) {
      errors.startDate = 'Please select a start date';
    }

    if (!formData.endDate) {
      errors.endDate = 'Please select an end date';
    } else if (formData.startDate && new Date(formData.endDate) < new Date(formData.startDate)) {
      errors.endDate = 'End date must be after start date';
    }

    if (!formData.reason.trim()) {
      errors.reason = 'Please provide a reason for your leave';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const calculateDuration = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    }
    return 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);

    try {
      const duration = calculateDuration();
      const requestData = {
        ...formData,
        duration
      };

      await apiService.createLeaveRequest(requestData);
      showSuccess('Request Submitted', 'Your leave request has been submitted successfully.');
      setSuccess(true);
    
      setTimeout(() => {
        router.push('/requests');
      }, 2000);
    } catch (error: unknown) {
      let errorMessage = 'Failed to create leave request';
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as { response?: { data?: { message?: string } } };
        errorMessage = apiError.response?.data?.message || errorMessage;
      }
      showError('Submission Failed', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/');
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
        <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-lg text-center max-w-md w-full">
          <div className="text-green-500 text-5xl sm:text-6xl mb-4">✓</div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-2">
            Request Submitted Successfully!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm sm:text-base">
            Your leave request has been submitted and is pending approval.
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-500">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Redirecting to your requests...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Header title="New Leave Request" />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">New Leave Request</h1>
            </div>
            <button
              onClick={() => {
                setIsNavigating(true);
                router.push('/');
              }}
              disabled={isNavigating}
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600 min-h-[44px] w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isNavigating ? (
                <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
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

          <Card variant="default">
            <Card.Content>
              <form onSubmit={handleSubmit} noValidate className="px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">

              <div>
                <label htmlFor="leaveTypeId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Leave Type *
                </label>
                <div className="relative">
                  <select
                    id="leaveTypeId"
                    name="leaveTypeId"
                    value={formData.leaveTypeId}
                    onChange={handleInputChange}
                    required
                    disabled={leaveTypes.length === 0}
                    className={`w-full px-3 py-3 sm:py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white min-h-[44px] text-base sm:text-sm ${
                      formErrors.leaveTypeId 
                        ? 'border-red-500 dark:border-red-400' 
                        : 'border-gray-300 dark:border-gray-600'
                    } ${leaveTypes.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <option value="">
                      {leaveTypes.length === 0 ? 'Loading leave types...' : 'Select leave type'}
                    </option>
                    {leaveTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name} ({formatCategory(type.category)}) - Max {type.maxDays} days
                      </option>
                    ))}
                  </select>
                  {leaveTypes.length === 0 && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                </div>
                {formErrors.leaveTypeId && (
                  <p role="alert" aria-label="leaveTypeId-error" aria-live="assertive" aria-atomic="true" className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                    <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {formErrors.leaveTypeId}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    aria-describedby="startDate-hint"
                    className={`w-full px-3 py-3 sm:py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white min-h-[44px] text-base sm:text-sm ${
                      formErrors.startDate 
                        ? 'border-red-500 dark:border-red-400' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  <p id="startDate-hint" className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Select the first day of your leave
                  </p>
                  {formErrors.startDate && (
                    <p role="alert" aria-label="startDate-error" aria-live="assertive" aria-atomic="true" className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                      <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {formErrors.startDate}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    End Date *
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    required
                    min={formData.startDate || new Date().toISOString().split('T')[0]}
                    aria-describedby="endDate-hint"
                    className={`w-full px-3 py-3 sm:py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white min-h-[44px] text-base sm:text-sm ${
                      formErrors.endDate 
                        ? 'border-red-500 dark:border-red-400' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  <p id="endDate-hint" className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Select the last day of your leave
                  </p>
                  {formErrors.endDate && (
                    <p role="alert" aria-label="endDate-error" aria-live="assertive" aria-atomic="true" className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                      <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {formErrors.endDate}
                    </p>
                  )}
                </div>
              </div>

              {formData.startDate && formData.endDate && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-md p-3 sm:p-4">
                  <div className="flex items-center justify-center sm:justify-start space-x-2">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm sm:text-base font-medium text-blue-800 dark:text-blue-200">
                      Duration: <span className="font-bold">{calculateDuration()} day{calculateDuration() !== 1 ? 's' : ''}</span>
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reason *
                </label>
                <textarea
                  id="reason"
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  placeholder="Please provide a reason for your leave request..."
                  aria-describedby="reason-hint"
                  className={`w-full px-3 py-3 sm:py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none text-base sm:text-sm min-h-[100px] sm:min-h-[80px] ${
                    formErrors.reason 
                      ? 'border-red-500 dark:border-red-400' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                <div className="mt-1">
                  <p id="reason-hint" className="text-xs text-gray-500 dark:text-gray-400">
                    Please provide a brief explanation for your leave request
                  </p>
                </div>
                {formErrors.reason && (
                  <p role="alert" aria-label="reason-error" aria-live="assertive" aria-atomic="true" className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                    <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {formErrors.reason}
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-6 sm:pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                       </svg>
                       Submitting...
                    </>
                  ) : (
                    'Submit Request'
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 min-h-[44px] bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-gray-500 dark:hover:bg-gray-600 dark:focus:ring-gray-400"
                >
                  Cancel
                </button>
              </div>
              </form>
            </Card.Content>
          </Card>
        </div>
      </main>
    </div>
  );
}