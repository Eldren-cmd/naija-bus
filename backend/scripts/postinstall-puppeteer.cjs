const { spawnSync } = require("node:child_process");
const path = require("node:path");

const isWhatsAppBotEnabled = String(process.env.WHATSAPP_BOT_ENABLED || "").toLowerCase() === "true";

if (!isWhatsAppBotEnabled) {
  console.log("[postinstall] WHATSAPP_BOT_ENABLED is not true; skipping Chromium install.");
  process.exit(0);
}

const cacheDirectory = process.env.PUPPETEER_CACHE_DIR || path.join(process.cwd(), ".cache", "puppeteer");
const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";

console.log(`[postinstall] Installing Puppeteer Chrome to cache: ${cacheDirectory}`);
const result = spawnSync(npxCommand, ["puppeteer", "browsers", "install", "chrome"], {
  stdio: "inherit",
  env: {
    ...process.env,
    PUPPETEER_CACHE_DIR: cacheDirectory,
  },
});

if (result.error) {
  console.error(`[postinstall] Failed to launch puppeteer installer: ${result.error.message}`);
  process.exit(1);
}

if (typeof result.status === "number" && result.status !== 0) {
  console.error(`[postinstall] Puppeteer Chrome install failed with exit code ${result.status}.`);
  process.exit(result.status);
}

console.log("[postinstall] Puppeteer Chrome install complete.");
