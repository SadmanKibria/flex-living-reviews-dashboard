// src/components/dashboard/ReviewsTable.tsx
'use client';

import { useState, useEffect } from 'react';
import { fetchApprovedReviewIds, fetchReviews, setReviewApproved } from '@/lib/api';
import { format } from 'date-fns';
import { Star } from 'lucide-react';
import { ReviewModal } from './ReviewModal';

export function ReviewsTable({
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
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReview, setSelectedReview] = useState<any | null>(null);
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    const loadReviews = async () => {
      setLoading(true);
      try {
        const [data, approved] = await Promise.all([
          fetchReviews(query),
          fetchApprovedReviewIds(query?.listingId),
        ]);
        setReviews(data.reviews);
        setApprovedIds(new Set(approved));
      } catch (err) {
        setError('Failed to load reviews');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, [query?.listingId, query?.channel, query?.from, query?.to, query?.minRating, query?.maxRating, query?.sortBy]);

  const toggleApproved = async (review: any) => {
    const reviewId = String(review.id);
    const listingId = String(review.listingId);
    const nextApproved = !approvedIds.has(reviewId);

    setSavingId(reviewId);
    try {
      await setReviewApproved({ reviewId, listingId, approved: nextApproved });
      setApprovedIds((prev) => {
        const next = new Set(prev);
        if (nextApproved) next.add(reviewId);
        else next.delete(reviewId);
        return next;
      });
    } catch (e) {
      console.error(e);
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!reviews.length) {
    return <div className="text-gray-500">No reviews found</div>;
  }

  return (
    <>
      <div className="overflow-x-auto">
        <div className="min-w-full divide-y divide-gray-200">
          <div className="bg-gray-50">
            <div className="grid grid-cols-12 gap-4 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="col-span-3">Listing</div>
              <div className="col-span-2">Channel</div>
              <div className="col-span-1">Rating</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-3">Review</div>
              <div className="col-span-1">Actions</div>
            </div>
          </div>
          <div className="bg-white divide-y divide-gray-200">
            {reviews.map((review) => (
              <div key={review.id} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50">
                <div className="col-span-3 text-sm font-medium text-gray-900">
                  {review.listingName}
                </div>
                <div className="col-span-2 text-sm text-gray-500">
                  {review.channel}
                </div>
                <div className="col-span-1">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="ml-1 text-sm text-gray-900">
                      {review.overallRating?.toFixed(1) || 'N/A'}
                    </span>
                  </div>
                </div>
                <div className="col-span-2 text-sm text-gray-500">
                  {format(new Date(review.submittedAt), 'MMM d, yyyy')}
                </div>
                <div className="col-span-3 text-sm text-gray-500 truncate">
                  {review.publicReview}
                </div>
                <div className="col-span-1 text-sm font-medium">
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setSelectedReview(review)}
                      className="text-indigo-600 hover:text-indigo-900 text-left"
                    >
                      View
                    </button>
                    <button
                      onClick={() => toggleApproved(review)}
                      disabled={savingId === String(review.id)}
                      className={
                        approvedIds.has(String(review.id))
                          ? 'text-green-700 hover:text-green-900 text-left'
                          : 'text-gray-500 hover:text-gray-700 text-left'
                      }
                    >
                      {approvedIds.has(String(review.id)) ? 'Approved' : 'Approve'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ReviewModal
        isOpen={!!selectedReview}
        onClose={() => setSelectedReview(null)}
        review={selectedReview}
      />
    </>
  );
}