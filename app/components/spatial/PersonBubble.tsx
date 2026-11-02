'use client';

import React, { useEffect, useRef } from 'react';
import { Participant, Track, RemoteTrackPublication } from 'livekit-client';
import { useIsSpeaking } from '@livekit/components-react';
import { MicOff, Volume2 } from 'lucide-react';

interface PersonBubbleProps {
  participant: Participant;
  isLocal: boolean;
  x: number;
  y: number;
  name: string;
  avatarColor: string;
  avatarEmoji: string;
  isDragging?: boolean;
  onPointerDown?: (e: React.PointerEvent) => void;
  showRangeRing?: boolean;
  volumePercent?: number; // 0 to 100
}

export const PersonBubble: React.FC<PersonBubbleProps> = ({
  participant,
  isLocal,
  x,
  y,
  name,
  avatarColor,
  avatarEmoji,
  isDragging = false,
  onPointerDown,
  showRangeRing = false,
  volumePercent,
}) => {
  const isSpeaking = useIsSpeaking(participant);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasVideo, setHasVideo] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(true);

  // Monitor tracks on participant
  useEffect(() => {
    const updateTracks = () => {
      const cameraPub = participant.getTrackPublication(Track.Source.Camera);
      const micPub = participant.getTrackPublication(Track.Source.Microphone);

      const hasCam = Boolean(cameraPub && !cameraPub.isMuted && cameraPub.track);
      setHasVideo(hasCam);

      const muted = !micPub || micPub.isMuted;
      setIsMuted(muted);

      if (videoRef.current && cameraPub?.track) {
        cameraPub.track.attach(videoRef.current);
      }
    };

    updateTracks();

    participant.on('trackPublished', updateTracks);
    participant.on('trackUnpublished', updateTracks);
    participant.on('trackMuted', updateTracks);
    participant.on('trackUnmuted', updateTracks);
    participant.on('trackSubscribed', updateTracks);
    participant.on('trackUnsubscribed', updateTracks);

    return () => {
      participant.off('trackPublished', updateTracks);
      participant.off('trackUnpublished', updateTracks);
      participant.off('trackMuted', updateTracks);
      participant.off('trackUnmuted', updateTracks);
      participant.off('trackSubscribed', updateTracks);
      participant.off('trackUnsubscribed', updateTracks);
      if (videoRef.current) {
        const cameraPub = participant.getTrackPublication(Track.Source.Camera);
        if (cameraPub?.track) {
          cameraPub.track.detach(videoRef.current);
        }
      }
    };
  }, [participant]);

  const bubbleSize = 96; // px

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        transform: `translate3d(${x - bubbleSize / 2}px, ${y - bubbleSize / 2}px, 0)`,
        width: bubbleSize,
        height: bubbleSize,
        zIndex: isLocal ? 40 : 30,
        touchAction: 'none',
        userSelect: 'none',
        pointerEvents: 'auto',
        cursor: isLocal ? (isDragging ? 'grabbing' : 'grab') : 'default',
        transition: isDragging ? 'none' : 'transform 0.12s cubic-bezier(0.2, 0.9, 0.4, 1.1)',
      }}
      onPointerDown={onPointerDown}
    >
      {/* Subtle Proximity Range Ring (Local user or on hover) */}
      {showRangeRing && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 750 * 2,
            height: 750 * 2,
            borderRadius: '50%',
            border: '2px dashed rgba(241, 164, 29, 0.25)',
            background: 'radial-gradient(circle, rgba(255, 234, 182, 0.08) 0%, rgba(255, 234, 182, 0) 70%)',
            pointerEvents: 'none',
            zIndex: -1,
          }}
        />
      )}

      {/* Speaking Ripple Wave */}
      {isSpeaking && (
        <div
          style={{
            position: 'absolute',
            inset: -8,
            borderRadius: '50%',
            background: 'rgba(153, 147, 235, 0.35)',
            animation: 'spatialPulse 1.4s ease-out infinite',
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Bubble Container */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          overflow: 'hidden',
          backgroundColor: avatarColor || '#FFF5DD',
          border: isSpeaking
            ? '3.5px solid #9993EB'
            : isLocal
            ? '3px solid #F1A41D'
            : '2.5px solid #FFFFFF',
          boxShadow: isSpeaking
            ? '0 8px 24px rgba(153, 147, 235, 0.35), 0 2px 6px rgba(0,0,0,0.06)'
            : '0 6px 18px rgba(60, 50, 40, 0.12), 0 2px 4px rgba(0,0,0,0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1,
        }}
      >
        {/* Video stream if active */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: hasVideo ? 'block' : 'none',
            transform: isLocal ? 'scaleX(-1)' : 'none',
          }}
        />

        {/* Fallback illustrated Avatar */}
        {!hasVideo && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: '38px', lineHeight: 1 }}>{avatarEmoji || '😊'}</span>
          </div>
        )}

        {/* Local user "YOU" badge */}
        {isLocal && (
          <div
            style={{
              position: 'absolute',
              top: 4,
              backgroundColor: '#F1A41D',
              color: '#FFFFFF',
              fontSize: '9px',
              fontWeight: 700,
              padding: '1px 6px',
              borderRadius: '999px',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
            }}
          >
            You
          </div>
        )}
      </div>

      {/* Name Label & Status Pill */}
      <div
        style={{
          position: 'absolute',
          top: bubbleSize + 6,
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#FFFFFF',
          padding: '3px 10px',
          borderRadius: '999px',
          boxShadow: '0 2px 8px rgba(60, 50, 40, 0.1)',
          border: '1px solid #EAE5DF',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          whiteSpace: 'nowrap',
          maxWidth: '140px',
        }}
      >
        <span
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: '#2D3139',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {name || participant.identity}
        </span>

        {isMuted ? (
          <MicOff size={11} color="#EE6659" strokeWidth={2.5} />
        ) : (
          <Volume2 size={11} color="#70BBB2" strokeWidth={2.5} />
        )}

        {!isLocal && volumePercent !== undefined && volumePercent < 100 && (
          <span style={{ fontSize: '10px', color: '#949CBA', fontWeight: 500 }}>
            {volumePercent}%
          </span>
        )}
      </div>
    </div>
  );
};
