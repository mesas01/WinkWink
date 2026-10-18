// Procedural lo-fi background track for the demo video. Original, royalty-free by construction.
// Usage: node scripts/demo/music.mjs <seconds> <out.wav>
import { writeFileSync } from "node:fs";

const SR = 44100;
const BPM = 84;
const BEAT = 60 / BPM;
const BAR = BEAT * 4;
const midi = (n) => 440 * 2 ** ((n - 69) / 12);

// Fmaj7 · Em7 · Dm7 · Cmaj7, two bars each
const CHORDS = [
  { root: 41, tones: [53, 57, 60, 64] },
  { root: 40, tones: [52, 55, 59, 62] },
  { root: 38, tones: [50, 53, 57, 60] },
  { root: 36, tones: [48, 52, 55, 59] },
];
const ARP = [0, 2, 1, 3, 2, 1, 3, 2];

function render(seconds) {
  const n = Math.ceil(seconds * SR);
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  const add = (i, v, pan = 0) => {
    if (i < 0 || i >= n) return;
    L[i] += v * (1 - pan) * 0.5 * 2;
    R[i] += v * (1 + pan) * 0.5 * 2;
  };
  const chordLen = BAR * 2;
  for (let start = 0, c = 0; start < seconds; start += chordLen, c++) {
    const chord = CHORDS[c % CHORDS.length];
    // Pad: detuned sine pairs with slow attack and release
    for (const tone of chord.tones) {
      const f = midi(tone);
      const s0 = Math.floor(start * SR);
      const len = Math.floor((chordLen + 1.2) * SR);
      for (let k = 0; k < len; k++) {
        const t = k / SR;
        const env = Math.min(1, t / 0.9) * Math.min(1, Math.max(0, (chordLen + 1.2 - t) / 1.2));
        const v = (Math.sin(2 * Math.PI * f * t) + Math.sin(2 * Math.PI * (f + 0.18) * t)) * 0.5;
        add(s0 + k, v * env * 0.035);
      }
    }
    for (let beat = 0; beat < 8; beat++) {
      const bt = start + beat * BEAT;
      // Bass on beats 1 and 3
      if (beat % 2 === 0) {
        const f = midi(chord.root);
        const s0 = Math.floor(bt * SR);
        for (let k = 0; k < SR * BEAT * 1.6; k++) {
          const t = k / SR;
          add(s0 + k, Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 2.2) * 0.11);
        }
      }
      // Arpeggio eighth notes, soft plucks panned left and right
      for (let half = 0; half < 2; half++) {
        const step = beat * 2 + half;
        const tone = chord.tones[ARP[step % ARP.length]] + 12;
        const f = midi(tone);
        const s0 = Math.floor((bt + half * BEAT * 0.5) * SR);
        const pan = step % 2 ? 0.35 : -0.35;
        for (let k = 0; k < SR * 0.6; k++) {
          const t = k / SR;
          const v = Math.sin(2 * Math.PI * f * t) + 0.25 * Math.sin(2 * Math.PI * f * 3 * t);
          add(s0 + k, v * Math.exp(-t * 7) * Math.min(1, t / 0.004) * 0.03, pan);
        }
      }
      // Hi-hat on the off-beats
      const s0 = Math.floor((bt + BEAT * 0.5) * SR);
      for (let k = 0; k < SR * 0.05; k++)
        add(s0 + k, (Math.random() * 2 - 1) * Math.exp(-(k / SR) * 90) * 0.02, 0.2);
    }
  }
  // Gentle low-pass for warmth, then normalize with fade in/out
  let pl = 0;
  let pr = 0;
  const a = 0.18;
  let peak = 0;
  for (let i = 0; i < n; i++) {
    pl += a * (L[i] - pl);
    pr += a * (R[i] - pr);
    L[i] = pl;
    R[i] = pr;
    peak = Math.max(peak, Math.abs(pl), Math.abs(pr));
  }
  const gain = 0.8 / (peak || 1);
  const fadeIn = 2 * SR;
  const fadeOut = 3 * SR;
  for (let i = 0; i < n; i++) {
    const f = Math.min(1, i / fadeIn, (n - i) / fadeOut);
    L[i] *= gain * f;
    R[i] *= gain * f;
  }
  return [L, R];
}

function wav([L, R]) {
  const n = L.length;
  const buf = Buffer.alloc(44 + n * 4);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + n * 4, 4);
  buf.write("WAVEfmt ", 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 4, 28);
  buf.writeUInt16LE(4, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i])) * 32767), 44 + i * 4);
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i])) * 32767), 46 + i * 4);
  }
  return buf;
}

const seconds = Number(process.argv[2] ?? 120);
const out = process.argv[3] ?? "music.wav";
writeFileSync(out, wav(render(seconds)));
console.log(`music: ${seconds.toFixed(1)}s → ${out}`);
