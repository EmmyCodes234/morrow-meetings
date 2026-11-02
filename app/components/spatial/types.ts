export interface Vector2 {
  x: number;
  y: number;
}

export type WidgetType = 'sticky' | 'youtube' | 'screenshare';

export interface BaseWidget {
  id: string;
  type: WidgetType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  creatorId: string;
}

export interface StickyNoteWidget extends BaseWidget {
  type: 'sticky';
  text: string;
  color: 'mandarin' | 'lavender' | 'oregano' | 'cherry' | 'blueberry';
}

export interface YouTubeWidget extends BaseWidget {
  type: 'youtube';
  youtubeId: string;
  isPlaying: boolean;
  timestamp: number;
  playStartedUtc: number | null;
}

export interface ScreenShareWidget extends BaseWidget {
  type: 'screenshare';
  participantIdentity: string;
}

export type CanvasWidget = StickyNoteWidget | YouTubeWidget | ScreenShareWidget;

export interface SpatialParticipantState {
  identity: string;
  name: string;
  x: number;
  y: number;
  avatarColor: string;
  avatarEmoji?: string;
  avatarId?: string;
  lastActive: number;
}

export type SpatialDataPacket =
  | { type: 'pos'; id: string; x: number; y: number }
  | {
      type: 'hello';
      id: string;
      name: string;
      x: number;
      y: number;
      avatarColor: string;
      avatarEmoji?: string;
      avatarId?: string;
    }
  | {
      type: 'profile';
      id: string;
      name: string;
      avatarColor: string;
      avatarEmoji?: string;
      avatarId?: string;
    }
  | { type: 'widget_add'; widget: CanvasWidget }
  | { type: 'widget_update'; id: string; updates: Partial<CanvasWidget> }
  | { type: 'widget_delete'; id: string }
  | { type: 'global_audio'; enabled: boolean };
