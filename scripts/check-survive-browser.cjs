// 생존 맛보기 브라우저 검사: 시작 → 낮(일 맡기기) → 밤(탐색 판정) → 새벽 → … → 결말. 스크린샷 저장.
const path = require("node:path"), assert = require("node:assert/strict"), { chromium } = require("playwright");
const URL = process.env.CIVITAS_TEST_URL || "http://127.0.0.1:8080/civitas/survive/";
(async () => {
  const browser = await chromium.launch();
  try {
    for (const size of [{ width: 320, height: 640 }, { width: 390, height: 844 }]) {
      const ctx = await browser.newContext({ viewport: size, deviceScaleFactor: 2 });
      const page = await ctx.newPage(), errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("response", (r) => r.status() >= 400 && errors.push(r.status() + " " + r.url()));
      const shots = new Set();
      const shot = async (n) => { if (size.width !== 390 || shots.has(n)) return; shots.add(n); await page.waitForTimeout(450); await page.screenshot({ path: path.join(__dirname, "../artifacts/survive-" + n + ".png") }); };
      await page.goto(URL);
      await page.evaluate(() => localStorage.clear());
      await page.reload();
      await shot("title");
      await page.fill("[name=name]", "해솔");
      await page.click("button[type=submit]");
      for (let step = 0; step < 1500; step++) {
        if (await page.locator(".ending").count()) break;
        const has = async (sel) => (await page.locator(sel).count()) > 0;
        if (await has(".roll")) { await shot("roll"); await page.waitForTimeout(1300); continue; }
        if (await has("[data-action=dismiss]")) { if (await has(".report")) await shot("report"); await page.click("[data-action=dismiss]"); continue; }
        if (await has("[data-action=event]:not(:disabled)")) { await shot("event"); await page.locator("[data-action=event]:not(:disabled)").first().click(); continue; }
        if (await has("[data-action=approach]")) { await shot("scene"); await page.locator("[data-action=approach]").first().click(); continue; }
        if (await has("[data-action=home]")) { await shot("result"); await page.click("[data-action=home]"); continue; }
        if (await has(".night")) {
          await shot("night");
          if (await has("[data-action=recgo]")) await page.click("[data-action=recgo]");
          else await page.click("[data-action=skip]");
          continue;
        }
        if (await has("[data-action=endday]")) {
          await shot("day");
          // 방침 하나만 고른다(사람마다 누르지 않는다)
          await page.click("[data-action=policy][data-k=balanced]");
          assert((await page.locator(".card .job").first().innerText()).trim().length > 0, "자동 배치");
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
          assert(!overflow, "가로 넘침 " + size.width);
          await page.click("[data-action=endday]");
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
      console.log("생존 맛보기 UI 한 판 완주:", size.width + "x" + size.height);
      await ctx.close();
    }
  } finally { await browser.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
