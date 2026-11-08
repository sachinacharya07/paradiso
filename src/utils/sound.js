/**
 * Web Audio API Retro Sound Effects Synthesizer
 * Zero external audio files — 100% synthesized in the browser.
 */

let audioCtx = null;
const STORAGE_KEY = 'paradiso-sound-muted';

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function isMuted() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setMuted(muted) {
  try {
    localStorage.setItem(STORAGE_KEY, muted ? 'true' : 'false');
  } catch {
    // ignore
  }
}

/**
 * 1. Standard UI Navigation Beep
 */
export function playBeep() {
  if (isMuted()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, ctx.currentTime);
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.06);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  } catch {
    // audio unavailable
  }
}

/**
 * 2. Typewriter / Mechanical Key Click (for Guestbook typing)
 */
export function playTypewriterClick() {
  if (isMuted()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Small pitch variation for natural typing feel
    const freq = 1200 + (Math.random() * 400 - 200);

    // Noise burst
    const bufferSize = ctx.sampleRate * 0.02; // 20ms
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq, ctx.currentTime);
    filter.Q.setValueAtTime(3, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    whiteNoise.start();
    whiteNoise.stop(ctx.currentTime + 0.02);
  } catch {
    // ignore
  }
}

/**
 * 3. Cinema Ticket Paper Tear (when clicking movie tickets)
 */
export function playPaperTear() {
  if (isMuted()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const bufferSize = ctx.sampleRate * 0.08; // 80ms crackle
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(2500, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.09, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
    noise.stop(ctx.currentTime + 0.08);
  } catch {
    // ignore
  }
}

/**
 * 4. Floppy Disk Save / Retro Boot Chime (when admin saves an entry)
 */
export function playFloppySave() {
  if (isMuted()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Two-tone rising chime (C5 -> G5 -> C6)
    const notes = [523.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const startTime = ctx.currentTime + idx * 0.09;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.08, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.14);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.14);
    });
  } catch {
    // ignore
  }
}

/**
 * 5. Cassette Latch / Click (when pressing play/pause on music)
 */
export function playCassetteClick() {
  if (isMuted()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // First mechanical thud
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(140, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.03);

    gain1.gain.setValueAtTime(0.12, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.03);

    // Second metallic latch 35ms later
    const startTime2 = ctx.currentTime + 0.035;
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(680, startTime2);
    osc2.frequency.exponentialRampToValueAtTime(220, startTime2 + 0.04);

    gain2.gain.setValueAtTime(0.09, startTime2);
    gain2.gain.exponentialRampToValueAtTime(0.001, startTime2 + 0.04);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(startTime2);
    osc2.stop(startTime2 + 0.04);
  } catch {
    // ignore
  }
}

/**
 * 6. Metro Transit / Subway Chime (when navigating timeline stations)
 * Two-tone retro station departure chime (e.g. 587.3Hz D5 -> 880Hz A5)
 */
export function playSubwayChime() {
  if (isMuted()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [
      { freq: 587.33, start: 0, duration: 0.22 }, // D5
      { freq: 880.0, start: 0.16, duration: 0.35 },  // A5
    ];

    notes.forEach(({ freq, start, duration }) => {
      const startTime = ctx.currentTime + start;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.09, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  } catch {
    // ignore
  }
}
