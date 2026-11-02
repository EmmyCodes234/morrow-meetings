'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AvatarAnimationState, AvatarAnimator, AvatarSpriteSheetSet } from './AvatarAnimator';

const spriteCache = new Map<string, AvatarSpriteSheetSet>();

export interface AvatarProps {
  name: string;
  size?: number;
  animation?: AvatarAnimationState;
  className?: string;
  style?: React.CSSProperties;
}

export const Avatar: React.FC<AvatarProps> = ({
  name = 'avocado',
  size = 96,
  animation = AvatarAnimationState.Idle,
  className,
  style,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [spriteData, setSpriteData] = useState<AvatarSpriteSheetSet | null>(() => spriteCache.get(name) || null);
  const animatorRef = useRef<AvatarAnimator | null>(null);

  // Fetch spritesheet data if not cached
  useEffect(() => {
    if (spriteCache.has(name)) {
      setSpriteData(spriteCache.get(name)!);
      return;
    }

    let isMounted = true;
    fetch(`/avatars/spritesheets/${name}/spritesheet.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`Avatar ${name} not found`);
        return res.json();
      })
      .then((json) => {
        const fullSet: AvatarSpriteSheetSet = {
          spritesheetSrc: `/avatars/spritesheets/${name}/spritesheet.png`,
          spritesheetData: json.spritesheetData,
          animations: json.animations,
        };
        spriteCache.set(name, fullSet);
        if (isMounted) {
          setSpriteData(fullSet);
        }
      })
      .catch((err) => {
        console.warn(`Could not load avatar ${name}, falling back:`, err);
      });

    return () => {
      isMounted = false;
    };
  }, [name]);

  // Set up animator on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !spriteData) return;

    // Retina DPI scale
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;

    const animator = new AvatarAnimator(canvas, spriteData);
    animator.start();
    animator.setState(animation);
    animatorRef.current = animator;

    return () => {
      animator.stop();
      animatorRef.current = null;
    };
  }, [spriteData, size]);

  // Update animation state (Idle vs Talking)
  useEffect(() => {
    if (animatorRef.current) {
      animatorRef.current.setState(animation);
    }
  }, [animation]);

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: size,
          height: size,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};
