'use client';

import { useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';

export default function AuthEventListener() {
  const { showError } = useToast();

  useEffect(() => {
    const handleTokenExpired = (event: CustomEvent) => {
      showError(event.detail.message);
    };

    window.addEventListener('auth:tokenExpired', handleTokenExpired as EventListener);

    return () => {
      window.removeEventListener('auth:tokenExpired', handleTokenExpired as EventListener);
    };
  }, [showError]);

  return null;
}