'use client';

import { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import { apiService, UserProfile } from '../services/api';

interface EditUserFormProps {
  user: UserProfile;
  onUserUpdated: (updatedUser: UserProfile) => void;
  onCancel: () => void;
}

interface Role {
  id: string;
  name: string;
  description: string;
}

const EditUserForm: React.FC<EditUserFormProps> = ({ user, onUserUpdated, onCancel }) => {
  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    roleId: user.role.id,
    annualLeaveBalance: user.annualLeaveBalance,
    sickLeaveBalance: user.sickLeaveBalance
  });
  const [roles, setRoles] = useState<Role[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const rolesData = await apiService.makeAuthenticatedRequest<Role[]>('/api/roles');
        setRoles(rolesData);
      } catch (error) {
        console.error('Error fetching roles:', error);
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

    if (!formData.roleId) {
      newErrors.roleId = 'Role is required';
    }

    if (formData.annualLeaveBalance < 0) {
      newErrors.annualLeaveBalance = 'Annual leave balance cannot be negative';
    }

    if (formData.sickLeaveBalance < 0) {
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
      // Update user basic info
      await apiService.makeAuthenticatedRequest(`/api/users/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim()
        })
      });

      // Update role if changed
      if (formData.roleId !== user.role.id) {
        await apiService.makeAuthenticatedRequest(`/api/users/${user.id}/role`, {
          method: 'POST',
          body: JSON.stringify({ roleId: formData.roleId })
        });
      }

      // Update leave balances if changed
      if (formData.annualLeaveBalance !== user.annualLeaveBalance || 
          formData.sickLeaveBalance !== user.sickLeaveBalance) {
        await apiService.makeAuthenticatedRequest(`/api/users/${user.id}/leave-balance`, {
          method: 'POST',
          body: JSON.stringify({
            annualLeaveChange: formData.annualLeaveBalance,
            sickLeaveChange: formData.sickLeaveBalance
          })
        });
      }

      // Fetch updated user data
      const updatedUser = await apiService.makeAuthenticatedRequest<UserProfile>(`/api/users/${user.id}`);
      
      showSuccess('User updated successfully!');
      onUserUpdated(updatedUser);
    } catch (error: any) {
      console.error('Error updating user:', error);
      showError(error.message || 'Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('Balance') ? parseInt(value) || 0 : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Edit User: {user.firstName} {user.lastName}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* First Name */}
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
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.firstName}</p>
              )}
            </div>

            {/* Last Name */}
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
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.lastName}</p>
              )}
            </div>

            {/* Email */}
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
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
              )}
            </div>

            {/* Role */}
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
              >
                <option value="">Select a role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                  </option>
                ))}
              </select>
              {errors.roleId && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.roleId}</p>
              )}
            </div>

            {/* Leave Balances */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Annual Leave Balance */}
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
                />
                {errors.annualLeaveBalance && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.annualLeaveBalance}</p>
                )}
              </div>

              {/* Sick Leave Balance */}
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
                />
                {errors.sickLeaveBalance && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.sickLeaveBalance}</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
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
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Updating...' : 'Update User'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditUserForm;