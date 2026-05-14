'use client';

import React, { useState, useEffect } from 'react';

interface NotificationBadgeProps {
  /** Optional className override for the badge dot */
  className?: string;
}

/**
 * A red dot notification badge that appears when there are unseen notifications.
 * Listens for 'notification' CustomEvents dispatched by the SocketService.
 * Resets when the user navigates to the earnings/activity page.
 *
 * @param className - Optional CSS class override
 */
export default function NotificationBadge({ className }: NotificationBadgeProps) {
  const [unseenCount, setUnseenCount] = useState(0);

  useEffect(() => {
    /** Increment count on each notification event */
    const handleNotification = () => {
      setUnseenCount((prev) => prev + 1);
    };

    /** Clear count when the user visits the activity/earnings page */
    const handleClear = () => {
      setUnseenCount(0);
    };

    window.addEventListener('notification', handleNotification as EventListener);
    window.addEventListener('clear-notifications', handleClear);

    return () => {
      window.removeEventListener('notification', handleNotification as EventListener);
      window.removeEventListener('clear-notifications', handleClear);
    };
  }, []);

  if (unseenCount === 0) return null;

  return (
    <span
      className={
        className ||
        'absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse'
      }
      aria-label={`${unseenCount} unseen notification${unseenCount > 1 ? 's' : ''}`}
    />
  );
}
