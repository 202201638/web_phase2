'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/providers/AuthProvider';
import NotificationBadge from '@/components/notifications/NotificationBadge';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg"></div>
            <span className="text-xl font-bold text-gray-900">ClipSphere</span>
          </Link>

          {/* Middle - Navigation Items */}
          <div className="hidden md:flex items-center gap-8">
            {user ? (
              <>
                <Link href="/discover" className="text-gray-600 hover:text-gray-900">
                  Discover
                </Link>
                <Link href="/trending" className="text-gray-600 hover:text-gray-900">
                  Trending
                </Link>
                <Link href="/following" className="text-gray-600 hover:text-gray-900">
                  Following
                </Link>
                {user.role === 'admin' && (
                  <Link href="/admin" className="text-gray-600 hover:text-gray-900 font-medium">
                    Admin
                  </Link>
                )}
                <Link
                  href="/upload"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Upload
                </Link>
              </>
            ) : (
              <>
                <Link href="/discover" className="text-gray-600 hover:text-gray-900">
                  Discover
                </Link>
                <Link href="/trending" className="text-gray-600 hover:text-gray-900">
                  Trending
                </Link>
                <Link href="/following" className="text-gray-600 hover:text-gray-900">
                  Following
                </Link>
              </>
            )}
          </div>

          {/* Right side - User Actions */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                {/* Notification bell with badge */}
                <Link href="/earnings" className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <NotificationBadge />
                </Link>

                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                  >
                    {user.avatarKey ? (
                      <img 
                        src={`http://localhost:5000/uploads/avatars/${user.avatarKey}`}
                        alt={user.username}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                    )}
                    <span>{user.username}</span>
                  </button>
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-gray-600 hover:bg-gray-100"
                    >
                      Profile
                    </Link>
                    <Link href="/earnings" className="block px-4 py-2 text-gray-600 hover:bg-gray-100">
                      💰 Earnings
                    </Link>
                    <Link href="/wallet" className="block px-4 py-2 text-gray-600 hover:bg-gray-100">
                      💳 Wallet
                    </Link>
                    <Link href="/settings" className="block px-4 py-2 text-gray-600 hover:bg-gray-100">
                      Settings
                    </Link>
                    {user.role === 'admin' && (
                      <Link href="/admin" className="block px-4 py-2 text-gray-600 hover:bg-gray-100">
                        Admin Dashboard
                      </Link>
                    )}
                    </div>
                  )}
                </div>
                <button
                  onClick={logout}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="text-gray-600 hover:text-gray-900">
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-gray-600 hover:text-gray-900"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {menuOpen && (
          <div className="md:hidden pb-4 border-t pt-4">
            {user ? (
              <>
                <Link href="/discover" className="block py-2 text-gray-600 hover:text-gray-900">
                  Discover
                </Link>
                <Link href="/trending" className="block py-2 text-gray-600 hover:text-gray-900">
                  Trending
                </Link>
                <Link href="/following" className="block py-2 text-gray-600 hover:text-gray-900">
                  Following
                </Link>
                <Link href="/earnings" className="block py-2 text-gray-600 hover:text-gray-900">
                  💰 Earnings
                </Link>
                <Link href="/wallet" className="block py-2 text-gray-600 hover:text-gray-900">
                  💳 Wallet
                </Link>
                {user.role === 'admin' && (
                  <Link href="/admin" className="block py-2 text-gray-600 hover:text-gray-900 font-medium">
                    Admin
                  </Link>
                )}
                <Link
                  href="/upload"
                  className="block py-2 px-4 bg-purple-600 text-white rounded-lg mt-2"
                >
                  Upload Video
                </Link>
                <button
                  onClick={logout}
                  className="w-full py-2 px-4 bg-red-600 text-white rounded-lg mt-2"
                >
                  Logout
                </button>
                <Link href={`/profile/${user.id}`} className="block py-2 text-gray-600">
                  Profile
                </Link>
                <Link href="/my-videos" className="block py-2 text-gray-600">
                  My Videos
                </Link>
                <Link href="/settings" className="block py-2 text-gray-600">
                  Settings
                </Link>
                {user.role === 'admin' && (
                  <Link href="/admin" className="block py-2 text-gray-600">
                    Admin Dashboard
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link href="/discover" className="block py-2 text-gray-600">
                  Discover
                </Link>
                <Link href="/auth/login" className="block py-2 text-gray-600">
                  Login
                </Link>
                <Link href="/auth/register" className="block py-2 px-4 bg-purple-600 text-white rounded-lg mt-2">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
