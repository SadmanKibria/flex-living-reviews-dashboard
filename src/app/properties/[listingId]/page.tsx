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

export default async function PropertyPage({ params }: PropertyPageProps) {
  const { listingId } = params;
  const baseUrl = await getBaseUrl();

  const [hostaway, approved] = await Promise.all([
    fetchJson<ApiResponse>(`${baseUrl}/api/reviews/hostaway?listingId=${encodeURIComponent(listingId)}`),
    fetchJson<{ approvedReviewIds: string[] }>(`${baseUrl}/api/reviews/approved?listingId=${encodeURIComponent(listingId)}`),
  ]);

  const allReviews = hostaway.reviews ?? [];
  const listingName = allReviews[0]?.listingName || `Property #${listingId}`;
  const insights = buildInsights(allReviews);

  return (
    <div className="bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="overflow-hidden rounded-2xl bg-white shadow">
          <div className="relative">
            <div className="h-56 sm:h-72 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-500" />
            <div className="absolute inset-x-0 bottom-0 px-6 pb-6">
              <div className="backdrop-blur-sm bg-white/80 rounded-xl p-4">
                <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">{listingName}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1">Central location</span>
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1">Self check-in</span>
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1">Fast Wi‑Fi</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6">
            <div className="lg:col-span-8 space-y-8">
              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-gray-900">About this space</h2>
                <p className="text-gray-700">
                  A modern Flex Living apartment with thoughtful amenities and an easy check-in experience. This page
                  shows manager-approved guest reviews and a lightweight performance snapshot.
                </p>
              </section>

              <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <QuickFact label="Guests" value="4" />
                <QuickFact label="Bedrooms" value="2" />
                <QuickFact label="Bathrooms" value="1" />
                <QuickFact label="Area" value="62 m²" />
              </section>

              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Insights</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <InsightCard title="Avg. rating" value={insights.averageRatingLabel} subtitle={`${insights.reviewCount} reviews`} />
                  <InsightCard title="Last 30 days" value={insights.last30Label} subtitle={insights.deltaLabel} />
                  <InsightCard title="Recurring theme" value={insights.weakestCategoryLabel} subtitle={insights.weakestCategorySubLabel} />
                </div>
                {insights.trendNote ? <p className="text-sm text-gray-500">{insights.trendNote}</p> : null}
              </section>

              <section>
                <PropertyReviews listingId={listingId} approvedReviewIds={approved.approvedReviewIds ?? []} allReviews={allReviews} />
              </section>
            </div>

            <aside className="lg:col-span-4">
              <div className="lg:sticky lg:top-6 space-y-4">
                <div className="rounded-xl border border-gray-200 bg-white p-5">
                  <div className="flex items-baseline justify-between">
                    <div className="text-2xl font-semibold text-gray-900">£185</div>
                    <div className="text-sm text-gray-500">per night</div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-xs font-medium text-gray-600">Check-in</div>
                      <div className="mt-1 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900">Anytime</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-600">Check-out</div>
                      <div className="mt-1 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900">11:00</div>
                    </div>
                  </div>
                  <button className="mt-4 w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                    Request to book
                  </button>
                  <button className="mt-2 w-full rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Contact host
                  </button>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5">
                  <div className="text-sm font-semibold text-gray-900">Manager tools</div>
                  <div className="mt-2 text-sm text-gray-600">Approve reviews on the dashboard to show them here.</div>
                  <a href="/dashboard" className="mt-3 inline-flex text-sm font-medium text-indigo-600 hover:text-indigo-800">
                    Open dashboard
                  </a>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

async function PropertyReviews({
  listingId,
  approvedReviewIds,
  allReviews,
}: {
  listingId: string;
  approvedReviewIds: string[];
  allReviews: NormalizedReview[];
}) {
  const approvedSet = new Set((approvedReviewIds ?? []).map(String));
  if (!approvedSet.size) {
    return <p className="text-gray-600">No reviews have been selected for display yet.</p>;
  }

  const reviews = (allReviews ?? []).filter((r) => approvedSet.has(String(r.id)));

  if (!reviews.length) {
    return <p className="text-gray-600">No approved reviews found for this property.</p>;
  }

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

function QuickFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
      <div className="text-xs font-medium text-gray-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-gray-900">{value}</div>
    </div>
  );
}

function InsightCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="text-xs font-medium text-gray-500">{title}</div>
      <div className="mt-2 text-2xl font-semibold text-gray-900">{value}</div>
      <div className="mt-1 text-sm text-gray-600">{subtitle}</div>
    </div>
  );
}

function buildInsights(reviews: NormalizedReview[]): {
  reviewCount: number;
  averageRatingLabel: string;
  last30Label: string;
  deltaLabel: string;
  weakestCategoryLabel: string;
  weakestCategorySubLabel: string;
  trendNote: string;
} {
  const reviewCount = reviews.length;
  const rated = reviews.map((r) => r.overallRating).filter((v): v is number => typeof v === 'number');
  const avg = rated.length ? rated.reduce((a, b) => a + b, 0) / rated.length : null;

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const last30Start = now - 30 * dayMs;
  const prev30Start = now - 60 * dayMs;

  const last30 = reviews.filter((r) => new Date(r.submittedAt).getTime() >= last30Start);
  const prev30 = reviews.filter((r) => {
    const t = new Date(r.submittedAt).getTime();
    return t >= prev30Start && t < last30Start;
  });

  const last30Rated = last30.map((r) => r.overallRating).filter((v): v is number => typeof v === 'number');
  const prev30Rated = prev30.map((r) => r.overallRating).filter((v): v is number => typeof v === 'number');
  const last30Avg = last30Rated.length ? last30Rated.reduce((a, b) => a + b, 0) / last30Rated.length : null;
  const prev30Avg = prev30Rated.length ? prev30Rated.reduce((a, b) => a + b, 0) / prev30Rated.length : null;

  const delta = last30Avg !== null && prev30Avg !== null ? last30Avg - prev30Avg : null;

  const catBuckets: Record<string, number[]> = {};
  for (const r of reviews) {
    for (const c of r.categories ?? []) {
      if (!catBuckets[c.category]) catBuckets[c.category] = [];
      catBuckets[c.category].push(c.rating);
    }
  }

  let weakestCategory: { category: string; avg: number; count: number } | null = null;
  for (const [category, values] of Object.entries(catBuckets)) {
    if (!values.length) continue;
    const a = values.reduce((x, y) => x + y, 0) / values.length;
    if (!weakestCategory || a < weakestCategory.avg) {
      weakestCategory = { category, avg: a, count: values.length };
    }
  }

  const averageRatingLabel = avg === null ? 'N/A' : avg.toFixed(1);
  const last30Label = last30Avg === null ? 'N/A' : last30Avg.toFixed(1);
  const deltaLabel =
    delta === null
      ? 'Not enough data'
      : `${delta >= 0 ? '+' : ''}${delta.toFixed(1)} vs prior 30d`;

  const weakestCategoryLabel = weakestCategory ? toTitleCase(weakestCategory.category) : 'N/A';
  const weakestCategorySubLabel = weakestCategory
    ? `${weakestCategory.avg.toFixed(1)} avg (${weakestCategory.count} ratings)`
    : 'No category data';

  const trendNote =
    last30.length === 0
      ? 'No reviews in the last 30 days.'
      : prev30.length === 0
        ? 'Not enough prior reviews to calculate a 30-day comparison.'
        : '';

  return {
    reviewCount,
    averageRatingLabel,
    last30Label,
    deltaLabel,
    weakestCategoryLabel,
    weakestCategorySubLabel,
    trendNote,
  };
}

function toTitleCase(input: string): string {
  return input
    .replace(/_/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}