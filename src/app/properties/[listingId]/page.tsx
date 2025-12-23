// src/app/properties/[listingId]/page.tsx
interface PropertyPageProps {
  params: {
    listingId: string;
  };
}

export default function PropertyPage({ params }: PropertyPageProps) {
  const { listingId } = params;

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Property #{listingId}
        </h2>
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-gray-600">
            Property details and reviews will be displayed here.
          </p>
        </div>
      </div>
    </div>
  );
}