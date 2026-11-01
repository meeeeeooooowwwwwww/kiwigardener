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
const paths = [...new Set([
  ...[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match=>new URL(match[1]).pathname),
  "/plants/agapanthus-seafoam/", "/plants/veronica-rakaiensis/", "/plants/phormium-jester/"
])];
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
  // Stable pixel-sized nursery photo stand-in for CSS/layout tests: avoid 271 third-party fetches.
  await page.route(/https:\/\/www\.goughsnurseries\.co\.nz\/cache\/plant\//, (route) =>
    route.fulfill({status:200, contentType:"image/svg+xml", body:'<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150"><rect width="150" height="150" fill="#a8c697"/></svg>'}));
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
        const mobileElement = document.querySelector(".mobile-nav summary");
        const menu = mobileElement && visible(mobileElement) ? mobileElement.getBoundingClientRect() : undefined;
        const desktopElement = document.querySelector(".main-nav");
        const desktop = desktopElement && visible(desktopElement) ? desktopElement.getBoundingClientRect() : undefined;
        const hero = document.querySelector(".hero-primary")?.getBoundingClientRect();
        const imgMissingAlt = [...document.images].filter((el) => !el.hasAttribute("alt")).length;
        return { viewport, scroll, offenders, brandRight:brand?.right, menuLeft:menu?.left, desktopLeft:desktop?.left, heroWidth:hero?.width, imageCount:document.images.length, imgMissingAlt, h1:document.querySelectorAll("h1").length };
      });
      if (snapshot.scroll > snapshot.viewport + 1) failures.push(`${path} @${width}: horizontal scroll ${snapshot.scroll}px > ${snapshot.viewport}px. Offenders: ${snapshot.offenders.join(", ")}`);
      if (snapshot.brandRight !== undefined) {
        const navLeft = snapshot.menuLeft ?? snapshot.desktopLeft;
        if (navLeft !== undefined && snapshot.brandRight > navLeft - 1) failures.push(`${path} @${width}: brand overlaps navigation`);
      }
      if (snapshot.imgMissingAlt) failures.push(`${path} @${width}: ${snapshot.imgMissingAlt} images missing alt`);
      if (snapshot.h1 !== 1) failures.push(`${path} @${width}: expected one h1`);
      // Regression: verify the computed layout, not only horizontal overflow.
      if ((width === 390 || width === 1440) && await page.locator(".learning-path").count()) {
        const nav = await page.evaluate(() => {
          const list = document.querySelector(".learning-path ol");
          const item = list?.querySelector("li");
          const link = item?.querySelector("a");
          const title = item?.querySelector(".path-title");
          const desc = item?.querySelector(".path-desc");
          const before = link ? getComputedStyle(link, "::before") : null;
          const heading = title?.getBoundingClientRect();
          const detail = desc?.getBoundingClientRect();
          return { layout: list && getComputedStyle(list).display,
            marker: list && getComputedStyle(list).listStyleType,
            linkDisplay: link && getComputedStyle(link).display,
            number: before?.content, numberWidth: Number.parseFloat(before?.width || "0"),
            gap: heading && detail ? detail.top - heading.bottom : -1,
            items: list?.children.length, hardcodedNumbers: !!item?.querySelector(".path-index") };
        });
        if (nav.layout !== "grid" || nav.marker !== "none" || nav.linkDisplay !== "flex" ||
            nav.number === "none" || nav.numberWidth < 20 || nav.gap < 2 ||
            nav.items !== 4 || nav.hardcodedNumbers) {
          failures.push(`${path} @${width}: learning steps unstyled or text cramped: ${JSON.stringify(nav)}`);
        }
      }
      if (path === "/plants/") {
        const detail=await page.evaluate(()=>{
          const results=document.querySelector(".plant-results");
          const card=document.querySelector(".plant-card:not([hidden])");
          const footer=document.querySelector(".site-footer");
          const mobile=document.querySelector(".mobile-nav summary");
          const desktop=document.querySelector(".main-nav");
          const vis=e=>e&&e.getClientRects().length>0&&getComputedStyle(e).display!=="none";
          return {
            columns:getComputedStyle(results).gridTemplateColumns.split(" ").filter(Boolean).length,
            expectedCard:card?.classList.contains("card"),
            cardBackground:card&&getComputedStyle(card).backgroundColor,
            footerPresent:Boolean(footer&&footer.querySelector('.footer-contact')),
            footerPlantLink:Boolean(footer?.querySelector('a[href="/plants/"]')),
            filterWidth:document.querySelector(".plant-filters")?.getBoundingClientRect().width,
            compactNav:vis(mobile),desktopNav:vis(desktop),
            searchHeight:document.getElementById("plant-query")?.getBoundingClientRect().height,
            photoLink:card?.querySelector(".plant-photo-link")?.href,
            internalLink:card?.querySelector(".plant-card-body")?.getAttribute("href"),
            imageHeight:card?.querySelector(".plant-photo")?.getBoundingClientRect().height,
            imageAlt:card?.querySelector(".plant-photo")?.alt
          };
        });
        const expectedCols=width<=520?1:width<=950?2:3;
        if(detail.columns!==expectedCols)failures.push(`Plant cards @${width}: ${detail.columns} columns, expected ${expectedCols}`);
        if(!detail.expectedCard||!detail.footerPresent||!detail.footerPlantLink)failures.push(`Plant cards/footer @${width}: shared components missing`);
        if(!detail.photoLink?.startsWith("https://www.goughsnurseries.co.nz/plant/")||!detail.internalLink?.startsWith("/plants/")||detail.imageHeight<100||!detail.imageAlt)failures.push(`Plant photo @${width}: missing photo or incorrect links/layout`);
        if(!detail.filterWidth||detail.filterWidth>snapshot.viewport||detail.searchHeight<40)failures.push(`Plant search @${width}: control too narrow or overflows`);
        if(width<=1100?!detail.compactNav||detail.desktopNav:!detail.desktopNav||detail.compactNav)failures.push(`Plant navigation @${width}: wrong menu mode`);
      }
      if (path === "/" && (!snapshot.heroWidth || snapshot.heroWidth < 100)) failures.push(`Homepage @${width}: primary enquiry CTA missing or too narrow`);
      checked++;
    }
    if (path === "/plants/") {
      await page.setViewportSize({width:390,height:850});
      const photoCount=await page.locator(".plant-card .plant-photo").count();
      if(photoCount!==271)failures.push("Expected 271 plant thumbnails, got "+photoCount);
      const feijoa=page.locator('a.plant-card-body[href="/plants/acca-sellowiana/"]').locator("..");
      const out=await feijoa.locator(".plant-photo-link").getAttribute("href");
      if(out!=="https://www.goughsnurseries.co.nz/plant/acca-sellowiana")failures.push("Feijoa plant photo must link to its exact nursery listing");
      await page.fill("#plant-query","feijoa");
      let visible=await page.locator(".plant-card:visible").count();
      if(visible!==1)failures.push("Plant search for feijoa should return exactly one plant, got "+visible);
      if(!page.url().includes("query=feijoa"))failures.push("Plant search does not persist query URL");
      await page.locator("#plant-reset").click();
      visible=await page.locator(".plant-card:visible").count();
      if(visible!==24)failures.push("Plant finder should show first 24 cards, got "+visible);
      await page.locator("#plant-more").click();
      visible=await page.locator(".plant-card:visible").count();
      if(visible!==48)failures.push("Load-more should show 48 cards, got "+visible);
      await page.locator("#plant-reset").click();
      await page.fill("#plant-query","white flowering shrubs");
      visible=await page.locator(".plant-card:visible").count();
      if(visible<1)failures.push("Natural language 'white flowering shrubs' did not find plants");
      await page.locator("#plant-reset").click();
      await page.fill("#plant-query","native plants");
      visible=await page.locator(".plant-card:visible").count();
      if(visible<1)failures.push("Natural language 'native plants' did not find plants");
      await page.locator("#plant-reset").click();
      await page.selectOption("#plant-form","Shrub");
      await page.selectOption("#plant-flower","white");
      visible=await page.locator(".plant-card:visible").count();
      if(visible<1||visible>24)failures.push("Combined shrub and white-flower filters failed: "+visible);
      await page.locator("#plant-reset").click();
      await page.selectOption("#plant-native","yes");
      visible=await page.locator(".plant-card:visible").count();
      if(visible<1||visible>24)failures.push("Native-only filter failed: "+visible);
      await page.locator("#plant-reset").click();
      if(!await page.locator("#plant-more").isVisible())failures.push("Show more is not available after reset");
    }
    if (path === "/") {
      for (const width of [320, 390, 720, 820, 1024, 1100]) {
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
      if (!mail?.startsWith("tel:+64273406581")) failures.push("Homepage click-to-call CTA not configured");
    }
  }
  await page.close();
} finally { await browser.close(); await new Promise((resolve) => server.close(resolve)); }
if (failures.length) {
  console.error(`Responsive QA failed: ${failures.length} findings among ${checked} viewport checks:\n${failures.join("\n")}`);
  process.exitCode = 1;
} else console.log(`Responsive QA passed: ${paths.length} pages × ${widths.length} viewport widths = ${checked} layouts; 320px–1920px; mobile menu, navigation, image alt and enquiry CTA checks.`);
