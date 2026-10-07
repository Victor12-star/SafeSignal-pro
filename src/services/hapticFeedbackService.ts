/**
 * Tactical Haptic Feedback Service
 *
 * Calibrated sensory vibration cadences designed for physical, eyes-free differentiation:
 * - High-intensity prolonged shockwave pulses for acute emergency triggers
 * - Covert low-resonance micro-cadences for Silent SOS
 * - Gentle reassuring "Heartbeat" pulses for recipient acknowledgment
 * - Ascending release cadences for incident resolution
 */

export type HapticType =
  | 'EMERGENCY_LOUD'
  | 'EMERGENCY_SILENT'
  | 'HOLD_TICK'
  | 'HOLD_ESCALATE'
  | 'RECIPIENT_ACKNOWLEDGED'
  | 'INCIDENT_RESOLVED'
  | 'LOW_BATTERY_WARNING'
  | 'PACKET_DELIVERED'
  | 'STANDARD_TAP';

export interface HapticPatternDefinition {
  type: HapticType;
  name: string;
  category: 'EMERGENCY_TRIGGER' | 'STANDARD_ACKNOWLEDGMENT' | 'SYSTEM_WARNING';
  pattern: number[];
  description: string;
  sensoryProfile: string;
}

export const HAPTIC_PATTERNS: Record<HapticType, HapticPatternDefinition> = {
  EMERGENCY_LOUD: {
    type: 'EMERGENCY_LOUD',
    name: 'Emergency SOS Trigger (High Urgency)',
    category: 'EMERGENCY_TRIGGER',
    // Prolonged heavy triple-shockwave: 600ms on, 150ms off, 600ms on, 150ms off, 900ms on
    pattern: [600, 150, 600, 150, 900],
    description: 'Deep, high-inertia triple-shockwave cadence unmistakable in winter pockets or bags.',
    sensoryProfile: 'Heavy prolonged vibration shockwave (2.4s total)',
  },
  EMERGENCY_SILENT: {
    type: 'EMERGENCY_SILENT',
    name: 'Silent SOS Trigger (Covert Tactile)',
    category: 'EMERGENCY_TRIGGER',
    // Ultra-crisp covert pulse: 90ms on, 70ms off, 110ms on (minimal motor acoustics)
    pattern: [90, 70, 110],
    description: 'Crisp micro-cadence easily felt by holding fingers but virtually inaudible to bystanders.',
    sensoryProfile: 'Covert double-tap with suppressed acoustic resonance (0.27s total)',
  },
  HOLD_TICK: {
    type: 'HOLD_TICK',
    name: 'SOS Hold Progress Tick',
    category: 'EMERGENCY_TRIGGER',
    pattern: [25],
    description: 'Metronome haptic tick indicating active 2.0s hold progression.',
    sensoryProfile: 'Sharp 25ms tick',
  },
  HOLD_ESCALATE: {
    type: 'HOLD_ESCALATE',
    name: 'SOS Hold 80% Threshold',
    category: 'EMERGENCY_TRIGGER',
    pattern: [45, 30, 45],
    description: 'Rapid double-tick warning the user that SOS activation is imminent.',
    sensoryProfile: 'Quick escalation double-burst',
  },
  RECIPIENT_ACKNOWLEDGED: {
    type: 'RECIPIENT_ACKNOWLEDGED',
    name: 'Recipient Acknowledgment ("Help is Coming")',
    category: 'STANDARD_ACKNOWLEDGMENT',
    // Gentle reassuring "Heartbeat" cadence (Lub-DUB): 80ms on, 120ms rest, 180ms on
    pattern: [80, 120, 180],
    description: 'Gentle "Heartbeat" cadence signalling trusted contact has opened map and is responding.',
    sensoryProfile: 'Organic human heartbeat pulse (Lub-DUB, 0.38s total)',
  },
  INCIDENT_RESOLVED: {
    type: 'INCIDENT_RESOLVED',
    name: 'Incident Resolved ("All Clear")',
    category: 'STANDARD_ACKNOWLEDGMENT',
    // Ascending melodic cadence: 50ms on, 60ms off, 80ms on, 60ms off, 140ms on
    pattern: [50, 60, 80, 60, 140],
    description: 'Harmonic ascending release of tension confirming the user has marked themselves safe.',
    sensoryProfile: 'Ascending triple-release pulse (0.39s total)',
  },
  LOW_BATTERY_WARNING: {
    type: 'LOW_BATTERY_WARNING',
    name: 'Critical Low Battery Alert (<15%)',
    category: 'SYSTEM_WARNING',
    // Staccato urgent warning: 200ms on, 80ms off, 200ms on, 80ms off, 350ms on
    pattern: [200, 80, 200, 80, 350],
    description: 'Sharp staccato pulse alerting user that device power is dying.',
    sensoryProfile: 'Urgent rhythmic warning pulse (0.91s total)',
  },
  PACKET_DELIVERED: {
    type: 'PACKET_DELIVERED',
    name: 'Cloud Packet Synced',
    category: 'STANDARD_ACKNOWLEDGMENT',
    pattern: [40, 40, 50],
    description: 'Subtle micro-pulse confirming queued emergency packet reached the cloud gateway.',
    sensoryProfile: 'Gentle micro-tap',
  },
  STANDARD_TAP: {
    type: 'STANDARD_TAP',
    name: 'Standard Control Tap',
    category: 'STANDARD_ACKNOWLEDGMENT',
    pattern: [25],
    description: 'Crisp tactile confirmation for general interface controls.',
    sensoryProfile: 'Single clean tick',
  },
};

class HapticFeedbackService {
  private isSupported: boolean = false;
  private lastTriggeredPattern: HapticType | null = null;
  private listeners: Set<(type: HapticType) => void> = new Set();

  constructor() {
    this.isSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;
  }

  public getIsSupported(): boolean {
    return this.isSupported;
  }

  public getLastTriggered(): HapticType | null {
    return this.lastTriggeredPattern;
  }

  public subscribe(cb: (type: HapticType) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  /**
   * Primary dispatcher for sensory haptic patterns
   */
  public trigger(type: HapticType): boolean {
    this.lastTriggeredPattern = type;
    this.listeners.forEach((cb) => cb(type));

    if (!this.isSupported) {
      return false;
    }

    try {
      const def = HAPTIC_PATTERNS[type];
      if (def && navigator.vibrate) {
        navigator.vibrate(def.pattern);
        return true;
      }
    } catch {
      // Ignore background or user gesture permission rejections
    }
    return false;
  }

  public stop(): void {
    if (this.isSupported && navigator.vibrate) {
      try {
        navigator.vibrate(0);
      } catch {}
    }
  }
}

export const hapticFeedbackService = new HapticFeedbackService();
