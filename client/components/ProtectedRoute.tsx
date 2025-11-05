'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter();
  const { token, user, isLoading } = useAuthStore();

  useEffect(() => {
    // If not loading and no token, redirect to login
    if (!isLoading && !token) {
      router.push('/login');
      return;
    }

    // If roles are specified and user doesn't have permission
    if (!isLoading && user && allowedRoles && allowedRoles.length > 0) {
      if (!allowedRoles.includes(user.role)) {
        // Redirect to their appropriate dashboard
        router.push(getDashboardRoute(user.role));
      }
    }
  }, [token, user, isLoading, allowedRoles, router]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If no token, don't render children (will redirect via useEffect)
  if (!token) {
    return null;
  }

  // If role check fails, don't render (will redirect via useEffect)
  if (allowedRoles && allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}

// Helper function to get dashboard route based on role
function getDashboardRoute(role: string): string {
  switch (role) {
    case 'PATIENT':
      return '/dashboard/patient';
    case 'DOCTOR':
      return '/dashboard/doctor';
    case 'LAB_TECHNICIAN':
      return '/dashboard/laboratory';
    case 'PHARMACIST':
      return '/dashboard/pharmacy';
    case 'NURSE':
      return '/dashboard/staff';
    case 'RECEPTIONIST':
      return '/dashboard/reception';
    case 'ADMIN':
    case 'SUPER_ADMIN':
      return '/dashboard/admin';
    default:
      return '/';
  }
}
