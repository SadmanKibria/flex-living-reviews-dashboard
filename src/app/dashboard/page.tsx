// src/app/dashboard/page.tsx
import { Metadata } from 'next';
import { ListingCards } from '@/components/dashboard/ListingCards';
import { ReviewsTable } from '@/components/dashboard/ReviewsTable';
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

      <section>
        <h2 className="text-xl font-semibold mb-4">Listing Overview</h2>
        <ErrorBoundary fallback={<div className="text-red-500">Failed to load listing data</div>}>
          <ListingCards />
        </ErrorBoundary>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Recent Reviews</h2>
        <ErrorBoundary fallback={<div className="text-red-500">Failed to load reviews</div>}>
          <ReviewsTable />
        </ErrorBoundary>
      </section>
    </div>
  );
}