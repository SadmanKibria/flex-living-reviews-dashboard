// src/lib/api.ts
import { ApiResponse } from '../app/api/reviews/hostaway/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export async function fetchReviews(): Promise<ApiResponse> {
  const response = await fetch(`${API_BASE_URL}/api/reviews/hostaway`);
  if (!response.ok) {
    throw new Error('Failed to fetch reviews');
  }
  return response.json();
}