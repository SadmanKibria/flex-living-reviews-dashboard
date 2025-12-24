// src/app/dashboard/page.tsx
import { Metadata } from 'next';
import { DashboardClient } from '@/components/dashboard/DashboardClient';
import { LastUpdated } from '@/components/dashboard/LastUpdated';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export const metadata: Metadata = {
  title: 'Dashboard | Flex Living Reviews',
};

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Review Dashboard</h1>
        <ErrorBoundary fallback={null}>
          <LastUpdated />
        </ErrorBoundary>
      </header>

      <ErrorBoundary fallback={<div className="text-red-500">Failed to load dashboard</div>}>
        <DashboardClient />
      </ErrorBoundary>
    </div>
  );
}