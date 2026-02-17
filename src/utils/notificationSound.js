/**
 * Notification sound utility
 * Plays a pleasant notification sound when a new message arrives
 */

let audioContext = null;
let isEnabled = true;

/**
 * Initialize the audio context (lazy initialization)
 */
const getAudioContext = () => {
  if (!audioContext && typeof window !== 'undefined' && window.AudioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
};

/**
 * Play a pleasant notification sound using Web Audio API
 * Creates a two-tone notification sound
 */
export const playNotificationSound = () => {
  if (!isEnabled) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Resume audio context if suspended (required by some browsers)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // First tone (higher pitch)
    const oscillator1 = ctx.createOscillator();
    const gainNode1 = ctx.createGain();
    
    oscillator1.connect(gainNode1);
    gainNode1.connect(ctx.destination);
    
    oscillator1.frequency.value = 600; // Hz
    oscillator1.type = 'sine';
    
    gainNode1.gain.setValueAtTime(0, now);
    gainNode1.gain.linearRampToValueAtTime(0.3, now + 0.01);
    gainNode1.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    
    oscillator1.start(now);
    oscillator1.stop(now + 0.2);

    // Second tone (slightly lower pitch, delayed)
    const oscillator2 = ctx.createOscillator();
    const gainNode2 = ctx.createGain();
    
    oscillator2.connect(gainNode2);
    gainNode2.connect(ctx.destination);
    
    oscillator2.frequency.value = 800; // Hz
    oscillator2.type = 'sine';
    
    gainNode2.gain.setValueAtTime(0, now + 0.1);
    gainNode2.gain.linearRampToValueAtTime(0.3, now + 0.11);
    gainNode2.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    
    oscillator2.start(now + 0.1);
    oscillator2.stop(now + 0.3);

  } catch (error) {
    console.warn('[NotificationSound] Failed to play sound:', error);
  }
};

/**
 * Enable notification sounds
 */
export const enableNotificationSound = () => {
  isEnabled = true;
};

/**
 * Disable notification sounds
 */
export const disableNotificationSound = () => {
  isEnabled = false;
};

/**
 * Check if notification sounds are enabled
 */
export const isNotificationSoundEnabled = () => {
  return isEnabled;
};

/**
 * Toggle notification sounds on/off
 */
export const toggleNotificationSound = () => {
  isEnabled = !isEnabled;
  return isEnabled;
};
