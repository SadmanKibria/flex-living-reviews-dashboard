// src/app/properties/[listingId]/page.tsx
import { headers } from 'next/headers';

import type { ApiResponse, NormalizedReview } from '@/app/api/reviews/hostaway/types';

interface PropertyPageProps {
  params: {
    listingId: string;
  };
}

async function getBaseUrl(): Promise<string> {
  const h = await headers();
  const host = h.get('host');
  const proto = h.get('x-forwarded-proto') ?? 'http';
  if (!host) return '';
  return `${proto}://${host}`;
}

async function fetchJson<T>(input: string): Promise<T> {
  const res = await fetch(input, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export default function PropertyPage({ params }: PropertyPageProps) {
  const { listingId } = params;

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Property #{listingId}
        </h2>
        <div className="bg-white shadow rounded-lg p-6">
          <PropertyReviews listingId={listingId} />
        </div>
      </div>
    </div>
  );
}

async function PropertyReviews({ listingId }: { listingId: string }) {
  const baseUrl = await getBaseUrl();
  const approved = await fetchJson<{ approvedReviewIds: string[] }>(
    `${baseUrl}/api/reviews/approved?listingId=${encodeURIComponent(listingId)}`
  );

  const approvedSet = new Set((approved.approvedReviewIds ?? []).map(String));
  if (!approvedSet.size) {
    return <p className="text-gray-600">No reviews have been selected for display yet.</p>;
  }

  const hostaway = await fetchJson<ApiResponse>(`${baseUrl}/api/reviews/hostaway?listingId=${encodeURIComponent(listingId)}`);
  const reviews = (hostaway.reviews ?? []).filter((r) => approvedSet.has(String(r.id)));

  if (!reviews.length) {
    return <p className="text-gray-600">No approved reviews found for this property.</p>;
  }

  const title = reviews[0]?.listingName || `Property #${listingId}`;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900">Guest reviews</h3>
        <p className="text-sm text-gray-500">Showing reviews selected by a manager for the public page.</p>
      </div>

      <div className="divide-y divide-gray-200 rounded-lg border border-gray-200">
        {reviews.map((review) => (
          <ReviewCard key={String(review.id)} review={review} />
        ))}
      </div>
    </div>
  );
}

function ReviewCard({ review }: { review: NormalizedReview }) {
  return (
    <div className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-gray-900">{review.channel}</div>
          <div className="text-xs text-gray-500">{new Date(review.submittedAt).toLocaleDateString()}</div>
        </div>
        <div className="text-sm font-semibold text-gray-900">
          {review.overallRating === null ? 'N/A' : review.overallRating.toFixed(1)}
          <span className="text-xs text-gray-500"> / 5</span>
        </div>
      </div>

      <p className="mt-3 text-gray-700">{review.publicReview}</p>

      {review.categories?.length ? (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {review.categories.map((c) => (
            <div key={c.category} className="rounded-md bg-gray-50 px-3 py-2">
              <div className="text-xs text-gray-500 capitalize">{c.category}</div>
              <div className="text-sm font-medium text-gray-900">{c.rating.toFixed(1)}</div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}