'use client';

import React, { useEffect, useRef, useState } from 'react';
import { POPSPACE_AVATARS, AvatarMeta, getRandomAvatar } from './avatarMetadata';
import { Avatar } from './Avatar';
import { AvatarAnimationState } from './AvatarAnimator';
import { Mic, MicOff, Video, VideoOff, Sparkles, ArrowRight } from 'lucide-react';

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
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarMeta>(() => getRandomAvatar());
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
    const finalName = username.trim() || selectedAvatar.label;
    onJoin({
      username: finalName,
      avatarId: selectedAvatar.id,
      avatarBgColor: selectedAvatar.bgColor,
      videoEnabled: isVideoOn,
      audioEnabled: isMicOn,
    });
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF8F0', // PopSpace warm paper background
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Dot Grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(#D4CEBA 1.2px, transparent 1.2px)',
          backgroundSize: '32px 32px',
          opacity: 0.5,
          pointerEvents: 'none',
        }}
      />

      {/* Main Drop-In Card */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          padding: '32px 28px',
          boxShadow: '0 16px 48px rgba(60, 50, 40, 0.12), 0 2px 6px rgba(0,0,0,0.04)',
          border: '1px solid #EAE5DF',
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
            backgroundColor: '#FFF5DD',
            color: '#7C4F00',
            fontSize: '12px',
            fontWeight: 700,
            padding: '4px 12px',
            borderRadius: '999px',
            marginBottom: '16px',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          <Sparkles size={13} color="#F1A41D" />
          <span>Space: {roomName}</span>
        </div>

        <h2
          style={{
            fontSize: '24px',
            fontWeight: 800,
            color: '#2D3139',
            letterSpacing: '-0.02em',
            margin: '0 0 20px 0',
            textAlign: 'center',
          }}
        >
          Choose your look
        </h2>

        {/* Avatar / Camera Preview Bubble */}
        <div
          style={{
            position: 'relative',
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            overflow: 'hidden',
            backgroundColor: selectedAvatar.bgColor,
            border: '4px solid #FFFFFF',
            boxShadow: '0 10px 28px rgba(60, 50, 40, 0.14)',
            marginBottom: '16px',
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
            <Avatar name={selectedAvatar.id} size={110} animation={AvatarAnimationState.Idle} />
          )}
        </div>

        {/* Quick Mic / Cam Preview Toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <button
            type="button"
            onClick={() => setIsMicOn(!isMicOn)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '999px',
              border: 'none',
              backgroundColor: isMicOn ? '#F4F5F8' : '#FDEEEC',
              color: isMicOn ? '#2D3139' : '#EE6659',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {isMicOn ? <Mic size={14} /> : <MicOff size={14} />}
            <span>{isMicOn ? 'Mic On' : 'Mic Off'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsVideoOn(!isVideoOn)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '999px',
              border: 'none',
              backgroundColor: isVideoOn ? '#F4F5F8' : '#FDEEEC',
              color: isVideoOn ? '#2D3139' : '#EE6659',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {isVideoOn ? <Video size={14} /> : <VideoOff size={14} />}
            <span>{isVideoOn ? 'Camera On' : 'Avatar Mode'}</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Character Selector Horizontal Scroll */}
          <div style={{ width: '100%' }}>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 700,
                color: '#575F75',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '8px',
              }}
            >
              Select Character
            </label>
            <div
              style={{
                display: 'flex',
                gap: '10px',
                overflowX: 'auto',
                paddingBottom: '8px',
                scrollSnapType: 'x mandatory',
                scrollbarWidth: 'none',
              }}
            >
              {POPSPACE_AVATARS.slice(0, 15).map((av) => {
                const isSelected = av.id === selectedAvatar.id;
                return (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => setSelectedAvatar(av)}
                    style={{
                      flex: '0 0 auto',
                      width: '52px',
                      height: '52px',
                      borderRadius: '50%',
                      backgroundColor: av.bgColor,
                      border: isSelected ? '3px solid #F1A41D' : '2px solid transparent',
                      boxShadow: isSelected ? '0 4px 12px rgba(241, 164, 29, 0.4)' : 'none',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                      transition: 'all 0.15s ease',
                    }}
                    title={av.label}
                  >
                    <Avatar name={av.id} size={48} animation={AvatarAnimationState.Idle} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Name Input */}
          <div style={{ width: '100%' }}>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 700,
                color: '#575F75',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '8px',
              }}
            >
              Your Name
            </label>
            <input
              type="text"
              placeholder={`e.g. ${selectedAvatar.label}`}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: '#F4F5F8',
                border: '1px solid #EAE5DF',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 600,
                color: '#2D3139',
                outline: 'none',
              }}
            />
          </div>

          {/* Enter Space Button */}
          <button
            type="submit"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '14px',
              backgroundColor: '#F1A41D',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '999px',
              fontSize: '15px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 6px 18px rgba(241, 164, 29, 0.35)',
              marginTop: '8px',
              transition: 'all 0.15s ease',
            }}
          >
            <span>Enter Space</span>
            <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};
