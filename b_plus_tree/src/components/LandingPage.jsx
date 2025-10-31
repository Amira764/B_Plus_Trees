import React from 'react';
import styles from '../styles/LandingPage.module.css';

const LandingPage = ({ onModeSelect }) => {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>🌳 B+ Tree Visualization</h1>
      <div className={styles.cards}>
        <button 
          className={styles.modeButton}
          onClick={() => onModeSelect('csv')}
        >
          CSV Mode
        </button>
        <button 
          className={styles.modeButton}
          onClick={() => onModeSelect('manual')}
        >
          Manual Mode
        </button>
      </div>
    </div>
  );
};

export default LandingPage;