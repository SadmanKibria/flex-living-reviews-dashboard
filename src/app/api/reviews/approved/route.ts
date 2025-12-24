import { NextResponse } from 'next/server';

import { getApprovedReviewIds, setReviewApproved } from '@/lib/approvedReviewsStore';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const listingId = url.searchParams.get('listingId') ?? undefined;

  const approvedReviewIds = await getApprovedReviewIds(listingId);

  return NextResponse.json(
    {
      approvedReviewIds,
    },
    { status: 200 }
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      reviewId?: string;
      listingId?: string;
      approved?: boolean;
    };

    const reviewId = body.reviewId;
    const listingId = body.listingId;
    const approved = Boolean(body.approved);

    if (!reviewId || !listingId) {
      return NextResponse.json(
        {
          error: 'reviewId and listingId are required',
        },
        { status: 400 }
      );
    }

    const result = await setReviewApproved({
      reviewId,
      listingId,
      approved,
    });

    return NextResponse.json(
      {
        reviewId,
        listingId,
        approved: result.approved,
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
