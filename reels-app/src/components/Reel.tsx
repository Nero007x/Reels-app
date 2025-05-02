"use client";

import { useState, useRef, useEffect } from 'react';
import styles from './Reel.module.css';

export interface ReelProps {
  videoUrl: string;
  username: string;
  caption: string;
  likes: number;
  comments: number;
  isActive?: boolean;
}

export const Reel = ({ videoUrl, username, caption, likes, comments, isActive = false }: ReelProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Handle play/pause
  const togglePlay = () => {
    if (videoRef.current && !hasError) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(err => {
          console.error("Error playing video:", err);
          setHasError(true);
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Handle mute/unmute
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Auto-play when reel becomes active
  useEffect(() => {
    if (videoRef.current && !hasError) {
      if (isActive) {
        videoRef.current.play().catch(error => {
          // Auto-play might be blocked by browser policy
          console.error('Auto-play prevented:', error);
          setHasError(true);
        });
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
        // Reset video position when not active
        videoRef.current.currentTime = 0;
      }
    }
  }, [isActive, hasError]);

  // Handle video error events
  const handleVideoError = () => {
    console.error(`Error loading video: ${videoUrl}`);
    setHasError(true);
  };

  return (
    <div className={styles.reelContainer} onClick={togglePlay}>
      {!hasError ? (
        <div className={styles.videoWrapper}>
          <video 
            ref={videoRef}
            className={styles.reelVideo}
            src={videoUrl}
            loop
            muted={isMuted}
            playsInline
            onError={handleVideoError}
          />
        </div>
      ) : (
        <div className={styles.errorContainer}>
          <p>Video could not be loaded</p>
          <p className={styles.errorUrl}>{videoUrl}</p>
        </div>
      )}
      
      {/* Video Controls Overlay */}
      <div className={styles.controlsOverlay}>
        <div className={styles.playPauseIndicator}>
          {!isPlaying && !hasError && <div className={styles.playIcon}>▶</div>}
        </div>

        {!hasError && (
          <button 
            className={styles.muteButton} 
            onClick={toggleMute}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        )}
      </div>
      
      {/* Reel Info */}
      <div className={styles.reelInfo}>
        <div className={styles.userInfo}>
          <div className={styles.avatar}></div>
          <span className={styles.username}>{username}</span>
        </div>
        <p className={styles.caption}>{caption}</p>
      </div>
      
      {/* Engagement Actions */}
      <div className={styles.engagementActions}>
        <div className={styles.action}>
          <div className={styles.actionIcon}>❤️</div>
          <span>{likes}</span>
        </div>
        <div className={styles.action}>
          <div className={styles.actionIcon}>💬</div>
          <span>{comments}</span>
        </div>
      </div>
    </div>
  );
}; 