// src/lib/api.ts
import { ApiResponse } from '../app/api/reviews/hostaway/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

function withBase(path: string): string {
  if (!API_BASE_URL) return path;
  return `${API_BASE_URL}${path}`;
}

export async function fetchReviews(query?: {
  listingId?: string;
  channel?: string;
  from?: string;
  to?: string;
  minRating?: string;
  maxRating?: string;
  sortBy?: string;
}): Promise<ApiResponse> {
  const qs = new URLSearchParams();
  if (query?.listingId) qs.set('listingId', query.listingId);
  if (query?.channel) qs.set('channel', query.channel);
  if (query?.from) qs.set('from', query.from);
  if (query?.to) qs.set('to', query.to);
  if (query?.minRating) qs.set('minRating', query.minRating);
  if (query?.maxRating) qs.set('maxRating', query.maxRating);
  if (query?.sortBy) qs.set('sortBy', query.sortBy);

  const path = qs.toString() ? `/api/reviews/hostaway?${qs.toString()}` : '/api/reviews/hostaway';

  const response = await fetch(withBase(path), { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Failed to fetch reviews');
  }
  return response.json();
}

export async function fetchApprovedReviewIds(listingId?: string): Promise<string[]> {
  if (!listingId) return [];
  const qs = `?listingId=${encodeURIComponent(listingId)}`;
  const response = await fetch(withBase(`/api/reviews/approved${qs}`), {
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch approved reviews');
  }
  const data = (await response.json()) as { approvedReviewIds: string[] };
  return data.approvedReviewIds ?? [];
}

export async function setReviewApproved(input: {
  reviewId: string;
  listingId: string;
  approved: boolean;
}): Promise<{ approved: boolean }> {
  const response = await fetch(withBase('/api/reviews/approved'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error('Failed to update approval');
  }

  const data = (await response.json()) as { approved: boolean };
  return { approved: Boolean(data.approved) };
}