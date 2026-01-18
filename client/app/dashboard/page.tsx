'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      // Redirect to role-specific dashboard
      switch (user.role) {
        case 'PATIENT':
          router.replace('/dashboard/patient');
          break;
        case 'DOCTOR':
          router.replace('/dashboard/doctor');
          break;
        case 'LAB_TECHNICIAN':
          router.replace('/dashboard/laboratory');
          break;
        case 'PHARMACIST':
          router.replace('/dashboard/pharmacy');
          break;
        case 'NURSE':
          router.replace('/dashboard/ipd');
          break;
        case 'RECEPTIONIST':
          router.replace('/dashboard/reception');
          break;
        case 'ACCOUNTANT':
          router.replace('/dashboard/billing');
          break;
        case 'HR_MANAGER':
          router.replace('/dashboard/staff/hr');
          break;
        case 'ADMIN':
        case 'SUPER_ADMIN':
          router.replace('/dashboard/admin');
          break;
        default:
          router.replace('/');
      }
    }
  }, [user, router]);

  return (
    <ProtectedRoute>
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to your dashboard...</p>
        </div>
      </div>
    </ProtectedRoute>
  );
}
