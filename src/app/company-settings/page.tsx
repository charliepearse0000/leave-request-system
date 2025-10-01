'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '../contexts/ToastContext';
import { companySettings, CompanySettings } from '../services/company-settings';
import Header from '../components/Header';
import Card from '../components/Card';
import RouteGuard from '../components/RouteGuard';

function CompanySettingsContent() {
  const [settings, setSettings] = useState<CompanySettings>(companySettings.getSettings());
  const [isSaving, setIsSaving] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const { showSuccess, showError } = useToast();
  const router = useRouter();

  useEffect(() => {
    setSettings(companySettings.getSettings());
  }, []);

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
      
      
      if (settings.defaultAnnualLeaveAllowance < 0 || settings.defaultSickLeaveAllowance < 0) {
        showError('Leave allowances must be positive numbers');
        return;
      }

      if (settings.defaultAnnualLeaveAllowance > 365 || settings.defaultSickLeaveAllowance > 365) {
        showError('Leave allowances cannot exceed 365 days');
        return;
      }

      
      companySettings.updateSettings(settings);
      showSuccess('Company settings updated successfully');
    } catch {
      showError('Failed to update company settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(companySettings.getSettings());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Header title="Company Settings" />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Company Settings</h1>
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
            <div className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            <div className="mt-8 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 min-h-[44px] bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-gray-500 dark:hover:bg-gray-600 dark:focus:ring-gray-400"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
            </div>
          </Card.Content>
        </Card>


        </div>
      </main>
    </div>
  );
}

export default function CompanySettingsPage() {
  return (
    <RouteGuard requiredRoles={['admin']}>
      <CompanySettingsContent />
    </RouteGuard>
  );
}