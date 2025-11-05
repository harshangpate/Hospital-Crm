'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/hooks/useTranslation';

export default function DoctorsRedirect() {
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    router.replace('/dashboard/reception/doctors');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">{t('redirecting')}</p>
      </div>
    </div>
  );
}
