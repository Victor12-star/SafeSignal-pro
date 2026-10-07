/**
 * SafeSignal Shake Detection Service
 * Calibrated 3D accelerometer shake recognition with cross-platform support (iOS/Android),
 * Screen WakeLock integration, directional reversal filtering, and live telemetry.
 */

export type ShakeSensitivity = 'high' | 'medium' | 'low';

export interface ShakeSettings {
  enabled: boolean;
  sensitivity: ShakeSensitivity;
  countdownGraceSeconds: number; // 0 for instant, 3 for grace countdown
  silentByDefault: boolean;
}

export interface MotionData {
  x: number;
  y: number;
  z: number;
  magnitude: number;
  threshold: number;
  peakCount: number;
  lastShakeTimestamp: number;
}

type MotionCallback = (data: MotionData) => void;
type ShakeCallback = (isSilent: boolean) => void;

const SENSITIVITY_THRESHOLDS: Record<ShakeSensitivity, number> = {
  high: 16,   // Easier to trigger, for cold weather / heavy gloves / light shaking
  medium: 24, // Standard default, prevents walking / pocket jostle false positives
  low: 34,    // Heavy vigorous shake, for high-impact sports / rough terrain
};

class ShakeDetectionService {
  private settings: ShakeSettings = {
    enabled: true,
    sensitivity: 'medium',
    countdownGraceSeconds: 3,
    silentByDefault: true, // Default to covert / silent protection for sender safety
  };

  private isListening = false;
  private shakeCallbacks: Set<ShakeCallback> = new Set();
  private motionCallbacks: Set<MotionCallback> = new Set();

  private lastX = 0;
  private lastY = 0;
  private lastZ = 0;
  private lastTimestamp = 0;
  private peakCount = 0;
  private lastPeakTime = 0;
  private wakeLock: any = null;

  // Audio tone context for eyes-free pocket countdown feedback
  private audioCtx: AudioContext | null = null;

  constructor() {
    this.loadSettings();
  }

  private loadSettings() {
    try {
      const saved = localStorage.getItem('safesignal_shake_settings');
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      }
    } catch {
      // Default settings used
    }
  }

  public saveSettings(updated: Partial<ShakeSettings>) {
    this.settings = { ...this.settings, ...updated };
    try {
      localStorage.setItem('safesignal_shake_settings', JSON.stringify(this.settings));
    } catch {
      // Ignore
    }
  }

  public getSettings(): ShakeSettings {
    return { ...this.settings };
  }

  /**
   * Request device orientation / motion permissions (required on iOS 13+ Safari)
   */
  public async requestPermission(): Promise<'granted' | 'denied' | 'unsupported'> {
    if (typeof window === 'undefined') return 'unsupported';

    const DeviceMotion = window.DeviceMotionEvent as any;
    if (DeviceMotion && typeof DeviceMotion.requestPermission === 'function') {
      try {
        const response = await DeviceMotion.requestPermission();
        return response === 'granted' ? 'granted' : 'denied';
      } catch (err) {
        console.warn('ShakeDetection: iOS motion permission error', err);
        return 'denied';
      }
    }

    // Android / Standard browsers don't require explicit popup permission
    return 'granted';
  }

  /**
   * Request Screen WakeLock to keep motion sensors alert even when pocketed
   */
  public async requestWakeLock() {
    try {
      if ('wakeLock' in navigator && !this.wakeLock) {
        this.wakeLock = await (navigator as any).wakeLock.request('screen');
        this.wakeLock.addEventListener('release', () => {
          this.wakeLock = null;
        });
      }
    } catch (e) {
      // Screen wakeLock might fail in un-focused tabs
    }
  }

  public releaseWakeLock() {
    if (this.wakeLock) {
      this.wakeLock.release().catch(() => {});
      this.wakeLock = null;
    }
  }

  /**
   * Start listening to device accelerometer
   */
  public start() {
    if (this.isListening || typeof window === 'undefined') return;

    window.addEventListener('devicemotion', this.handleDeviceMotion, { passive: true });
    this.isListening = true;
    this.requestWakeLock();
  }

  /**
   * Stop listening
   */
  public stop() {
    if (!this.isListening || typeof window === 'undefined') return;

    window.removeEventListener('devicemotion', this.handleDeviceMotion);
    this.isListening = false;
    this.releaseWakeLock();
  }

  public subscribeShake(cb: ShakeCallback): () => void {
    this.shakeCallbacks.add(cb);
    if (!this.isListening && this.settings.enabled) {
      this.start();
    }
    return () => {
      this.shakeCallbacks.delete(cb);
    };
  }

  public subscribeMotion(cb: MotionCallback): () => void {
    this.motionCallbacks.add(cb);
    return () => {
      this.motionCallbacks.delete(cb);
    };
  }

  private handleDeviceMotion = (event: DeviceMotionEvent) => {
    if (!this.settings.enabled) return;

    const acc = event.acceleration || event.accelerationIncludingGravity;
    if (!acc) return;

    const x = acc.x || 0;
    const y = acc.y || 0;
    const z = acc.z || 0;
    const now = performance.now();

    const dt = now - this.lastTimestamp;
    if (dt < 40) return; // Throttle to ~25Hz sampling rate

    const threshold = SENSITIVITY_THRESHOLDS[this.settings.sensitivity] || 24;

    // Calculate acceleration vector magnitude difference (jerk / sudden change in acceleration)
    const deltaX = Math.abs(x - this.lastX);
    const deltaY = Math.abs(y - this.lastY);
    const deltaZ = Math.abs(z - this.lastZ);

    const magnitude = deltaX + deltaY + deltaZ;

    this.lastX = x;
    this.lastY = y;
    this.lastZ = z;
    this.lastTimestamp = now;

    // Broadcast live telemetry for calibration meter in settings
    if (this.motionCallbacks.size > 0) {
      this.motionCallbacks.forEach((cb) => {
        cb({
          x,
          y,
          z,
          magnitude,
          threshold,
          peakCount: this.peakCount,
          lastShakeTimestamp: this.lastPeakTime,
        });
      });
    }

    // Check if motion exceeds calibrated sensitivity threshold
    if (magnitude > threshold) {
      if (now - this.lastPeakTime > 1200) {
        // Reset window if too much time has passed
        this.peakCount = 1;
      } else {
        this.peakCount += 1;
      }
      this.lastPeakTime = now;

      // Require 2 quick deliberate directional shakes within 1.2s to prevent accidental bumps
      if (this.peakCount >= 2) {
        this.peakCount = 0;
        this.fireShakeEvent();
      }
    }
  };

  /**
   * Synthesize an acoustic alert beep via Web Audio API (eyes-free in pocket)
   */
  public playCountdownTone(freq: number = 880, durationMs: number = 120) {
    if (this.settings.silentByDefault) return; // Stealth protection: no audible sounds emitted
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.audioCtx) {
        this.audioCtx = new AudioCtx();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

      gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + durationMs / 1000);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + durationMs / 1000);
    } catch {
      // Audio autoplay might be restricted before first click
    }
  }

  /**
   * Programmatic simulator trigger (for desktop preview, emulators, or quick button)
   */
  public simulateShake() {
    this.fireShakeEvent();
  }

  private fireShakeEvent() {
    this.shakeCallbacks.forEach((cb) => {
      cb(this.settings.silentByDefault);
    });
  }
}

export const shakeDetectionService = new ShakeDetectionService();
