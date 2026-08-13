let audioContext: AudioContext | null = null;
let initialized = false;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === "undefined") return null;
  const Context = window.AudioContext || (window as any).webkitAudioContext;
  if (!Context) return null;
  audioContext ??= new Context();
  return audioContext;
};

const unlockAudio = () => {
  const context = getAudioContext();
  if (context?.state === "suspended") void context.resume();
};

export const initializeNotificationSound = () => {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  window.addEventListener("pointerdown", unlockAudio, { once: true });
  window.addEventListener("keydown", unlockAudio, { once: true });
};

export const playMessageNotificationSound = async () => {
  const context = getAudioContext();
  if (!context) return;

  if (context.state === "suspended") {
    try {
      await context.resume();
    } catch {
      return;
    }
  }

  const now = context.currentTime;
  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.12, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
  gain.connect(context.destination);

  [659.25, 783.99].forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    oscillator.connect(gain);
    oscillator.start(now + index * 0.08);
    oscillator.stop(now + 0.22 + index * 0.08);
  });
};

