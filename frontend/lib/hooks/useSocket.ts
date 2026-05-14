'use client';

import { useEffect, useState } from 'react';
import socketService from '@/lib/socket';
import Cookies from 'js-cookie';

/**
 * React hook that wraps the existing SocketService singleton.
 * Manages connection lifecycle: connects on mount when authenticated,
 * disconnects on unmount.
 *
 * @returns {{ isConnected: boolean }} Socket connection state
 */
export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = Cookies.get('token');

    if (token && !socketService.isConnected()) {
      socketService.connect(token);
    }

    // Poll connection status since the socket events are handled
    // inside the SocketService class via CustomEvents
    const interval = setInterval(() => {
      setIsConnected(socketService.isConnected());
    }, 1000);

    // Initial check
    setIsConnected(socketService.isConnected());

    return () => {
      clearInterval(interval);
    };
  }, []);

  return { isConnected };
}
