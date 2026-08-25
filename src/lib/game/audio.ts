let music: HTMLAudioElement | null = null;
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let sfxBus: GainNode | null = null;
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
  sfxBus = ctx.createGain();
  sfxBus.gain.value = 0.7;
  sfxBus.connect(master);
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

function jitter(amount: number) {
  return 1 + (Math.random() * 2 - 1) * amount;
}

function tone(opts: {
  freq: number;
  duration: number;
  type?: OscillatorType;
  when?: number;
  gain?: number;
  freqEnd?: number;
  filter?: number;
}) {
  const audioCtx = ensureCtx();
  if (!sfxBus) return;
  const start = audioCtx.currentTime + (opts.when ?? 0);
  const osc = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();
  osc.type = opts.type ?? "sine";
  osc.frequency.setValueAtTime(opts.freq, start);
  if (opts.freqEnd) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(opts.freqEnd, 20), start + opts.duration);
  }
  filter.type = "lowpass";
  filter.frequency.value = opts.filter ?? 2200;
  const peak = opts.gain ?? 0.07;
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(peak, start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, start + opts.duration);
  osc.connect(filter);
  filter.connect(g);
  g.connect(sfxBus);
  osc.start(start);
  osc.stop(start + opts.duration + 0.02);
  osc.onended = () => {
    osc.disconnect();
    filter.disconnect();
    g.disconnect();
  };
}

function thunk(when = 0, gain = 0.05) {
  const audioCtx = ensureCtx();
  if (!sfxBus) return;
  const start = audioCtx.currentTime + when;
  const length = Math.floor(audioCtx.sampleRate * 0.05);
  const buffer = audioCtx.createBuffer(1, length, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  }
  const src = audioCtx.createBufferSource();
  src.buffer = buffer;
  const filter = audioCtx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 900;
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(gain, start);
  g.gain.exponentialRampToValueAtTime(0.0001, start + 0.05);
  src.connect(filter);
  filter.connect(g);
  g.connect(sfxBus);
  src.start(start);
  src.stop(start + 0.06);
  src.onended = () => {
    src.disconnect();
    filter.disconnect();
    g.disconnect();
  };
}

export function sfxTick() {
  tone({ freq: 980 * jitter(0.04), duration: 0.035, type: "triangle", gain: 0.028, filter: 2400 });
}

export function sfxPlace() {
  thunk(0, 0.045);
  tone({ freq: 220 * jitter(0.05), duration: 0.07, type: "sine", gain: 0.05, filter: 900 });
}

export function sfxHint() {
  tone({ freq: 392, duration: 0.16, type: "sine", gain: 0.045, filter: 1800 });
  tone({ freq: 523.25, duration: 0.2, type: "triangle", when: 0.07, gain: 0.035, filter: 2000 });
}

export function sfxSkip() {
  tone({ freq: 520, duration: 0.08, type: "sine", gain: 0.04, freqEnd: 360, filter: 1600 });
  tone({ freq: 360, duration: 0.1, type: "triangle", when: 0.06, gain: 0.03, freqEnd: 220, filter: 1400 });
}

export function sfxCorrect() {
  tone({ freq: 523.25, duration: 0.12, type: "triangle", gain: 0.055, filter: 2400 });
  tone({ freq: 659.25, duration: 0.16, type: "sine", when: 0.08, gain: 0.05, filter: 2600 });
  tone({ freq: 783.99, duration: 0.24, type: "sine", when: 0.16, gain: 0.04, filter: 2800 });
}

export function sfxWrong() {
  tone({ freq: 196, duration: 0.18, type: "sine", gain: 0.05, freqEnd: 147, filter: 900 });
  tone({ freq: 147, duration: 0.22, type: "triangle", when: 0.06, gain: 0.035, filter: 700 });
}

export function sfxWin() {
  tone({ freq: 523.25, duration: 0.14, type: "triangle", gain: 0.05, filter: 2200 });
  tone({ freq: 659.25, duration: 0.14, type: "triangle", when: 0.11, gain: 0.05, filter: 2400 });
  tone({ freq: 783.99, duration: 0.16, type: "sine", when: 0.22, gain: 0.045, filter: 2600 });
  tone({ freq: 1046.5, duration: 0.36, type: "sine", when: 0.34, gain: 0.04, filter: 2800 });
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
