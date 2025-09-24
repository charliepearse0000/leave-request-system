'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import { ShieldExclamationIcon, HomeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function NotAuthorizedPage() {
  const router = useRouter();
  const { user, getUserRole } = useAuth();

  const handleGoHome = () => {
    router.push('/');
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-red-100 dark:bg-red-900/30">
            <ShieldExclamationIcon className="h-12 w-12 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            Access Denied
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            You don&apos;t have permission to access this page
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                What happened?
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                The page you&apos;re trying to access requires specific permissions that your current role doesn&apos;t have.
              </p>
            </div>

            {user && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-3">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Current role:</span>{' '}
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 capitalize">
                    {getUserRole()}
                  </span>
                </p>
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                What can you do?
              </h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Contact your administrator to request access</li>
                <li>• Return to the dashboard</li>
                <li>• Check if you&apos;re logged in with the correct account</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleGoBack}
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Go Back
          </button>
          <button
            onClick={handleGoHome}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <HomeIcon className="h-4 w-4 mr-2" />
            Go to Dashboard
          </button>
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400">
          If you believe this is an error, please contact your system administrator.
        </div>
      </div>
    </div>
  );
}