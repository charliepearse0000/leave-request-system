'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';

interface RouteGuardProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  requireAuth?: boolean;
  redirectTo?: string;
}

export default function RouteGuard({ 
  children, 
  requiredRoles = [], 
  requireAuth = true,
  redirectTo 
}: RouteGuardProps) {
  const { isAuthenticated, isLoading, hasRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

  
    if (requireAuth && !isAuthenticated) {
      router.push('/login');
      return;
    }

  
    if (requiredRoles.length > 0 && isAuthenticated) {
      if (!hasRole(requiredRoles)) {
  
        router.push(redirectTo || '/not-authorized');
        return;
      }
    }
  }, [isAuthenticated, isLoading, hasRole, requiredRoles, requireAuth, redirectTo, router]);

  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  
  if (requiredRoles.length > 0 && isAuthenticated && !hasRole(requiredRoles)) {
    return null;
  }

  return <>{children}</>;
}