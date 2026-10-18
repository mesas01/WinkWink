// Records the narrated WinkWink demo: voice (macOS `say`), synced captions, visible cursor and music.
// Usage: npm run demo:record [-- https://winkwink-seven.vercel.app]
// Output: demo/winkwink-demo.mp4 (needs macOS, Google Chrome and ffmpeg).
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import puppeteer from "puppeteer-core";

const BASE = process.argv[2] ?? "https://winkwink-seven.vercel.app";
const ROOT = new URL("../", import.meta.url).pathname;
const OUT = `${ROOT}demo/`;
const BUILD = `${OUT}build/`;
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const W = 1440;
const H = 900;

/** The narration. Each line is spoken and shown as a caption while the screen acts it out. */
/**
 * The narration. Each line is spoken and shown as a caption while the screen acts it out.
 * A line can be a string, or { show, say } when the spoken form differs (URLs, file names).
 */
const LINES = {
  intro:
    "Esto es WinkWink: un agente de inteligencia artificial que revisa las facturas de tu empresa en Blinka y frena el fraude antes del pago.",
  problem:
    "El fraude más común en cuentas por pagar es una factura real… con la cuenta bancaria cambiada.",
  laura:
    "Laura, de ingeniería, necesita pagar la factura de AWS. Entra como empleada y la sube en PDF.",
  running:
    "El agente la lee, verifica la cuenta contra la registrada en Blinka y aplica las reglas de la empresa.",
  approved:
    "Todo coincide y el monto cumple la política: aprobada automáticamente, con su razón por escrito.",
  camila: "Ahora llega otra factura de AWS. Parece idéntica… pero pide pagar a una cuenta nueva.",
  blocked:
    "El agente detecta que la cuenta no coincide con la verificada. Bloqueo inmediato: el pago se niega.",
  admin:
    "Finanzas lo ve al instante. Ni siquiera un administrador puede aprobar esta factura: solo rechazarla.",
  audit: "Todo queda en un registro de auditoría: la decisión anterior se tacha, nunca se borra.",
  kpis: "El panel muestra la autonomía del agente, lo que espera revisión y los fraudes frenados.",
  rules:
    "Las reglas son configurables, y lo que ninguna regla cubre queda retenido para una persona.",
  tryCard: "Ahora, pruébalo tú mismo. Son tres pasos y no necesitas cuenta.",
  tryStep1: {
    show: "1 · En GitHub, abre la carpeta test-invoices y descarga una de las ocho facturas de prueba.",
    say: "Uno: en el repositorio de GitHub, abre la carpeta test invoices y descarga una de las ocho facturas de prueba.",
  },
  tryStep2: {
    show: "2 · Entra a winkwink-seven.vercel.app/agente y elige un rol: Empleado o Admin financiero.",
    say: "Dos: entra a winkwink seven punto vercel punto app, barra agente, y elige un rol: empleado o administrador financiero.",
  },
  tryStep3: "3 · Ve a Nueva factura, sube el PDF y presiona Enviar y evaluar.",
  tryResult: "Por ejemplo, esta factura de Figma trae un Tax ID falso, y el agente la bloquea.",
  tryReset:
    "Cada PDF indica el resultado esperado. Y con Reiniciar demo vuelves a empezar cuando quieras.",
  signup:
    "¿Quieres tu propia cuenta? En Entrar puedes registrarte con tu correo, o continuar con Google.",
  google:
    "Con un clic eliges tu cuenta de Google, y vuelves a WinkWink con tu panel privado de facturas.",
  outro: "WinkWink. La inteligencia artificial lee; las reglas deciden.",
};

const shown = (id) => (typeof LINES[id] === "string" ? LINES[id] : LINES[id].show);
const spoken = (id) => (typeof LINES[id] === "string" ? LINES[id] : LINES[id].say);

const PDFS = `${ROOT}test-invoices/`;
const REPO_PDFS = "https://github.com/mesas01/WinkWink/tree/main/test-invoices";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const sh = (cmd, args) =>
  execFileSync(cmd, args, { stdio: ["ignore", "pipe", "pipe"] })
    .toString()
    .trim();
const duration = (file) =>
  Number(
    sh("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=nw=1:nk=1",
      file,
    ]),
  );

const TTS_MODEL = process.env["DEMO_TTS_MODEL"] || "gemini-3.8-flash-tts";
const TTS_VOICE = process.env["DEMO_TTS_VOICE"] || "Kore";
const CACHE = `${OUT}voice-cache/`;

const hash = (text) =>
  createHash("sha1").update(`${TTS_MODEL}|${TTS_VOICE}|${text}`).digest("hex").slice(0, 16);

/** Wraps raw 16-bit mono PCM in a WAV header (Gemini may return audio/L16). */
function pcmToWav(pcm, rate) {
  const head = Buffer.alloc(44);
  head.write("RIFF", 0);
  head.writeUInt32LE(36 + pcm.length, 4);
  head.write("WAVEfmt ", 8);
  head.writeUInt32LE(16, 16);
  head.writeUInt16LE(1, 20);
  head.writeUInt16LE(1, 22);
  head.writeUInt32LE(rate, 24);
  head.writeUInt32LE(rate * 2, 28);
  head.writeUInt16LE(2, 32);
  head.writeUInt16LE(16, 34);
  head.write("data", 36);
  head.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([head, pcm]);
}

async function geminiSpeech(text) {
  const key = process.env["GEMINI_API_KEY"];
  if (!key) return null;
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent`,
      {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          contents: [{ parts: [{ text }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: TTS_VOICE } } },
          },
        }),
      },
    );
    if (res.status === 429 || res.status >= 500) {
      await sleep(15000 * (attempt + 1));
      continue;
    }
    if (!res.ok) return null;
    const json = await res.json();
    const part = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
    if (!part) return null;
    const bytes = Buffer.from(part.inlineData.data, "base64");
    const mime = part.inlineData.mimeType ?? "";
    if (mime.includes("wav")) return bytes;
    const rate = Number(/rate=(\d+)/.exec(mime)?.[1] ?? 24000);
    return pcmToWav(bytes, rate);
  }
  return null;
}

const BATCH_MODEL = process.env["DEMO_TTS_BATCH_MODEL"] || "gemini-2.5-flash-preview-tts";

/** Silences in a WAV as [{ end, dur }] (end in seconds). */
function silences(file) {
  const out = execFileSync(
    "ffmpeg",
    ["-v", "info", "-i", file, "-af", "silencedetect=n=-38dB:d=0.3", "-f", "null", "-"],
    {
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  const log = out.toString() + "";
  return [...log.matchAll(/silence_end: ([0-9.]+) \| silence_duration: ([0-9.]+)/g)].map((m) => ({
    end: Number(m[1]),
    dur: Number(m[2]),
  }));
}

/**
 * Picks the sentence boundaries among the detected pauses with dynamic programming: each segment
 * should last roughly in proportion to its text, and longer pauses are preferred as boundaries.
 */
function splitPoints(sil, texts, total) {
  const chars = texts.map((t) => t.length);
  const sum = chars.reduce((a, b) => a + b, 0);
  const expected = chars.map((c) => (c / sum) * total);
  const mids = sil.map((x) => x.end - x.dur / 2);
  const n = texts.length;
  const S = sil.length;
  const segCost = (j, from, to) => ((to - from - expected[j]) / expected[j]) ** 2;
  // dp[j][i]: best cost when sentence j ends at pause i (j < n-1)
  const dp = Array.from({ length: n - 1 }, () => new Array(S).fill(Infinity));
  const prev = Array.from({ length: n - 1 }, () => new Array(S).fill(-1));
  for (let i = 0; i < S; i++) dp[0][i] = segCost(0, 0, mids[i]) - 3 * sil[i].dur;
  for (let j = 1; j < n - 1; j++)
    for (let i = j; i < S; i++)
      for (let k = j - 1; k < i; k++) {
        const c = dp[j - 1][k] + segCost(j, mids[k], mids[i]) - 3 * sil[i].dur;
        if (c < dp[j][i]) {
          dp[j][i] = c;
          prev[j][i] = k;
        }
      }
  let best = -1;
  let bestCost = Infinity;
  for (let i = n - 2; i < S; i++) {
    const c = dp[n - 2][i] + segCost(n - 1, mids[i], total);
    if (c < bestCost) {
      bestCost = c;
      best = i;
    }
  }
  const cuts = [];
  for (let j = n - 2, i = best; j >= 0; i = prev[j][i], j--) cuts.unshift(mids[i]);
  return cuts;
}

/** Whole narration in one Gemini TTS request (cached), split into one clip per line. */
async function batchVoices(ids, texts) {
  const key = process.env["GEMINI_API_KEY"];
  const tag = createHash("sha1")
    .update(`${BATCH_MODEL}|${TTS_VOICE}|${texts.join("\n")}`)
    .digest("hex")
    .slice(0, 16);
  const cached = `${CACHE}batch-${tag}.wav`;
  if (!existsSync(cached)) {
    if (!key) return null;
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${BATCH_MODEL}:generateContent`,
      {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          contents: [{ parts: [{ text: texts.join("\n\n") }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: TTS_VOICE } } },
          },
        }),
      },
    );
    if (!res.ok) return null;
    const part = (await res.json()).candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
    if (!part) return null;
    const bytes = Buffer.from(part.inlineData.data, "base64");
    const mime = part.inlineData.mimeType ?? "";
    writeFileSync(
      cached,
      mime.includes("wav") ? bytes : pcmToWav(bytes, Number(/rate=(\d+)/.exec(mime)?.[1] ?? 24000)),
    );
  }
  const total = duration(cached);
  const sil = silences(cached);
  if (sil.length < ids.length - 1) return null;
  const cuts = [0, ...splitPoints(sil, texts, total), total];
  const durations = {};
  ids.forEach((id, i) => {
    const file = `${BUILD}${id}.wav`;
    sh("ffmpeg", [
      "-y",
      "-v",
      "error",
      "-i",
      cached,
      "-ss",
      cuts[i].toFixed(3),
      "-to",
      cuts[i + 1].toFixed(3),
      "-af",
      "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse",
      "-ar",
      "44100",
      file,
    ]);
    durations[id] = duration(file);
  });
  return durations;
}

/** Natural voice from Gemini (one batched request, cached); macOS voice only as a last resort. */
async function synthesizeVoices() {
  mkdirSync(CACHE, { recursive: true });
  const ids = Object.keys(LINES);
  const texts = ids.map((id) => spoken(id).replace(/…/g, "..."));
  const batch = await batchVoices(ids, texts);
  if (batch) {
    console.log(` voz Gemini ${TTS_VOICE} (${BATCH_MODEL})`);
    return batch;
  }
  console.log(" Gemini TTS no disponible: uso la voz de macOS");
  const durations = {};
  ids.forEach((id, i) => {
    const aiff = `${BUILD}${id}.aiff`;
    const file = `${BUILD}${id}.wav`;
    sh("say", ["-v", "Paulina", "-r", "182", "-o", aiff, texts[i].replace(/\.\.\./g, ", ")]);
    sh("ffmpeg", ["-y", "-v", "error", "-i", aiff, "-ar", "44100", file]);
    durations[id] = duration(file);
  });
  return durations;
}

const OVERLAY_CSS = `
#ww-caption{position:fixed;left:50%;bottom:30px;transform:translateX(-50%);z-index:100003;width:min(1080px,90vw);
  background:rgba(26,26,26,.94);color:#faf8f4;font:600 23px/1.38 Archivo,system-ui,sans-serif;padding:15px 24px;border-radius:3px;
  box-shadow:0 0 0 2px #faf8f4;text-align:center;transition:opacity .35s ease, transform .35s ease}
#ww-caption.hide{opacity:0;transform:translate(-50%,8px)}
#ww-card{position:fixed;inset:0;z-index:100000;background:#faf8f4;color:#1a1a1a;display:grid;place-items:center;
  font-family:Archivo,system-ui,sans-serif;text-align:center;transition:opacity .6s ease}
#ww-card.hide{opacity:0}
#ww-card h1{font-size:84px;font-weight:800;letter-spacing:-.03em;margin:0}
#ww-card p{font-size:28px;margin:16px 0 0;color:#4b3b8f;font-weight:600}
#ww-card small{display:block;margin-top:28px;font:700 19px 'Courier Prime',monospace;color:#555}
#ww-cursor{position:fixed;z-index:100001;width:24px;height:24px;border-radius:50%;background:rgba(75,59,143,.28);
  border:2px solid #4b3b8f;pointer-events:none;transform:translate(-50%,-50%);
  transition:left .7s cubic-bezier(.22,1,.36,1),top .7s cubic-bezier(.22,1,.36,1),background .15s}
#ww-cursor.click{background:rgba(75,59,143,.75);transform:translate(-50%,-50%) scale(.82)}
html{scroll-behavior:smooth}
/* Keeps the page repainting so the screencast emits frames in real time, even on static scenes. */
#ww-tick{position:fixed;right:0;bottom:0;width:2px;height:2px;z-index:100002;pointer-events:none;animation:ww-tick .5s steps(15) infinite}
@keyframes ww-tick{from{background:#faf8f3}to{background:#faf8f5}}
`;

async function ensureOverlay(page) {
  await page.evaluate((css) => {
    if (!document.getElementById("ww-style")) {
      const s = document.createElement("style");
      s.id = "ww-style";
      s.textContent = css;
      document.head.append(s);
    }
    if (!document.getElementById("ww-cursor")) {
      const c = document.createElement("div");
      c.id = "ww-cursor";
      c.style.left = "760px";
      c.style.top = "520px";
      document.body.append(c);
    }
    if (!document.getElementById("ww-tick")) {
      const t = document.createElement("div");
      t.id = "ww-tick";
      document.body.append(t);
    }
    if (!document.getElementById("ww-caption")) {
      const el = document.createElement("div");
      el.id = "ww-caption";
      el.className = "hide";
      document.body.append(el);
    }
  }, OVERLAY_CSS);
}

function createNarrator(page, durations) {
  const cues = [];
  let t0 = 0;
  return {
    start() {
      t0 = Date.now();
    },
    cues,
    /** Shows the caption and starts the voice clip; resolves when the clip has finished. */
    async say(id) {
      await ensureOverlay(page);
      await page.evaluate((text) => {
        const el = document.getElementById("ww-caption");
        el.textContent = text;
        el.classList.remove("hide");
      }, shown(id));
      cues.push({ id, at: Date.now() - t0 });
      return sleep(durations[id] * 1000 + 450);
    },
    async hide() {
      await page.evaluate(() => document.getElementById("ww-caption")?.classList.add("hide"));
    },
  };
}

async function card(page, title, subtitle, small) {
  await ensureOverlay(page);
  await page.evaluate(
    (t, s, sm) => {
      document.getElementById("ww-card")?.remove();
      const el = document.createElement("div");
      el.id = "ww-card";
      el.innerHTML = `<div><h1>${t}</h1><p>${s}</p>${sm ? `<small>${sm}</small>` : ""}</div>`;
      document.body.append(el);
    },
    title,
    subtitle,
    small,
  );
}

async function hideCard(page) {
  await page.evaluate(() => document.getElementById("ww-card")?.classList.add("hide"));
  await sleep(650);
  await page.evaluate(() => document.getElementById("ww-card")?.remove());
}

async function find(page, xpath) {
  for (let i = 0; i < 60; i++) {
    const [el] = await page.$$(`xpath/${xpath}`);
    if (el) return el;
    await sleep(200);
  }
  throw new Error(`Not found: ${xpath}`);
}

async function pointAt(page, el) {
  await ensureOverlay(page);
  await el.evaluate((n) => n.scrollIntoView({ block: "nearest", behavior: "smooth" }));
  await sleep(350);
  const box = await el.boundingBox();
  if (!box) return;
  await page.evaluate(
    (x, y) => {
      const c = document.getElementById("ww-cursor");
      c.style.left = `${x}px`;
      c.style.top = `${y}px`;
    },
    box.x + box.width / 2,
    box.y + box.height / 2,
  );
  await sleep(800);
}

async function click(page, xpath, after = 400) {
  const el = await find(page, xpath);
  await pointAt(page, el);
  await page.evaluate(() => document.getElementById("ww-cursor").classList.add("click"));
  await el.click();
  await sleep(160);
  await page.evaluate(() => document.getElementById("ww-cursor")?.classList.remove("click"));
  await sleep(after);
}

async function typeInvoice(page, text) {
  const area = await find(page, ".//textarea");
  await pointAt(page, area);
  await area.click();
  await area.type(text, { delay: 22 });
}

const button = (t) => `.//button[contains(normalize-space(.), "${t}")]`;
const link = (t) => `.//a[contains(normalize-space(.), "${t}")]`;
const row = (t) => `.//main//li//button[contains(., "${t}")]`;

async function waitText(page, re, timeout = 30000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if (await page.evaluate((src) => new RegExp(src).test(document.body.innerText), re)) return;
    await sleep(200);
  }
}

/** Off-camera: a clean queue where the six sample invoices are already decided. */
async function prepare(page) {
  await page.goto(`${BASE}/agente`, { waitUntil: "networkidle0" });
  await page.evaluate(() => localStorage.removeItem("winkwink-agent-demo"));
  await page.reload({ waitUntil: "networkidle0" });
  await (await find(page, button("Evaluar pendientes"))).click();
  await waitText(page, "Sin evaluar\\s*0", 90000);
  await (await find(page, button("Empleado"))).click();
  await sleep(500);
}

async function uploadPdf(page, file) {
  await click(page, button("Nueva factura"), 300);
  const input = await find(page, ".//input[@id='invoice-file']");
  await pointAt(page, input);
  await input.uploadFile(`${PDFS}${file}`);
  await pointAt(page, await find(page, `.//form//p[contains(., "${file}")]`));
}

async function submitAndWait(page, label) {
  await click(page, button("Enviar y evaluar"), 0);
  await find(page, `.//article//span[contains(., "${label}")]`);
}

async function story(page, nar) {
  // Intro over the landing page
  await page.goto(`${BASE}/`, { waitUntil: "networkidle0" });
  await sleep(800);
  await card(
    page,
    "WinkWink",
    "Agente antifraude para cuentas por pagar en Blinka",
    "Reto Blinka · 30X Hackathon",
  );
  await sleep(1000);
  let voice = nar.say("intro");
  await voice;
  await hideCard(page);
  voice = nar.say("problem");
  await page.evaluate(() => window.scrollTo({ top: 420, behavior: "smooth" }));
  await sleep(2200);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await voice;
  await click(page, link("Probar el agente"), 900);

  // Case 1: Laura's legitimate PDF is approved automatically
  voice = nar.say("laura");
  await pointAt(page, await find(page, button("Empleado")));
  await uploadPdf(page, "01-aws-aprobada.pdf");
  await voice;
  voice = nar.say("running");
  await submitAndWait(page, "Aprobada");
  await voice;
  voice = nar.say("approved");
  await pointAt(page, await find(page, ".//article//span[contains(., 'Aprobada')]"));
  await voice;

  // Case 2: Camila's PDF with a changed bank account is blocked
  voice = nar.say("camila");
  const select = await find(page, ".//header//select");
  await pointAt(page, select);
  await page.select("header select", "Camila Torres");
  await sleep(400);
  await uploadPdf(page, "02-aws-fraude-cuenta-cambiada.pdf");
  await voice;
  await submitAndWait(page, "Bloqueada");
  voice = nar.say("blocked");
  await pointAt(page, await find(page, ".//article//dl[contains(., 'Verificada en Blinka')]"));
  await voice;

  // Finance admin: cannot approve, rejects, audit log keeps the history
  voice = nar.say("admin");
  await click(page, button("Admin financiero"), 500);
  await click(page, row("INV-2026-10419"), 600);
  await pointAt(page, await find(page, ".//article//p[contains(., 'Aprobación bloqueada')]"));
  await voice;
  voice = nar.say("audit");
  await click(page, `.//article${button("Rechazar").slice(1)}`, 500);
  const log = await find(page, ".//article//section[contains(., 'Registro de auditoría')]");
  await log.evaluate((n) => n.scrollIntoView({ block: "center", behavior: "smooth" }));
  await sleep(700);
  await pointAt(
    page,
    await find(page, ".//article//section//span[contains(@class,'line-through')]"),
  );
  await voice;
  voice = nar.say("kpis");
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await sleep(700);
  await pointAt(page, await find(page, ".//dl[contains(., 'Autonomía')]"));
  await voice;
  voice = nar.say("rules");
  await click(page, button("Reglas activas"), 400);
  await pointAt(page, await find(page, ".//main//li[1]//button[@role='switch']"));
  await voice;

  // Try it yourself
  await nar.hide();
  await card(
    page,
    "Pruébalo tú mismo",
    "3 pasos · sin cuenta · sin instalar nada",
    "winkwink-seven.vercel.app/agente",
  );
  voice = nar.say("tryCard");
  await voice;
  await page.goto(REPO_PDFS, { waitUntil: "networkidle2" });
  await sleep(600);
  voice = nar.say("tryStep1");
  await pointAt(page, await find(page, ".//a[contains(., '03-figma-fraude-taxid.pdf')]"));
  await sleep(600);
  await pointAt(page, await find(page, ".//a[contains(., '02-aws-fraude-cuenta-cambiada.pdf')]"));
  await voice;
  await page.goto(`${BASE}/agente`, { waitUntil: "networkidle0" });
  await sleep(600);
  voice = nar.say("tryStep2");
  await pointAt(page, await find(page, button("Empleado")));
  await sleep(500);
  await pointAt(page, await find(page, button("Admin financiero")));
  await voice;
  voice = nar.say("tryStep3");
  await uploadPdf(page, "03-figma-fraude-taxid.pdf");
  await pointAt(page, await find(page, button("Enviar y evaluar")));
  await voice;
  await submitAndWait(page, "Bloqueada");
  voice = nar.say("tryResult");
  await pointAt(page, await find(page, ".//article//p[contains(., 'Tax ID')]"));
  await voice;
  voice = nar.say("tryReset");
  await pointAt(page, await find(page, button("Reiniciar demo")));
  await voice;

  // Sign up or sign in with Google
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle0" });
  await sleep(500);
  voice = nar.say("signup");
  await pointAt(page, await find(page, button("Crear cuenta")));
  await sleep(400);
  await pointAt(page, await find(page, button("Continuar con Google")));
  await voice;
  voice = nar.say("google");
  const googleButton = await find(page, button("Continuar con Google"));
  await pointAt(page, googleButton);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2", timeout: 20000 }).catch(() => {}),
    googleButton.click(),
  ]);
  await sleep(600);
  await ensureOverlay(page);
  await page.evaluate((text) => {
    const el = document.getElementById("ww-caption");
    el.textContent = text;
    el.classList.remove("hide");
  }, shown("google"));
  await voice;
  await page.goto(`${BASE}/`, { waitUntil: "networkidle0" });
  await sleep(400);

  // Outro
  await nar.hide();
  await card(
    page,
    "La IA lee. Las reglas deciden.",
    "winkwink-seven.vercel.app/agente",
    "github.com/mesas01/WinkWink · Santiago Mesa",
  );
  voice = nar.say("outro");
  await voice;
  await nar.hide();
  await sleep(2500);
}

function mixAudio(cues, videoSeconds) {
  const music = `${BUILD}music.wav`;
  sh("node", [`${ROOT}scripts/demo/music.mjs`, String(videoSeconds + 1), music]);
  const inputs = ["-i", music];
  const parts = [];
  cues.forEach((c, i) => {
    inputs.push("-i", `${BUILD}${c.id}.wav`);
    parts.push(
      `[${i + 1}:a]aresample=44100,pan=stereo|c0=c0|c1=c0,adelay=${c.at}|${c.at},volume=1.3[v${i}]`,
    );
  });
  const voices = cues.map((_, i) => `[v${i}]`).join("");
  const filter = [
    ...parts,
    `${voices}amix=inputs=${cues.length}:normalize=0:duration=longest,apad=whole_dur=${videoSeconds}[voice]`,
    `[voice]asplit=2[vmix][vkey]`,
    `[0:a]volume=0.32[bed]`,
    `[bed][vkey]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=350[ducked]`,
    `[ducked][vmix]amix=inputs=2:normalize=0,alimiter=limit=0.95[out]`,
  ].join(";");
  const mix = `${BUILD}mix.wav`;
  sh("ffmpeg", [
    "-y",
    "-v",
    "error",
    ...inputs,
    "-filter_complex",
    filter,
    "-map",
    "[out]",
    "-t",
    String(videoSeconds),
    mix,
  ]);
  return mix;
}

async function run() {
  rmSync(BUILD, { recursive: true, force: true });
  mkdirSync(BUILD, { recursive: true });
  console.log("1/4 voz…");
  const durations = await synthesizeVoices();

  console.log("2/4 grabando pantalla…");
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    defaultViewport: { width: W, height: H, deviceScaleFactor: 1 },
  });
  const page = await browser.newPage();
  const ua = (await browser.userAgent()).replace("HeadlessChrome", "Chrome");
  await page.setUserAgent(ua);
  // Captions are injected into pages, including Google's sign-in page, which enforces Trusted Types.
  await page.setBypassCSP(true);
  await page.evaluateOnNewDocument(() =>
    localStorage.setItem(
      "winkwink-preferences",
      JSON.stringify({ state: { lang: "es", theme: "light", employeePreview: false }, version: 0 }),
    ),
  );
  await prepare(page);
  const webm = `${BUILD}screen.webm`;
  const recorder = await page.screencast({ path: webm });
  const nar = createNarrator(page, durations);
  nar.start();
  const wallStart = Date.now();
  await story(page, nar);
  const wallSeconds = (Date.now() - wallStart) / 1000;
  await recorder.stop();
  await browser.close();

  console.log("3/4 video…");
  // The screencast WebM has no duration header: encode first, then measure the MP4.
  // Puppeteer stamps frames at a fixed rate while Chrome delivers them faster, so the raw
  // WebM runs long. Rescale it to the measured wall-clock length so it matches the voice cues.
  const raw = `${BUILD}raw.mp4`;
  sh("ffmpeg", [
    "-y",
    "-v",
    "error",
    "-i",
    webm,
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "16",
    "-an",
    raw,
  ]);
  const factor = wallSeconds / duration(raw);
  const video = `${BUILD}video.mp4`;
  sh("ffmpeg", [
    "-y",
    "-v",
    "error",
    "-i",
    raw,
    "-vf",
    `setpts=PTS*${factor.toFixed(6)}`,
    "-c:v",
    "libx264",
    "-preset",
    "slow",
    "-crf",
    "18",
    "-pix_fmt",
    "yuv420p",
    "-r",
    "30",
    "-an",
    video,
  ]);
  const seconds = duration(video);
  console.log(`   reloj real ${wallSeconds.toFixed(1)} s · factor ${factor.toFixed(3)}`);

  console.log("4/4 música, voz y mezcla final…");
  writeFileSync(`${BUILD}cues.json`, JSON.stringify(nar.cues, null, 2));
  const mix = mixAudio(nar.cues, seconds);
  const mp4 = `${OUT}winkwink-demo.mp4`;
  if (existsSync(mp4)) rmSync(mp4);
  sh("ffmpeg", [
    "-y",
    "-v",
    "error",
    "-i",
    video,
    "-i",
    mix,
    "-c:v",
    "copy",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-shortest",
    "-movflags",
    "+faststart",
    mp4,
  ]);
  console.log(`Video listo (${seconds.toFixed(1)} s): ${mp4}`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
