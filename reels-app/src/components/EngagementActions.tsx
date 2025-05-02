"use client";

import styles from './Reel.module.css';

interface EngagementActionsProps {
  likes: number;
  comments: number;
}

export const EngagementActions = ({ likes, comments }: EngagementActionsProps) => {
  return (
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
  );
}; 