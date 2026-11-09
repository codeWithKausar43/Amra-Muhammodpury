/**
 * Sweet Melodious Notification Sound Engine (মিষ্টি নোটিফিকেশন সাউন্ড)
 * Supports both Audio element playback (notification.wav) and Web Audio API synthesis fallback.
 */

class NotificationAudioEngine {
  private audioCtx: AudioContext | null = null;
  private audioEl: HTMLAudioElement | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.audioEl = new Audio('/sounds/notification.wav');
        this.audioEl.volume = 1.0; // High volume
      } catch (err) {
        console.warn('Audio element init failed', err);
      }
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  /**
   * Synthesize a sweet crystalline chime via Web Audio API (zero delay, pure tone)
   */
  public synthesizeSweetChime(volume: number = 1.0) {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // Arpeggiated sweet chord: C6 (1046.5Hz), E6 (1318.5Hz), G6 (1567.98Hz), C7 (2093.0Hz)
      const notes = [
        { freq: 1046.5, time: 0.0, gain: 0.25 },
        { freq: 1318.5, time: 0.08, gain: 0.3 },
        { freq: 1567.98, time: 0.16, gain: 0.35 },
        { freq: 2093.0, time: 0.24, gain: 0.4 },
      ];

      notes.forEach(({ freq, time, gain }) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + time);

        // Sweet crystal envelope with soft decay
        gainNode.gain.setValueAtTime(0.0001, now + time);
        gainNode.gain.exponentialRampToValueAtTime(gain * volume, now + time + 0.015);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + time + 1.2);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(now + time);
        osc.stop(now + time + 1.25);
      });
    } catch (e) {
      console.warn('Web Audio synthesis error', e);
    }
  }

  /**
   * Play the sweet notification chime with maximum clarity & mobile vibration
   */
  public play(volume: number = 1.0): Promise<void> {
    if (typeof window === 'undefined') return Promise.resolve();

    // Trigger mobile vibration pattern (200ms buzz, 100ms pause, 200ms buzz)
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([250, 100, 250, 100, 250]);
      } catch {
        // Ignored
      }
    }

    // Try HTML5 Audio first
    if (this.audioEl) {
      this.audioEl.currentTime = 0;
      this.audioEl.volume = Math.max(0, Math.min(1.0, volume));
      const playPromise = this.audioEl.play();
      if (playPromise !== undefined) {
        return playPromise.catch(() => {
          // Fallback to Web Audio synthesis if browser autoplay policy blocks audio element
          this.synthesizeSweetChime(volume);
        });
      }
    } else {
      this.synthesizeSweetChime(volume);
    }

    return Promise.resolve();
  }
}

export const notificationAudio = new NotificationAudioEngine();

