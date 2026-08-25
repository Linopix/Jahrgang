let music: HTMLAudioElement | null = null;
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let sfxBus: GainNode | null = null;
let lobbyGain: GainNode | null = null;
let crackleGain: GainNode | null = null;
let crackleReady = false;
let lobbyTimer: number | null = null;
let lobbyNext = 0;
let lobbyStep16 = 0;
let volume = 0.85;
let previewMuted = false;
let uiMuted = false;
let lobbyWanted = true;
let retro = false;
const uiListeners = new Set<() => void>();

const LOBBY_BPM = 76;
const LOBBY_STEP = 60 / LOBBY_BPM / 4;
const LOBBY_CHORDS = [
  [220.0, 261.63, 329.63],
  [146.83, 220.0, 293.66],
  [196.0, 246.94, 293.66],
  [130.81, 196.0, 261.63],
];

function notifyUi() {
  uiListeners.forEach((fn) => fn());
}

function ensureMusic() {
  if (music) return music;
  music = new Audio();
  music.preload = "auto";
  applyPreviewVolume();
  return music;
}

function ensureCtx() {
  if (ctx) return ctx;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  ctx = new AudioCtx({ latencyHint: "interactive" });
  master = ctx.createGain();
  sfxBus = ctx.createGain();
  lobbyGain = ctx.createGain();
  crackleGain = ctx.createGain();
  sfxBus.connect(master);
  lobbyGain.connect(master);
  crackleGain.connect(master);
  master.connect(ctx.destination);
  lobbyGain.gain.value = 0;
  crackleGain.gain.value = 0;
  applyUiVolume();
  return ctx;
}

function previewGainValue() {
  if (previewMuted) return 0;
  return volume * volume;
}

function applyPreviewVolume() {
  if (music) music.volume = previewGainValue();
}

function applyUiVolume() {
  if (!ctx) return;
  const sfx = uiMuted ? 0 : 0.7;
  const lobby = uiMuted || !lobbyWanted ? 0 : 0.55;
  const hiss = uiMuted || !retro ? 0 : 0.022;
  if (sfxBus) sfxBus.gain.setTargetAtTime(sfx, ctx.currentTime, 0.04);
  if (lobbyGain) lobbyGain.gain.setTargetAtTime(lobby, ctx.currentTime, 0.12);
  if (crackleGain) crackleGain.gain.setTargetAtTime(hiss, ctx.currentTime, 0.2);
  if (retro && !uiMuted) ensureCrackle();
  if (lobbyWanted && !uiMuted) startLobby();
  else stopLobby();
}

function ensureCrackle() {
  const audioCtx = ensureCtx();
  if (!crackleGain || crackleReady) return;
  crackleReady = true;
  const length = Math.floor(audioCtx.sampleRate * 2.4);
  const buffer = audioCtx.createBuffer(1, length, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    const pop = Math.random() > 0.997 ? (Math.random() * 2 - 1) * 0.9 : 0;
    data[i] = (Math.random() * 2 - 1) * 0.18 + pop;
  }
  const src = audioCtx.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  const hp = audioCtx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 1800;
  const lp = audioCtx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 6800;
  src.connect(hp);
  hp.connect(lp);
  lp.connect(crackleGain);
  src.start();
}

function noiseHit(
  dest: GainNode,
  when: number,
  duration: number,
  gain: number,
  highpass: number,
  lowpass: number,
) {
  if (!ctx) return;
  const length = Math.max(32, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = highpass;
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = lowpass;
  const g = ctx.createGain();
  g.gain.setValueAtTime(Math.max(gain, 0.0001), when);
  g.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  src.connect(hp);
  hp.connect(lp);
  lp.connect(g);
  g.connect(dest);
  src.start(when);
  src.stop(when + duration + 0.02);
}

function playKick(when: number) {
  if (!ctx || !lobbyGain) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(92, when);
  osc.frequency.exponentialRampToValueAtTime(42, when + 0.14);
  g.gain.setValueAtTime(0.16, when);
  g.gain.exponentialRampToValueAtTime(0.0001, when + 0.18);
  osc.connect(g);
  g.connect(lobbyGain);
  osc.start(when);
  osc.stop(when + 0.2);
}

function playChord(when: number, step: number) {
  if (!ctx || !lobbyGain) return;
  const chord = LOBBY_CHORDS[Math.floor(step / 16) % LOBBY_CHORDS.length];
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 920;
  lp.connect(lobbyGain);
  for (const freq of chord) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    osc.detune.value = (Math.random() - 0.5) * 8;
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.035, when + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 1.4);
    osc.connect(g);
    g.connect(lp);
    osc.start(when);
    osc.stop(when + 1.45);
  }
  const bass = ctx.createOscillator();
  const bg = ctx.createGain();
  bass.type = "sine";
  bass.frequency.value = chord[0] / 2;
  bg.gain.setValueAtTime(0.07, when);
  bg.gain.exponentialRampToValueAtTime(0.0001, when + 0.42);
  bass.connect(bg);
  bg.connect(lobbyGain);
  bass.start(when);
  bass.stop(when + 0.45);
}

function playLobbyStep(step: number, when: number) {
  if (!ctx || !lobbyGain) return;
  const beat = step % 16;
  if (beat === 0 || beat === 8) playKick(when);
  if (beat === 4 || beat === 12) {
    noiseHit(lobbyGain, when, 0.12, 0.07, 800, 2400);
    toneInto(lobbyGain, { freq: 180, duration: 0.09, type: "triangle", gain: 0.03, filter: 900, whenAbs: when });
  }
  if (beat % 2 === 0) noiseHit(lobbyGain, when, 0.035, beat % 4 === 2 ? 0.03 : 0.016, 6000, 11000);
  if (beat === 0) playChord(when, step);
}

function toneInto(
  dest: GainNode,
  opts: {
    freq: number;
    duration: number;
    type?: OscillatorType;
    gain?: number;
    filter?: number;
    freqEnd?: number;
    whenAbs: number;
  },
) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  osc.type = opts.type ?? "sine";
  osc.frequency.setValueAtTime(opts.freq, opts.whenAbs);
  if (opts.freqEnd) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(opts.freqEnd, 20), opts.whenAbs + opts.duration);
  }
  filter.type = "lowpass";
  filter.frequency.value = opts.filter ?? 2200;
  const peak = opts.gain ?? 0.07;
  g.gain.setValueAtTime(0.0001, opts.whenAbs);
  g.gain.exponentialRampToValueAtTime(peak, opts.whenAbs + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, opts.whenAbs + opts.duration);
  osc.connect(filter);
  filter.connect(g);
  g.connect(dest);
  osc.start(opts.whenAbs);
  osc.stop(opts.whenAbs + opts.duration + 0.02);
}

function startLobby() {
  if (lobbyTimer !== null) return;
  const audioCtx = ensureCtx();
  lobbyNext = audioCtx.currentTime + 0.05;
  const tick = () => {
    if (!lobbyWanted || uiMuted) {
      stopLobby();
      return;
    }
    while (lobbyNext < audioCtx.currentTime + 0.18) {
      playLobbyStep(lobbyStep16, lobbyNext);
      lobbyStep16 += 1;
      lobbyNext += LOBBY_STEP;
    }
    lobbyTimer = window.setTimeout(tick, 70);
  };
  tick();
}

function stopLobby() {
  if (lobbyTimer === null) return;
  window.clearTimeout(lobbyTimer);
  lobbyTimer = null;
}

export function setRetroAudio(next: boolean) {
  retro = next;
  ensureCtx();
  applyUiVolume();
}

export function unlockAudio() {
  ensureMusic();
  const audioCtx = ensureCtx();
  if (audioCtx.state === "suspended") {
    void audioCtx.resume();
  }
  applyUiVolume();
}

export function setMasterVolume(next: number) {
  volume = Math.min(1, Math.max(0, next));
  applyPreviewVolume();
}

export function setMuted(next: boolean) {
  previewMuted = next;
  applyPreviewVolume();
}

export function getMasterVolume() {
  return volume;
}

export function isMuted() {
  return previewMuted;
}

export function isUiMuted() {
  return uiMuted;
}

export function setUiMuted(next: boolean) {
  uiMuted = next;
  try {
    localStorage.setItem("jahrgang-ui-muted", next ? "1" : "0");
  } catch {
    /* ignore */
  }
  ensureCtx();
  applyUiVolume();
  notifyUi();
}

export function hydrateUiMute() {
  try {
    uiMuted = localStorage.getItem("jahrgang-ui-muted") === "1";
  } catch {
    uiMuted = false;
  }
  applyUiVolume();
  notifyUi();
}

export function subscribeUiAudio(fn: () => void) {
  uiListeners.add(fn);
  return () => {
    uiListeners.delete(fn);
  };
}

export function setLobbyWanted(next: boolean) {
  lobbyWanted = next;
  applyUiVolume();
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
  toneInto(sfxBus, { ...opts, whenAbs: start });
}

function thunk(when = 0, gain = 0.05) {
  const audioCtx = ensureCtx();
  if (!sfxBus) return;
  noiseHit(sfxBus, audioCtx.currentTime + when, 0.05, gain, 200, 900);
}

export function sfxTick() {
  tone({ freq: 980 * jitter(0.04), duration: 0.035, type: "triangle", gain: 0.028, filter: 2400 });
  if (retro && sfxBus && ctx) noiseHit(sfxBus, ctx.currentTime, 0.04, 0.02, 2200, 7000);
}

let lastSlideAt = 0;

export function sfxSlide(year?: number) {
  const now = performance.now();
  if (now - lastSlideAt < 55) return;
  lastSlideAt = now;
  const t =
    typeof year === "number" ? Math.min(1, Math.max(0, (year - YEAR_MIN_SLIDE) / YEAR_SPAN_SLIDE)) : 0.4;
  tone({
    freq: 360 + t * 540,
    duration: 0.03,
    type: "sine",
    gain: 0.022,
    filter: 2200,
  });
}

const YEAR_MIN_SLIDE = 1960;
const YEAR_SPAN_SLIDE = 66;

export function sfxHover() {
  tone({ freq: 720 * jitter(0.03), duration: 0.025, type: "sine", gain: 0.012, filter: 1800 });
}

export function sfxPop() {
  tone({ freq: 880, duration: 0.05, type: "sine", gain: 0.03, filter: 2400 });
  tone({ freq: 1240, duration: 0.07, type: "triangle", when: 0.02, gain: 0.018, filter: 2800 });
}

export function sfxScratch() {
  const audioCtx = ensureCtx();
  if (!sfxBus) return;
  const now = audioCtx.currentTime;
  noiseHit(sfxBus, now, 0.28, 0.14, 400, 4200);
  const bpLen = Math.floor(audioCtx.sampleRate * 0.26);
  const buffer = audioCtx.createBuffer(1, bpLen, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bpLen; i++) data[i] = Math.random() * 2 - 1;
  const src = audioCtx.createBufferSource();
  src.buffer = buffer;
  const bp = audioCtx.createBiquadFilter();
  bp.type = "bandpass";
  bp.Q.value = 7;
  bp.frequency.setValueAtTime(420, now);
  bp.frequency.exponentialRampToValueAtTime(2600, now + 0.07);
  bp.frequency.exponentialRampToValueAtTime(180, now + 0.24);
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(0.16, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);
  src.connect(bp);
  bp.connect(g);
  g.connect(sfxBus);
  src.start(now);
  src.stop(now + 0.28);
  tone({ freq: 340, freqEnd: 68, duration: 0.22, type: "triangle", gain: 0.045, filter: 1400 });
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
