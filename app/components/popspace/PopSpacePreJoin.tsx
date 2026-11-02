'use client';

import React, { useEffect, useRef, useState } from 'react';
import { EXECUTIVE_THEMES, AvatarMeta, getInitials } from './avatarMetadata';
import { Avatar } from './Avatar';
import { AvatarAnimationState } from './AvatarAnimator';
import { Mic, MicOff, Video, VideoOff, ShieldCheck, ArrowRight } from 'lucide-react';

interface PopSpacePreJoinProps {
  roomName: string;
  onJoin: (choices: {
    username: string;
    avatarId: string;
    avatarBgColor: string;
    videoEnabled: boolean;
    audioEnabled: boolean;
  }) => void;
}

export const PopSpacePreJoin: React.FC<PopSpacePreJoinProps> = ({ roomName, onJoin }) => {
  const [selectedTheme, setSelectedTheme] = useState<AvatarMeta>(EXECUTIVE_THEMES[0]);
  const [username, setUsername] = useState('');
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(false);

  // Local camera preview stream
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let active = true;

    if (isVideoOn) {
      navigator.mediaDevices
        ?.getUserMedia({ video: true, audio: false })
        .then((stream) => {
          if (!active) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.warn('Could not access camera for preview:', err);
          setIsVideoOn(false);
        });
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isVideoOn]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = username.trim() || 'Guest Member';
    onJoin({
      username: finalName,
      avatarId: selectedTheme.id,
      avatarBgColor: selectedTheme.bgColor,
      videoEnabled: isVideoOn,
      audioEnabled: isMicOn,
    });
  };

  const initials = getInitials(username || 'Morrow');

  return (
    <div
      style={{
        minHeight: '100dvh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F8FAFC',
        padding: '16px',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Subtle background mesh */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          opacity: 0.6,
          pointerEvents: 'none',
        }}
      />

      {/* Main Join Card */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '430px',
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          padding: '28px 24px',
          boxShadow: '0 20px 48px rgba(15, 23, 42, 0.08), 0 2px 6px rgba(0, 0, 0, 0.03)',
          border: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 10,
        }}
      >
        {/* Header Tag */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#EEF2FF',
            color: '#4338CA',
            fontSize: '11px',
            fontWeight: 700,
            padding: '4px 12px',
            borderRadius: '999px',
            marginBottom: '14px',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          <ShieldCheck size={13} color="#4F46E5" />
          <span>Room: {roomName}</span>
        </div>

        <h1
          style={{
            fontSize: '22px',
            fontWeight: 800,
            color: '#0F172A',
            letterSpacing: '-0.02em',
            margin: '0 0 6px 0',
            textAlign: 'center',
          }}
        >
          Ready to join?
        </h1>
        <p
          style={{
            fontSize: '13px',
            color: '#64748B',
            margin: '0 0 20px 0',
            textAlign: 'center',
          }}
        >
          Check your camera, microphone, and presence
        </p>

        {/* Live Preview Bubble */}
        <div
          style={{
            position: 'relative',
            width: '104px',
            height: '104px',
            borderRadius: '50%',
            overflow: 'hidden',
            backgroundColor: '#0F172A',
            border: '3px solid #FFFFFF',
            boxShadow: '0 12px 30px rgba(15, 23, 42, 0.15)',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isVideoOn ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)',
              }}
            />
          ) : (
            <Avatar
              name={selectedTheme.id}
              initials={initials}
              size={104}
              animation={AvatarAnimationState.Idle}
            />
          )}
        </div>

        {/* Quick Mic / Cam Preview Toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <button
            type="button"
            onClick={() => setIsMicOn(!isMicOn)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '999px',
              border: `1px solid ${isMicOn ? '#E2E8F0' : '#FCA5A5'}`,
              backgroundColor: isMicOn ? '#F8FAFC' : '#FEF2F2',
              color: isMicOn ? '#334155' : '#EF4444',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {isMicOn ? <Mic size={14} /> : <MicOff size={14} />}
            <span>{isMicOn ? 'Mic On' : 'Muted'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsVideoOn(!isVideoOn)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '999px',
              border: `1px solid ${isVideoOn ? '#C7D2FE' : '#E2E8F0'}`,
              backgroundColor: isVideoOn ? '#EEF2FF' : '#F8FAFC',
              color: isVideoOn ? '#4F46E5' : '#334155',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {isVideoOn ? <Video size={14} /> : <VideoOff size={14} />}
            <span>{isVideoOn ? 'Camera On' : 'Avatar Mode'}</span>
          </button>
        </div>

        {/* Join Form */}
        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Name Input */}
          <div style={{ width: '100%' }}>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 700,
                color: '#475569',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '6px',
              }}
            >
              Your Name
            </label>
            <input
              type="text"
              placeholder="e.g. Emmanuel Enyi"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: '#F8FAFC',
                border: '1.5px solid #E2E8F0',
                borderRadius: '12px',
                fontSize: '16px', // Prevents iOS Safari auto-zoom
                color: '#0F172A',
                fontWeight: 600,
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s ease',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#4F46E5')}
              onBlur={(e) => (e.target.style.borderColor = '#E2E8F0')}
            />
          </div>

          {/* Theme Color Selector */}
          <div style={{ width: '100%' }}>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 700,
                color: '#475569',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '6px',
              }}
            >
              Presence Theme
            </label>
            <div
              style={{
                display: 'flex',
                gap: '8px',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '4px 0',
              }}
            >
              {EXECUTIVE_THEMES.map((th) => {
                const isSelected = th.id === selectedTheme.id;
                return (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => setSelectedTheme(th)}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: th.gradient || th.bgColor,
                      border: isSelected ? '2.5px solid #0F172A' : '2px solid transparent',
                      boxShadow: isSelected ? '0 0 0 2px #FFFFFF, 0 4px 10px rgba(0,0,0,0.15)' : 'none',
                      cursor: 'pointer',
                      padding: 0,
                      transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                      transition: 'all 0.15s ease',
                    }}
                    title={th.label}
                  />
                );
              })}
            </div>
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '13px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: '#0F172A',
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              marginTop: '4px',
              boxShadow: '0 8px 20px rgba(15, 23, 42, 0.15)',
              transition: 'background-color 0.15s ease, transform 0.1s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1E293B')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0F172A')}
          >
            <span>Enter Meeting Room</span>
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
