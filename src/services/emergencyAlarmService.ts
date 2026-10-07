/**
 * Emergency Alarm Service
 * Generates continuous high-decibel acoustic siren alarms using the Web Audio API,
 * triggers urgent mobile device vibration patterns, and requests screen wake-lock
 * so family members and friends hear and notice emergency distress calls even if away from their phone.
 */

class EmergencyAlarmService {
  private audioCtx: AudioContext | null = null;
  private primaryOsc: OscillatorNode | null = null;
  private secondaryOsc: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private modulationInterval: number | null = null;
  private vibrationInterval: number | null = null;
  private wakeLock: any = null;
  private isRinging: boolean = false;
  private listeners: Set<(ringing: boolean) => void> = new Set();

  public subscribe(callback: (ringing: boolean) => void): () => void {
    this.listeners.add(callback);
    callback(this.isRinging);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb(this.isRinging));
  }

  public getIsRinging(): boolean {
    return this.isRinging;
  }

  /**
   * Initializes and starts the loud emergency siren.
   * Modulates between 820Hz and 1240Hz (international emergency broadcast tone)
   */
  public async startAlarm(): Promise<boolean> {
    if (this.isRinging) return true;

    try {
      // 1. Initialize AudioContext
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return false;

      if (!this.audioCtx || this.audioCtx.state === 'closed') {
        this.audioCtx = new AudioContextClass();
      }

      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      // Master Gain for maximum loudness
      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.setValueAtTime(0.85, this.audioCtx.currentTime);
      this.gainNode.connect(this.audioCtx.destination);

      // Primary Oscillator (Piercing square/sawtooth warble)
      this.primaryOsc = this.audioCtx.createOscillator();
      this.primaryOsc.type = 'sawtooth';
      this.primaryOsc.frequency.setValueAtTime(860, this.audioCtx.currentTime);

      // Secondary Oscillator for rich harmonic dissonance (cuts through ambient noise)
      this.secondaryOsc = this.audioCtx.createOscillator();
      this.secondaryOsc.type = 'sine';
      this.secondaryOsc.frequency.setValueAtTime(1180, this.audioCtx.currentTime);

      // Connect oscillators
      const oscGain = this.audioCtx.createGain();
      oscGain.gain.setValueAtTime(0.7, this.audioCtx.currentTime);

      this.primaryOsc.connect(this.gainNode);
      this.secondaryOsc.connect(oscGain);
      oscGain.connect(this.gainNode);

      this.primaryOsc.start();
      this.secondaryOsc.start();

      // Dual-tone sweeping frequency modulation (Ambulance / Emergency Broadcast tone)
      let highTone = false;
      this.modulationInterval = window.setInterval(() => {
        if (!this.audioCtx || !this.primaryOsc || !this.secondaryOsc) return;
        const now = this.audioCtx.currentTime;
        highTone = !highTone;
        const targetFreq1 = highTone ? 1220 : 840;
        const targetFreq2 = highTone ? 960 : 680;

        this.primaryOsc.frequency.exponentialRampToValueAtTime(targetFreq1, now + 0.28);
        this.secondaryOsc.frequency.exponentialRampToValueAtTime(targetFreq2, now + 0.28);
      }, 340);

      // 2. Hardware Vibration for mobile devices across the room
      this.startVibrationLoop();

      // 3. Screen Wake Lock so recipient phone stays lit up and does not sleep
      this.requestWakeLock();

      this.isRinging = true;
      this.notify();
      return true;
    } catch (err) {
      console.warn('Emergency siren autoplay restricted by browser policy:', err);
      // Still trigger vibration and wake lock even if audio context requires gesture
      this.startVibrationLoop();
      this.requestWakeLock();
      this.isRinging = true;
      this.notify();
      return false;
    }
  }

  /**
   * Continuous urgent vibration burst pattern
   */
  private startVibrationLoop() {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([600, 200, 600, 200, 1000]);
        this.vibrationInterval = window.setInterval(() => {
          if (this.isRinging) {
            navigator.vibrate([600, 200, 600, 200, 1000]);
          }
        }, 2600);
      } catch (e) {
        // Ignore vibration errors
      }
    }
  }

  /**
   * Keep device screen turned ON
   */
  private async requestWakeLock() {
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      try {
        this.wakeLock = await (navigator as any).wakeLock.request('screen');
      } catch (e) {
        // WakeLock request ignored if permission not granted
      }
    }
  }

  /**
   * Silences the siren alarm and stops vibration
   */
  public stopAlarm() {
    if (this.modulationInterval) {
      clearInterval(this.modulationInterval);
      this.modulationInterval = null;
    }

    if (this.vibrationInterval) {
      clearInterval(this.vibrationInterval);
      this.vibrationInterval = null;
    }

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(0);
      } catch (e) {
        // Ignore
      }
    }

    if (this.wakeLock) {
      try {
        this.wakeLock.release();
        this.wakeLock = null;
      } catch (e) {
        // Ignore
      }
    }

    if (this.gainNode && this.audioCtx) {
      try {
        this.gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
      } catch (e) {
        // Ignore
      }
    }

    try {
      if (this.primaryOsc) {
        this.primaryOsc.stop();
        this.primaryOsc.disconnect();
        this.primaryOsc = null;
      }
      if (this.secondaryOsc) {
        this.secondaryOsc.stop();
        this.secondaryOsc.disconnect();
        this.secondaryOsc = null;
      }
    } catch (e) {
      // Ignore
    }

    this.isRinging = false;
    this.notify();
  }

  public toggleAlarm() {
    if (this.isRinging) {
      this.stopAlarm();
    } else {
      this.startAlarm();
    }
  }
}

export const emergencyAlarmService = new EmergencyAlarmService();
