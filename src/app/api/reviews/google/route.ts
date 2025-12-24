import { NextResponse } from 'next/server';

import type { NormalizedReview } from '../hostaway/types';

type GooglePlaceDetailsResponse = {
  id?: string;
  displayName?: { text?: string; languageCode?: string };
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  reviews?: Array<{
    name?: string;
    relativePublishTimeDescription?: string;
    rating?: number;
    text?: { text?: string; languageCode?: string };
    publishTime?: string;
    authorAttribution?: {
      displayName?: string;
      uri?: string;
      photoUri?: string;
    };
  }>;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const placeId = url.searchParams.get('placeId');
  const listingId = url.searchParams.get('listingId') ?? placeId;

  if (!placeId) {
    return NextResponse.json({ error: 'placeId is required' }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error: 'GOOGLE_MAPS_API_KEY is not set',
        hint: 'Set GOOGLE_MAPS_API_KEY in your environment and retry.',
      },
      { status: 400 }
    );
  }

  try {
    const googleRes = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'id,displayName,rating,userRatingCount,googleMapsUri,reviews',
      },
      cache: 'no-store',
    });

    if (!googleRes.ok) {
      const text = await googleRes.text();
      return NextResponse.json(
        {
          error: 'Failed to fetch Google Place Details',
          status: googleRes.status,
          body: text,
        },
        { status: 502 }
      );
    }

    const place = (await googleRes.json()) as GooglePlaceDetailsResponse;

    const listingName = place.displayName?.text ?? `Google Place ${placeId}`;
    const normalized: NormalizedReview[] = (place.reviews ?? []).map((r) => {
      const id = r.name ?? `${placeId}:${r.publishTime ?? ''}:${r.authorAttribution?.displayName ?? ''}`;
      const rating = typeof r.rating === 'number' ? clamp(r.rating, 0, 5) : null;
      const submittedAt = r.publishTime ?? new Date().toISOString();

      return {
        id,
        listingId: String(listingId ?? placeId),
        listingName,
        channel: 'Google',
        overallRating: rating,
        categories: [],
        publicReview: r.text?.text ?? '',
        submittedAt,
      };
    });

    return NextResponse.json(
      {
        placeId,
        listingId: String(listingId ?? placeId),
        listingName,
        placeRating: place.rating ?? null,
        userRatingCount: place.userRatingCount ?? null,
        googleMapsUri: place.googleMapsUri ?? null,
        reviews: normalized,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
