'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Room,
  RoomEvent,
  Participant,
  RemoteParticipant,
  Track,
  RemoteTrackPublication,
  RemoteAudioTrack,
} from 'livekit-client';
import { useLocalParticipant, useRemoteParticipants } from '@livekit/components-react';
import { PopSpacePersonBubble } from '../popspace/PopSpacePersonBubble';
import { PopSpaceActionBar } from '../popspace/PopSpaceActionBar';
import { MeetingTemplatesModal, TemplateDefinition, TEMPLATES } from '../popspace/MeetingTemplatesModal';
import { CanvasWidgetsLayer } from './CanvasWidgets';
import { EdgeRadar } from './EdgeRadar';
import { CanvasWidget, SpatialDataPacket, SpatialParticipantState } from './types';
import { calculateDistance, computeProximityVolume } from './proximityAudio';
import {
  Share2,
  Users,
  Volume2,
  Radio,
  Check,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  PhoneOff,
  Plus,
  Navigation,
  StickyNote,
  PlaySquare,
  LayoutTemplate,
} from 'lucide-react';

export interface UserChoices {
  username: string;
  avatarId: string;
  avatarBgColor: string;
  videoEnabled: boolean;
  audioEnabled: boolean;
}

interface SpatialCanvasProps {
  room: Room;
  roomName: string;
  userChoices?: UserChoices;
  template?: string;
}

export const SpatialCanvas: React.FC<SpatialCanvasProps> = ({ room, roomName, userChoices, template }) => {
  const { localParticipant } = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();

  // Canvas Viewport Pan & Zoom
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  // Local Participant Position & Avatar (spawned safely below template widgets)
  const [localPos, setLocalPos] = useState({ x: 400, y: 460 });
  const [localAvatarColor] = useState(() => userChoices?.avatarBgColor || '#FFF5DD');
  const [localAvatarId] = useState(() => userChoices?.avatarId || 'avocado');
  const [isDraggingLocal, setIsDraggingLocal] = useState(false);

  // Modals & Menus State
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  // Remote Participant Positions
  const [peerStates, setPeerStates] = useState<Record<string, SpatialParticipantState>>({});

  // Audio Mode: Proximity vs Global
  const [isGlobalAudio, setIsGlobalAudio] = useState(false);

  // Canvas Widgets (Sticky notes, YouTube, Screen shares)
  const [widgets, setWidgets] = useState<CanvasWidget[]>(() => {
    if (template) {
      const tmpl = TEMPLATES.find((t) => t.id === template);
      if (tmpl) {
        return tmpl.generateWidgets(400, 350);
      }
    }
    return [
      {
        id: 'welcome-sticky',
        type: 'sticky',
        x: 140,
        y: 200,
        text: '✨ Welcome to PopSpace!\n• Drag your avatar to walk\n• Tap anywhere to move\n• Move close to talk naturally',
        color: 'mandarin',
        creatorId: 'system',
      },
    ];
  });

  // Media Controls State
  const [isMicOn, setIsMicOn] = useState(userChoices?.audioEnabled ?? true);
  const [isVideoOn, setIsVideoOn] = useState(userChoices?.videoEnabled ?? true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Canvas viewport sizing
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });

  // Center canvas on local avatar on initial mount
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setViewportSize({ width: clientWidth, height: clientHeight });
        setPan({
          x: clientWidth / 2 - 400 * zoom,
          y: clientHeight / 2 - 300 * zoom,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Broadcast data packet to room
  const broadcastPacket = useCallback(
    (packet: SpatialDataPacket, reliable = true) => {
      if (!room || !room.localParticipant) return;
      try {
        const payload = new TextEncoder().encode(JSON.stringify(packet));
        room.localParticipant.publishData(payload, { reliable });
      } catch (err) {
        console.error('Failed to broadcast spatial packet:', err);
      }
    },
    [room]
  );

  // Handle incoming data channel packets from peers
  useEffect(() => {
    const handleDataReceived = (payload: Uint8Array, participant?: RemoteParticipant) => {
      try {
        const text = new TextDecoder().decode(payload);
        const packet: SpatialDataPacket = JSON.parse(text);

        if (packet.type === 'pos') {
          setPeerStates((prev) => {
            const existing = prev[packet.id];
            return {
              ...prev,
              [packet.id]: {
                identity: packet.id,
                name: participant?.name || packet.id,
                x: packet.x,
                y: packet.y,
                avatarColor: existing?.avatarColor || '#FFF5DD',
                avatarId: existing?.avatarId || 'avocado',
                lastActive: Date.now(),
              },
            };
          });
        } else if (packet.type === 'hello') {
          setPeerStates((prev) => ({
            ...prev,
            [packet.id]: {
              identity: packet.id,
              name: packet.name || packet.id,
              x: packet.x,
              y: packet.y,
              avatarColor: packet.avatarColor || '#FFF5DD',
              avatarId: packet.avatarId || 'avocado',
              lastActive: Date.now(),
            },
          }));
          // Reply with our own position so new peer learns where we are
          broadcastPacket(
            {
              type: 'hello',
              id: room.localParticipant.identity,
              name: room.localParticipant.name || userChoices?.username || room.localParticipant.identity,
              x: localPos.x,
              y: localPos.y,
              avatarColor: localAvatarColor,
              avatarId: localAvatarId,
            },
            true
          );
        } else if (packet.type === 'profile') {
          setPeerStates((prev) => ({
            ...prev,
            [packet.id]: {
              identity: packet.id,
              name: packet.name || packet.id,
              x: prev[packet.id]?.x ?? 550,
              y: prev[packet.id]?.y ?? 350,
              avatarColor: packet.avatarColor || '#FFF5DD',
              avatarId: packet.avatarId || 'avocado',
              lastActive: Date.now(),
            },
          }));
        } else if (packet.type === 'widget_add') {
          setWidgets((prev) => (prev.some((w) => w.id === packet.widget.id) ? prev : [...prev, packet.widget]));
        } else if (packet.type === 'widget_update') {
          setWidgets((prev) =>
            prev.map((w) => (w.id === packet.id ? ({ ...w, ...packet.updates } as CanvasWidget) : w))
          );
        } else if (packet.type === 'widget_delete') {
          setWidgets((prev) => prev.filter((w) => w.id !== packet.id));
        } else if (packet.type === 'global_audio') {
          setIsGlobalAudio(packet.enabled);
        }
      } catch (err) {
        console.error('Error parsing spatial packet:', err);
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);

    // Broadcast hello when joining
    if (room.localParticipant) {
      broadcastPacket(
        {
          type: 'hello',
          id: room.localParticipant.identity,
          name: room.localParticipant.name || userChoices?.username || room.localParticipant.identity,
          x: localPos.x,
          y: localPos.y,
          avatarColor: localAvatarColor,
          avatarId: localAvatarId,
        },
        true
      );
    }

    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room, localPos, localAvatarColor, localAvatarId, userChoices, broadcastPacket]);

  // Clean up departed participants
  useEffect(() => {
    const handleParticipantDisconnected = (participant: RemoteParticipant) => {
      setPeerStates((prev) => {
        const next = { ...prev };
        delete next[participant.identity];
        return next;
      });
      // Remove any screen shares from departed participant
      setWidgets((prev) =>
        prev.filter((w) => !(w.type === 'screenshare' && w.participantIdentity === participant.identity))
      );
    };

    room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
    return () => {
      room.off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
    };
  }, [room]);

  // Automatic Screen Share Widget Placement
  useEffect(() => {
    const handleTrackSubscribed = (track: any, pub: any, participant: RemoteParticipant) => {
      if (track.source === Track.Source.ScreenShare) {
        const screenWidgetId = `screen-${participant.identity}`;
        const peerPos = peerStates[participant.identity] || { x: localPos.x + 120, y: localPos.y };
        setWidgets((prev) => {
          if (prev.some((w) => w.id === screenWidgetId)) return prev;
          return [
            ...prev,
            {
              id: screenWidgetId,
              type: 'screenshare',
              participantIdentity: participant.identity,
              x: peerPos.x + 80,
              y: peerPos.y - 60,
              creatorId: participant.identity,
            },
          ];
        });
      }
    };

    const handleTrackUnsubscribed = (track: any, pub: any, participant: RemoteParticipant) => {
      if (track.source === Track.Source.ScreenShare) {
        const screenWidgetId = `screen-${participant.identity}`;
        setWidgets((prev) => prev.filter((w) => w.id !== screenWidgetId));
      }
    };

    room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);
    room.on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);
    return () => {
      room.off(RoomEvent.TrackSubscribed, handleTrackSubscribed);
      room.off(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);
    };
  }, [room, peerStates, localPos]);

  // Proximity Audio Engine: Adjust audio volume based on Euclidean distance
  useEffect(() => {
    remoteParticipants.forEach((participant) => {
      const peer = peerStates[participant.identity];
      let volume = 1;

      if (!isGlobalAudio && peer) {
        const distance = calculateDistance(localPos.x, localPos.y, peer.x, peer.y);
        volume = computeProximityVolume(distance);
      }

      participant.audioTrackPublications.forEach((pub) => {
        if (pub.track instanceof RemoteAudioTrack) {
          pub.track.setVolume(volume);
        }
      });
    });
  }, [localPos, peerStates, remoteParticipants, isGlobalAudio]);

  // Local Avatar Dragging
  const localDragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);

  const handleLocalPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsDraggingLocal(true);
    localDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: localPos.x,
      initialY: localPos.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDraggingLocal && localDragRef.current) {
      const dx = (e.clientX - localDragRef.current.startX) / zoom;
      const dy = (e.clientY - localDragRef.current.startY) / zoom;
      const newX = Math.round(localDragRef.current.initialX + dx);
      const newY = Math.round(localDragRef.current.initialY + dy);
      setLocalPos({ x: newX, y: newY });
      broadcastPacket({ type: 'pos', id: localParticipant.identity, x: newX, y: newY }, false);
      return;
    }

    if (activeTouchesRef.current.has(e.pointerId)) {
      activeTouchesRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    // Two-finger Pinch-to-zoom on touchscreens
    if (activeTouchesRef.current.size >= 2 && pinchStartDistRef.current && pinchCenterRef.current) {
      const touches = Array.from(activeTouchesRef.current.values());
      const p1 = touches[0];
      const p2 = touches[1];
      const currentDist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      const scale = currentDist / pinchStartDistRef.current;
      const newZoom = Math.min(2.0, Math.max(0.4, Number((pinchStartZoomRef.current * scale).toFixed(2))));

      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const mouseX = pinchCenterRef.current.x - rect.left;
        const mouseY = pinchCenterRef.current.y - rect.top;
        const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
        const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);
        setZoom(newZoom);
        setPan({ x: newPanX, y: newPanY });
      }
      hasDraggedRef.current = true;
      return;
    }

    // Canvas Background Dragging (Panning)
    if (isPanning && panStartRef.current) {
      if (pointerDownPosRef.current) {
        const dist = Math.hypot(e.clientX - pointerDownPosRef.current.x, e.clientY - pointerDownPosRef.current.y);
        if (dist > 8) {
          hasDraggedRef.current = true;
        }
      }
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      setPan({
        x: panStartRef.current.panX + dx,
        y: panStartRef.current.panY + dy,
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    activeTouchesRef.current.delete(e.pointerId);
    if (activeTouchesRef.current.size < 2) {
      pinchStartDistRef.current = null;
      pinchCenterRef.current = null;
    }

    if (isDraggingLocal) {
      setIsDraggingLocal(false);
      localDragRef.current = null;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      // Send one final reliable coordinate packet
      broadcastPacket({ type: 'pos', id: localParticipant.identity, x: localPos.x, y: localPos.y }, true);
    }
    if (isPanning && activeTouchesRef.current.size === 0) {
      setIsPanning(false);
      panStartRef.current = null;
    }
  };

  // Canvas Multi-Touch & Panning State
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const pointerDownPosRef = useRef<{ x: number; y: number } | null>(null);
  const hasDraggedRef = useRef(false);
  const activeTouchesRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef<number>(1);
  const pinchCenterRef = useRef<{ x: number; y: number } | null>(null);

  // Background pointer down (Pan or Tap-to-walk or Pinch-to-zoom)
  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    // Only handle primary button
    if (e.button !== 0) return;

    // Do NOT pan canvas if user pressed any button, input, header, or dialog
    const target = e.target as HTMLElement | null;
    if (
      target?.closest(
        'button, input, textarea, select, a, header, nav, [role="dialog"], [role="button"], .ui-interactive, .modal-backdrop'
      )
    ) {
      return;
    }

    activeTouchesRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Multi-touch Pinch to Zoom on mobile touchscreens
    if (activeTouchesRef.current.size === 2) {
      const [p1, p2] = Array.from(activeTouchesRef.current.values());
      pinchStartDistRef.current = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      pinchStartZoomRef.current = zoom;
      pinchCenterRef.current = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
      hasDraggedRef.current = true;
      setIsPanning(false);
      return;
    }

    if (activeTouchesRef.current.size === 1) {
      pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
      hasDraggedRef.current = false;
      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        panX: pan.x,
        panY: pan.y,
      };
    }
  };

  // Tap to walk: Quick click on canvas floor moves avatar smoothly there
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (isAddMenuOpen) {
      setIsAddMenuOpen(false);
    }
    if (hasDraggedRef.current) return;
    if (!containerRef.current) return;

    // CRITICAL FIX: Do NOT move avatar if user clicked any button, top taskbar, bottom dock, or modal
    const target = e.target as HTMLElement | null;
    if (
      target?.closest(
        'button, input, textarea, select, a, header, nav, [role="dialog"], [role="button"], .ui-interactive, .modal-backdrop'
      )
    ) {
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert screen coordinates to canvas coordinates
    const targetX = Math.round((clickX - pan.x) / zoom);
    const targetY = Math.round((clickY - pan.y) / zoom);

    setLocalPos({ x: targetX, y: targetY });
    broadcastPacket({ type: 'pos', id: localParticipant.identity, x: targetX, y: targetY }, true);
  };

  // Mouse Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    const newZoom = Math.min(2.0, Math.max(0.4, Number((zoom * zoomFactor).toFixed(2))));

    // Zoom centered around mouse
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
    const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  // Media Toggles
  const handleToggleMic = async () => {
    const next = !isMicOn;
    setIsMicOn(next);
    await localParticipant.setMicrophoneEnabled(next);
  };

  const handleToggleVideo = async () => {
    const next = !isVideoOn;
    setIsVideoOn(next);
    await localParticipant.setCameraEnabled(next);
  };

  const handleToggleScreenShare = async () => {
    const next = !isScreenSharing;
    setIsScreenSharing(next);
    await localParticipant.setScreenShareEnabled(next);
  };

  const handleToggleGlobalAudio = () => {
    const next = !isGlobalAudio;
    setIsGlobalAudio(next);
    broadcastPacket({ type: 'global_audio', enabled: next }, true);
  };

  // Widget Actions
  const handleAddSticky = () => {
    const newWidget: CanvasWidget = {
      id: `sticky-${Date.now()}`,
      type: 'sticky',
      x: localPos.x + 80,
      y: localPos.y - 40,
      text: 'New thought...',
      color: 'lavender',
      creatorId: localParticipant.identity,
    };
    setWidgets((prev) => [...prev, newWidget]);
    broadcastPacket({ type: 'widget_add', widget: newWidget }, true);
  };

  const handleAddYouTube = () => {
    const url = prompt('Enter a YouTube Video URL (e.g. https://youtu.be/...):');
    if (!url) return;
    let videoId = '';
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (match && match[1]) {
      videoId = match[1];
    } else {
      videoId = 'jfKfPfyJRdk'; // Chill lofi beats fallback
    }

    const newWidget: CanvasWidget = {
      id: `yt-${Date.now()}`,
      type: 'youtube',
      youtubeId: videoId,
      isPlaying: true,
      timestamp: 0,
      playStartedUtc: Date.now(),
      x: localPos.x - 180,
      y: localPos.y - 200,
      creatorId: localParticipant.identity,
    };
    setWidgets((prev) => [...prev, newWidget]);
    broadcastPacket({ type: 'widget_add', widget: newWidget }, true);
  };

  const handleUpdateWidget = (id: string, updates: Partial<CanvasWidget>) => {
    setWidgets((prev) => prev.map((w) => (w.id === id ? ({ ...w, ...updates } as CanvasWidget) : w)));
    broadcastPacket({ type: 'widget_update', id, updates }, true);
  };

  const handleDeleteWidget = (id: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
    broadcastPacket({ type: 'widget_delete', id }, true);
  };

  const handleSelectTemplate = (tmpl: TemplateDefinition) => {
    const newWidgets = tmpl.generateWidgets(localPos.x, localPos.y);
    setWidgets((prev) => [...prev, ...newWidgets]);
    newWidgets.forEach((w) => {
      broadcastPacket({ type: 'widget_add', widget: w }, true);
    });
    setIsTemplatesOpen(false);
  };

  const handleRecenter = () => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    setPan({
      x: clientWidth / 2 - localPos.x * zoom,
      y: clientHeight / 2 - localPos.y * zoom,
    });
  };

  const handleFocusPeer = (peer: SpatialParticipantState) => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    setPan({
      x: clientWidth / 2 - peer.x * zoom,
      y: clientHeight / 2 - peer.y * zoom,
    });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100vw',
        height: '100dvh',
        overflow: 'hidden',
        backgroundColor: '#F8FAFC',
        userSelect: 'none',
        touchAction: 'none',
      }}
      onPointerDown={handleCanvasPointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClick={handleCanvasClick}
      onWheel={handleWheel}
    >
      {/* Subtle Dot-Grid Floor */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(#CBD5E1 1.2px, transparent 1.2px)`,
          backgroundSize: `${28 * zoom}px ${28 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
          pointerEvents: 'none',
          opacity: 0.6,
        }}
      />

      {/* Modern Room Taskbar */}
      <header
        className="ui-interactive"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '52px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
          zIndex: 80,
        }}
      >
        {/* Left: Brand & Room Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            onClick={() => (window.location.href = '/')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: '15px',
              color: '#0F172A',
              letterSpacing: '-0.02em',
            }}
          >
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#4F46E5',
              }}
            />
            <span>Morrow</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '3px 8px',
              borderRadius: '999px',
              backgroundColor: '#F1F5F9',
              border: '1px solid #E2E8F0',
              fontSize: '11px',
              fontWeight: 700,
              color: '#475569',
            }}
          >
            <span style={{ maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {roomName}
            </span>
            <span style={{ color: '#94A3B8' }}>•</span>
            <Users size={11} />
            <span>{remoteParticipants.length + 1}</span>
          </div>
        </div>

        {/* Center: Media Toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Mic */}
          <button
            onClick={handleToggleMic}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
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
            <span className="hidden sm:inline">{isMicOn ? 'Mute' : 'Unmuted'}</span>
          </button>

          {/* Camera */}
          <button
            onClick={handleToggleVideo}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
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
            <span className="hidden sm:inline">{isVideoOn ? 'Cam On' : 'Avatar'}</span>
          </button>

          {/* Screen Share (Desktop only) */}
          <button
            onClick={handleToggleScreenShare}
            className="hidden md:flex"
            style={{
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
              borderRadius: '999px',
              border: '1px solid #E2E8F0',
              backgroundColor: isScreenSharing ? '#ECFDF5' : '#F8FAFC',
              color: isScreenSharing ? '#059669' : '#334155',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Monitor size={14} />
            <span>{isScreenSharing ? 'Sharing' : 'Share'}</span>
          </button>
        </div>

        {/* Right: Copy Link & Leave */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={handleCopyLink}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 10px',
              borderRadius: '999px',
              border: '1px solid #E2E8F0',
              backgroundColor: '#FFFFFF',
              color: copiedLink ? '#059669' : '#334155',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {copiedLink ? <Check size={13} color="#059669" /> : <Share2 size={13} />}
            <span className="hidden sm:inline">{copiedLink ? 'Copied' : 'Invite'}</span>
          </button>

          <button
            onClick={() => (window.location.href = '/')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
              borderRadius: '999px',
              border: 'none',
              backgroundColor: '#FEF2F2',
              color: '#EF4444',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <PhoneOff size={13} />
            <span className="hidden sm:inline">Leave</span>
          </button>
        </div>
      </header>

      {/* Infinite Scaled & Panned Canvas Layer */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
          transformOrigin: '0 0',
          width: 0,
          height: 0,
          willChange: 'transform',
        }}
      >
        {/* Canvas Widgets (Notes, YouTube, Screens) */}
        <CanvasWidgetsLayer
          widgets={widgets}
          onUpdateWidget={handleUpdateWidget}
          onDeleteWidget={handleDeleteWidget}
          remoteParticipants={remoteParticipants}
          localParticipant={localParticipant}
          zoom={zoom}
        />

        {/* Remote Participants with Authentic PopSpace Animated Sprites */}
        {remoteParticipants.map((participant) => {
          const peer = peerStates[participant.identity];
          const x = peer?.x ?? 550;
          const y = peer?.y ?? 350;
          const dist = calculateDistance(localPos.x, localPos.y, x, y);
          const volPercent = isGlobalAudio ? 100 : Math.round(computeProximityVolume(dist) * 100);

          let avatarId = peer?.avatarId || 'avocado';
          let avatarBgColor = peer?.avatarColor || '#FFF5DD';
          if (participant.metadata) {
            try {
              const meta = JSON.parse(participant.metadata);
              if (meta.avatarId) avatarId = meta.avatarId;
              if (meta.avatarBgColor) avatarBgColor = meta.avatarBgColor;
            } catch (e) {}
          }

          return (
            <PopSpacePersonBubble
              key={participant.identity}
              participant={participant}
              isLocal={false}
              x={x}
              y={y}
              name={peer?.name || participant.name || participant.identity}
              avatarId={avatarId}
              avatarBgColor={avatarBgColor}
              volumePercent={volPercent}
            />
          );
        })}

        {/* Local Participant Bubble with Authentic PopSpace Sprite */}
        <PopSpacePersonBubble
          participant={localParticipant}
          isLocal={true}
          x={localPos.x}
          y={localPos.y}
          name={localParticipant.name || userChoices?.username || 'You'}
          avatarId={userChoices?.avatarId || localAvatarId}
          avatarBgColor={userChoices?.avatarBgColor || localAvatarColor}
          isDragging={isDraggingLocal}
          onPointerDown={handleLocalPointerDown}
          showRangeRing={!isGlobalAudio}
        />
      </div>

      {/* Edge Radar for Mobile & Small Screens */}
      <EdgeRadar
        peers={Object.values(peerStates)}
        viewportWidth={viewportSize.width}
        viewportHeight={viewportSize.height}
        canvasPan={pan}
        canvasZoom={zoom}
        onFocusPeer={handleFocusPeer}
      />

      {/* Modern Viewport Zoom & Recenter Controls */}
      <div
        className="ui-interactive"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          right: '16px',
          bottom: 'calc(max(16px, env(safe-area-inset-bottom, 16px)) + 58px)',
          zIndex: 85,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <button
          onClick={handleRecenter}
          title="Center on my avatar"
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 14px rgba(15, 23, 42, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#1E293B',
            cursor: 'pointer',
          }}
        >
          <Navigation size={16} />
        </button>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 14px rgba(15, 23, 42, 0.08)',
            overflow: 'hidden',
          }}
        >
          <button
            onClick={() => setZoom((z) => Math.min(2.0, Number((z * 1.15).toFixed(2))))}
            title="Zoom In"
            style={{
              width: '38px',
              height: '34px',
              border: 'none',
              borderBottom: '1px solid #E2E8F0',
              backgroundColor: '#FFFFFF',
              color: '#1E293B',
              fontSize: '18px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            +
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.4, Number((z * 0.85).toFixed(2))))}
            title="Zoom Out"
            style={{
              width: '38px',
              height: '34px',
              border: 'none',
              backgroundColor: '#FFFFFF',
              color: '#1E293B',
              fontSize: '18px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            -
          </button>
        </div>
      </div>

      {/* Modern Bottom Action Dock (Add Content & Proximity Audio) */}
      <div
        className="ui-interactive"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          bottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 90,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          maxWidth: 'calc(100vw - 32px)',
        }}
      >
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setIsAddMenuOpen((open) => !open)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              borderRadius: '999px',
              backgroundColor: isAddMenuOpen ? '#F1F5F9' : '#FFFFFF',
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 16px rgba(15, 23, 42, 0.08)',
              color: '#0F172A',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Plus size={15} />
            <span>Add<span className="hidden sm:inline"> Content</span></span>
          </button>

          {/* Add Content Popover Menu */}
          {isAddMenuOpen && (
            <div
              style={{
                position: 'absolute',
                bottom: '50px',
                left: 0,
                width: '200px',
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 12px 32px rgba(15, 23, 42, 0.12)',
                padding: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                zIndex: 100,
              }}
            >
              {/* Sticky Note */}
              <button
                onClick={() => {
                  handleAddSticky();
                  setIsAddMenuOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: '#1E293B',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <StickyNote size={15} color="#D97706" />
                <span>Sticky Note</span>
              </button>

              {/* YouTube Video */}
              <button
                onClick={() => {
                  handleAddYouTube();
                  setIsAddMenuOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: '#1E293B',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <PlaySquare size={15} color="#EF4444" />
                <span>YouTube Player</span>
              </button>

              <div style={{ height: 1, backgroundColor: '#E2E8F0', margin: '4px 6px' }} />

              {/* Room Templates */}
              <button
                onClick={() => {
                  setIsTemplatesOpen(true);
                  setIsAddMenuOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: '#1E293B',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <LayoutTemplate size={15} color="#4F46E5" />
                <span>Room Layouts...</span>
              </button>
            </div>
          )}
        </div>

        <button
          onClick={handleAddSticky}
          className="hidden md:flex"
          style={{
            alignItems: 'center',
            gap: '6px',
            padding: '9px 16px',
            borderRadius: '999px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 16px rgba(15, 23, 42, 0.08)',
            color: '#1E293B',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <span>+ Sticky</span>
        </button>

        <button
          onClick={handleToggleGlobalAudio}
          title={isGlobalAudio ? 'Switch to Proximity Audio' : 'Switch to Room-wide Audio'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '9px 16px',
            borderRadius: '999px',
            backgroundColor: isGlobalAudio ? '#EEF2FF' : '#FFFFFF',
            border: `1px solid ${isGlobalAudio ? '#4F46E5' : '#E2E8F0'}`,
            boxShadow: '0 4px 16px rgba(15, 23, 42, 0.08)',
            color: isGlobalAudio ? '#4338CA' : '#475569',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          <Radio size={14} color={isGlobalAudio ? '#4F46E5' : '#64748B'} />
          <span>{isGlobalAudio ? 'Global' : 'Nearby'}<span className="hidden sm:inline"> Audio</span></span>
        </button>
      </div>

      {/* PopSpace Meeting Templates Modal */}
      <MeetingTemplatesModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />
    </div>
  );
};
