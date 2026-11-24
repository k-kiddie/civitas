// 맛보기 브라우저 검사: 시작 → 장소 방문 → 사건/결과 → 건설 → 계절 결산 → 결말까지 자동 진행. 스크린샷 저장.
const path = require("node:path"), assert = require("node:assert/strict"), { chromium } = require("playwright");
const URL = process.env.CIVITAS_TEST_URL || "http://127.0.0.1:8080/civitas/proto/";
(async () => {
  const browser = await chromium.launch();
  try {
    for (const size of [{ width: 320, height: 640 }, { width: 390, height: 844 }]) {
      const ctx = await browser.newContext({ viewport: size, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
      const page = await ctx.newPage(), errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("response", (r) => r.status() >= 400 && errors.push(r.status() + " " + r.url()));
      const shot = async (n) => { if (size.width !== 390) return; await page.waitForTimeout(450); await page.screenshot({ path: path.join(__dirname, "../artifacts/proto-" + n + ".png") }); };
      await page.goto(URL);
      await shot("title");
      await page.fill("[name=name]", "해솔");
      await page.click("button[type=submit]");
      await page.locator(".map").waitFor();
      await shot("map");
      const order = ["dock", "fishing", "market", "alley", "hall", "union", "home", "manor"];
      let visits = 0, shotEvent = false, shotResult = false, shotPaper = false;
      for (let step = 0; step < 600; step++) {
        if (await page.locator(".ending").count()) break;
        const choose = page.locator("[data-action=choose]:not(:disabled)");
        if (await choose.count()) {
          if (!shotEvent) { await shot("event"); shotEvent = true; }
          await choose.first().click(); continue;
        }
        const dismiss = page.locator("[data-action=dismiss]");
        if (await dismiss.count()) {
          if (!shotResult && await page.locator(".result").count()) { await shot("result"); shotResult = true; }
          if (!shotPaper && await page.locator(".paper").count()) { await shot("paper"); shotPaper = true; }
          await dismiss.click(); continue;
        }
        if (await page.locator(".toast").count()) await page.locator("[data-action=toast-close]").click();
        const ap = await page.locator(".ap i.on").count();
        if (ap === 0) { await page.locator("[data-action=end]").click(); continue; }
        // 제방 돈이 있으면 짓기
        await page.locator("[data-action=sheet][data-sheet=build]").click();
        const dike = page.locator("[data-action=build][data-id=dike]:not(:disabled)");
        if (await dike.count()) { await dike.click(); continue; }
        await page.locator("[data-action=close]").click();
        const loc = order[visits++ % order.length];
        const node = page.locator(`[data-loc=${loc}]:not([aria-disabled])`);
        if (await node.count()) await node.click(); else visits++;
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
        assert(!overflow, "가로 넘침 " + size.width);
      }
      assert.equal(await page.locator(".ending").count(), 1, "결말 도달");
      await shot("ending");
      await page.locator(".ending [data-sheet=log]").click();
      assert((await page.locator(".log li").count()) > 2);
      await page.locator("[data-action=close]").click();
      await page.locator("[data-action=restart]").click();
      await page.locator("[name=name]").waitFor();
      assert((await page.locator(".origin:not(.locked)").count()) >= 2, "상인 집안 해금");
      assert.deepEqual(errors, []);
      console.log("맛보기 UI 한 판 완주·결말·해금:", size.width + "x" + size.height);
      await ctx.close();
    }
  } finally { await browser.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
