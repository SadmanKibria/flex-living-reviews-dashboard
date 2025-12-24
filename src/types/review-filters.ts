import { NormalizedReview } from '@/app/api/reviews/hostaway/types';

export type Channel = 'Airbnb' | 'Booking.com' | 'Google' | 'Unknown';

export type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest';

export interface FilterState {
  listingId: string | null;
  channels: Channel[];
  minRating: number | null;
  maxRating: number | null;
  includeUnrated: boolean;
  startDate: string | null;
  endDate: string | null;
  category: string | null;
  minCategoryRating: number | null;
  sortBy: SortOption;
}

export const DEFAULT_FILTERS: FilterState = {
  listingId: null,
  channels: [],
  minRating: null,
  maxRating: null,
  includeUnrated: true,
  startDate: null,
  endDate: null,
  category: null,
  minCategoryRating: null,
  sortBy: 'newest'
};

export function applyFilters(reviews: NormalizedReview[], filters: FilterState): NormalizedReview[] {
  return reviews.filter(review => {
    // Filter by listing
    if (filters.listingId && review.listingId !== filters.listingId) {
      return false;
    }

    // Filter by channel
    if (filters.channels.length > 0 && !filters.channels.includes(review.channel as Channel)) {
      return false;
    }

    // Filter by rating
    if (review.overallRating !== null) {
      if (filters.minRating !== null && review.overallRating < filters.minRating) {
        return false;
      }
      if (filters.maxRating !== null && review.overallRating > filters.maxRating) {
        return false;
      }
    } else if (!filters.includeUnrated) {
      return false;
    }

    // Filter by date range
    const reviewDate = new Date(review.submittedAt);
    if (filters.startDate && reviewDate < new Date(filters.startDate)) {
      return false;
    }
    if (filters.endDate && reviewDate > new Date(filters.endDate)) {
      return false;
    }

    // Filter by category
    if (filters.category) {
      const categoryEntry = (review.categories ?? []).find((c) => c.category === filters.category);
      if (!categoryEntry) {
        return false;
      }
      if (filters.minCategoryRating !== null && categoryEntry.rating < filters.minCategoryRating) {
        return false;
      }
    }

    return true;
  });
}

export function applySort(reviews: NormalizedReview[], sortBy: SortOption): NormalizedReview[] {
  return [...reviews].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      case 'oldest':
        return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
      case 'highest':
        return (b.overallRating ?? 0) - (a.overallRating ?? 0);
      case 'lowest':
        return (a.overallRating ?? 5) - (b.overallRating ?? 5);
      default:
        return 0;
    }
  });
}

export function getAvailableCategories(reviews: NormalizedReview[]): string[] {
  const categories = new Set<string>();
  reviews.forEach(review => {
    if (review.categories) {
      review.categories.forEach((c) => categories.add(c.category));
    }
  });
  return Array.from(categories).sort();
}

export function getAvailableListings(reviews: NormalizedReview[]) {
  const listings = new Map<string, string>();
  reviews.forEach(review => {
    if (!listings.has(review.listingId)) {
      listings.set(review.listingId, review.listingName);
    }
  });
  return Array.from(listings.entries()).map(([id, name]) => ({
    id,
    name
  }));
}
