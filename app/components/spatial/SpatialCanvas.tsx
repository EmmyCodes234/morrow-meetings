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
import { MeetingTemplatesModal, TemplateDefinition } from '../popspace/MeetingTemplatesModal';
import { CanvasWidgetsLayer } from './CanvasWidgets';
import { EdgeRadar } from './EdgeRadar';
import { CanvasWidget, SpatialDataPacket, SpatialParticipantState } from './types';
import { calculateDistance, computeProximityVolume } from './proximityAudio';
import { Share2, Users, Volume2, Radio, Check } from 'lucide-react';

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
}

export const SpatialCanvas: React.FC<SpatialCanvasProps> = ({ room, roomName, userChoices }) => {
  const { localParticipant } = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();

  // Canvas Viewport Pan & Zoom
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  // Local Participant Position & Avatar
  const [localPos, setLocalPos] = useState({ x: 400, y: 350 });
  const [localAvatarColor] = useState(() => userChoices?.avatarBgColor || '#FFF5DD');
  const [localAvatarId] = useState(() => userChoices?.avatarId || 'avocado');
  const [isDraggingLocal, setIsDraggingLocal] = useState(false);

  // Templates Modal State
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);

  // Remote Participant Positions
  const [peerStates, setPeerStates] = useState<Record<string, SpatialParticipantState>>({});

  // Audio Mode: Proximity vs Global
  const [isGlobalAudio, setIsGlobalAudio] = useState(false);

  // Canvas Widgets (Sticky notes, YouTube, Screen shares)
  const [widgets, setWidgets] = useState<CanvasWidget[]>([
    {
      id: 'welcome-sticky',
      type: 'sticky',
      x: 140,
      y: 200,
      text: '✨ Welcome to Morrow Spaces!\n• Drag your bubble around\n• Tap anywhere to walk\n• Get close to hear people clearly',
      color: 'mandarin',
      creatorId: 'system',
    },
  ]);

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
          x: clientWidth / 2 - localPos.x,
          y: clientHeight / 2 - localPos.y,
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

    // Canvas Background Dragging (Panning)
    if (isPanning && panStartRef.current) {
      if (pointerDownPosRef.current) {
        const dist = Math.hypot(e.clientX - pointerDownPosRef.current.x, e.clientY - pointerDownPosRef.current.y);
        if (dist > 6) {
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
    if (isDraggingLocal) {
      setIsDraggingLocal(false);
      localDragRef.current = null;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      // Send one final reliable coordinate packet
      broadcastPacket({ type: 'pos', id: localParticipant.identity, x: localPos.x, y: localPos.y }, true);
    }
    if (isPanning) {
      setIsPanning(false);
      panStartRef.current = null;
    }
  };

  // Canvas Panning State
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const pointerDownPosRef = useRef<{ x: number; y: number } | null>(null);
  const hasDraggedRef = useRef(false);

  // Background pointer down (Pan or Tap-to-walk)
  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    // Only handle primary button
    if (e.button !== 0) return;

    pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
    hasDraggedRef.current = false;
    setIsPanning(true);
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
  };

  // Tap to walk: Quick click on canvas floor moves avatar smoothly there
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (hasDraggedRef.current) return;
    if (!containerRef.current) return;
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
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#FFF8F0', // Warm paper canvas background
        userSelect: 'none',
        touchAction: 'none',
      }}
      onPointerDown={handleCanvasPointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={handleCanvasClick}
      onWheel={handleWheel}
    >
      {/* Warm Ambient Dot-Grid Floor */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(#D4CEBA 1.2px, transparent 1.2px)`,
          backgroundSize: `${32 * zoom}px ${32 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
          pointerEvents: 'none',
          opacity: 0.65,
        }}
      />

      {/* Top Header Bar */}
      <header
        style={{
          position: 'fixed',
          top: 'max(16px, env(safe-area-inset-top))',
          left: '20px',
          right: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 80,
          pointerEvents: 'none',
        }}
      >
        {/* Room Title & Participant Count */}
        <div
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 16px',
            backgroundColor: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: '999px',
            border: '1px solid #EAE5DF',
            boxShadow: '0 4px 16px rgba(60, 50, 40, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#2D3139', letterSpacing: '-0.01em' }}>
              {roomName}
            </span>
          </div>

          <div style={{ width: 1, height: 16, backgroundColor: '#EAE5DF' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#575F75', fontSize: '13px' }}>
            <Users size={14} />
            <span style={{ fontWeight: 600 }}>{remoteParticipants.length + 1}</span>
          </div>
        </div>

        {/* Right Action: Share Link Pill */}
        <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleCopyLink}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              backgroundColor: '#FFFFFF',
              borderRadius: '999px',
              border: '1px solid #EAE5DF',
              boxShadow: '0 4px 16px rgba(60, 50, 40, 0.08)',
              color: copiedLink ? '#00786D' : '#2D3139',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {copiedLink ? <Check size={14} color="#00786D" /> : <Share2 size={14} />}
            <span>{copiedLink ? 'Link Copied!' : 'Invite Friends'}</span>
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

      {/* PopSpace Floating Action Dock */}
      <PopSpaceActionBar
        isMicOn={isMicOn}
        isVideoOn={isVideoOn}
        isScreenSharing={isScreenSharing}
        isGlobalAudio={isGlobalAudio}
        onToggleMic={handleToggleMic}
        onToggleVideo={handleToggleVideo}
        onToggleScreenShare={handleToggleScreenShare}
        onToggleGlobalAudio={handleToggleGlobalAudio}
        onAddSticky={handleAddSticky}
        onAddYouTube={handleAddYouTube}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onRecenter={handleRecenter}
        onLeave={() => (window.location.href = '/')}
      />

      {/* PopSpace Meeting Templates Modal */}
      <MeetingTemplatesModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />
    </div>
  );
};
