'use client';

import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import VideoCard from '@/components/video/VideoCard';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/providers/AuthProvider';

interface Video {
  _id: string;
  title: string;
  description: string;
  duration: number;
  owner: {
    _id: string;
    username: string;
  };
  videoURL: string;
  thumbnail?: string;
  likes: number;
  reviews: number;
  views?: number;
  createdAt: string;
}

interface User {
  _id: string;
  username: string;
  email: string;
  avatarKey?: string;
  createdAt: string;
}

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [likedVideos, setLikedVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'videos' | 'liked' | 'settings'>('videos');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

  useEffect(() => {
    fetchUserData();
  }, []);

  // Refetch liked videos when switching to liked tab
  useEffect(() => {
    if (activeTab === 'liked' && user) {
      fetchLikedVideos();
    }
  }, [activeTab, user]);

  const fetchLikedVideos = async () => {
    try {
      const token = Cookies.get('token');
      if (!token) return;

      const likedResponse = await axios.get(`${API_URL}/videos/liked`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Liked videos response:', likedResponse.data);
      
      // The backend returns { success: true, data: videos }
      const likedData = likedResponse.data.data || [];
      console.log('Liked videos data:', likedData);
      setLikedVideos(likedData);
    } catch (err: any) {
      console.error('Failed to fetch liked videos:', err);
    }
  };

  const handleLogout = () => {
    Cookies.remove('token');
    router.push('/auth/login');
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    setUploadingPhoto(true);

    try {
      const token = Cookies.get('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const formData = new FormData();
      formData.append('avatar', file);

      console.log('Uploading photo to:', `${API_URL}/users/upload-avatar`);
      console.log('Token:', token.substring(0, 20) + '...');

      const response = await axios.post(`${API_URL}/users/upload-avatar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      console.log('Upload response:', response.data);

      // Update user state with new avatar globally
      if (user && response.data.data.avatarKey) {
        const updatedUser = { ...user, avatarKey: response.data.data.avatarKey };
        updateUser(updatedUser);
      }
      
      alert('Profile photo updated successfully!');
    } catch (error: any) {
      console.error('Failed to upload photo:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to upload photo';
      alert(`Upload failed: ${errorMessage}`);
    } finally {
      setUploadingPhoto(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleChangePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const fetchUserData = async () => {
    try {
      const token = Cookies.get('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      console.log('Fetching user profile...');
      
      // Fetch user profile
      const userResponse = await axios.get(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('User response:', userResponse.data);

      // Fetch user's videos
      const videosResponse = await axios.get(`${API_URL}/videos/user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Videos response:', videosResponse.data);

      // Fetch liked videos
      const likedResponse = await axios.get(`${API_URL}/videos/liked`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Liked videos response:', likedResponse.data);
      
      let likedData = [];
      if (likedResponse.data.data && Array.isArray(likedResponse.data.data)) {
        likedData = likedResponse.data.data;
      }
      console.log('Setting liked videos:', likedData);
      setLikedVideos(likedData);
      
      // Handle different response formats
      let videosData = [];
      if (videosResponse.data.data && Array.isArray(videosResponse.data.data)) {
        videosData = videosResponse.data.data;
      } else if (videosResponse.data && Array.isArray(videosResponse.data)) {
        videosData = videosResponse.data;
      }
      
      setVideos(videosData);
    } catch (err: any) {
      console.error('Profile fetch error:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to fetch profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm('Are you sure you want to delete this video?')) {
      return;
    }

    try {
      const token = Cookies.get('token');
      await axios.delete(`${API_URL}/videos/${videoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Remove video from state
      setVideos(videos.filter(video => video._id !== videoId));
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to delete video');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Show profile even if there's an error, just show the error message
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {error && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      )}
      
      {user ? (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Profile Header */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
              {/* Profile Avatar */}
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden shadow-lg">
                  {user.avatarKey ? (
                    <img 
                      src={`http://localhost:5000/uploads/avatars/${user.avatarKey}`}
                      alt={user.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-500 via-purple-600 to-pink-500 flex items-center justify-center">
                      <span className="text-4xl font-bold text-white">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="absolute bottom-0 right-0 w-8 h-8 bg-green-500 rounded-full border-4 border-white"></div>
              </div>
              
              {/* User Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{user.username}</h1>
                <p className="text-gray-600 mb-3">{user.email}</p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Member since {new Date(user.createdAt || '').toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Active</span>
                  </div>
                </div>
              </div>
              
              {/* Stats */}
              <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-1">{videos.length}</div>
                  <div className="text-sm text-gray-500 font-medium">Videos</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {videos.reduce((sum, video) => sum + (video.likes || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-500 font-medium">Total Likes</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {videos.reduce((sum, video) => sum + (video.views || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-500 font-medium">Total Views</div>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="mt-8 flex flex-wrap gap-3 justify-center md:justify-start">
              <button
                onClick={handleLogout}
                className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
              <button className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Edit Profile
              </button>
              <button 
                onClick={handleChangePhotoClick}
                disabled={uploadingPhoto}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {uploadingPhoto ? 'Uploading...' : 'Change Photo'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <button className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Upload Video
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <p className="text-gray-500">Loading profile...</p>
          </div>
        </div>
      )}

      {user && (
      <>
      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('videos')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'videos'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Videos
              </button>
              <button
                onClick={() => setActiveTab('liked')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'liked'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Liked Videos
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'settings'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Settings
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'videos' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">My Videos</h2>
              <button
                onClick={() => router.push('/upload')}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Upload New Video
              </button>
            </div>

            {videos.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <div className="text-6xl mb-4">📹</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No videos yet</h3>
                <p className="text-gray-600 mb-6">Upload your first video to get started!</p>
                <button
                  onClick={() => router.push('/upload')}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Upload Video
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {videos.map((video) => (
                  <div key={video._id} className="relative group">
                    <VideoCard video={video} />
                    <button
                      onClick={() => handleDeleteVideo(video._id)}
                      className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'liked' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Liked Videos</h2>
              <span className="text-sm text-gray-500">
                {likedVideos.length} {likedVideos.length === 1 ? 'video' : 'videos'}
              </span>
            </div>
            
            {/* Always show the grid, even if empty */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {likedVideos.length > 0 ? (
                likedVideos.map((video, index) => (
                  <VideoCard key={video._id || index} video={video} />
                ))
              ) : (
                <div className="col-span-full bg-white rounded-lg shadow-sm p-12 text-center">
                  <div className="text-6xl mb-4">🤍</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No liked videos yet</h3>
                  <p className="text-gray-600 mb-6">
                    Start exploring and like videos you enjoy!
                  </p>
                  <button
                    onClick={() => router.push('/discover')}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Discover Videos
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Account Settings</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <input
                  type="text"
                  value={user.username}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
              <div className="pt-4">
                <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      </>
      )}
    </div>
  );
}
