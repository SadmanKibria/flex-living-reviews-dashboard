export interface RawReview {
  id: string;
  listingId: string;
  listingName: string;
  channel: string;
  channelId: string;
  guestName?: string;
  guestImage?: string;
  rating: number | null;
  reviewText: string;
  submittedAt: string;
  categoryRatings: {
    cleanliness?: number;
    communication?: number;
    checkIn?: number;
    accuracy?: number;
    location?: number;
    value?: number;
    [key: string]: number | undefined;
  } | null;
  response?: {
    text: string;
    submittedAt: string;
  } | null;
}

export interface RawApiResponse {
  status: number;
  message: string;
  pagination: {
    page: number;
    itemsPerPage: number;
    totalCount: number;
    totalPages: number;
  };
  data: RawReview[];
}

export interface NormalizedReview {
  id: string | number;
  listingId: string;
  listingName: string;
  channel: string;
  overallRating: number | null;
  categories: {
    category: string;
    rating: number;
  }[];
  publicReview: string;
  submittedAt: string;
}

export interface ListingSummary {
  listingId: string;
  listingName: string;
  averageRating: number | null;
  reviewCount: number;
  categoryAverages: Record<string, number>;
}

export interface ApiResponse {
  reviews: NormalizedReview[];
  listings: ListingSummary[];
}
