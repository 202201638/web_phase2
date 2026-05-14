'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import axios from 'axios';
import VideoCard from '@/components/video/VideoCard';
import VideoSearch from '@/components/video/VideoSearch';
import FilterDropdown from '@/components/video/FilterDropdown';

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
  createdAt: string;
}

export default function DiscoverPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchInitialVideos = async () => {
      try {
        setLoading(true);
        const params: any = { skip: 0, limit: 12 };
        if (searchQuery) {
          params.search = searchQuery;
        }
        if (sortBy) {
          params.sortBy = sortBy;
        }
        
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL || '/api/v1'}/videos`,
          { params }
        );

        const newVideos = response.data.data || [];
        setVideos(newVideos);
        if (newVideos.length === 0) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch videos');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialVideos();
  }, [searchQuery, sortBy]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setVideos([]);
    setHasMore(true);
  };

  const handleFilterChange = (filter: string) => {
    setSortBy(filter);
    setVideos([]);
    setHasMore(true);
  };

  const fetchMoreVideos = useCallback(async () => {
    if (loading || !hasMore) return;

    try {
      setLoading(true);
      const params: any = { skip: videos.length, limit: 12 };
      if (searchQuery) {
        params.search = searchQuery;
      }
      if (sortBy) {
        params.sortBy = sortBy;
      }

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || '/api/v1'}/videos`,
        { params }
      );

      const newVideos = response.data.data || [];
      setVideos(prev => {
        const existingIds = new Set(prev.map(v => v._id));
        const filtered = newVideos.filter((v: Video) => !existingIds.has(v._id));
        return [...prev, ...filtered];
      });

      if (newVideos.length === 0) {
        setHasMore(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch more videos');
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, videos.length, searchQuery, sortBy]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchMoreVideos();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, fetchMoreVideos]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Discover Videos</h1>
          <p className="text-gray-600">Browse the latest videos from our community</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <VideoSearch onSearch={handleSearch} placeholder="Search videos by title..." />
          </div>
          <FilterDropdown onFilterChange={handleFilterChange} currentFilter={sortBy} />
        </div>

        {/* Video Grid - Responsive: 1 col mobile, 2 tablet, 3-4 desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {videos.map((video) => (
            <VideoCard key={video._id} video={video} />
          ))}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center mb-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        )}

        {/* Infinite scroll trigger */}
        {hasMore && <div ref={observerTarget} className="h-10" />}

        {/* No more videos message */}
        {!hasMore && videos.length > 0 && (
          <div className="text-center py-8 text-gray-500">
            No more videos to load
          </div>
        )}

        {/* Empty state */}
        {videos.length === 0 && !loading && (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">No videos available yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
