let shared: AudioContext | null = null;

function audioContext() {
  if (typeof window === "undefined") return null;
  const Context = window.AudioContext;
  if (!Context) return null;
  if (!shared) shared = new Context();
  return shared;
}

/** Browsers only play a chime after the tutor has tapped the page. */
export function unlockJoinChime() {
  const context = audioContext();
  if (context && context.state === "suspended") {
    void context.resume();
  }
}

/** A short soft chime when someone enters the tutor's meeting. */
export function playJoinChime() {
  const context = audioContext();
  if (!context) return;
  if (context.state === "suspended") {
    void context.resume();
  }
  const now = context.currentTime;
  const notes = [523.25, 659.25, 783.99];
  for (const [index, frequency] of notes.entries()) {
    const tone = context.createOscillator();
    const level = context.createGain();
    tone.type = "sine";
    tone.frequency.value = frequency;
    const start = now + index * 0.09;
    level.gain.setValueAtTime(0.0001, start);
    level.gain.exponentialRampToValueAtTime(0.07, start + 0.03);
    level.gain.exponentialRampToValueAtTime(0.0001, start + 0.55);
    tone.connect(level);
    level.connect(context.destination);
    tone.start(start);
    tone.stop(start + 0.58);
  }
}
