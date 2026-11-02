'use client';

import React from 'react';
import { SpatialParticipantState } from './types';
import { ArrowUpRight } from 'lucide-react';
import { getInitials } from '../popspace/avatarMetadata';

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

        const margin = 36;
        const isOffscreen =
          screenX < margin ||
          screenX > viewportWidth - margin ||
          screenY < margin ||
          screenY > viewportHeight - margin;

        if (!isOffscreen) return null;

        // Clamp to screen edges
        const clampedX = Math.max(margin, Math.min(viewportWidth - margin, screenX));
        const clampedY = Math.max(margin, Math.min(viewportHeight - margin, screenY));

        const initials = getInitials(peer.name);

        return (
          <button
            key={peer.identity}
            className="ui-interactive"
            onClick={(e) => {
              e.stopPropagation();
              onFocusPeer(peer);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              left: clampedX,
              top: clampedY,
              transform: 'translate(-50%, -50%)',
              zIndex: 90,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 10px',
              backgroundColor: '#FFFFFF',
              borderRadius: '999px',
              border: `1.5px solid ${peer.avatarColor || '#4F46E5'}`,
              boxShadow: '0 4px 14px rgba(15, 23, 42, 0.12)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              touchAction: 'manipulation',
            }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                backgroundColor: peer.avatarColor || '#4F46E5',
                color: '#FFFFFF',
                fontSize: '9px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {initials}
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#1E293B' }}>{peer.name}</span>
            <ArrowUpRight size={12} color="#94A3B8" />
          </button>
        );
      })}
    </>
  );
};
