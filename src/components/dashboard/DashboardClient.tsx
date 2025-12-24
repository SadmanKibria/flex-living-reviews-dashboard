'use client';

import { useEffect, useMemo, useState } from 'react';

import { ListingCards } from '@/components/dashboard/ListingCards';
import { ReviewsTable } from '@/components/dashboard/ReviewsTable';
import { fetchReviews } from '@/lib/api';

type SortBy = 'newest' | 'oldest' | 'highest' | 'lowest';

interface ListingOption {
  listingId: string;
  listingName: string;
}

interface Filters {
  listingId: string;
  channel: string;
  from: string;
  to: string;
  minRating: string;
  maxRating: string;
  sortBy: SortBy;
}

const DEFAULT_FILTERS: Filters = {
  listingId: '',
  channel: '',
  from: '',
  to: '',
  minRating: '',
  maxRating: '',
  sortBy: 'newest',
};

export function DashboardClient() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [listingOptions, setListingOptions] = useState<ListingOption[]>([]);

  useEffect(() => {
    const loadListings = async () => {
      try {
        const data = await fetchReviews();
        setListingOptions(data.listings.map((l) => ({ listingId: l.listingId, listingName: l.listingName })));
      } catch {
        setListingOptions([]);
      }
    };

    loadListings();
  }, []);

  const query = useMemo(() => {
    return {
      listingId: filters.listingId || undefined,
      channel: filters.channel || undefined,
      from: filters.from || undefined,
      to: filters.to || undefined,
      minRating: filters.minRating || undefined,
      maxRating: filters.maxRating || undefined,
      sortBy: filters.sortBy || undefined,
    };
  }, [filters]);

  return (
    <div className="space-y-8">
      <section className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Listing</label>
            <select
              value={filters.listingId}
              onChange={(e) => setFilters((p) => ({ ...p, listingId: e.target.value }))}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">All</option>
              {listingOptions.map((l) => (
                <option key={l.listingId} value={l.listingId}>
                  {l.listingName}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Channel</label>
            <select
              value={filters.channel}
              onChange={(e) => setFilters((p) => ({ ...p, channel: e.target.value }))}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">All</option>
              <option value="Airbnb">Airbnb</option>
              <option value="Booking.com">Booking.com</option>
              <option value="Google">Google</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">From</label>
            <input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters((p) => ({ ...p, from: e.target.value }))}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">To</label>
            <input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters((p) => ({ ...p, to: e.target.value }))}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Rating</label>
            <div className="flex gap-2">
              <input
                inputMode="decimal"
                placeholder="Min"
                value={filters.minRating}
                onChange={(e) => setFilters((p) => ({ ...p, minRating: e.target.value }))}
                className="w-1/2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              />
              <input
                inputMode="decimal"
                placeholder="Max"
                value={filters.maxRating}
                onChange={(e) => setFilters((p) => ({ ...p, maxRating: e.target.value }))}
                className="w-1/2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Sort</label>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters((p) => ({ ...p, sortBy: e.target.value as SortBy }))}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="highest">Highest rating</option>
              <option value="lowest">Lowest rating</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={() => setFilters(DEFAULT_FILTERS)}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Reset
          </button>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Listing Overview</h2>
        <ListingCards query={query} />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Reviews</h2>
        <ReviewsTable query={query} />
      </section>
    </div>
  );
}
