// 「넷이서 버티기」 브라우저 검사: 시나리오별로 시작 → 저녁 결정 → 밤 탐색 → 새벽 → … → 결말. 스크린샷 저장.
const path = require("node:path"), assert = require("node:assert/strict"), { chromium } = require("playwright");
const URL = process.env.CIVITAS_TEST_URL || "http://127.0.0.1:8080/civitas/survive/";
(async () => {
  const browser = await chromium.launch();
  try {
    for (const [scenario, size] of [["nuclear", { width: 390, height: 844 }], ["iceage", { width: 390, height: 844 }], ["flood", { width: 320, height: 640 }]]) {
      const ctx = await browser.newContext({ viewport: size, deviceScaleFactor: 2 });
      const page = await ctx.newPage(), errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("response", (r) => { if (r.status() >= 400 && !/\/assets\/scenarios\//.test(r.url())) errors.push(r.status() + " " + r.url()); });
      const shots = new Set();
      const shot = async (n) => { if (size.width !== 390 || shots.has(n)) return; shots.add(n); await page.waitForTimeout(450); await page.screenshot({ path: path.join(__dirname, `../artifacts/survive-${scenario}-${n}.png`) }); };
      await page.goto(URL);
      await page.evaluate(() => localStorage.clear());
      await page.reload();
      await page.fill("[name=name]", "해솔");
      await page.click(`[data-action=pick][data-k=${scenario}]`);
      await shot("title");
      await page.click("button[type=submit]");
      let nights = 0;
      for (let step = 0; step < 1500; step++) {
        if (await page.locator(".ending").count()) break;
        const has = async (sel) => (await page.locator(sel).count()) > 0;
        if (await has(".roll")) { await page.waitForTimeout(1300); continue; }
        if (await has("[data-action=dismiss]")) { if (await has(".report")) await shot("report"); await page.click("[data-action=dismiss]"); continue; }
        if (await has("[data-action=event]:not(:disabled)")) { await shot("event"); await page.locator("[data-action=event]:not(:disabled)").first().click(); continue; }
        if (await has("[data-action=approach]:not(:disabled)")) { await shot("scene"); await page.locator("[data-action=approach]:not(:disabled)").first().click(); continue; }
        if (await has("[data-action=home]")) { await shot("result"); await page.click("[data-action=home]"); continue; }
        if (await has("[data-action=night]")) {
          await shot("evening");
          if (nights++ % 2 === 0 && await has("[data-action=rec]")) await page.click("[data-action=rec]");
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
          assert(!overflow, "가로 넘침 " + size.width);
          await page.click("[data-action=night]");
          continue;
        }
        if (await has("[data-action=toast]")) { await page.click("[data-action=toast]"); continue; }
        throw Error("멈춤: " + (await page.locator("body").innerText()).slice(0, 300));
      }
      assert.equal(await page.locator(".ending").count(), 1, "결말 도달");
      await shot("ending");
      await page.reload();
      assert.equal(await page.locator(".ending").count(), 1, "새로고침해도 결말 유지");
      assert.deepEqual(errors, []);
      console.log("넷이서 버티기 UI 완주:", scenario, size.width + "x" + size.height);
      await ctx.close();
    }
  } finally { await browser.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
