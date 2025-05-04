"use client";

import styles from './Reel.module.css';
import { useMuteContext } from '../context/MuteContext';

interface MuteControlProps {
  hasError: boolean;
}

export const MuteControl = ({ hasError }: MuteControlProps) => {
  const { isMuted, toggleMute } = useMuteContext();
  
  if (hasError) return null;
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleMute();
  };
  
  return (
    <button 
      className={styles.muteButton} 
      onClick={handleClick}
    >
      {isMuted ? '🔇' : '🔊'}
    </button>
  );
}; 