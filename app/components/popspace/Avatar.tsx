'use client';

import React from 'react';
import { AvatarAnimationState } from './AvatarAnimator';
import { getInitials, getThemeById } from './avatarMetadata';

export interface AvatarProps {
  name: string; // Theme ID (e.g. 'indigo', 'slate') or user name
  size?: number;
  animation?: AvatarAnimationState;
  className?: string;
  style?: React.CSSProperties;
  initials?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name = 'indigo',
  size = 80,
  animation = AvatarAnimationState.Idle,
  className,
  style,
  initials,
}) => {
  const theme = getThemeById(name);
  const displayInitials = initials || getInitials(name);
  const isSpeaking = animation === AvatarAnimationState.Talking;

  const fontSize = Math.round(size * 0.38);

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: size,
        height: size,
        borderRadius: '50%',
        background: theme.gradient || theme.bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: theme.textColor || '#FFFFFF',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        fontSize: `${fontSize}px`,
        fontWeight: 700,
        letterSpacing: '-0.02em',
        boxShadow: isSpeaking
          ? '0 0 0 3px rgba(16, 185, 129, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.25)'
          : 'inset 0 2px 4px rgba(255, 255, 255, 0.25), 0 4px 14px rgba(0, 0, 0, 0.1)',
        userSelect: 'none',
        flexShrink: 0,
        overflow: 'hidden',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        ...style,
      }}
    >
      <span>{displayInitials}</span>

      {/* Subtle top-light gradient sheen for tactile depth */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '45%',
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0) 100%)',
          borderRadius: '50% 50% 0 0',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};
