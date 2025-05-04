"use client";

import styles from './Reel.module.css';

interface ReelDescriptionProps {
  caption: string;
}

export const ReelDescription = ({ caption }: ReelDescriptionProps) => {
  return (
    <div className={styles.reelInfo}>
      <p className={styles.caption}>{caption}</p>
    </div>
  );
}; 