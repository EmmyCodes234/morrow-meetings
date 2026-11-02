'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Participant, Track } from 'livekit-client';
import { useIsSpeaking } from '@livekit/components-react';
import { Avatar } from './Avatar';
import { AvatarAnimationState } from './AvatarAnimator';
import { getInitials } from './avatarMetadata';
import { MicOff, Volume2 } from 'lucide-react';

interface PopSpacePersonBubbleProps {
  participant: Participant;
  isLocal: boolean;
  x: number;
  y: number;
  name: string;
  avatarId: string;
  avatarBgColor: string;
  isDragging?: boolean;
  onPointerDown?: (e: React.PointerEvent) => void;
  showRangeRing?: boolean;
  volumePercent?: number;
}

export const PopSpacePersonBubble: React.FC<PopSpacePersonBubbleProps> = ({
  participant,
  isLocal,
  x,
  y,
  name,
  avatarId = 'indigo',
  avatarBgColor = '#4F46E5',
  isDragging = false,
  onPointerDown,
  showRangeRing = false,
  volumePercent,
}) => {
  const isSpeaking = useIsSpeaking(participant);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasVideo, setHasVideo] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // Monitor participant media tracks
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

  // Executive presence bubble dimensions
  const bubbleSize = 82;

  const initials = getInitials(name);

  return (
    <div
      className="ui-interactive"
      onClick={(e) => e.stopPropagation()}
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
        transition: isDragging ? 'none' : 'transform 0.15s cubic-bezier(0.2, 0.9, 0.4, 1.1)',
      }}
      onPointerDown={onPointerDown}
    >
      {/* Earshot range ring for proximity audio */}
      {showRangeRing && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 700 * 2,
            height: 700 * 2,
            borderRadius: '50%',
            border: '1.5px dashed rgba(79, 70, 229, 0.18)',
            background: 'radial-gradient(circle, rgba(79, 70, 229, 0.05) 0%, rgba(79, 70, 229, 0) 70%)',
            pointerEvents: 'none',
            zIndex: -1,
          }}
        />
      )}

      {/* Speaking Indicator Pulse */}
      {isSpeaking && (
        <div
          style={{
            position: 'absolute',
            inset: -6,
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.25)',
            animation: 'spatialPulse 1.4s ease-out infinite',
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Main Avatar / Video Bubble */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          overflow: 'hidden',
          backgroundColor: '#0F172A',
          border: isSpeaking
            ? '3px solid #10B981'
            : isLocal
            ? '3px solid #4F46E5'
            : '2px solid rgba(255, 255, 255, 0.85)',
          boxShadow: isSpeaking
            ? '0 0 0 4px rgba(16, 185, 129, 0.25), 0 8px 24px rgba(0, 0, 0, 0.15)'
            : '0 8px 24px rgba(30, 41, 59, 0.12), 0 2px 6px rgba(0, 0, 0, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1,
        }}
      >
        {/* Live Camera Feed */}
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

        {/* Executive Monogram Avatar when Camera is Off */}
        {!hasVideo && (
          <Avatar
            name={avatarId}
            initials={initials}
            size={bubbleSize}
            animation={isSpeaking ? AvatarAnimationState.Talking : AvatarAnimationState.Idle}
          />
        )}
      </div>

      {/* Sleek Professional Name Pill with Status */}
      <div
        style={{
          position: 'absolute',
          top: bubbleSize + 6,
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#FFFFFF',
          padding: '3px 10px',
          borderRadius: '999px',
          boxShadow: '0 2px 10px rgba(15, 23, 42, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)',
          border: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          whiteSpace: 'nowrap',
          maxWidth: '140px',
        }}
      >
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: '#1E293B',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {isLocal ? `${name} (You)` : name}
        </span>

        {isMuted ? (
          <MicOff size={11} color="#EF4444" strokeWidth={2.5} />
        ) : (
          <Volume2 size={11} color="#10B981" strokeWidth={2.5} />
        )}

        {!isLocal && volumePercent !== undefined && volumePercent < 100 && (
          <span style={{ fontSize: '9px', color: '#64748B', fontWeight: 600 }}>
            {volumePercent}%
          </span>
        )}
      </div>
    </div>
  );
};
