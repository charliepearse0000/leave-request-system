'use client';

import { useState, useEffect, useRef } from 'react';
import { useToast } from '../contexts/ToastContext';
import { apiService } from '../services/api';
import { companySettings } from '../services/company-settings';
import { useFocusTrap } from '../utils/focus-trap';

interface AddStaffFormProps {
  isOpen: boolean;
  onStaffAdded: () => void;
  onCancel: () => void;
}

interface Role {
  id: string;
  name: string;
  description: string;
}

const AddStaffForm: React.FC<AddStaffFormProps> = ({ isOpen, onStaffAdded, onCancel }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    roleId: '',
    annualLeaveBalance: '',
    sickLeaveBalance: ''
  });
  const [roles, setRoles] = useState<Role[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const { showSuccess, showError } = useToast();
  
  const modalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(modalRef, isOpen, {
    initialFocus: 'input[name="firstName"]',
    escapeDeactivates: true,
    onDeactivate: onCancel,
  });

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const rolesData = await apiService.getRoles();
        setRoles(rolesData);
      } catch {
        showError('Failed to load roles');
      }
    };

    fetchRoles();
  }, [showError]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.roleId) {
      newErrors.roleId = 'Role is required';
    }

    const annualLeave = parseInt(formData.annualLeaveBalance) || 0;
    if (annualLeave < 0) {
      newErrors.annualLeaveBalance = 'Annual leave balance cannot be negative';
    }

    const sickLeave = parseInt(formData.sickLeaveBalance) || 0;
    if (sickLeave < 0) {
      newErrors.sickLeaveBalance = 'Sick leave balance cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const staffData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        roleId: formData.roleId,
        annualLeaveBalance: formData.annualLeaveBalance ? parseInt(formData.annualLeaveBalance) : companySettings.getDefaultAnnualLeaveAllowance(),
        sickLeaveBalance: formData.sickLeaveBalance ? parseInt(formData.sickLeaveBalance) : companySettings.getDefaultSickLeaveAllowance()
      };

      await apiService.createStaff(staffData);
      
      showSuccess('Staff member added successfully!');
      onStaffAdded();
    } catch (error: unknown) {
      
      let errorMessage = 'Failed to add staff member';
      
      if (error instanceof Error && error.message) {
        if (error.message.includes('email') && error.message.includes('already')) {
          errorMessage = 'This email address is already registered. Please use a different email.';
        } else if (error.message.includes('User registration failed')) {
          errorMessage = 'Failed to register user. Please check all required fields and try again.';
        } else if (error.message.includes('Failed to assign role')) {
          errorMessage = 'User was created but role assignment failed. Please edit the user to assign the correct role.';
        } else if (error.message.includes('Failed to set leave balances')) {
          errorMessage = 'User was created but leave balance setup failed. Please edit the user to set correct balances.';
        } else if (error.message.includes('validation')) {
          errorMessage = 'Please check all fields for valid information and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      showError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={modalRef}
      className="fixed inset-0 z-[9999] overflow-y-auto transition-opacity duration-300"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.25)' }}
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-staff-title"
    >
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
        <div 
          className="relative inline-block align-middle bg-white dark:bg-gray-800 rounded-xl shadow-2xl transform transition-all max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700"
          onClick={(e) => e.stopPropagation()}
        >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 id="add-staff-title" className="text-xl font-semibold text-gray-900 dark:text-white">
              Add New Staff Member
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Close dialog"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  First Name
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
                  aria-describedby={errors.firstName ? "firstName-error" : undefined}
                  aria-invalid={errors.firstName ? "true" : "false"}
                  required
                />
                {errors.firstName && (
                  <p id="firstName-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Last Name
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
                  aria-describedby={errors.lastName ? "lastName-error" : undefined}
                  aria-invalid={errors.lastName ? "true" : "false"}
                  required
                />
                {errors.lastName && (
                  <p id="lastName-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
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
                  aria-describedby={errors.email ? "email-error" : undefined}
                  aria-invalid={errors.email ? "true" : "false"}
                  required
                  autoComplete="email"
                />
                {errors.email && (
                  <p id="email-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">{errors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="roleId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role
                </label>
                <select
                  id="roleId"
                  name="roleId"
                  value={formData.roleId}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.roleId ? 'border-red-500' : 'border-gray-300'
                  }`}
                  aria-describedby={errors.roleId ? "roleId-error" : undefined}
                  aria-invalid={errors.roleId ? "true" : "false"}
                  required
                >
                  <option value="">Select a role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                    </option>
                  ))}
                </select>
                {errors.roleId && (
                  <p id="roleId-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">{errors.roleId}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
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
                aria-describedby={errors.password ? "password-error" : undefined}
                aria-invalid={errors.password ? "true" : "false"}
                required
                autoComplete="new-password"
              />
              {errors.password && (
                <p id="password-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">{errors.password}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="annualLeaveBalance" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Annual Leave Allowance (days)
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Company default: {companySettings.getDefaultAnnualLeaveAllowance()} days
                </p>
                <input
                  type="number"
                  id="annualLeaveBalance"
                  name="annualLeaveBalance"
                  value={formData.annualLeaveBalance}
                  onChange={handleInputChange}
                  min="0"
                  placeholder={companySettings.getDefaultAnnualLeaveAllowance().toString()}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.annualLeaveBalance ? 'border-red-500' : 'border-gray-300'
                  }`}
                  aria-describedby={`annualLeaveBalance-help${errors.annualLeaveBalance ? ' annualLeaveBalance-error' : ''}`}
                  aria-invalid={errors.annualLeaveBalance ? "true" : "false"}
                />
                <p id="annualLeaveBalance-help" className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Leave empty to use company default.
                </p>
                {errors.annualLeaveBalance && (
                  <p id="annualLeaveBalance-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">{errors.annualLeaveBalance}</p>
                )}
              </div>

              <div>
                <label htmlFor="sickLeaveBalance" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sick Leave Allowance (days)
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Company default: {companySettings.getDefaultSickLeaveAllowance()} days
                </p>
                <input
                  type="number"
                  id="sickLeaveBalance"
                  name="sickLeaveBalance"
                  value={formData.sickLeaveBalance}
                  onChange={handleInputChange}
                  min="0"
                  placeholder={companySettings.getDefaultSickLeaveAllowance().toString()}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.sickLeaveBalance ? 'border-red-500' : 'border-gray-300'
                  }`}
                  aria-describedby={`sickLeaveBalance-help${errors.sickLeaveBalance ? ' sickLeaveBalance-error' : ''}`}
                  aria-invalid={errors.sickLeaveBalance ? "true" : "false"}
                />
                <p id="sickLeaveBalance-help" className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Leave empty to use company default.
                </p>
                {errors.sickLeaveBalance && (
                  <p id="sickLeaveBalance-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">{errors.sickLeaveBalance}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center px-4 py-2 min-h-[44px] border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-400"
              >
                {isSubmitting ? 'Adding...' : 'Add Staff Member'}
              </button>
            </div>
          </form>
        </div>
        </div>
      </div>
    </div>
  );
};

export default AddStaffForm;