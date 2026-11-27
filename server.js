"use strict";
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const root = __dirname;
const port = Math.max(
  1,
  Number(process.argv[process.argv.indexOf("--port") + 1]) ||
    Number(process.env.PORT) ||
    8080,
);
const BASE = "/civitas";
const routes = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/job-stories.js", ["job-stories.js", "text/javascript; charset=utf-8"]],
  ["/careers.js", ["careers.js", "text/javascript; charset=utf-8"]],
  ["/institutions.js", ["institutions.js", "text/javascript; charset=utf-8"]],
  ["/agencies.js", ["agencies.js", "text/javascript; charset=utf-8"]],
  ["/random-events.js", ["random-events.js", "text/javascript; charset=utf-8"]],
  ["/underworld.js", ["underworld.js", "text/javascript; charset=utf-8"]],
  ["/politics.js", ["politics.js", "text/javascript; charset=utf-8"]],
  ["/work-careers.js", ["work-careers.js", "text/javascript; charset=utf-8"]],
  [
    "/work-incidents.js",
    ["work-incidents.js", "text/javascript; charset=utf-8"],
  ],
  [
    "/work-agreements.js",
    ["work-agreements.js", "text/javascript; charset=utf-8"],
  ],
  ["/work-projects.js", ["work-projects.js", "text/javascript; charset=utf-8"]],
  ["/career-echoes.js", ["career-echoes.js", "text/javascript; charset=utf-8"]],
  ["/chronicles.js", ["chronicles.js", "text/javascript; charset=utf-8"]],
  ["/society.js", ["society.js", "text/javascript; charset=utf-8"]],
  ["/succession.js", ["succession.js", "text/javascript; charset=utf-8"]],
  ["/family.js", ["family.js", "text/javascript; charset=utf-8"]],
  ["/life.js", ["life.js", "text/javascript; charset=utf-8"]],
  ["/council.js", ["council.js", "text/javascript; charset=utf-8"]],
  ["/pacts.js", ["pacts.js", "text/javascript; charset=utf-8"]],
  ["/parties.js", ["parties.js", "text/javascript; charset=utf-8"]],
  ["/starts.js", ["starts.js", "text/javascript; charset=utf-8"]],
  ["/campaign.js", ["campaign.js", "text/javascript; charset=utf-8"]],
  ["/agenda.js", ["agenda.js", "text/javascript; charset=utf-8"]],
  ["/game.js", ["game.js", "text/javascript; charset=utf-8"]],
  ["/style.css", ["style.css", "text/css; charset=utf-8"]],
]);
for (const scene of [
  "opening-farm",
  "opening-clerk",
  "opening-factory",
  "opening-police",
  "storm-safe",
  "storm-partial",
  "storm-flood",
  "election-win",
  "election-loss",
  "hearing",
]) {
  routes.set(`/assets/events/${scene}.webp`, [
    `assets/events/${scene}.webp`,
    "image/webp",
  ]);
}
// Register only public source assets; never expose repository files or saves.
function registerPublic(directory) {
  for (const entry of fs.readdirSync(path.join(root, directory), {
    withFileTypes: true,
  })) {
    const file = `${directory}/${entry.name}`;
    if (entry.isDirectory()) registerPublic(file);
    else if (/\.(js|css|html)$/.test(file)) {
      const type = file.endsWith(".js")
        ? "text/javascript; charset=utf-8"
        : file.endsWith(".css")
          ? "text/css; charset=utf-8"
          : "text/html; charset=utf-8";
      routes.set(`/${file}`, [file, type]);
    }
  }
}
registerPublic("src");
registerPublic("next");
routes.set("/next/", ["next/index.html", "text/html; charset=utf-8"]);
registerPublic("proto");
routes.set("/proto/", ["proto/index.html", "text/html; charset=utf-8"]);
registerPublic("survive");
routes.set("/survive/", ["survive/index.html", "text/html; charset=utf-8"]);
registerPublic("journey");
routes.set("/journey/", ["journey/index.html", "text/html; charset=utf-8"]);
http
  .createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    // free-village 서버가 80번 포트의 /civitas/ 아래로 넘겨 주는 요청도 같은 파일로 응답한다.
    if (url.pathname === BASE) {
      res.writeHead(301, { location: `${BASE}/${url.search}` });
      res.end();
      return;
    }
    const basePath = url.pathname.startsWith(`${BASE}/`) ? BASE : "";
    if (basePath) url.pathname = url.pathname.slice(BASE.length);
    if (url.pathname === "/next" || url.pathname === "/proto" || url.pathname === "/survive" || url.pathname === "/journey") {
      res.writeHead(302, { location: `${basePath}${url.pathname}/${url.search}` });
      res.end();
      return;
    }
    if (url.pathname === "/healthz") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ status: "ok", game: "civitas" }));
      return;
    }
    // 생존 시나리오 그림: 나중에 추가되는 파일도 바로 보이도록 정해진 폴더의 webp/png만 그때그때 읽는다
    const art = url.pathname.match(/^\/assets\/(portraits|scenarios|gear|journey)\/([a-z0-9_/-]+)\.(webp|png)$/);
    if (art && req.method === "GET" && !url.pathname.includes("..")) {
      const file = path.join(root, "assets", art[1], art[2] + "." + art[3]);
      if (file.startsWith(path.join(root, "assets")) && fs.existsSync(file)) {
        const st = fs.statSync(file), tag = `"${st.size.toString(36)}-${Math.floor(st.mtimeMs).toString(36)}"`;
        const head = { "cache-control": "public, max-age=86400", etag: tag, "x-content-type-options": "nosniff" };
        if (req.headers["if-none-match"] === tag) { res.writeHead(304, head); res.end(); return; }
        const body = fs.readFileSync(file);
        res.writeHead(200, { ...head, "content-type": art[3] === "png" ? "image/png" : "image/webp", "content-length": body.length });
        res.end(body);
        return;
      }
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }
    const route = routes.get(url.pathname);
    if (req.method !== "GET" || !route) {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }
    const [file, type] = route;
    let body;
    try {
      body = fs.readFileSync(path.join(root, file));
    } catch {
      res.writeHead(503, { "content-type": "text/plain; charset=utf-8" });
      res.end("Asset unavailable");
      return;
    }
    res.writeHead(200, {
      "content-type": type,
      "content-length": body.length,
      // 그림은 하루 동안 기억해 두고, 코드·화면은 매번 새로 받는다(업데이트 즉시 반영)
      "cache-control": type.startsWith("image/") ? "public, max-age=86400" : "no-store",
      "x-content-type-options": "nosniff",
    });
    res.end(body);
  })
  .listen(port, "0.0.0.0", () =>
    console.log(`CIVITAS가 ${port} 포트에서 실행 중`),
  );
