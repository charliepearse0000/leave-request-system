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

  
  if (requireAuth && !isAuthenticated) {
    return <>{fallback}</>;
  }

  
  if (!requireAuth && !isAuthenticated) {
    return <>{children}</>;
  }

  
  if (deniedRoles.length > 0 && hasRole(deniedRoles)) {
    return <>{fallback}</>;
  }

  
  if (allowedRoles.length > 0 && !hasRole(allowedRoles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

  
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