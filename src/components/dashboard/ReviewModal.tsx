'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { Star } from 'lucide-react';
import { format } from 'date-fns';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: any; // You might want to create a proper type
}

export function ReviewModal({ isOpen, onClose, review }: ReviewModalProps) {
  if (!review) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  {review.listingName}
                  <div className="text-sm font-normal text-gray-500">
                    {review.channel} • {format(new Date(review.submittedAt), 'MMMM d, yyyy')}
                  </div>
                </Dialog.Title>

                <div className="mt-4">
                  <div className="flex items-center mb-4">
                    <div className="flex items-center">
                      <Star className="h-5 w-5 text-yellow-400 fill-current" />
                      <span className="ml-1 text-lg font-semibold">
                        {review.overallRating?.toFixed(1) || 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="prose max-w-none">
                    <p className="text-gray-700">{review.publicReview}</p>
                  </div>

                  {review.categories?.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">
                        Category Ratings
                      </h4>
                      <div className="space-y-2">
                        {review.categories.map((category: any) => (
                          <div key={category.category} className="flex items-center">
                            <span className="w-32 text-sm text-gray-500 capitalize">
                              {category.category}
                            </span>
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-indigo-600"
                                style={{ width: `${(category.rating / 5) * 100}%` }}
                              />
                            </div>
                            <span className="ml-2 text-sm font-medium w-8">
                              {category.rating.toFixed(1)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-900 hover:bg-indigo-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}