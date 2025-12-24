'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

export function LastUpdated() {
  const [lastUpdated, setLastUpdated] = useState<Date>(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-sm text-gray-500">
      Last updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
    </div>
  );
}