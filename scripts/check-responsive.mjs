// Run in CI with installed playwright-core and GitHub-hosted Chrome.
// Audits every sitemap page at phone, tablet, laptop, desktop and ultrawide widths.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";
import { chromium } from "playwright-core";

const widths = [320, 360, 375, 390, 430, 600, 720, 768, 820, 1024, 1280, 1440, 1920];
const xml = await readFile("dist/sitemap.xml", "utf8");
const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]).pathname);
assert.ok(paths.length >= 20, "Expected the complete static website sitemap");
const root = resolve("dist");
const mime = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript", ".svg": "image/svg+xml", ".xml": "application/xml", ".txt": "text/plain" };
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://127.0.0.1");
    let path = decodeURIComponent(url.pathname);
    if (path === "/") path = "/index.html";
    else if (path.endsWith("/")) path += "index.html";
    else if (!extname(path)) path += "/index.html";
    const file = resolve(root, "." + path);
    if (!file.startsWith(root + sep)) { res.writeHead(403); res.end(); return; }
    const body = await readFile(file);
    res.writeHead(200, { "Content-Type": mime[extname(file)] || "application/octet-stream" });
    res.end(body);
  } catch { res.writeHead(404); res.end("Not found"); }
});
await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
const port = server.address().port;
const candidates = [process.env.CHROME_PATH, "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/opt/google/chrome/chrome", "/usr/bin/chromium"].filter(Boolean);
const browserPath = candidates.find((p) => existsSync(p));
if (!browserPath) { server.close(); throw new Error("Chrome is not installed on this CI runner"); }
const browser = await chromium.launch({ executablePath: browserPath, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const failures = [];
let checked = 0;
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
  // Layout audit does not depend on third-party image-server availability.
  await page.route(/https:\/\/images\.unsplash\.com\//, (route) => route.abort());
  for (const path of paths) {
    await page.setViewportSize({ width: 1280, height: 900 });
    const response = await page.goto(`http://127.0.0.1:${port}${path}`, { waitUntil: "load", timeout: 15000 });
    if (response.status() !== 200) failures.push(`${path}: HTTP ${response.status()}`);
    for (const width of widths) {
      await page.setViewportSize({ width, height: width <= 430 ? 780 : 900 });
      const snapshot = await page.evaluate(() => {
        const viewport = document.documentElement.clientWidth;
        const scroll = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
        const visible = (element) => element && element.getClientRects().length && getComputedStyle(element).visibility !== "hidden" && getComputedStyle(element).display !== "none";
        const offenders = [...document.querySelectorAll("body *")].filter((el) => {
          if (!visible(el)) return false;
          const r = el.getBoundingClientRect();
          return r.width > 0 && (r.right > viewport + 2 || r.left < -2);
        }).slice(0, 6).map((el) => `${el.tagName.toLowerCase()}.${String(el.className?.baseVal ?? el.className ?? "").trim().replace(/\s+/g, ".").slice(0, 60)} (${Math.round(el.getBoundingClientRect().left)}..${Math.round(el.getBoundingClientRect().right)})`);
        const brand = document.querySelector(".site-header .brand")?.getBoundingClientRect();
        const menu = document.querySelector(".mobile-nav summary")?.getBoundingClientRect();
        const desktop = document.querySelector(".main-nav")?.getBoundingClientRect();
        const hero = document.querySelector(".hero-primary")?.getBoundingClientRect();
        const imgMissingAlt = [...document.images].filter((el) => !el.hasAttribute("alt")).length;
        return { viewport, scroll, offenders, brandRight:brand?.right, menuLeft:menu?.left, desktopLeft:desktop?.left, heroWidth:hero?.width, imageCount:document.images.length, imgMissingAlt, h1:document.querySelectorAll("h1").length };
      });
      if (snapshot.scroll > snapshot.viewport + 1) failures.push(`${path} @${width}: horizontal scroll ${snapshot.scroll}px > ${snapshot.viewport}px. Offenders: ${snapshot.offenders.join(", ")}`);
      if (snapshot.brandRight !== undefined && (width <= 720 ? snapshot.menuLeft : snapshot.desktopLeft) !== undefined) {
        if (snapshot.brandRight > (width <= 720 ? snapshot.menuLeft : snapshot.desktopLeft) - 1) failures.push(`${path} @${width}: brand overlaps navigation`);
      }
      if (snapshot.imgMissingAlt) failures.push(`${path} @${width}: ${snapshot.imgMissingAlt} images missing alt`);
      if (snapshot.h1 !== 1) failures.push(`${path} @${width}: expected one h1`);
      if (path === "/" && (!snapshot.heroWidth || snapshot.heroWidth < 100)) failures.push(`Homepage @${width}: primary enquiry CTA missing or too narrow`);
      checked++;
    }
    if (path === "/") {
      for (const width of [320, 390, 720]) {
        await page.setViewportSize({ width, height: 850 });
        await page.locator(".mobile-nav summary").click();
        const state = await page.evaluate(() => {
          const menu = document.querySelector(".mobile-links");
          const r = menu.getBoundingClientRect();
          return { visible: getComputedStyle(menu).display !== "none", right: r.right, left:r.left, vp: document.documentElement.clientWidth, scroll:document.documentElement.scrollWidth };
        });
        if (!state.visible || state.right > state.vp + 1 || state.left < -1 || state.scroll > state.vp + 1) failures.push(`Mobile menu @${width}: clipped or causes scroll: ${JSON.stringify(state)}`);
        await page.locator(".mobile-nav summary").click();
      }
      const mail = await page.locator("a.hero-primary").getAttribute("href");
      if (!mail?.startsWith("mailto:david@americafirst.co.nz")) failures.push("Homepage email CTA not configured");
    }
  }
  await page.close();
} finally { await browser.close(); await new Promise((resolve) => server.close(resolve)); }
if (failures.length) {
  console.error(`Responsive QA failed: ${failures.length} findings among ${checked} viewport checks:\n${failures.join("\n")}`);
  process.exitCode = 1;
} else console.log(`Responsive QA passed: ${paths.length} pages × ${widths.length} viewport widths = ${checked} layouts; 320px–1920px; mobile menu, navigation, image alt and enquiry CTA checks.`);
