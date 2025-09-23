'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from '../components/LoginForm';

export default function LoginPage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (typeof window === 'undefined') {
        setIsChecking(false);
        return;
      }

      // Add a small delay to ensure proper initialization
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check if user is already authenticated
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('userData');
      
      if (token && userData) {
        // User is already logged in, redirect to dashboard
        router.push('/');
      } else {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [router]);

  // Show loading while checking authentication
  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Leave Request System
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Please sign in to your account
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}