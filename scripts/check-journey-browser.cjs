// 「남행」 브라우저 완주 검사 (서버가 8080에서 떠 있어야 한다): node scripts/check-journey-browser.cjs
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const b = await chromium.launch();
  for (const [origin, size] of [["parent", { width: 390, height: 844 }], ["deserter", { width: 320, height: 640 }], ["drifter", { width: 390, height: 844 }], ["crew", { width: 320, height: 640 }], ["pilot", { width: 390, height: 844 }]]) {
    const page = await b.newPage({ viewport: size });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => { if (m.type() === "error" && !/404|Failed to load resource/.test(m.text())) errors.push(m.text()); });
    await page.goto("http://localhost:8080/journey/");
    await page.evaluate(() => localStorage.clear()); await page.reload();
    const shot = (n) => page.screenshot({ path: `artifacts/journey-${origin}-${n}.png` });
    await page.click(`[data-action=origin][data-k=${origin}]`);
    await shot("title");
    await page.click("[data-action=start]");
    const has = async (sel) => (await page.locator(sel).count()) > 0;
    for (let step = 0; step < 900; step++) {
      if (await has(".ending")) break;
      if (await has(".roll")) { await page.waitForTimeout(1600); continue; }
      if (await has("[data-action=begin]")) { await shot("intro"); await page.click("[data-action=begin]"); continue; }
      if (await has("[data-action=cont]")) { await page.click("[data-action=cont]"); continue; }
      if (await has("[data-action=choose]:not(:disabled)")) { await shot("event"); await page.locator("[data-action=choose]:not(:disabled)").first().click(); continue; }
      if (await has(".sheet [data-action=drop]") && await has(".slots.over")) { await page.locator("[data-action=drop]").first().click(); continue; }
      if (await has(".sheet [data-action=close]")) { await page.click(".sheet [data-action=close]"); continue; }
      if (await has("[data-action=sleep]")) { await shot("camp"); await page.click("[data-action=sleep]"); continue; }
      if (await has(".jbar .warn")) { await page.click(".jbar .warn"); continue; }
      if (await has("[data-action=go]:not(:disabled)")) {
        await shot("map");
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
        assert(!overflow, "가로 넘침 " + size.width);
        await page.locator("[data-action=go]:not(:disabled)").first().click(); continue;
      }
      if (await has("[data-action=toast]")) { await page.click("[data-action=toast]"); continue; }
      if (await has("[data-action=close]")) { await page.click("[data-action=close]"); continue; }
      throw Error("멈춤: " + (await page.locator("body").innerText()).slice(0, 300));
    }
    assert.equal(await page.locator(".ending").count(), 1, "결말 도달");
    await shot("ending");
    await page.reload();
    assert.equal(await page.locator(".ending").count(), 1, "새로고침해도 결말 유지");
    assert.deepEqual(errors, []);
    console.log(`남행 UI 완주: ${origin} ${size.width}x${size.height}`);
    await page.close();
  }
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
