"use client";

import { useState, useEffect, useRef } from 'react';
import { Reel, ReelProps } from './Reel';
import styles from './ReelsFeed.module.css';

// Public domain videos that should work better
const SAMPLE_VIDEOS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4'
];

// Data types
export interface ReelData extends Omit<ReelProps, 'isActive'> {
  id: string;
}

interface PaginationData {
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

interface ApiResponse {
  reels: ReelData[];
  pagination: PaginationData;
}

export const ReelsFeed = () => {
  const [reels, setReels] = useState<ReelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentReelIndex, setCurrentReelIndex] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const reelsPerPage = 5;

  // Fetch reels from API
  const fetchReels = async (pageNum: number) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/reels?page=${pageNum}&limit=${reelsPerPage}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch reels');
      }
      
      const data: ApiResponse = await response.json();
      
      setReels(prev => pageNum === 1 ? data.reels : [...prev, ...data.reels]);
      setHasMore(data.pagination.hasMore);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching reels:', error);
      setLoading(false);
      
      // Fallback to mock data if API fails
      const mockReels: ReelData[] = Array.from({ length: reelsPerPage }, (_, i) => {
        const id = (pageNum - 1) * reelsPerPage + i;
        return {
          id: `reel-${pageNum}-${i}`,
          videoUrl: SAMPLE_VIDEOS[id % SAMPLE_VIDEOS.length],
          username: `user_${Math.floor(Math.random() * 1000)}`,
          caption: `This is a sample reel caption for reel ${pageNum}-${i}. #reels #sample #nextjs`,
          likes: Math.floor(Math.random() * 10000),
          comments: Math.floor(Math.random() * 1000),
        };
      });
      
      setReels(prev => pageNum === 1 ? mockReels : [...prev, ...mockReels]);
      setHasMore(pageNum < 10);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchReels(page);
  }, [page]);

  // Setup intersection observer for infinite scroll
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.8,
    };
    
    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const index = parseInt(entry.target.getAttribute('data-index') || '0');
          setCurrentReelIndex(index);
          
          // Load more reels when approaching the end
          if (index >= reels.length - 2 && !loading && hasMore) {
            setPage(prevPage => prevPage + 1);
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
  }, [reels.length, loading, hasMore]);

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
    
    if (index !== currentReelIndex) {
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
            username={reel.username}
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