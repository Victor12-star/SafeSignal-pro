import React, { useState, useEffect } from 'react';
import { Smartphone, Zap, ShieldAlert, Check, AlertTriangle, Lock, EyeOff } from 'lucide-react';
import {
  shakeDetectionService,
  ShakeSettings,
  MotionData,
  ShakeSensitivity,
} from '../services/shakeDetectionService';
import { hapticFeedbackService } from '../services/hapticFeedbackService';

interface ShakeSettingsCardProps {
  onLockScreen: () => void;
  onSimulateShake: () => void;
}

export const ShakeSettingsCard: React.FC<ShakeSettingsCardProps> = ({
  onLockScreen,
  onSimulateShake,
}) => {
  const [settings, setSettings] = useState<ShakeSettings>(shakeDetectionService.getSettings());
  const [motionData, setMotionData] = useState<MotionData | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'idle' | 'granted' | 'denied' | 'unsupported'>('idle');
  const [testTriggered, setTestTriggered] = useState(false);

  useEffect(() => {
    // Subscribe to live motion data for the calibration gauge
    const unsubscribeMotion = shakeDetectionService.subscribeMotion((data) => {
      setMotionData(data);
    });

    return () => {
      unsubscribeMotion();
    };
  }, []);

  const handleToggle = (enabled: boolean) => {
    const updated = { ...settings, enabled };
    setSettings(updated);
    shakeDetectionService.saveSettings({ enabled });
    if (enabled) {
      shakeDetectionService.start();
    } else {
      shakeDetectionService.stop();
    }
  };

  const handleSensitivityChange = (sensitivity: ShakeSensitivity) => {
    const updated = { ...settings, sensitivity };
    setSettings(updated);
    shakeDetectionService.saveSettings({ sensitivity });
    hapticFeedbackService.trigger('HOLD_TICK');
  };

  const handleCountdownGraceToggle = (graceSeconds: number) => {
    const updated = { ...settings, countdownGraceSeconds: graceSeconds };
    setSettings(updated);
    shakeDetectionService.saveSettings({ countdownGraceSeconds: graceSeconds });
    hapticFeedbackService.trigger('HOLD_TICK');
  };

  const handleSilentToggle = (silentByDefault: boolean) => {
    const updated = { ...settings, silentByDefault };
    setSettings(updated);
    shakeDetectionService.saveSettings({ silentByDefault });
    hapticFeedbackService.trigger('HOLD_TICK');
  };

  const handleRequestPermission = async () => {
    const result = await shakeDetectionService.requestPermission();
    setPermissionStatus(result);
    if (result === 'granted') {
      shakeDetectionService.start();
    }
  };

  const triggerTestShake = () => {
    setTestTriggered(true);
    hapticFeedbackService.trigger('HOLD_ESCALATE');
    if (!settings.silentByDefault) {
      shakeDetectionService.playCountdownTone(1000, 150);
    }
    setTimeout(() => {
      setTestTriggered(false);
      onSimulateShake();
    }, 200);
  };

  // Calculate percentage of threshold reached for gauge visualization
  const currentMag = motionData?.magnitude || 0;
  const currentThreshold = motionData?.threshold || 24;
  const gaugePercent = Math.min((currentMag / (currentThreshold * 1.5)) * 100, 100);
  const thresholdMarkPercent = (currentThreshold / (currentThreshold * 1.5)) * 100;

  return (
    <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4 text-slate-800">
      {/* Header and Master Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-600">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
              <span>Shake-to-Trigger SOS</span>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                Lock Screen Ready
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              Stealth duress trigger faster than 2s on-screen button
            </div>
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => handleToggle(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
        </label>
      </div>

      {settings.enabled && (
        <div className="space-y-4 pt-1 border-t border-slate-100">
          {/* Covert Note */}
          <div className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
            <div className="font-semibold text-slate-800 flex items-center gap-1">
              <EyeOff className="w-3.5 h-3.5 text-slate-600" />
              <span>Covert Attacker Protection:</span>
            </div>
            <p>
              Shaking sends distress signals directly to the Reserve End. No sirens or strobe lights appear on your phone so observers cannot tell you called for help.
            </p>
          </div>

          {/* iOS / Mobile Permission status if needed */}
          {typeof window !== 'undefined' && (window as any).DeviceMotionEvent && (
            <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-slate-700 font-medium">Motion Sensor Permission</span>
              </div>
              {permissionStatus === 'granted' ? (
                <span className="text-emerald-700 flex items-center gap-1 font-semibold text-[11px]">
                  <Check className="w-3 h-3" /> Granted
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleRequestPermission}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-black text-white rounded text-[11px] font-semibold cursor-pointer"
                >
                  Enable Sensor
                </button>
              )}
            </div>
          )}

          {/* Live Accelerometer Calibration Gauge */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Live Accelerometer G-Force</span>
              <span className="font-mono text-slate-800 text-[11px] font-semibold">
                {currentMag.toFixed(1)} m/s² (Target: {currentThreshold} m/s²)
              </span>
            </div>

            {/* Visual Gauge Bar */}
            <div className="relative w-full h-3 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-75 ${
                  currentMag >= currentThreshold ? 'bg-rose-500' : 'bg-slate-700'
                }`}
                style={{ width: `${gaugePercent}%` }}
              />
              {/* Threshold indicator line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-amber-500 z-10"
                style={{ left: `${thresholdMarkPercent}%` }}
                title={`Threshold: ${currentThreshold} m/s²`}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span>0 m/s² (Resting)</span>
              <span className="text-amber-700 font-medium">▲ Trigger Threshold</span>
              <span>Max Shake</span>
            </div>
          </div>

          {/* Sensitivity Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">
              Motion Sensitivity
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleSensitivityChange('high')}
                className={`py-2 px-2 text-xs rounded-lg font-medium border transition-colors cursor-pointer text-center ${
                  settings.sensitivity === 'high'
                    ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="font-bold">High</div>
                <div className="text-[10px] mt-0.5 opacity-80">Light shake (16)</div>
              </button>

              <button
                type="button"
                onClick={() => handleSensitivityChange('medium')}
                className={`py-2 px-2 text-xs rounded-lg font-medium border transition-colors cursor-pointer text-center ${
                  settings.sensitivity === 'medium'
                    ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="font-bold">Balanced</div>
                <div className="text-[10px] mt-0.5 opacity-80">Recommended (24)</div>
              </button>

              <button
                type="button"
                onClick={() => handleSensitivityChange('low')}
                className={`py-2 px-2 text-xs rounded-lg font-medium border transition-colors cursor-pointer text-center ${
                  settings.sensitivity === 'low'
                    ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="font-bold">Firm</div>
                <div className="text-[10px] mt-0.5 opacity-80">Heavy shake (34)</div>
              </button>
            </div>
          </div>

          {/* Countdown Grace Buffer Option */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">
              Safety Grace Window
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleCountdownGraceToggle(3)}
                className={`py-2 px-3 text-xs rounded-lg font-medium border transition-colors cursor-pointer text-center ${
                  settings.countdownGraceSeconds === 3
                    ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="font-bold">3s Grace Countdown</div>
                <div className="text-[10px] mt-0.5 opacity-80">Cancels accidental shakes</div>
              </button>

              <button
                type="button"
                onClick={() => handleCountdownGraceToggle(0)}
                className={`py-2 px-3 text-xs rounded-lg font-medium border transition-colors cursor-pointer text-center ${
                  settings.countdownGraceSeconds === 0
                    ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="font-bold">Instant Trigger</div>
                <div className="text-[10px] mt-0.5 opacity-80">0-second immediate broadcast</div>
              </button>
            </div>
          </div>

          {/* Silent SOS on Shake */}
          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <div className="text-xs font-semibold text-slate-800">Covert Silent Trigger</div>
              <div className="text-[11px] text-slate-500">Mute alarm tones so attackers cannot hear the SOS</div>
            </div>
            <input
              type="checkbox"
              checked={settings.silentByDefault}
              onChange={(e) => handleSilentToggle(e.target.checked)}
              className="w-4 h-4 accent-slate-900 rounded"
            />
          </div>

          {/* Action Buttons: Test Shake & Lock Phone Screen */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              type="button"
              onClick={triggerTestShake}
              className={`py-2.5 px-3 bg-white hover:bg-slate-50 text-slate-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-300 cursor-pointer transition-all shadow-xs ${
                testTriggered ? 'bg-slate-100 border-slate-400' : ''
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-rose-600" />
              <span>Simulate Shake</span>
            </button>

            <button
              type="button"
              onClick={onLockScreen}
              className="py-2.5 px-3 bg-white hover:bg-slate-50 text-slate-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-300 cursor-pointer transition-all shadow-xs"
            >
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>Lock Phone Screen</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
