'use client';

import React, { useState, useEffect } from 'react';
import { XMarkIcon, ChatBubbleLeftIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

interface NotificationData {
  likerUsername?: string;
  commenterUsername?: string;
  videoTitle?: string;
  videoId?: string;
  amount?: number;
  message?: string;
  timestamp?: string;
}

interface NotificationToastProps {
  type: 'like' | 'comment' | 'tip';
  data: NotificationData;
  onClose: () => void;
}

/**
 * A glassmorphism-styled toast notification that slides in from the right.
 * Auto-dismisses after 5 seconds. Supports stacking via NotificationContainer.
 */
export default function NotificationToast({ type, data, onClose }: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    
    // Auto-dismiss after 5 seconds
    const dismissTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 5000);

    return () => {
      clearTimeout(timer);
      clearTimeout(dismissTimer);
    };
  }, [onClose]);

  const getIcon = () => {
    switch (type) {
      case 'like':
        return <HeartSolidIcon className="w-5 h-5 text-red-400" />;
      case 'comment':
        return <ChatBubbleLeftIcon className="w-5 h-5 text-blue-400" />;
      case 'tip':
        return <CurrencyDollarIcon className="w-5 h-5 text-green-400" />;
      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'like':
        return `❤️ ${data.likerUsername} liked your video`;
      case 'comment':
        return `💬 ${data.commenterUsername} commented on your video`;
      case 'tip':
        return `💸 You received a $${data.amount} tip!`;
      default:
        return 'Notification';
    }
  };

  const getSubtitle = () => {
    if (data.videoTitle) {
      return `"${data.videoTitle.length > 30 
        ? data.videoTitle.substring(0, 30) + '...' 
        : data.videoTitle}"`;
    }
    if (type === 'tip' && data.message) {
      return data.message.length > 30 
        ? data.message.substring(0, 30) + '...' 
        : data.message;
    }
    return '';
  };

  const getActionText = () => {
    switch (type) {
      case 'like':
        return 'View Video';
      case 'comment':
        return 'View Comment';
      case 'tip':
        return 'View Earnings';
      default:
        return 'View';
    }
  };

  const handleAction = () => {
    if (data.videoId) {
      window.location.href = `/video/${data.videoId}`;
    } else if (type === 'tip') {
      window.location.href = '/earnings';
    }
    onClose();
  };

  return (
    <div
      className={`
        w-full max-w-sm
        transform transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      {/* Glassmorphism card */}
      <div className="backdrop-blur-md bg-white/20 border border-white/30 rounded-xl shadow-xl overflow-hidden">
        <div className="relative p-4">
          <div className="flex items-start">
            {/* Icon */}
            <div className="flex-shrink-0 mr-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
                {getIcon()}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">
                {getTitle()}
              </p>
              {getSubtitle() && (
                <p className="text-sm text-gray-600 mt-0.5">
                  {getSubtitle()}
                </p>
              )}
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-400">
                  {data.timestamp && new Date(data.timestamp).toLocaleTimeString()}
                </p>
                <button
                  onClick={handleAction}
                  className="text-xs text-purple-600 hover:text-purple-700 font-medium transition-colors"
                >
                  {getActionText()}
                </button>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(onClose, 300);
              }}
              className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Container component that manages stacking multiple toast notifications.
 * Listens for 'notification' CustomEvents dispatched by the SocketService.
 */
export function NotificationContainer() {
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'like' | 'comment' | 'tip';
    data: NotificationData;
  }>>([]);

  useEffect(() => {
    const handleNotification = (event: CustomEvent) => {
      const { type, data } = event.detail;
      const id = Date.now().toString();
      
      setNotifications(prev => [...prev, { id, type, data }]);
    };

    // Listen for custom notification events
    window.addEventListener('notification', handleNotification as EventListener);

    return () => {
      window.removeEventListener('notification', handleNotification as EventListener);
    };
  }, []);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3">
      {notifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          type={notification.type}
          data={notification.data}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
}
