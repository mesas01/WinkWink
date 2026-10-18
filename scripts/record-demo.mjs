// Records the narrated WinkWink demo: voice (macOS `say`), synced captions, visible cursor and music.
// Usage: npm run demo:record [-- https://winkwink-seven.vercel.app]
// Output: demo/winkwink-demo.mp4 (needs macOS, Google Chrome and ffmpeg).
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import puppeteer from "puppeteer-core";

const BASE = process.argv[2] ?? "https://winkwink-seven.vercel.app";
const ROOT = new URL("../", import.meta.url).pathname;
const OUT = `${ROOT}demo/`;
const BUILD = `${OUT}build/`;
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const VOICE = "Paulina";
const RATE = "182";
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

function synthesizeVoices() {
  const durations = {};
  for (const id of Object.keys(LINES)) {
    const file = `${BUILD}${id}.aiff`;
    sh("say", ["-v", VOICE, "-r", RATE, "-o", file, spoken(id).replace(/…/g, ", ")]);
    durations[id] = duration(file);
  }
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
    inputs.push("-i", `${BUILD}${c.id}.aiff`);
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
  const durations = synthesizeVoices();

  console.log("2/4 grabando pantalla…");
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    defaultViewport: { width: W, height: H, deviceScaleFactor: 1 },
  });
  const page = await browser.newPage();
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
