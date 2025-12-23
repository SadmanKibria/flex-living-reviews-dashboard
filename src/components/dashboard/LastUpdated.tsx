'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

export function LastUpdated() {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 60000);

    setLastUpdated(new Date());
    return () => clearInterval(interval);
  }, []);

  if (!lastUpdated) return null;

  return (
    <div className="text-sm text-gray-500">
      Last updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
    </div>
  );
}