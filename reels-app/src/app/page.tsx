import { ReelsFeed } from '@/components/ReelsFeed';
import styles from './page.module.css';

export default function Home() {
  return (
    <div className={styles.container}>
      <ReelsFeed />
    </div>
  );
}
