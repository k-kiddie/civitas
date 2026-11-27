"use strict";
const assert = require("node:assert/strict"),
  { spawn } = require("node:child_process"),
  net = require("node:net"),
  path = require("node:path");
(async () => {
  const probe = net.createServer();
  await new Promise((r) => probe.listen(0, "127.0.0.1", r));
  const port = probe.address().port;
  await new Promise((r) => probe.close(r));
  const server = spawn(
    process.execPath,
    ["server.js", "--port", String(port)],
    { cwd: path.join(__dirname, ".."), stdio: ["ignore", "pipe", "pipe"] },
  );
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(Error("Server startup timed out")),
        5000,
      );
      server.stdout.once("data", () => {
        clearTimeout(timer);
        resolve();
      });
      server.once("exit", () => {
        clearTimeout(timer);
        reject(Error("Server exited"));
      });
    });
    const base = "http://127.0.0.1:" + port;
    for (const prefix of ["", "/civitas"]) {
      for (const url of [
        "/",
        "/next/",
        "/next/index.html",
        "/src/ui/season.js",
        "/src/ui/save.js",
        "/src/ui/season.css",
        "/src/engine/season.js",
        "/src/content/harbor.js",
        "/src/shared/harbor.js",
        "/assets/events/storm-safe.webp",
        "/healthz",
      ]) {
        const res = await fetch(base + prefix + url);
        assert.equal(res.status, 200, url);
        assert(
          Number(res.headers.get("content-length")) > 0 || url === "/healthz",
        );
      }
      for (const asset of [
        "people/parent_m.webp",
        "origins/deserter.webp",
        "places/start_base.webp",
        "scenes/hk_sick_child.webp",
        "items/soi_photo.webp",
        "ui/title.webp",
      ]) {
        const res = await fetch(base + prefix + "/assets/journey/" + asset);
        assert.equal(res.status, 200, "journey/" + asset);
        assert.equal(res.headers.get("content-type"), "image/webp");
        assert(Number(res.headers.get("content-length")) > 0);
      }
      const redirect = await fetch(base + prefix + "/next?sample=1", {
        redirect: "manual",
      });
      assert.equal(redirect.status, 302);
      assert.equal(
        redirect.headers.get("location"),
        prefix + "/next/?sample=1",
      );
      const index = await (await fetch(base + prefix + "/next/")).text();
      assert(index.includes("../src/engine/season.js"));
      for (const url of [
        "/.git/config",
        "/DESIGN.md",
        "/package.json",
        "/src/engine/missing.js",
        "/assets/journey/ART_DESIGN.md",
        "/assets/journey/people/missing.webp",
      ])
        assert.equal((await fetch(base + prefix + url)).status, 404);
    }
    assert.equal(
      (await fetch(base + "/next/", { method: "POST" })).status,
      404,
    );
    console.log(
      "서버: /next/ · /civitas/next/ · 기존 게임/자산 · 상대 경로/리다이렉트 · 비공개 파일 차단 통과",
    );
  } finally {
    server.kill();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
