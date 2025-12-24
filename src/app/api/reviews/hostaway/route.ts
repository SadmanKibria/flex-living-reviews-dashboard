import { NextResponse } from 'next/server';

import { readFile } from 'node:fs/promises';
import path from 'node:path';

import type { ApiResponse, ListingSummary, NormalizedReview, RawReview } from './types';

export async function GET() {
  // TODO: Implement Hostaway API integration

  try {
    const url = new URL(process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api/reviews/hostaway` : 'http://localhost/api/reviews/hostaway');

    const searchParams = new URLSearchParams(url.search);
    const listingId = searchParams.get('listingId');
    const channel = searchParams.get('channel');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const minRating = searchParams.get('minRating');
    const maxRating = searchParams.get('maxRating');

    const raw = await loadMockHostawayReviews();
    const normalized = normalizeHostawayReviews(raw);

    const filtered = normalized.filter((r) => {
      if (listingId && r.listingId !== listingId) return false;
      if (channel && r.channel.toLowerCase() !== channel.toLowerCase()) return false;

      if (from) {
        const fromDate = new Date(from);
        if (!Number.isNaN(fromDate.getTime())) {
          const rDate = new Date(r.submittedAt);
          if (rDate < fromDate) return false;
        }
      }

      if (to) {
        const toDate = new Date(to);
        if (!Number.isNaN(toDate.getTime())) {
          const rDate = new Date(r.submittedAt);
          if (rDate > toDate) return false;
        }
      }

      if (minRating && r.overallRating !== null) {
        const min = Number(minRating);
        if (!Number.isNaN(min) && r.overallRating < min) return false;
      }

      if (maxRating && r.overallRating !== null) {
        const max = Number(maxRating);
        if (!Number.isNaN(max) && r.overallRating > max) return false;
      }

      return true;
    });

    const listings = buildListingSummaries(filtered);
    const payload: ApiResponse = {
      reviews: filtered.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()),
      listings,
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        reviews: [],
        listings: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  // TODO: Implement review submission
  return NextResponse.json(
    { message: 'Review submitted successfully' },
    { status: 201 }
  );
}

async function loadMockHostawayReviews(): Promise<unknown> {
  const filePath = path.join(process.cwd(), 'src', 'data', 'hostaway-reviews.mock.json');
  const raw = await readFile(filePath, 'utf8');
  const withoutLeadingBlockComment = raw.replace(/^\s*\/\*\*[\s\S]*?\*\/\s*/m, '');
  return JSON.parse(withoutLeadingBlockComment);
}

function normalizeHostawayReviews(payload: unknown): NormalizedReview[] {
  if (!payload || typeof payload !== 'object') return [];

  const p = payload as any;

  if (Array.isArray(p?.data)) {
    const rawReviews = p.data as RawReview[];
    return rawReviews.map(normalizeRawReview).filter(Boolean) as NormalizedReview[];
  }

  if (Array.isArray(p?.result)) {
    return (p.result as any[]).map(normalizeHostawayExampleReview).filter(Boolean) as NormalizedReview[];
  }

  return [];
}

function normalizeRawReview(r: RawReview): NormalizedReview | null {
  const categories: { category: string; rating: number }[] = [];
  if (r.categoryRatings) {
    for (const [category, rating] of Object.entries(r.categoryRatings)) {
      if (typeof rating !== 'number') continue;
      categories.push({ category, rating: toFiveStarScale(rating) });
    }
  }

  return {
    id: r.id,
    listingId: r.listingId,
    listingName: r.listingName,
    channel: r.channel,
    overallRating: r.rating === null ? null : toFiveStarScale(r.rating),
    categories: categories.sort((a, b) => a.category.localeCompare(b.category)),
    publicReview: r.reviewText,
    submittedAt: r.submittedAt,
  };
}

function normalizeHostawayExampleReview(r: any): NormalizedReview | null {
  const categories: { category: string; rating: number }[] = [];
  const rc = r?.reviewCategory;
  if (Array.isArray(rc)) {
    for (const item of rc) {
      if (!item || typeof item !== 'object') continue;
      const category = String(item.category ?? '');
      const rating = Number(item.rating);
      if (!category || Number.isNaN(rating)) continue;
      categories.push({ category, rating: toFiveStarScale(rating) });
    }
  }

  const listingName = String(r?.listingName ?? '');
  const listingId = listingName ? stableListingIdFromName(listingName) : '';

  return {
    id: r?.id ?? '',
    listingId,
    listingName,
    channel: inferChannelFromReviewType(r?.type),
    overallRating: r?.rating === null || r?.rating === undefined ? null : toFiveStarScale(Number(r.rating)),
    categories: categories.sort((a, b) => a.category.localeCompare(b.category)),
    publicReview: String(r?.publicReview ?? ''),
    submittedAt: String(r?.submittedAt ?? ''),
  };
}

function toFiveStarScale(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value <= 5) return clamp(value, 0, 5);
  return clamp(value / 2, 0, 5);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function buildListingSummaries(reviews: NormalizedReview[]): ListingSummary[] {
  const byListing = new Map<string, { listingName: string; reviews: NormalizedReview[] }>();
  for (const r of reviews) {
    const entry = byListing.get(r.listingId);
    if (entry) {
      entry.reviews.push(r);
    } else {
      byListing.set(r.listingId, { listingName: r.listingName, reviews: [r] });
    }
  }

  const summaries: ListingSummary[] = [];
  for (const [listingId, group] of byListing.entries()) {
    const ratingValues = group.reviews.map((r) => r.overallRating).filter((v): v is number => typeof v === 'number');
    const averageRating = ratingValues.length ? ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length : null;

    const categoryBuckets: Record<string, number[]> = {};
    for (const r of group.reviews) {
      for (const c of r.categories) {
        if (!categoryBuckets[c.category]) categoryBuckets[c.category] = [];
        categoryBuckets[c.category].push(c.rating);
      }
    }

    const categoryAverages: Record<string, number> = {};
    for (const [category, values] of Object.entries(categoryBuckets)) {
      if (!values.length) continue;
      categoryAverages[category] = values.reduce((a, b) => a + b, 0) / values.length;
    }

    summaries.push({
      listingId,
      listingName: group.listingName,
      averageRating,
      reviewCount: group.reviews.length,
      categoryAverages,
    });
  }

  summaries.sort((a, b) => {
    const aRating = a.averageRating ?? -1;
    const bRating = b.averageRating ?? -1;
    if (bRating !== aRating) return bRating - aRating;
    return b.reviewCount - a.reviewCount;
  });

  return summaries;
}

function stableListingIdFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function inferChannelFromReviewType(type: unknown): string {
  if (typeof type !== 'string') return 'Hostaway';
  if (type.includes('airbnb')) return 'Airbnb';
  if (type.includes('booking')) return 'Booking.com';
  return 'Hostaway';
}
