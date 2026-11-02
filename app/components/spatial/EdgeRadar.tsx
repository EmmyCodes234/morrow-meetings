'use client';

import React from 'react';
import { SpatialParticipantState } from './types';
import { ArrowUpRight } from 'lucide-react';

interface EdgeRadarProps {
  peers: SpatialParticipantState[];
  viewportWidth: number;
  viewportHeight: number;
  canvasPan: { x: number; y: number };
  canvasZoom: number;
  onFocusPeer: (peer: SpatialParticipantState) => void;
}

export const EdgeRadar: React.FC<EdgeRadarProps> = ({
  peers,
  viewportWidth,
  viewportHeight,
  canvasPan,
  canvasZoom,
  onFocusPeer,
}) => {
  if (viewportWidth === 0 || viewportHeight === 0) return null;

  return (
    <>
      {peers.map((peer) => {
        // Calculate peer screen position
        const screenX = peer.x * canvasZoom + canvasPan.x;
        const screenY = peer.y * canvasZoom + canvasPan.y;

        const margin = 40;
        const isOffscreen =
          screenX < margin ||
          screenX > viewportWidth - margin ||
          screenY < margin ||
          screenY > viewportHeight - margin;

        if (!isOffscreen) return null;

        // Clamp to screen edges
        const clampedX = Math.max(margin, Math.min(viewportWidth - margin, screenX));
        const clampedY = Math.max(margin, Math.min(viewportHeight - margin, screenY));

        return (
          <button
            key={peer.identity}
            onClick={() => onFocusPeer(peer)}
            style={{
              position: 'fixed',
              left: clampedX,
              top: clampedY,
              transform: 'translate(-50%, -50%)',
              zIndex: 90,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: '#FFFFFF',
              borderRadius: '999px',
              border: `2px solid ${peer.avatarColor || '#9993EB'}`,
              boxShadow: '0 4px 14px rgba(60, 50, 40, 0.15)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              touchAction: 'manipulation',
            }}
          >
            <span style={{ fontSize: '13px' }}>{peer.avatarEmoji || '😊'}</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#2D3139' }}>{peer.name}</span>
            <ArrowUpRight size={13} color="#949CBA" />
          </button>
        );
      })}
    </>
  );
};
