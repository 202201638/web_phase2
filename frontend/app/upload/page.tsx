'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/services/api';
import { useAuth } from '@/app/providers/AuthProvider';
import Cookies from 'js-cookie';

export default function UploadPage() {
  const { user, isAuthenticated } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please log in to upload videos</p>
          <a href="/auth/login" className="text-purple-600 hover:underline">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Only accept MP4 files for maximum compatibility
      if (selectedFile.type !== 'video/mp4') {
        setError('Please select a valid MP4 video file');
        return;
      }
      
      // Check file extension
      const fileName = selectedFile.name.toLowerCase();
      if (!fileName.endsWith('.mp4')) {
        setError('Please select a file with .mp4 extension');
        return;
      }
      
      // Remove file size check for testing
      if (selectedFile.size > 500 * 1024 * 1024) {
        setError('File size must be less than 500MB');
        return;
      }
      
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim()) {
      setError('Please provide a title and select a video file');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('description', description);

      // Upload video with progress tracking
      const response = await apiClient.post('/videos', formData, {
        onUploadProgress: (progressEvent: any) => {
          const percent = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          setUploadProgress(percent);
        },
      });

      setSuccess(true);
      setFile(null);
      setTitle('');
      setDescription('');
      setUploadProgress(0);

      // Redirect after 2 seconds
      setTimeout(() => {
        window.location.href = `/video/${response.data.data._id}`;
      }, 2000);
    } catch (err: any) {
      console.error('Upload error details:', err);
      console.error('Error response:', err.response);
      console.error('Error status:', err.response?.status);
      console.error('Error data:', err.response?.data);
      console.error('Error message:', err.message);
      
      let message = 'Failed to upload video';
      
      if (err.response?.status === 401) {
        message = 'Authentication expired. Please log in again.';
      } else if (err.response?.data?.message) {
        message = err.response.data.message;
      } else if (err.message) {
        message = err.message;
      }
      
      setError(message);
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Upload Video</h1>

          {success && (
            <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg">
              ✓ Video uploaded successfully! Redirecting...
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-semibold">✗ {error}</span>
                  {error.includes('Authentication') && (
                    <div className="mt-2">
                      <a 
                        href="/auth/login?force=true" 
                        className="text-purple-600 hover:underline font-medium"
                      >
                        → Click here to log in again
                      </a>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Video File</label>
              <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-600 transition">
                <input
                  type="file"
                  accept="video/mp4"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={loading}
                />
                <div>
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <p className="text-gray-600">
                    {file
                      ? file.name
                      : 'Drag and drop your video here or click to browse'}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Max 500MB • MP4 format only • Max 5 minutes
                  </p>
                </div>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                placeholder="Enter video title"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
              <p className="text-xs text-gray-500 mt-1">{title.length}/100</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                placeholder="Describe your video"
                rows={5}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
              <p className="text-xs text-gray-500 mt-1">{description.length}/500</p>
            </div>

            {/* Upload Progress */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-2">{uploadProgress}% uploaded</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !file || !title.trim()}
              className="w-full px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition"
            >
              {loading ? `Uploading... ${uploadProgress}%` : 'Upload Video'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
