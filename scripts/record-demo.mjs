// Records the WinkWink demo video with captions and a visible cursor.
// Usage: npm run demo:record [-- https://winkwink-seven.vercel.app]
// Output: demo/winkwink-demo.mp4 (needs Google Chrome and ffmpeg installed).
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import puppeteer from "puppeteer-core";

const BASE = process.argv[2] ?? "https://winkwink-seven.vercel.app";
const OUT_DIR = new URL("../demo/", import.meta.url).pathname;
const WEBM = `${OUT_DIR}winkwink-demo.webm`;
const MP4 = `${OUT_DIR}winkwink-demo.mp4`;
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const W = 1440;
const H = 900;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Caption bar, title cards and a fake cursor, injected into the page. */
const OVERLAY_CSS = `
#ww-caption{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:99999;max-width:1100px;
  background:#1a1a1a;color:#faf8f4;font:600 22px/1.35 Archivo,system-ui,sans-serif;padding:14px 22px;border-radius:3px;
  box-shadow:0 0 0 2px #faf8f4;transition:opacity .25s;text-align:center}
#ww-caption b{color:#c9bcff}
#ww-card{position:fixed;inset:0;z-index:100000;background:#faf8f4;color:#1a1a1a;display:grid;place-items:center;
  font-family:Archivo,system-ui,sans-serif;text-align:center}
#ww-card h1{font-size:76px;font-weight:800;letter-spacing:-.03em;margin:0}
#ww-card p{font-size:26px;margin:14px 0 0;color:#4b3b8f;font-weight:600}
#ww-card small{display:block;margin-top:26px;font:700 18px 'Courier Prime',monospace;color:#555}
#ww-cursor{position:fixed;z-index:100001;width:22px;height:22px;border-radius:50%;background:rgba(75,59,143,.35);
  border:2px solid #4b3b8f;pointer-events:none;transform:translate(-50%,-50%);transition:left .55s cubic-bezier(.23,1,.32,1),top .55s cubic-bezier(.23,1,.32,1)}
#ww-cursor.click{background:rgba(75,59,143,.7)}
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
      c.style.left = "720px";
      c.style.top = "450px";
      document.body.append(c);
    }
  }, OVERLAY_CSS);
}

async function caption(page, html, holdMs = 0) {
  await ensureOverlay(page);
  await page.evaluate((h) => {
    let el = document.getElementById("ww-caption");
    if (!el) {
      el = document.createElement("div");
      el.id = "ww-caption";
      document.body.append(el);
    }
    el.innerHTML = h;
    el.style.opacity = h ? "1" : "0";
  }, html);
  if (holdMs) await sleep(holdMs);
}

async function card(page, title, subtitle, small, holdMs) {
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
  await sleep(holdMs);
  await page.evaluate(() => document.getElementById("ww-card")?.remove());
}

async function find(page, xpath) {
  for (let i = 0; i < 40; i++) {
    const [el] = await page.$$(`xpath/${xpath}`);
    if (el) return el;
    await sleep(250);
  }
  throw new Error(`Not found: ${xpath}`);
}

/** Moves the visible cursor to the element, then clicks it. */
async function click(page, xpath, pauseMs = 500) {
  await ensureOverlay(page);
  const el = await find(page, xpath);
  await el.scrollIntoView();
  const box = await el.boundingBox();
  if (!box) throw new Error(`No box: ${xpath}`);
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.evaluate(
    (cx, cy) => {
      const c = document.getElementById("ww-cursor");
      c.style.left = `${cx}px`;
      c.style.top = `${cy}px`;
    },
    x,
    y,
  );
  await sleep(650);
  await page.evaluate(() => document.getElementById("ww-cursor").classList.add("click"));
  await el.click();
  await sleep(180);
  await page.evaluate(() => document.getElementById("ww-cursor")?.classList.remove("click"));
  await sleep(pauseMs);
}

const button = (text) => `.//button[contains(normalize-space(.), "${text}")]`;
const row = (id) => `.//main//li//button[contains(., "${id}")]`;

async function waitAllEvaluated(page) {
  for (let i = 0; i < 120; i++) {
    const done = await page.evaluate(() => /Sin evaluar\s*0/.test(document.body.innerText));
    if (done) return;
    await sleep(500);
  }
}

async function run() {
  mkdirSync(OUT_DIR, { recursive: true });
  for (const f of [WEBM, MP4]) if (existsSync(f)) rmSync(f);
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    defaultViewport: { width: W, height: H, deviceScaleFactor: 1 },
    args: [`--window-size=${W},${H}`],
  });
  const page = await browser.newPage();
  await page.evaluateOnNewDocument(() =>
    localStorage.setItem(
      "winkwink-preferences",
      JSON.stringify({ state: { lang: "es", theme: "light", employeePreview: false }, version: 0 }),
    ),
  );
  await page.goto(`${BASE}/`, { waitUntil: "networkidle0" });
  await sleep(1500);
  const recorder = await page.screencast({ path: WEBM });

  // 1. Title + problem
  await card(page, "WinkWink", "Agente de IA antifraude para cuentas por pagar en Blinka", "Reto Blinka · 30X Hackathon", 3500);
  await caption(page, "Una factura real con la <b>cuenta bancaria cambiada</b> es el fraude más común en cuentas por pagar.", 4200);
  await caption(page, "WinkWink lee cada factura, verifica la cuenta y la <b>sella</b>: aprobada, retenida o bloqueada.", 3800);

  // 2. Agent
  await page.goto(`${BASE}/agente`, { waitUntil: "networkidle0" });
  await sleep(1200);
  await caption(page, "Panel del <b>Admin financiero</b>: 6 facturas sintéticas en cola.", 0);
  await click(page, button("Reiniciar demo"), 1600);
  await caption(page, "<b>Autonomía:</b> el agente evalúa toda la cola — A extracción con Gemini · B antifraude · C reglas · D auditoría.", 0);
  await click(page, button("Evaluar pendientes"), 0);
  await waitAllEvaluated(page);
  await sleep(1200);
  await caption(page, "Lo que cumple las reglas se <b>aprueba solo</b>; las excepciones quedan retenidas para un humano.", 4200);

  // 3. Anti-fraud
  await click(page, row("INV-003"), 600);
  await caption(page, "<b>Antifraude:</b> la cuenta de la factura (Wells Fargo ****9999) no coincide con la verificada de AWS en Blinka.", 4500);
  await caption(page, "Bloqueo rojo inmediato. <b>Nadie puede aprobarla</b>, ni siquiera un admin: solo rechazarla.", 4200);

  // 4. Explainability + override
  await click(page, row("INV-002"), 600);
  await caption(page, "<b>Explicable:</b> cada decisión trae su porqué en una línea. Viáticos de USD 120 superan el límite de USD 100.", 4200);
  await click(page, button("Aprobar excepción"), 600);
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }));
  await caption(page, "La excepción del admin queda en el <b>registro de auditoría</b> y la decisión anterior se <b>tacha</b>, nunca se borra.", 5000);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await sleep(800);

  // 5. New invoice
  await click(page, button("Nueva factura"), 400);
  await caption(page, "Nueva factura: texto, PDF o <b>foto con la cámara</b> del móvil o la webcam.", 0);
  const textarea = await find(page, ".//textarea");
  await textarea.click();
  await textarea.type(
    "Proveedor: Figma\nCategoría: Software\nTotal: USD 75.00\nMoneda: USD\nTax ID: US-771204\nCuenta bancaria: Silicon Valley Bank ****7500",
    { delay: 18 },
  );
  await sleep(600);
  await click(page, button("Enviar y evaluar"), 0);
  await sleep(4500);
  await caption(page, "Cuenta verificada + regla de Software &lt; USD 500 → <b>aprobada automáticamente</b>.", 3500);

  // 6. Rules, vendors, roles
  await click(page, button("Reglas activas"), 300);
  await caption(page, "Reglas configurables por el admin. Lo que ninguna regla cubre, <b>se retiene</b>.", 3500);
  await click(page, button("Proveedores verificados"), 300);
  await caption(page, "Cuentas y Tax ID pre-verificados en Blinka contra los que se compara cada factura.", 3500);
  await click(page, button("Empleado"), 400);
  await caption(page, "Vista de <b>Empleado</b>: solo sus facturas, su sello y su porqué. Sin reglas ni botones de excepción.", 4200);
  await click(page, button("Admin financiero"), 300);

  // 7. Close
  await caption(page, "", 0);
  await card(page, "La IA lee. Las reglas deciden.", "winkwink-seven.vercel.app/agente", "github.com/mesas01/WinkWink · Santiago Mesa", 4500);

  await recorder.stop();
  await browser.close();
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", WEBM, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-movflags", "+faststart", MP4]);
  rmSync(WEBM);
  console.log(`Video listo: ${MP4}`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
