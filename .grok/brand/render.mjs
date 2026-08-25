import { chromium } from "playwright";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const jobs = [
  {
    html: resolve("/workspace/.grok/brand/og-card.html"),
    out: resolve("/workspace/.grok/og-raw.png"),
    width: 1200,
    height: 630,
  },
  {
    html: resolve("/workspace/.grok/brand/x-banner.html"),
    out: resolve("/workspace/.grok/x-banner-raw.png"),
    width: 1200,
    height: 264,
  },
];

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

try {
  for (const job of jobs) {
    const page = await browser.newPage({
      viewport: { width: job.width, height: job.height },
      deviceScaleFactor: 2,
    });
    await page.goto(pathToFileURL(job.html).href, { waitUntil: "load", timeout: 30000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(200);
    await page.screenshot({ path: job.out, type: "png", omitBackground: false });
    await page.close();
    console.log("wrote", job.out);
  }
} finally {
  await browser.close();
}
