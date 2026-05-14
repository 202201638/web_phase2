'use client';

import { useEffect, useState, use } from 'react';
import apiClient from '@/lib/services/api';
import { useAuth } from '@/app/providers/AuthProvider';
import ReviewForm from '@/components/video/ReviewForm';
import ReviewList from '@/components/video/ReviewList';
import TestVideoPlayer from './test-video-player';

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
  likes: number;
  likedBy?: string[];
  createdAt: string;
}

interface Review {
  _id: string;
  rating: number;
  comment: string;
  user: {
    _id: string;
    username: string;
  };
  createdAt: string;
}

export default function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuth();
  const [video, setVideo] = useState<any>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [userReview, setUserReview] = useState<any>(null);
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [videoError, setVideoError] = useState(false);

  // Unwrap the params Promise
  const resolvedParams = use(params);
  const videoId = resolvedParams.id;

  const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const response = await apiClient.get(`/videos/${videoId}`);
        setVideo(response.data.data);
        setIsLiked(response.data.data.likedBy?.includes(user?.id) || false);
      } catch (err) {
        setError('Failed to load video');
      } finally {
        setLoading(false);
      }
    };

    const fetchUserReview = async () => {
      if (user) {
        try {
          const response = await apiClient.get(`/videos/${videoId}/reviews/user`);
          setUserReview(response.data.data);
        } catch (err) {
          // User hasn't reviewed this video yet, which is expected
          setUserReview(null);
        }
      }
    };

    const fetchAllReviews = async () => {
      try {
        const response = await apiClient.get(`/videos/${videoId}/reviews`);
        setReviews(response.data.data || []);
      } catch (err) {
        console.error('Failed to fetch reviews:', err);
        setReviews([]);
      }
    };

    fetchVideo();
    fetchUserReview();
    fetchAllReviews();
  }, [videoId, user?.id, API_URL]);

  const handleLike = async () => {
    if (!user) {
      alert('Please log in to like videos');
      return;
    }

    try {
      if (isLiked) {
        await apiClient.delete(`/videos/${videoId}/like`);
        setIsLiked(false);
        if (video) {
          setVideo({ ...video, likes: Math.max(0, (video.likes || 0) - 1) });
        }
      } else {
        await apiClient.post(`/videos/${videoId}/like`);
        setIsLiked(true);
        if (video) {
          setVideo({ ...video, likes: (video.likes || 0) + 1 });
        }
      }
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  const handleReviewSubmit = async (newReview: Review) => {
    if (isEditingReview) {
      // Update existing review in the list
      setReviews(reviews.map(review => 
        review.user._id === user?.id ? newReview : review
      ));
    } else {
      // Add new review
      setReviews([newReview, ...reviews]);
    }
    setUserReview(newReview);
    setIsEditingReview(false);
    
    // Refetch all reviews to ensure state is synchronized
    try {
      const response = await apiClient.get(`/videos/${videoId}/reviews`);
      setReviews(response.data.data || []);
    } catch (err) {
      console.error('Failed to refetch reviews:', err);
    }
  };

  const handleReviewDelete = async () => {
    try {
      await apiClient.delete(`/videos/${videoId}/reviews`);
      setUserReview(null);
      setIsEditingReview(false);
      
      // Refetch all reviews to ensure state is synchronized
      try {
        const response = await apiClient.get(`/videos/${videoId}/reviews`);
        setReviews(response.data.data || []);
      } catch (err) {
        console.error('Failed to refetch reviews:', err);
      }
    } catch (err) {
      console.error('Failed to delete review:', err);
      alert('Failed to delete review');
    }
  };

  const handleReviewEditCancel = () => {
    setIsEditingReview(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Video not found'}</p>
          <a href="/discover" className="text-purple-600 hover:underline">
            Back to Discover
          </a>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === video.owner._id;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Video Player */}
        <div 
          className="rounded-lg overflow-hidden mb-6 aspect-video"
          style={{
            backgroundImage: video.thumbnail ? `url(${video.thumbnail})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: video.thumbnail ? 'transparent' : '#000'
          }}
        >
          {videoError ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-900">
              <div className="text-center text-white p-8">
                <div className="text-6xl mb-4">🎬</div>
                <h3 className="text-xl font-semibold mb-2">Video Cannot Be Played</h3>
                <p className="text-gray-400 mb-4">This video format is not supported or the file is corrupted. Please upload a valid MP4 video file.</p>
                <button 
                  onClick={() => setVideoError(false)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <TestVideoPlayer videoUrl={video.videoURL || video.videoUrl || ''} />
            </div>
          )}
        </div>

        {/* Video Info */}
        <div className="bg-white rounded-lg p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{video.title}</h1>
              <p className="text-gray-600 mb-4">{video.description}</p>
              <p className="text-sm text-gray-500">
                By {video.owner.username}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900 mb-2">{video.likes || 0}</p>
              <p className="text-gray-500 mb-4">Likes</p>
              <button
                onClick={handleLike}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  isLiked
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                }`}
              >
                {isLiked ? '❤️ Liked' : '🤍 Like'}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          {isOwner && (
            <div className="flex gap-4 mt-4">
              <button className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300">
                ✏️ Edit
              </button>
              <button className="px-4 py-2 bg-red-200 text-red-900 rounded-lg hover:bg-red-300">
                🗑️ Delete
              </button>
            </div>
          )}
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Reviews ({reviews.length})
          </h2>

          {user && (!userReview || isEditingReview) && (
            <ReviewForm 
              videoId={videoId} 
              onSubmit={handleReviewSubmit} 
              onCancel={isEditingReview ? handleReviewEditCancel : undefined}
              existingReview={isEditingReview ? userReview : undefined}
            />
          )}
          {user && userReview && !isEditingReview && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-green-800 font-semibold">Your Review</p>
                  <p className="text-green-700 text-sm mt-1">
                    Rating: {userReview.rating} stars
                    {userReview.comment && <><br />Comment: "{userReview.comment}"</>}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditingReview(true)}
                    className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={handleReviewDelete}
                    className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          <ReviewList
            reviews={reviews}
            currentUserId={user?.id}
            isOwner={isOwner}
          />
        </div>
      </div>
    </div>
  );
}
