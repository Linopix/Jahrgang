let music: HTMLAudioElement | null = null;
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let volume = 0.85;
let muted = false;

function ensureMusic() {
  if (music) return music;
  music = new Audio();
  music.preload = "auto";
  applyVolume();
  return music;
}

function ensureCtx() {
  if (ctx) return ctx;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  ctx = new AudioCtx({ latencyHint: "interactive" });
  master = ctx.createGain();
  master.connect(ctx.destination);
  applyVolume();
  return ctx;
}

function gainValue() {
  if (muted) return 0;
  return volume * volume;
}

function applyVolume() {
  const g = gainValue();
  if (music) music.volume = g;
  if (master && ctx) {
    master.gain.setTargetAtTime(g, ctx.currentTime, 0.02);
  }
}

export function unlockAudio() {
  ensureMusic();
  const audioCtx = ensureCtx();
  if (audioCtx.state === "suspended") {
    void audioCtx.resume();
  }
}

export function setMasterVolume(next: number) {
  volume = Math.min(1, Math.max(0, next));
  applyVolume();
}

export function setMuted(next: boolean) {
  muted = next;
  applyVolume();
}

export function getMasterVolume() {
  return volume;
}

export function isMuted() {
  return muted;
}

export function playPreview(url: string) {
  const el = ensureMusic();
  if (el.src !== url) {
    el.src = url;
  }
  el.currentTime = 0;
  return el.play();
}

export function pausePreview() {
  music?.pause();
}

export function stopPreview() {
  if (!music) return;
  music.pause();
  music.removeAttribute("src");
  music.load();
}

export function getMusicElement() {
  return ensureMusic();
}

function beep(freq: number, duration: number, type: OscillatorType, when = 0, gain = 0.12) {
  const audioCtx = ensureCtx();
  if (!master) return;
  const osc = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const start = audioCtx.currentTime + when;
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(g);
  g.connect(master);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

export function sfxCorrect() {
  beep(523.25, 0.14, "triangle", 0, 0.1);
  beep(659.25, 0.18, "triangle", 0.09, 0.1);
  beep(783.99, 0.28, "sine", 0.18, 0.08);
}

export function sfxWrong() {
  beep(196, 0.22, "sawtooth", 0, 0.06);
  beep(146.83, 0.32, "triangle", 0.08, 0.08);
}

export function sfxPlace() {
  beep(880, 0.06, "square", 0, 0.04);
}

export function sfxWin() {
  beep(523.25, 0.16, "triangle", 0, 0.1);
  beep(659.25, 0.16, "triangle", 0.12, 0.1);
  beep(783.99, 0.16, "triangle", 0.24, 0.1);
  beep(1046.5, 0.4, "sine", 0.36, 0.09);
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
