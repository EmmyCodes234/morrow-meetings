'use client';

import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  Plus,
  Radio,
  Navigation,
  PhoneOff,
  StickyNote,
  PlaySquare,
  LayoutTemplate,
} from 'lucide-react';

interface PopSpaceActionBarProps {
  isMicOn: boolean;
  isVideoOn: boolean;
  isScreenSharing: boolean;
  isGlobalAudio: boolean;
  onToggleMic: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleGlobalAudio: () => void;
  onAddSticky: () => void;
  onAddYouTube: () => void;
  onOpenTemplates: () => void;
  onRecenter: () => void;
  onLeave: () => void;
}

export const PopSpaceActionBar: React.FC<PopSpaceActionBarProps> = ({
  isMicOn,
  isVideoOn,
  isScreenSharing,
  isGlobalAudio,
  onToggleMic,
  onToggleVideo,
  onToggleScreenShare,
  onToggleGlobalAudio,
  onAddSticky,
  onAddYouTube,
  onOpenTemplates,
  onRecenter,
  onLeave,
}) => {
  const [showOmnibar, setShowOmnibar] = useState(false);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'max(20px, env(safe-area-inset-bottom))',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 14px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: '999px',
        border: '1px solid #EAE5DF',
        boxShadow: '0 12px 36px rgba(60, 50, 40, 0.12), 0 2px 6px rgba(0,0,0,0.04)',
        touchAction: 'manipulation',
      }}
    >
      {/* Mic Button */}
      <button
        onClick={onToggleMic}
        title={isMicOn ? 'Mute Mic' : 'Unmute Mic'}
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          border: 'none',
          backgroundColor: isMicOn ? '#F4F5F8' : '#FDEEEC',
          color: isMicOn ? '#2D3139' : '#EE6659',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s ease',
        }}
      >
        {isMicOn ? <Mic size={20} strokeWidth={2.2} /> : <MicOff size={20} strokeWidth={2.2} />}
      </button>

      {/* Camera Button */}
      <button
        onClick={onToggleVideo}
        title={isVideoOn ? 'Turn Off Video' : 'Turn On Video'}
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          border: 'none',
          backgroundColor: isVideoOn ? '#F4F5F8' : '#FDEEEC',
          color: isVideoOn ? '#2D3139' : '#EE6659',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s ease',
        }}
      >
        {isVideoOn ? <Video size={20} strokeWidth={2.2} /> : <VideoOff size={20} strokeWidth={2.2} />}
      </button>

      {/* Screen Share Button */}
      <button
        onClick={onToggleScreenShare}
        title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          border: 'none',
          backgroundColor: isScreenSharing ? '#E4FBF8' : '#F4F5F8',
          color: isScreenSharing ? '#00786D' : '#2D3139',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Monitor size={19} strokeWidth={2.2} />
      </button>

      {/* PopSpace Omnibar (+) Menu Button */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowOmnibar(!showOmnibar)}
          title="Add to Space"
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            border: 'none',
            backgroundColor: showOmnibar ? '#FFEAB6' : '#F4F5F8',
            color: showOmnibar ? '#7C4F00' : '#2D3139',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: showOmnibar ? 'rotate(45deg)' : 'none',
            transition: 'transform 0.2s cubic-bezier(0.2, 0.9, 0.4, 1.1)',
          }}
        >
          <Plus size={22} strokeWidth={2.4} />
        </button>

        {showOmnibar && (
          <div
            style={{
              position: 'absolute',
              bottom: 56,
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#FFFFFF',
              borderRadius: '18px',
              border: '1px solid #EAE5DF',
              boxShadow: '0 16px 40px rgba(60, 50, 40, 0.16)',
              padding: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              minWidth: '180px',
              zIndex: 110,
            }}
          >
            <button
              onClick={() => {
                setShowOmnibar(false);
                onAddSticky();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 12px',
                borderRadius: '12px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                color: '#2D3139',
                textAlign: 'left',
                width: '100%',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FFF5DD')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <StickyNote size={16} color="#F1A41D" />
              <span>Sticky Note</span>
            </button>

            <button
              onClick={() => {
                setShowOmnibar(false);
                onAddYouTube();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 12px',
                borderRadius: '12px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                color: '#2D3139',
                textAlign: 'left',
                width: '100%',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FDEEEC')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <PlaySquare size={16} color="#EE6659" />
              <span>Watch YouTube</span>
            </button>

            <div style={{ height: 1, backgroundColor: '#EAE5DF', margin: '2px 0' }} />

            <button
              onClick={() => {
                setShowOmnibar(false);
                onOpenTemplates();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 12px',
                borderRadius: '12px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                color: '#2D3139',
                textAlign: 'left',
                width: '100%',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F3F2FE')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <LayoutTemplate size={16} color="#9993EB" />
              <span>Room Templates</span>
            </button>
          </div>
        )}
      </div>

      {/* Proximity vs Global Audio Toggle */}
      <button
        onClick={onToggleGlobalAudio}
        title={isGlobalAudio ? 'Switch to Spatial Nearby Audio' : 'Switch to Global Broadcast Audio'}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 14px',
          borderRadius: '999px',
          border: 'none',
          backgroundColor: isGlobalAudio ? '#F3F2FE' : '#F4F5F8',
          color: isGlobalAudio ? '#6259BE' : '#575F75',
          fontSize: '12px',
          fontWeight: 700,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        <Radio size={14} color={isGlobalAudio ? '#6259BE' : '#949CBA'} />
        <span>{isGlobalAudio ? 'Global Audio' : 'Nearby Audio'}</span>
      </button>

      {/* Recenter View Button */}
      <button
        onClick={onRecenter}
        title="Center View On Me"
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          border: 'none',
          backgroundColor: '#F4F5F8',
          color: '#575F75',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Navigation size={18} strokeWidth={2.2} />
      </button>

      {/* Leave Room Button */}
      <button
        onClick={onLeave}
        title="Leave Space"
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          border: 'none',
          backgroundColor: '#EE6659',
          color: '#FFFFFF',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: '4px',
        }}
      >
        <PhoneOff size={19} strokeWidth={2.2} />
      </button>
    </div>
  );
};
