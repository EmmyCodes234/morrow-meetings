'use client';

import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { generateRoomId } from '@/lib/client-utils';
import styles from '../styles/Home.module.css';
import { Sparkles, Move, Radio, Users } from 'lucide-react';

export default function Page() {
  const router = useRouter();
  const [roomInput, setRoomInput] = useState('');

  const startInstantSpace = () => {
    const roomId = generateRoomId();
    router.push(`/rooms/${roomId}`);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomInput.trim()) return;

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
          <span className={styles.logoText}>Morrow Spaces</span>
        </div>
        <div className={styles.navRight}>
          <span className={styles.badge}>Live Spaces</span>
        </div>
      </header>

      {/* Hero Section */}
      <main className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.pillTag}>
            <span className={styles.pulseDot} />
            <span>Zero install. Runs in any mobile or desktop browser.</span>
          </div>

          <h1 className={styles.title}>
            A living room for your <span className={styles.gradientText}>favorite people</span>.
          </h1>

          <p className={styles.subtitle}>
            Drag your video around an infinite canvas, talk naturally with proximity audio, watch videos together, and leave sticky notes.
          </p>

          {/* Action Row */}
          <div className={styles.actionRow}>
            <button className={styles.primaryButton} onClick={startInstantSpace}>
              <Sparkles size={18} />
              <span>Create a Space</span>
            </button>

            <form onSubmit={handleJoin} className={styles.joinForm}>
              <div className={styles.inputWrapper}>
                <input
                  type="text"
                  placeholder="Enter space code or link"
                  value={roomInput}
                  onChange={(e) => setRoomInput(e.target.value)}
                  className={styles.joinInput}
                />
              </div>
              <button type="submit" disabled={!roomInput.trim()} className={styles.joinButton}>
                Join
              </button>
            </form>
          </div>

          {/* Feature Highlights */}
          <div className={styles.featureHighlights}>
            <div className={styles.highlightItem}>
              <span className={styles.highlightDot} />
              <span>Proximity Audio</span>
            </div>
            <div className={styles.highlightItem}>
              <span className={styles.highlightDot} />
              <span>Touch &amp; Mobile First</span>
            </div>
            <div className={styles.highlightItem}>
              <span className={styles.highlightDot} />
              <span>Synced YouTube</span>
            </div>
            <div className={styles.highlightItem}>
              <span className={styles.highlightDot} />
              <span>Sticky Notes &amp; Screens</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
