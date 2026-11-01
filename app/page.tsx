'use client';

import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { generateRoomId } from '@/lib/client-utils';
import styles from '../styles/Home.module.css';

export default function Page() {
  const router = useRouter();
  const [roomInput, setRoomInput] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const startInstantMeeting = () => {
    const roomId = generateRoomId();
    router.push(`/rooms/${roomId}`);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomInput.trim()) return;

    // Handle full URL pasted (e.g. https://usemorrow.xyz/rooms/abc-123 or just abc-123)
    let cleanRoom = roomInput.trim();
    if (cleanRoom.includes('/rooms/')) {
      cleanRoom = cleanRoom.split('/rooms/')[1].split('?')[0].split('#')[0];
    } else if (cleanRoom.startsWith('http')) {
      const parts = cleanRoom.split('/');
      cleanRoom = parts[parts.length - 1];
    }

    router.push(`/rooms/${cleanRoom}`);
  };

  return (
    <div className={styles.container}>
      {/* Top Navigation */}
      <header className={styles.navbar}>
        <div className={styles.logoGroup}>
          <div className={styles.logoMark} />
          <span className={styles.logoText}>Morrow</span>
        </div>
        <div className={styles.navRight}>
          <span className={styles.badge}>Private &amp; Encrypted</span>
        </div>
      </header>

      {/* Hero Section */}
      <main className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.pillTag}>
            <span className={styles.pulseDot} />
            <span>Zero install. Runs in any browser.</span>
          </div>

          <h1 className={styles.title}>
            Video meetings built for <span className={styles.gradientText}>focus</span>.
          </h1>

          <p className={styles.subtitle}>
            Connect with family, friends, or your team with crystal-clear audio and video. 
            No account, downloads, or credit card required.
          </p>

          {/* Action Row: Mom-proof controls */}
          <div className={styles.actionRow}>
            <button 
              className={styles.primaryButton}
              onClick={startInstantMeeting}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m22 8-6 4 6 4V8Z" />
                <rect width="14" height="12" x="2" y="6" rx="2" />
              </svg>
              <span>New meeting</span>
            </button>

            <form onSubmit={handleJoin} className={styles.joinForm}>
              <div className={styles.inputWrapper}>
                <svg className={styles.inputIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="3" rx="2"/>
                  <path d="M7 7h.01"/>
                  <path d="M12 7h.01"/>
                  <path d="M17 7h.01"/>
                  <path d="M7 12h.01"/>
                  <path d="M12 12h.01"/>
                  <path d="M17 12h.01"/>
                  <path d="M7 17h.01"/>
                  <path d="M12 17h.01"/>
                  <path d="M17 17h.01"/>
                </svg>
                <input
                  type="text"
                  placeholder="Enter a code or link"
                  value={roomInput}
                  onChange={(e) => setRoomInput(e.target.value)}
                  className={styles.joinInput}
                />
              </div>
              <button 
                type="submit" 
                className={styles.secondaryButton}
                disabled={!roomInput.trim()}
              >
                Join
              </button>
            </form>
          </div>

          {/* Trust Indicators */}
          <div className={styles.featureList}>
            <div className={styles.featureItem}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Free forever for 1-on-1s</span>
            </div>
            <div className={styles.featureItem}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>High-definition video &amp; audio</span>
            </div>
            <div className={styles.featureItem}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Works on mobile &amp; laptop</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <span>Morrow &bull; usemorrow.xyz</span>
      </footer>
    </div>
  );
}
