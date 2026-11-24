const path = require("node:path"),
  fs = require("node:fs"),
  assert = require("node:assert/strict"),
  { chromium } = require("playwright");
(async () => {
  fs.mkdirSync(path.join(__dirname, "../artifacts"), { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH || undefined,
    args: ["--no-sandbox"],
  });
  try {
    for (const size of [
      { width: 320, height: 640 },
      { width: 390, height: 844 },
      { width: 1280, height: 900 },
    ]) {
      const context = await browser.newContext({
        viewport: size,
        hasTouch: size.width < 500,
        isMobile: size.width < 500,
      });
      const page = await context.newPage(),
        errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("response", (r) => {
        if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
      });
      await page.goto(
        process.env.CIVITAS_TEST_URL || "http://127.0.0.1:8080/civitas/next/",
      );
      await page.locator("[name=name]").fill("해솔");
      await page.getByRole("button", { name: "항구에서 시작하기" }).click();
      assert.match(await page.locator(".newspaper").textContent(), /이번 장의 목표/);
      if (size.width === 390) await page.screenshot({ path: path.join(__dirname, "../artifacts/mobile-intro.png") });
      await page.locator("[data-action=close-report]").click();
      async function settle() {
        for (let i = 0; i < 10; i++) {
          if (await page.locator("[data-action=result]").count())
            await page.locator("[data-action=result]").click();
          else if (await page.locator("[data-action=choice]").count())
            await page
              .locator("[data-action=choice]:not(:disabled)")
              .first()
              .click();
          else return;
        }
        throw Error("Event loop");
      }
      await settle();
      // Drag is an alternative to tap-select, and resolves to the same single placement.
      await page.locator("[data-place=dock]").evaluate((el) => el.scrollIntoView({ block: "center" }));
      const token = await page.locator("[data-person=head]").boundingBox(),
        dock = await page.locator("[data-place=dock]").boundingBox();
      await page.mouse.move(
        token.x + token.width / 2,
        token.y + token.height / 2,
      );
      await page.mouse.down();
      await page.mouse.move(dock.x + dock.width / 2, dock.y + dock.height / 2, {
        steps: 15,
      });
      await page.mouse.up();
      assert.equal(await page.locator("[data-place=dock] .player").count(), 1);
      await page.locator("[data-action=undo]").click();
      assert.equal(await page.locator(".piece.player").count(), 0);
      for (let turn = 0; turn < 8; turn++) {
        for (const [id, place] of [
          ["head", "dock"],
          ["kin", turn < 5 ? "gate" : "union"],
          ["young", turn < 5 ? "gate" : "union"],
        ]) {
          await page.locator(`[data-person=${id}]`).click();
          await page.locator(`[data-place=${place}]`).click();
        }
        if (turn === 1 && size.width === 390) await page.screenshot({ path: path.join(__dirname, "../artifacts/mobile-map.png") });
        await page.locator("[data-action=advance]").click();
        assert.match(await page.locator(".newspaper").textContent(), /예상 득표 \d+% → \d+%/);
        if (turn === 2 && size.width === 390) await page.screenshot({ path: path.join(__dirname, "../artifacts/mobile-report.png") });
        await page.locator("[data-action=close-report]").click();
        await settle();
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        );
        assert(!overflow, `overflow ${size.width}`);
        if (turn === 4) {
          await page.locator("[data-action=tab][data-tab=people]").click();
          assert((await page.locator(".memory").count()) > 0);
          await page.locator("[data-action=tab][data-tab=city]").click();
        }
        if (turn === 5) {
          await page.waitForFunction(() =>
            document
              .querySelector("#save-status")
              .textContent.includes("저장됨"),
          );
          await page.reload();
          await page.locator(".game-shell").waitFor();
          assert.equal(await page.locator("[name=name]").count(), 0);
        }
      }
      assert.equal(await page.locator(".ending").count(), 1);
      assert.match(
        await page.locator(".ending").textContent(),
        /당선|낙선/,
      );
      await page.locator("[data-action=archive]").first().click();
      assert.equal(await page.locator(".newspaper article").count(), 9);
      await page.locator("[data-action=close-report]").click();
      if (size.width === 390)
        await page.screenshot({
          path: path.join(__dirname, "../artifacts/mobile-ending.png"),
          fullPage: true,
        });
      assert.deepEqual(errors, []);
      console.log(
        "UI 8 turns, scoreboard, drag, undo, save/reload, memories, ending:",
        size.width + "x" + size.height,
      );
      await context.close();
    }
    for (const failure of ["indexeddb", "both", "corrupt"]) {
      const context = await browser.newContext();
      await context.addInitScript((mode) => {
        if (mode !== "corrupt") {
          IDBFactory.prototype.open = function () {
            throw Error("simulated database failure");
          };
        }
        if (mode === "both") {
          Storage.prototype.setItem = function () {
            throw Error("simulated quota failure");
          };
        }
      }, failure);
      const page = await context.newPage();
      await page.goto(
        process.env.CIVITAS_TEST_URL || "http://127.0.0.1:8080/civitas/next/",
      );
      await page.locator("[name=name]").waitFor();
      if (failure === "corrupt") {
        await page.evaluate(async () => {
          await SeasonSave.save(SeasonEngine.fresh({ name: "복원된 가장" }));
          localStorage.setItem("civitas-season-v2", "null");
          localStorage.setItem("civitas-river-v3", '{"legacy":"preserved"}');
        });
        await page.reload();
        await page.locator("[data-action=choice]").first().waitFor();
        assert.equal(await page.locator("[name=name]").count(), 0);
        assert.equal(
          await page.evaluate(() => localStorage.getItem("civitas-river-v3")),
          '{"legacy":"preserved"}',
        );
      } else {
        await page.locator("[name=name]").fill("저장 검사");
        await page.getByRole("button", { name: "항구에서 시작하기" }).click();
        if (failure === "indexeddb") {
          await page.waitForFunction(() =>
            document
              .querySelector("#save-status")
              .textContent.includes("보조 저장소"),
          );
          await page.reload();
          await page.locator("[data-action=choice]").first().waitFor();
          assert.equal(await page.locator("[name=name]").count(), 0);
        } else {
          await page.waitForFunction(() =>
            document
              .querySelector("#save-status")
              .textContent.includes("자동 저장 실패"),
          );
        }
      }
      console.log("Storage recovery:", failure);
      await context.close();
    }
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
