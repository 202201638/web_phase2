'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { HeartIcon, ChatBubbleLeftIcon, PlayIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { useAuth } from '@/app/providers/AuthProvider';
import TipModal from '@/components/ui/TipModal';
import axios from 'axios';
import Cookies from 'js-cookie';
import socketService from '@/lib/socket';

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

const getThumbnailUrl = (thumbnail: string | undefined) => {
  if (!thumbnail) return undefined;
  if (thumbnail.startsWith('http')) return thumbnail;
  return `http://localhost:5000${thumbnail}`;
};

const getVideoUrl = (videoURL: string | undefined) => {
  if (!videoURL) return undefined;
  if (videoURL.startsWith('http')) return videoURL;
  return `http://localhost:5000${videoURL}`;
};

export default function VideoCard({ video }: { video: Video }) {
  const { user } = useAuth();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(video.likes);
  const [showTipModal, setShowTipModal] = useState(false);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const timeAgo = formatDistanceToNow(new Date(video.createdAt), { addSuffix: true });

  // Join video room for real-time updates
  useEffect(() => {
    if (socketService.isConnected()) {
      socketService.joinVideoRoom(video._id);
    }

    // Listen for like updates
    const handleLikeUpdate = (event: CustomEvent) => {
      const { videoId, action, likes } = event.detail;
      if (videoId === video._id) {
        setLikesCount(likes);
      }
    };

    window.addEventListener('like-update', handleLikeUpdate as EventListener);

    return () => {
      if (socketService.isConnected()) {
        socketService.leaveVideoRoom(video._id);
      }
      window.removeEventListener('like-update', handleLikeUpdate as EventListener);
    };
  }, [video._id]);

  const handleLike = async () => {
    if (!user) {
      window.location.href = '/auth/login';
      return;
    }

    try {
      const token = Cookies.get('token');
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || '/api/v1'}/videos/${video._id}/like`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setIsLiked(!isLiked);
      setLikesCount(response.data.data.likes);

      // Emit real-time like event
      socketService.likeVideo({
        videoId: video._id,
        videoOwnerId: video.owner._id,
        likerUsername: user.username,
        videoTitle: video.title
      });
    } catch (error) {
      console.error('Error liking video:', error);
    }
  };

  const handleTip = () => {
    if (!user) {
      window.location.href = '/auth/login';
      return;
    }
    setShowTipModal(true);
  };
  
  // Get the video URL - try all possible fields
  const rawVideoUrl = video.videoURL || (video as any).videoUrl || (video as any).videoFile;
  const fullVideoUrl = rawVideoUrl ?
    (rawVideoUrl.startsWith('http') ? rawVideoUrl : `http://localhost:5000${rawVideoUrl}`) :
    null;

  console.log('Final video URL:', fullVideoUrl);

  return (
    <>
      <Link href={`/video/${video._id}`}>
        <div className="group cursor-pointer">
          {/* Thumbnail */}
          <div className="relative rounded-xl overflow-hidden mb-3 aspect-video bg-gray-100">
            {video.thumbnail && !imageError ? (
              <>
                {!imageLoaded && (
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-white border-opacity-30 border-t-white rounded-full animate-spin"></div>
                  </div>
                )}
                <img 
                  src={getThumbnailUrl(video.thumbnail)} 
                  alt={video.title}
                  className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                  onLoad={() => setImageLoaded(true)}
                  onError={(e) => {
                    setImageError(true);
                  }}
                />
              </>
            ) : (
              /* Always show a nice placeholder or video */
              fullVideoUrl ? (
                <video
                  className="w-full h-full object-cover"
                  muted
                  preload="metadata"
                  onMouseEnter={(e) => {
                    const video = e.currentTarget;
                    video.currentTime = 1;
                    video.play().catch(() => {});
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.pause();
                  }}
                >
                  <source src={fullVideoUrl} type="video/mp4" />
                </video>
              ) : (
                /* Attractive placeholder with glassmorphism */
                <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                  <div className="text-center text-white p-4">
                    <div className="w-16 h-16 bg-white bg-opacity-20 backdrop-blur-sm rounded-full flex items-center justify-center mb-3 mx-auto">
                      <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm10 12H5V5h10v10zM9 6a1 1 0 011.553-.832l3.001 2a1 1 0 010 1.664l-3 2A1 1 0 019 10V6z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium truncate max-w-[120px]">{video.title}</p>
                    <p className="text-xs opacity-75 mt-1">{video.owner.username}</p>
                  </div>
                </div>
              )
            )}
            
            {/* Glassmorphism overlay with video info */}
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center">
              {/* Play button */}
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-3 border border-white/30">
                <PlayIcon className="w-6 h-6 text-white" />
              </div>
              {/* Video info */}
              <p className="text-white text-sm font-semibold text-center px-4 line-clamp-2 drop-shadow-md">
                {video.title}
              </p>
              <div className="flex items-center gap-3 mt-2 text-white/90 text-xs">
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                  {likesCount}
                </span>
                <span className="bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                  {formatDuration(video.duration)}
                </span>
              </div>
            </div>
            
            {/* Duration badge with glassmorphism */}
            <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md text-white text-xs px-2 py-1 rounded-md border border-white/20">
              {formatDuration(video.duration)}
            </div>
          </div>

          {/* Video Info */}
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-purple-600 transition-colors text-sm leading-tight">
              {video.title}
            </h3>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 font-medium">
                {video.owner.username}
              </p>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
                <span>{video.views || 0}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                  <span>{likesCount}</span>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span>{video.reviews} reviews</span>
                </div>
                <span>{timeAgo}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={(e) => {
            e.preventDefault();
            handleLike();
          }}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
            isLiked 
              ? 'bg-red-100 text-red-700 border border-red-200' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
          }`}
        >
          {isLiked ? (
            <HeartSolidIcon className="w-4 h-4" />
          ) : (
            <HeartIcon className="w-4 h-4" />
          )}
          {likesCount}
        </button>
        
        <button
          onClick={(e) => {
            e.preventDefault();
            handleTip();
          }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 hover:from-purple-200 hover:to-pink-200 border border-purple-200 transition-all duration-200"
        >
          <CurrencyDollarIcon className="w-4 h-4" />
          Tip
        </button>
      </div>

      {/* Tip Modal */}
      {showTipModal && (
        <TipModal
          isOpen={showTipModal}
          onClose={() => setShowTipModal(false)}
          creatorId={video.owner._id}
          creatorName={video.owner.username}
          videoId={video._id}
          videoTitle={video.title}
        />
      )}
    </>
  );
}
