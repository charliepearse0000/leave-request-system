'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '../contexts/ToastContext';
import { apiService, ApiError } from '../services/api';
import Header from '../components/Header';
import Card from '../components/Card';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  password: string;
  annualLeaveBalance: number;
  sickLeaveBalance: number;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  password?: string;
  annualLeaveBalance?: string;
  sickLeaveBalance?: string;
}

export default function AddStaffPage() {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    password: '',
    annualLeaveBalance: 25,
    sickLeaveBalance: 10
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const { showSuccess, showError } = useToast();
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('userData');
      
      if (!token || !userData) {
        showError('Please log in to access this page.');
        router.push('/');
        return;
      }
      
      try {
        const user = JSON.parse(userData);
        // Check if user has admin role
        if (user.role !== 'admin') {
          showError('Access denied. Admin privileges required.');
          router.push('/');
          return;
        }
        
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing user data:', error);
        showError('Authentication error. Please log in again.');
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, showError]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // First name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Role validation
    if (!formData.role) {
      newErrors.role = 'Role selection is required';
    }

    // Annual leave balance validation
    if (formData.annualLeaveBalance < 0) {
      newErrors.annualLeaveBalance = 'Annual leave balance cannot be negative';
    }

    // Sick leave balance validation
    if (formData.sickLeaveBalance < 0) {
      newErrors.sickLeaveBalance = 'Sick leave balance cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const processedValue = type === 'number' ? Number(value) : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Map role to roleId (using actual UUIDs from the backend)
      const roleIdMap: { [key: string]: string } = {
        'employee': '5596b6ac-2059-4a6f-8522-4180c3c82e1a',
        'manager': '41bf908b-d1d1-4498-b1b0-55998caa4ce4', 
        'admin': '0be2f8ec-7b36-4e3e-8f59-07630da7a0b5'
      };

      const staffData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        roleId: roleIdMap[formData.role],
        annualLeaveBalance: formData.annualLeaveBalance,
        sickLeaveBalance: formData.sickLeaveBalance
      };

      const result = await apiService.createStaff(staffData);
      
      // Enhanced success feedback with detailed confirmation
      showSuccess(
        '🎉 Staff Member Successfully Created!', 
        `${staffData.firstName} ${staffData.lastName} has been added as ${formData.role.charAt(0).toUpperCase() + formData.role.slice(1)} with ${staffData.annualLeaveBalance} annual leave days and ${staffData.sickLeaveBalance} sick leave days. Login credentials have been set up.`
      );
      
      // Show additional confirmation in console for admin reference
      console.log('Staff member created:', {
        name: `${staffData.firstName} ${staffData.lastName}`,
        email: staffData.email,
        role: formData.role,
        id: result?.id || 'Generated by system'
      });
      
      // Reset form with a slight delay for better UX
      setTimeout(() => {
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          role: '',
          password: '',
          annualLeaveBalance: 25,
          sickLeaveBalance: 10
        });
        setErrors({});
      }, 1500);
      
    } catch (error) {
      const apiError = error as ApiError;
      
      // Enhanced error handling with specific feedback and recovery suggestions
      if (apiError.status === 400) {
        if (apiError.message.toLowerCase().includes('email already exists') || 
            apiError.message.toLowerCase().includes('user with this email')) {
          setErrors({ email: 'This email address is already registered in the system' });
          showError(
            '📧 Email Already Registered', 
            'This email address is already in use. Please choose a different email address or check if this person is already in the system.'
          );
        } else if (apiError.message.toLowerCase().includes('validation')) {
          const validationMsg = apiError.message.replace('Validation error', '').trim();
          showError(
            '📝 Form Validation Failed', 
            `Please review and correct the highlighted fields: ${validationMsg || 'Ensure all required fields are properly completed with valid information.'}`
          );
        } else if (apiError.message.toLowerCase().includes('password')) {
          setErrors({ password: 'Password does not meet security requirements' });
          showError(
            '🔐 Password Requirements Not Met', 
            'Password must be at least 6 characters long and contain valid characters. Please choose a stronger password.'
          );
        } else {
          showError(
            '⚠️ Invalid Information Provided', 
            `${apiError.message || 'Please verify all fields contain valid information and try again.'}`
          );
        }
      } else if (apiError.status === 401) {
        showError(
          '🔒 Session Expired', 
          'Your login session has expired for security reasons. You will be redirected to the login page.'
        );
        setTimeout(() => {
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
          router.push('/');
        }, 3000);
      } else if (apiError.status === 403) {
        showError(
          '🚫 Insufficient Permissions', 
          'Only administrators can add new staff members. Please contact your system administrator if you need access.'
        );
        setTimeout(() => router.push('/'), 3000);
      } else if (apiError.status === 409) {
        showError(
          '⚠️ Conflict Detected', 
          'A staff member with similar information already exists. Please verify the details and try again.'
        );
      } else if (apiError.status >= 500) {
        showError(
          '🔧 Server Error', 
          'Our servers are experiencing issues. Please try again in a few moments or contact support if the problem persists.'
        );
      } else {
        showError(
          '❌ Unable to Add Staff Member', 
          `${apiError.message || 'An unexpected error occurred. Please check your internet connection and try again.'}`
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <Header title="Add Staff Form" backButtonPath="/" />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Header title="Add Staff Form" backButtonPath="/" />
      
      <main className="max-w-2xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card variant="default">
            <Card.Header>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Add New Staff Member
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Fill in the details below to create a new employee account.
              </p>
            </Card.Header>
            
            <Card.Content className="px-6 py-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  {/* First Name Field */}
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      errors.firstName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter first name"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.firstName}</p>
                  )}
                </div>

                {/* Last Name Field */}
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      errors.lastName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter last name"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.lastName}</p>
                  )}
                </div>

                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter email address"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      errors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter password (min 6 characters)"
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
                  )}
                </div>

                {/* Role Field */}
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Role *
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      errors.role ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select a role</option>
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                  {errors.role && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.role}</p>
                  )}
                </div>

                {/* Annual Leave Balance Field */}
                <div>
                  <label htmlFor="annualLeaveBalance" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Annual Leave Balance (days)
                  </label>
                  <input
                    type="number"
                    id="annualLeaveBalance"
                    name="annualLeaveBalance"
                    value={formData.annualLeaveBalance}
                    onChange={handleInputChange}
                    min="0"
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      errors.annualLeaveBalance ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="25"
                  />
                  {errors.annualLeaveBalance && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.annualLeaveBalance}</p>
                  )}
                </div>

                {/* Sick Leave Balance Field */}
                <div>
                  <label htmlFor="sickLeaveBalance" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Sick Leave Balance (days)
                  </label>
                  <input
                    type="number"
                    id="sickLeaveBalance"
                    name="sickLeaveBalance"
                    value={formData.sickLeaveBalance}
                    onChange={handleInputChange}
                    min="0"
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      errors.sickLeaveBalance ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="10"
                  />
                  {errors.sickLeaveBalance && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.sickLeaveBalance}</p>
                  )}
                </div>

                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Adding...
                      </>
                    ) : (
                      'Add Staff Member'
                    )}
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