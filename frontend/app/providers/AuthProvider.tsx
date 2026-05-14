'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import apiClient, { authAPI } from '@/lib/services/api';
import Cookies from 'js-cookie';
import socketService from '@/lib/socket';

interface User {
  id: string;
  email: string;
  username: string;
  role: 'user' | 'admin';
  avatarKey?: string;
  createdAt?: string;
  notificationPreferences?: {
    email: boolean;
    inApp: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (token: string, userData: User) => void;
  logout: () => Promise<void>;
  updateUser: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = Cookies.get('token');
        console.log('AuthProvider: Token from cookies:', token ? 'exists' : 'not found');
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await apiClient.get('/users/me');
        console.log('AuthProvider: User fetched successfully:', response.data.data);

        setUser(response.data.data);
        
        // Connect to Socket.io when user is fetched
        socketService.connect(token);
      } catch (err) {
        console.error('AuthProvider: Failed to fetch user:', err);
        Cookies.remove('token');
        setError(err instanceof Error ? err.message : 'Failed to fetch user');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  /**
   * Login: clears any existing session first, then sets the new token and user.
   * This ensures account-switching works cleanly.
   */
  const login = (token: string, userData: User) => {
    console.log('AuthProvider: Login called with token:', token ? 'exists' : 'missing');
    // 1. Clear old session state
    socketService.disconnect();
    Cookies.remove('token');

    // 2. Set new session with browser-friendly cookie options
    Cookies.set('token', token, {
      expires: 7,
      path: '/',
      sameSite: 'lax',
      secure: false, // Set to true in production with HTTPS
    });
    console.log('AuthProvider: Token set in cookies');
    setUser(userData);
    setError(null);
    
    // 3. Connect to Socket.io with the new token
    socketService.connect(token);
  };

  /**
   * Logout: calls the backend to clear the server-side cookie, then
   * clears frontend state and disconnects the socket.
   */
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      // Server logout failed — still clear frontend state
      console.error('Server logout error:', err);
    }
    
    Cookies.remove('token');
    setUser(null);
    setError(null);
    
    // Disconnect from Socket.io
    socketService.disconnect();
    
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
  };

  const updateUser = (userData: User) => {
    setUser(userData);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isAuthenticated: !!user,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
