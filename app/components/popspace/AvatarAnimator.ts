export enum AvatarAnimationState {
  Idle = 'Idle',
  Talking = 'Talking',
}

export interface SpriteSheetFrameData {
  frame: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  rotated: boolean;
  trimmed: boolean;
  spriteSourceSize: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  sourceSize: {
    w: number;
    h: number;
  };
}

export interface SpriteSheetData {
  frames: Record<string, SpriteSheetFrameData>;
  meta: {
    app: string;
    version: string;
    image: string;
    format: string;
    size: {
      w: number;
      h: number;
    };
    scale: number;
  };
}

export interface AvatarSpriteSheetSet {
  spritesheetSrc: string;
  spritesheetData: SpriteSheetData;
  animations: Record<AvatarAnimationState, {
    frames: string[];
    timings: ([number, number] | number)[];
    type: 'sequential' | 'random';
  }>;
}

export class AvatarAnimator {
  private ctx: CanvasRenderingContext2D;
  private image: HTMLImageElement;
  private rafHandle = 0;
  private activeState: AvatarAnimationState = AvatarAnimationState.Idle;
  private frameNumber = 0;
  private nextFrameDuration = 0;
  private elapsedFrameTime = 0;
  private lastFrameTime = performance.now();
  private imageLoaded = false;

  constructor(private canvas: HTMLCanvasElement, private data: AvatarSpriteSheetSet) {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get 2d context for canvas element');
    }
    this.ctx = ctx;
    this.image = new Image();
    this.image.src = data.spritesheetSrc;
    this.image.onload = () => {
      this.imageLoaded = true;
      this.drawCurrentFrame();
    };
  }

  public start() {
    this.lastFrameTime = performance.now();
    this.calculateNextFrameDuration();
    this.loop();
  }

  public stop() {
    cancelAnimationFrame(this.rafHandle);
  }

  public setState(state: AvatarAnimationState) {
    if (this.activeState === state) return;
    this.activeState = state;
    this.frameNumber = 0;
    this.elapsedFrameTime = 0;
    this.calculateNextFrameDuration();
    this.drawCurrentFrame();
  }

  private calculateNextFrameDuration() {
    const animation = this.data.animations[this.activeState];
    if (!animation) return;
    const timing = animation.timings[this.frameNumber];
    if (Array.isArray(timing)) {
      const [min, max] = timing;
      this.nextFrameDuration = Math.random() * (max - min) + min;
    } else {
      this.nextFrameDuration = timing || 150;
    }
  }

  private advanceFrame() {
    const animation = this.data.animations[this.activeState];
    if (!animation) return;

    if (animation.type === 'random') {
      this.frameNumber = Math.floor(Math.random() * animation.frames.length);
    } else {
      this.frameNumber = (this.frameNumber + 1) % animation.frames.length;
    }
    this.calculateNextFrameDuration();
  }

  private loop = () => {
    const now = performance.now();
    const delta = now - this.lastFrameTime;
    this.lastFrameTime = now;
    this.elapsedFrameTime += delta;

    if (this.elapsedFrameTime >= this.nextFrameDuration) {
      this.elapsedFrameTime = 0;
      this.advanceFrame();
      this.drawCurrentFrame();
    }

    this.rafHandle = requestAnimationFrame(this.loop);
  };

  private drawCurrentFrame() {
    if (!this.imageLoaded) return;
    const animation = this.data.animations[this.activeState];
    if (!animation) return;
    const frameName = animation.frames[this.frameNumber];
    const frameMeta = this.data.spritesheetData.frames[frameName];
    if (!frameMeta) return;

    const { x, y, w, h } = frameMeta.frame;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Center image inside canvas maintaining aspect ratio
    const scale = Math.min(this.canvas.width / w, this.canvas.height / h);
    const drawW = w * scale;
    const drawH = h * scale;
    const drawX = (this.canvas.width - drawW) / 2;
    const drawY = (this.canvas.height - drawH) / 2;

    this.ctx.drawImage(this.image, x, y, w, h, drawX, drawY, drawW, drawH);
  }
}
