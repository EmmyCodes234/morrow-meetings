'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CanvasWidget, StickyNoteWidget, YouTubeWidget, ScreenShareWidget } from './types';
import { Participant, Track } from 'livekit-client';
import { Trash2, Move, Maximize2, Sparkles, PlaySquare } from 'lucide-react';

interface WidgetLayerProps {
  widgets: CanvasWidget[];
  onUpdateWidget: (id: string, updates: Partial<CanvasWidget>) => void;
  onDeleteWidget: (id: string) => void;
  remoteParticipants: Participant[];
  localParticipant: Participant;
}

const PASTEL_COLORS = {
  mandarin: { bg: '#FFF5DD', border: '#F1A41D', text: '#7C4F00' },
  lavender: { bg: '#F3F2FE', border: '#9993EB', text: '#6259BE' },
  oregano: { bg: '#E4FBF8', border: '#70BBB2', text: '#00786D' },
  cherry: { bg: '#FDEEEC', border: '#EE6659', text: '#9C2F08' },
  blueberry: { bg: '#EEF8FF', border: '#65B2E2', text: '#106CB0' },
};

export const CanvasWidgetsLayer: React.FC<WidgetLayerProps> = ({
  widgets,
  onUpdateWidget,
  onDeleteWidget,
  remoteParticipants,
  localParticipant,
}) => {
  return (
    <>
      {widgets.map((widget) => {
        if (widget.type === 'sticky') {
          return (
            <StickyNoteItem
              key={widget.id}
              widget={widget}
              onUpdate={onUpdateWidget}
              onDelete={onDeleteWidget}
            />
          );
        }
        if (widget.type === 'youtube') {
          return (
            <YouTubeItem
              key={widget.id}
              widget={widget}
              onUpdate={onUpdateWidget}
              onDelete={onDeleteWidget}
            />
          );
        }
        if (widget.type === 'screenshare') {
          const participant =
            localParticipant.identity === widget.participantIdentity
              ? localParticipant
              : remoteParticipants.find((p) => p.identity === widget.participantIdentity);
          return (
            <ScreenShareItem
              key={widget.id}
              widget={widget}
              participant={participant}
              onDelete={onDeleteWidget}
              onUpdate={onUpdateWidget}
            />
          );
        }
        return null;
      })}
    </>
  );
};

// --- STICKY NOTE ---
function StickyNoteItem({
  widget,
  onUpdate,
  onDelete,
}: {
  widget: StickyNoteWidget;
  onUpdate: (id: string, updates: Partial<CanvasWidget>) => void;
  onDelete: (id: string) => void;
}) {
  const [text, setText] = useState(widget.text);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; widgetX: number; widgetY: number } | null>(null);

  const colors = PASTEL_COLORS[widget.color] || PASTEL_COLORS.mandarin;

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      widgetX: widget.x,
      widgetY: widget.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    onUpdate(widget.id, {
      x: Math.round(dragRef.current.widgetX + dx),
      y: Math.round(dragRef.current.widgetY + dy),
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      dragRef.current = null;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: widget.x,
        top: widget.y,
        width: 250,
        minHeight: 180,
        backgroundColor: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: '16px',
        boxShadow: isDragging
          ? '0 18px 36px rgba(60, 50, 40, 0.16), 0 4px 10px rgba(0,0,0,0.06)'
          : '0 8px 24px rgba(60, 50, 40, 0.08), 0 2px 6px rgba(0,0,0,0.04)',
        zIndex: isDragging ? 50 : 20,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        touchAction: 'none',
        userSelect: 'none',
        transition: isDragging ? 'none' : 'box-shadow 0.2s ease',
      }}
    >
      {/* Header with drag handle and delete */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: isDragging ? 'grabbing' : 'grab',
          paddingBottom: '8px',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: colors.text }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: colors.border }} />
          <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.02em' }}>Note</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(widget.id);
          }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            color: '#949CBA',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.15s ease',
          }}
          title="Delete note"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Note Content */}
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          onUpdate(widget.id, { text: e.target.value });
        }}
        placeholder="Type a thought..."
        style={{
          flex: 1,
          width: '100%',
          background: 'transparent',
          border: 'none',
          outline: 'none',
          resize: 'none',
          fontFamily: 'inherit',
          fontSize: '14px',
          lineHeight: '1.5',
          color: '#2D3139',
          fontWeight: 500,
        }}
      />
    </div>
  );
}

// --- YOUTUBE WIDGET ---
function YouTubeItem({
  widget,
  onUpdate,
  onDelete,
}: {
  widget: YouTubeWidget;
  onUpdate: (id: string, updates: Partial<CanvasWidget>) => void;
  onDelete: (id: string) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; widgetX: number; widgetY: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      widgetX: widget.x,
      widgetY: widget.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    onUpdate(widget.id, {
      x: Math.round(dragRef.current.widgetX + dx),
      y: Math.round(dragRef.current.widgetY + dy),
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      dragRef.current = null;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: widget.x,
        top: widget.y,
        width: 360,
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        boxShadow: isDragging
          ? '0 20px 40px rgba(60, 50, 40, 0.2)'
          : '0 8px 24px rgba(60, 50, 40, 0.1)',
        border: '1px solid #EAE5DF',
        overflow: 'hidden',
        zIndex: isDragging ? 50 : 20,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Titlebar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          backgroundColor: '#FFF8F0',
          borderBottom: '1px solid #EAE5DF',
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'none',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <PlaySquare size={15} color="#EE6659" />
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#2D3139' }}>Shared Player</span>
        </div>
        <button
          onClick={() => onDelete(widget.id)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '3px',
            color: '#949CBA',
            borderRadius: '4px',
          }}
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Video Iframe */}
      <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%' }}>
        <iframe
          src={`https://www.youtube.com/embed/${widget.youtubeId}?autoplay=0&enablejsapi=1`}
          title="YouTube video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: 'none',
          }}
        />
      </div>
    </div>
  );
}

// --- SCREEN SHARE WIDGET ---
function ScreenShareItem({
  widget,
  participant,
  onDelete,
  onUpdate,
}: {
  widget: ScreenShareWidget;
  participant?: Participant;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<CanvasWidget>) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; widgetX: number; widgetY: number } | null>(null);

  useEffect(() => {
    if (!participant) return;
    const screenPub = participant.getTrackPublication(Track.Source.ScreenShare);
    if (screenPub?.track && videoRef.current) {
      screenPub.track.attach(videoRef.current);
    }
    return () => {
      if (screenPub?.track && videoRef.current) {
        screenPub.track.detach(videoRef.current);
      }
    };
  }, [participant]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      widgetX: widget.x,
      widgetY: widget.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    onUpdate(widget.id, {
      x: Math.round(dragRef.current.widgetX + dx),
      y: Math.round(dragRef.current.widgetY + dy),
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      dragRef.current = null;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: widget.x,
        top: widget.y,
        width: 440,
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        boxShadow: isDragging
          ? '0 20px 40px rgba(60, 50, 40, 0.2)'
          : '0 8px 24px rgba(60, 50, 40, 0.1)',
        border: '1.5px solid #EAE5DF',
        overflow: 'hidden',
        zIndex: isDragging ? 50 : 20,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          backgroundColor: '#F4F5F8',
          borderBottom: '1px solid #EAE5DF',
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'none',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#2D3139' }}>
          Screen: {participant?.name || widget.participantIdentity}
        </span>
        <button
          onClick={() => onDelete(widget.id)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '3px',
            color: '#949CBA',
            borderRadius: '4px',
          }}
        >
          <Trash2 size={13} />
        </button>
      </div>

      <div style={{ position: 'relative', width: '100%', height: 260, backgroundColor: '#000000' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </div>
    </div>
  );
}
