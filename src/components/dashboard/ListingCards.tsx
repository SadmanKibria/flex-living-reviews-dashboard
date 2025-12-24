// src/components/dashboard/ListingCards.tsx
'use client';

import { useState, useEffect } from 'react';
import { fetchReviews } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, ArrowUp, ArrowDown } from 'lucide-react';

import type { ListingSummary } from '@/app/api/reviews/hostaway/types';

export function ListingCards({
  query,
}: {
  query?: {
    listingId?: string;
    channel?: string;
    from?: string;
    to?: string;
    minRating?: string;
    maxRating?: string;
    sortBy?: string;
  };
}) {
  const [listings, setListings] = useState<ListingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadListings = async () => {
      try {
        const data = await fetchReviews(query);
        setListings(data.listings);
      } catch (err) {
        setError('Failed to load listings');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadListings();
  }, [query]);

  if (loading) {
    return <div className="h-40 bg-gray-100 rounded-lg animate-pulse" />;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!listings.length) {
    return <div className="text-gray-500">No listings found</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {listings.map((listing) => (
        <Card key={listing.listingId} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{listing.listingName}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-3">
              <Star className="h-5 w-5 text-yellow-400 fill-current" />
              <span className="text-lg font-semibold">
                {listing.averageRating ? listing.averageRating.toFixed(1) : 'N/A'}
              </span>
              <span className="text-sm text-gray-500">
                ({listing.reviewCount} {listing.reviewCount === 1 ? 'review' : 'reviews'})
              </span>
            </div>

            {listing.categoryAverages && Object.keys(listing.categoryAverages).length > 0 && (
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-green-600">
                  <ArrowUp className="h-4 w-4" />
                  {Object.entries(listing.categoryAverages)
                    .sort(([, a], [, b]) => Number(b ?? 0) - Number(a ?? 0))
                    .slice(0, 2)
                    .map(([category]) => (
                      <span key={category} className="capitalize bg-green-50 px-2 py-1 rounded">
                        {category}
                      </span>
                    ))}
                </div>
                {Object.keys(listing.categoryAverages).length > 2 && (
                  <div className="flex items-center gap-2 text-red-600">
                    <ArrowDown className="h-4 w-4" />
                    {Object.entries(listing.categoryAverages)
                      .sort(([, a], [, b]) => Number(a ?? 0) - Number(b ?? 0))
                      .slice(0, 1)
                      .map(([category]) => (
                        <span key={category} className="capitalize bg-red-50 px-2 py-1 rounded">
                          {category}
                        </span>
                      ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}