"use client";

import { useState, useEffect, useRef } from 'react';
import { Reel, ReelProps } from './Reel';
import styles from './ReelsFeed.module.css';

// Data types
export interface ReelData extends Omit<ReelProps, 'isActive'> {
  id: string;
}

interface PaginationData {
  page: number;
  limit: number;
  hasMore: boolean;
  nextToken?: string;
}

interface ApiResponse {
  reels: ReelData[];
  pagination: PaginationData;
}

// Generate a random session ID on each page load to randomize videos
const SESSION_ID = Math.random().toString(36).substring(2, 15);

export const ReelsFeed = () => {
  const [reels, setReels] = useState<ReelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentReelIndex, setCurrentReelIndex] = useState(0);
  const [pagination, setPagination] = useState<{
    page: number;
    hasMore: boolean;
    nextToken?: string;
  }>({
    page: 1,
    hasMore: true,
    nextToken: undefined
  });
  const reelsPerPage = 5;
  const isFetchingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Fetch reels from API
  const fetchReels = async () => {
    // Prevent multiple simultaneous fetch calls
    if (isFetchingRef.current) return;
    
    try {
      isFetchingRef.current = true;
      setLoading(true);
      
      // Build the query parameters
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: reelsPerPage.toString(),
        // Add session ID to force randomization on page refresh
        session: SESSION_ID
      });
      
      // Add token if we have one (important for pagination)
      if (pagination.nextToken) {
        params.append('token', pagination.nextToken);
      }
      
      console.log(`Fetching reels: page=${pagination.page}, token=${pagination.nextToken || 'none'}, session=${SESSION_ID}`);
      
      const response = await fetch(`/api/reels?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch reels');
      }
      
      const data: ApiResponse = await response.json();
      console.log('API Response:', data);
      
      // Add new reels to the existing list (for page 1, replace all reels)
      setReels(prev => pagination.page === 1 ? data.reels : [...prev, ...data.reels]);
      
      // Update pagination state with the token from the response
      setPagination({
        page: data.pagination.page + 1, // Increment the page for next fetch
        hasMore: data.pagination.hasMore,
        nextToken: data.pagination.nextToken
      });
      
      setLoading(false);
      isFetchingRef.current = false;
    } catch (error) {
      console.error('Error fetching reels:', error);
      setError('Failed to load videos. Please check your connection and try again.');
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  // Load initial data on mount
  useEffect(() => {
    fetchReels();
  }, []); // Empty dependency array means this runs once on mount

  // Load more reels when pagination changes
  const loadMoreReels = () => {
    if (!loading && pagination.hasMore && !isFetchingRef.current) {
      console.log('Loading more reels...');
      fetchReels();
    }
  };

  // Setup intersection observer for infinite scroll
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '100px',
      threshold: 0.5,
    };
    
    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const index = parseInt(entry.target.getAttribute('data-index') || '0');
          setCurrentReelIndex(index);
          
          // Load more reels when approaching the end
          if (index >= reels.length - 2 && !loading && pagination.hasMore) {
            loadMoreReels();
          }
        }
      });
    };
    
    observerRef.current = new IntersectionObserver(handleIntersection, observerOptions);
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [reels.length, loading, pagination.hasMore]);

  // Observe all reel elements
  useEffect(() => {
    const observer = observerRef.current;
    
    if (observer && containerRef.current) {
      const reelElements = containerRef.current.querySelectorAll('[data-index]');
      
      reelElements.forEach(element => {
        observer.observe(element);
      });
    }
    
    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [reels]);

  // Handle scroll-snapping manually
  const handleScroll = () => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const reelHeight = container.clientHeight;
    
    // Calculate which reel is most visible
    const index = Math.round(scrollTop / reelHeight);
    
    if (index !== currentReelIndex && index >= 0 && index < reels.length) {
      setCurrentReelIndex(index);
    }
  };

  // Preload the next video
  useEffect(() => {
    if (reels.length > currentReelIndex + 1) {
      const nextVideoUrl = reels[currentReelIndex + 1].videoUrl;
      const video = document.createElement('video');
      video.preload = 'auto';
      video.src = nextVideoUrl;
      // We don't need to append the video to the DOM, just initialize the request
    }
  }, [currentReelIndex, reels]);

  if (reels.length === 0 && loading) {
    return <div className={styles.loading}>Loading reels...</div>;
  }

  if (reels.length === 0 && error) {
    return (
      <div className={styles.errorContainer}>
        <h2>Error loading reels</h2>
        <p>{error}</p>
        <button 
          className={styles.retryButton}
          onClick={() => {
            setError(null);
            isFetchingRef.current = false;
            setPagination({
              page: 1,
              hasMore: true,
              nextToken: undefined
            });
            fetchReels();
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={styles.reelsFeedContainer}
      onScroll={handleScroll}
    >
      {reels.map((reel, index) => (
        <div 
          key={reel.id} 
          className={styles.reelItem}
          data-index={index}
        >
          <Reel 
            videoUrl={reel.videoUrl}
            caption={reel.caption}
            likes={reel.likes}
            comments={reel.comments}
            isActive={index === currentReelIndex}
          />
        </div>
      ))}
      
      {loading && reels.length > 0 && (
        <div className={styles.loadingMore}>Loading more reels...</div>
      )}
    </div>
  );
};