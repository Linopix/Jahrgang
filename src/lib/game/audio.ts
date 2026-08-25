let music: HTMLAudioElement | null = null;
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let sfxBus: GainNode | null = null;
let lobbyGain: GainNode | null = null;
let lobbyTimer: number | null = null;
let lobbyStep = 0;
let volume = 0.85;
let previewMuted = false;
let uiMuted = false;
let lobbyWanted = true;
const uiListeners = new Set<() => void>();

const LOBBY_NOTES = [220, 261.63, 329.63, 392, 440, 523.25];
const LOBBY_STEPS = [0, 2, 4, 3, 1, 4, 2, 0, 3, 5, 4, 2];

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
  sfxBus.connect(master);
  lobbyGain.connect(master);
  master.connect(ctx.destination);
  lobbyGain.gain.value = 0;
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
  const lobby = uiMuted || !lobbyWanted ? 0 : 1;
  if (sfxBus) sfxBus.gain.setTargetAtTime(sfx, ctx.currentTime, 0.04);
  if (lobbyGain) lobbyGain.gain.setTargetAtTime(lobby, ctx.currentTime, 0.12);
  if (lobbyWanted && !uiMuted) startLobby();
  else stopLobby();
}

function playLobbyNote() {
  if (!ctx || !lobbyGain) return;
  const freq = LOBBY_NOTES[LOBBY_STEPS[lobbyStep % LOBBY_STEPS.length]];
  lobbyStep += 1;
  const now = ctx.currentTime;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 1400;
  filter.Q.value = 0.4;

  const voice = (offset: number, ratio: number, level: number, seconds: number) => {
    if (!ctx || !lobbyGain) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq * ratio;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(level, now + 0.55);
    g.gain.exponentialRampToValueAtTime(0.0001, now + seconds);
    osc.connect(g);
    g.connect(filter);
    osc.start(now + offset);
    osc.stop(now + seconds + 0.05);
    osc.onended = () => {
      osc.disconnect();
      g.disconnect();
      if (ratio === 1) filter.disconnect();
    };
  };

  filter.connect(lobbyGain);
  voice(0, 1, 0.045, 4.2);
  voice(0.04, 2, 0.012, 3.4);
}

function startLobby() {
  if (lobbyTimer !== null) return;
  ensureCtx();
  const tick = () => {
    if (!lobbyWanted || uiMuted) {
      stopLobby();
      return;
    }
    playLobbyNote();
    lobbyTimer = window.setTimeout(tick, 3200 + Math.random() * 1600);
  };
  lobbyTimer = window.setTimeout(tick, 400);
}

function stopLobby() {
  if (lobbyTimer === null) return;
  window.clearTimeout(lobbyTimer);
  lobbyTimer = null;
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
