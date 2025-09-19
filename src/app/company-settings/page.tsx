'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '../contexts/ToastContext';
import { companySettings, CompanySettings } from '../services/company-settings';
import Header from '../components/Header';
import Card from '../components/Card';

export default function CompanySettingsPage() {
  const [settings, setSettings] = useState<CompanySettings>(companySettings.getSettings());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { showSuccess, showError } = useToast();
  const router = useRouter();

  useEffect(() => {
    // Check if user is admin
    const userData = localStorage.getItem('userData');
    if (userData) {
      const user = JSON.parse(userData);
      if (user.role !== 'admin') {
        router.push('/');
        return;
      }
    } else {
      router.push('/');
      return;
    }

    // Load current settings
    setSettings(companySettings.getSettings());
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Validate inputs
      if (settings.defaultAnnualLeaveAllowance < 0 || settings.defaultSickLeaveAllowance < 0) {
        showError('Leave allowances must be positive numbers');
        return;
      }

      if (settings.defaultAnnualLeaveAllowance > 365 || settings.defaultSickLeaveAllowance > 365) {
        showError('Leave allowances cannot exceed 365 days');
        return;
      }

      // Update settings
      companySettings.updateSettings(settings);
      showSuccess('Company settings updated successfully');
    } catch (error) {
      showError('Failed to update company settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(companySettings.getSettings());
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Company Settings</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Configure company-wide defaults and policies
          </p>
        </div>

        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Leave Allowance Defaults
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Annual Leave Default */}
              <div>
                <label htmlFor="defaultAnnualLeaveAllowance" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Default Annual Leave Allowance (days)
                </label>
                <input
                  type="number"
                  id="defaultAnnualLeaveAllowance"
                  name="defaultAnnualLeaveAllowance"
                  value={settings.defaultAnnualLeaveAllowance}
                  onChange={handleInputChange}
                  min="0"
                  max="365"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  This will be the default for all new employees
                </p>
              </div>

              {/* Sick Leave Default */}
              <div>
                <label htmlFor="defaultSickLeaveAllowance" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Default Sick Leave Allowance (days)
                </label>
                <input
                  type="number"
                  id="defaultSickLeaveAllowance"
                  name="defaultSickLeaveAllowance"
                  value={settings.defaultSickLeaveAllowance}
                  onChange={handleInputChange}
                  min="0"
                  max="365"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  This will be the default for all new employees
                </p>
              </div>
            </div>

            {/* Company Name */}
            <div className="mt-6">
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Company Name
              </label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={settings.companyName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Enter your company name"
              />
            </div>

            {/* Allow Custom Allowances */}
            <div className="mt-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="allowCustomAllowances"
                  name="allowCustomAllowances"
                  checked={settings.allowCustomAllowances}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                />
                <label htmlFor="allowCustomAllowances" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Allow custom allowances for individual employees
                </label>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                When enabled, admins can set different allowances for specific employees
              </p>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-700"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                {isSaving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </Card>

        {/* Current Settings Summary */}
        <Card className="mt-6">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Current Settings Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Annual Leave Default:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{settings.defaultAnnualLeaveAllowance} days</span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Sick Leave Default:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{settings.defaultSickLeaveAllowance} days</span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Company:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{settings.companyName}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Custom Allowances:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {settings.allowCustomAllowances ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}