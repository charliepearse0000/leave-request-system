'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string | { id: string; name: string };
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });
  const router = useRouter();

  const logout = useCallback((reason?: string) => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
    
    // Dispatch custom event for token expiry notifications
    if (reason === 'expired') {
      window.dispatchEvent(new CustomEvent('auth:tokenExpired', {
        detail: { message: 'Your session has expired. Please log in again.' }
      }));
    }
    
    router.push('/');
  }, [router]);

  const checkAuth = useCallback(() => {
    try {
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('userData');

      if (!token || !userData) {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
        return;
      }

      // Check if token is expired
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      if (tokenPayload.exp < currentTime) {
        // Token is expired
        logout('expired');
        return;
      }

      const user = JSON.parse(userData);
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Auth check failed:', error);
      logout();
    }
  }, [logout]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Periodic token expiry check
  useEffect(() => {
    if (!authState.isAuthenticated) return;

    const interval = setInterval(() => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        logout('expired');
        return;
      }

      try {
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        
        if (tokenPayload.exp < currentTime) {
          logout('expired');
        }
      } catch {
        logout('expired');
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [authState.isAuthenticated, logout]);

  const getUserRole = (): string => {
    if (!authState.user) return '';
    return typeof authState.user.role === 'string' 
      ? authState.user.role 
      : authState.user.role?.name || '';
  };

  const hasRole = (roles: string[]): boolean => {
    const userRole = getUserRole().toLowerCase();
    return roles.map(role => role.toLowerCase()).includes(userRole);
  };

  const isAdmin = (): boolean => hasRole(['admin']);
  const isManager = (): boolean => hasRole(['manager']);
  const isEmployee = (): boolean => hasRole(['employee']);

  return {
    ...authState,
    logout,
    checkAuth,
    getUserRole,
    hasRole,
    isAdmin,
    isManager,
    isEmployee,
  };
};