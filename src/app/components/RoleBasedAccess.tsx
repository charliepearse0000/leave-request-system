'use client';

import { useAuth } from '../hooks/useAuth';

interface RoleBasedAccessProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  deniedRoles?: string[];
  requireAuth?: boolean;
  fallback?: React.ReactNode;
}

export default function RoleBasedAccess({
  children,
  allowedRoles = [],
  deniedRoles = [],
  requireAuth = true,
  fallback = null,
}: RoleBasedAccessProps) {
  const { isAuthenticated, hasRole } = useAuth();

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return <>{fallback}</>;
  }

  // If user is not authenticated and auth is not required, show children
  if (!requireAuth && !isAuthenticated) {
    return <>{children}</>;
  }

  // Check denied roles first
  if (deniedRoles.length > 0 && hasRole(deniedRoles)) {
    return <>{fallback}</>;
  }

  // Check allowed roles
  if (allowedRoles.length > 0 && !hasRole(allowedRoles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Convenience components for common role checks
export function AdminOnly({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleBasedAccess allowedRoles={['admin']} fallback={fallback}>
      {children}
    </RoleBasedAccess>
  );
}

export function ManagerOnly({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleBasedAccess allowedRoles={['manager']} fallback={fallback}>
      {children}
    </RoleBasedAccess>
  );
}

export function AdminOrManager({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleBasedAccess allowedRoles={['admin', 'manager']} fallback={fallback}>
      {children}
    </RoleBasedAccess>
  );
}

export function EmployeeOnly({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleBasedAccess allowedRoles={['employee']} fallback={fallback}>
      {children}
    </RoleBasedAccess>
  );
}

export function AuthenticatedOnly({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleBasedAccess requireAuth={true} fallback={fallback}>
      {children}
    </RoleBasedAccess>
  );
}

export function GuestOnly({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleBasedAccess requireAuth={false} allowedRoles={[]} fallback={fallback}>
      {children}
    </RoleBasedAccess>
  );
}