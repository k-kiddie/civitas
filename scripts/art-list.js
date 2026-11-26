"use strict";
// 그림 목록 만들기: node scripts/art-list.js → assets/scenarios/ART_LIST.md
// 게임이 찾는 그림 파일 이름 전부와 한 줄 설명, 이미 있는지(✅) 표시. 없으면 기본 그림이 대신 나온다.
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const SC = require("../survive/scenarios"), N = require("../survive/night"), ST = require("../survive/story");
const short = (t, n = 70) => { const x = String(t || "").replace(/\{[a-z_0-9]+\}/g, "…").split(/(?<=[.!?”])\s/)[0]; return x.length > n ? x.slice(0, n) + "…" : x; };
const has = (rel) => fs.existsSync(path.join(root, "assets", rel));
const out = [];
out.push("# 그림 목록 (자동 생성)", "", "`node scripts/art-list.js`로 다시 만든다. ✅는 이미 있는 파일. 없는 그림은 게임이 기본 그림(장소·분위기 그림)으로 대신 보여 주므로 한 장씩 넣어도 된다.", "",
  "- 장면 그림: `assets/scenarios/<재난>/scenes/<이름>.webp` · 가로 16:9 · 1024×576 이상 · 위쪽이 그림의 중심(아래 30%는 글 뒤로 어둡게 스며든다)",
  "- 장비 그림: `assets/gear/<이름>.webp` · 정사각 512×512 · 어두운 배경에 물건 하나",
  "- 그림체: 극 빙하기 장면은 극한 추위와 생존 상황이 드러나는 사실적인 실사풍. 장비와 그 외 그림은 기존 유화풍. 글자·로고 넣지 않기.", "");
const PRIORITY = [
  ["극 빙하기 분위기", ["dawn_quiet", "dawn_storm", "dawn_raid", "dawn_death", "dawn_sick", "dawn_cold", "act1", "act2", "act3"].map((n) => `scenarios/iceage/scenes/${n}.webp`)],
  ["극 빙하기 이야기", ["s_map", "s_sign", "s_sled", "rival_r1", "rival_r2", "rival_r3", "f_cross", "f_wolf_block", "f_train", "ending_missed"].map((n) => `scenarios/iceage/scenes/${n}.webp`)],
  ["장비", Object.keys(N.gear).map((k) => `gear/${k}.webp`)],
];
out.push("## 먼저 그릴 것 (35장)", "");
for (const [h, list] of PRIORITY) out.push(`- **${h}**: ${list.map((r) => `${has(r) ? "✅" : ""}\`${r.split("/").pop().replace(".webp", "")}\``).join(" · ")}`);
out.push("");
const row = (rel, desc) => out.push(`- ${has(rel) ? "✅" : "⬜"} \`${rel.split("/").pop()}\` — ${desc}`);
for (const k of SC.order) {
  const sc = SC.scenarios[k], dir = `scenarios/${k}/scenes/`, st = ST[k];
  out.push(`## ${sc.name} (\`assets/${dir}\`)`, "");
  out.push("### 분위기 (아침 장 · 막 · 결말)", "");
  const mood = { dawn_quiet: "조용한 아침, 거처 안", dawn_storm: `${sc.words.threat}이(가) 지나간 아침`, dawn_raid: `${sc.words.rival}에게 습격당한 아침`, dawn_death: "누군가를 잃은 아침, 빈자리", dawn_sick: "앓는 사람 곁의 새벽", dawn_hunger: "빈 그릇, 굶주린 얼굴들", dawn_theft: "털린 창고", dawn_cold: "연료가 떨어져 서로 껴안고 떠는 밤", dawn_return: "밤 탐색에서 돌아온 사람들", last_morning: "마지막 아침" };
  for (const [n, d] of Object.entries(mood)) row(dir + n + ".webp", d);
  if (st) { st.acts.forEach((a) => row(`${dir}act${a.act}.webp`, `${a.title} — ${a.goal}`)); }
  for (const e of ["all", "most", "few", "riot", "lost", ...(st ? ["missed"] : [])]) row(`${dir}ending_${e}.webp`, `결말: ${short(sc.endings[e] || (st && st.endings[e]))}`);
  out.push("", "### 밤 장면", "");
  const scenes = [...(st ? st.scenes : []), ...sc.scenes, ...(N.extra[k] || []), ...N.common, ...N.chase, ...N.revisit];
  for (const x of scenes) row(dir + x.id + ".webp", `[${N.KINDS[x.kind] || "탐색"}${x.loc && !x.loc.startsWith("*") ? " · " + (sc.places[x.loc]?.name || x.loc) : ""}] ${short(x.text)}`);
  if (st) { out.push("", "### 마지막 밤", ""); for (const x of st.finale.scenes) row(dir + x.id + ".webp", short(x.text)); }
  out.push("", "### 아침 사건", "");
  const evs = [...SC.commonEvents, ...sc.events];
  for (const e of evs) row(dir + e.id + ".webp", short(e.text));
  if (st) {
    for (const b of ["r1", "r2", "r3"]) row(`${dir}rival_${b}.webp`, `${st.rivalName}: ${short(st.rival.find((r) => r.id === b).text)}`);
    for (const [pid, beats] of Object.entries(st.arcs)) beats.forEach((b, i) => row(`${dir}arc_${pid}_${i}.webp`, `${sc.people.find((p) => p.id === pid)?.name || pid} 사연 ${i + 1}: ${short(b.text)}`));
    for (const [id, c] of Object.entries(st.callbacks)) row(`${dir}cb_${id}.webp`, `돌아온 선택: ${short(c.text)}`);
    row(`${dir}fin_eve.webp`, "떠나기 전날, 짐을 싸는 사람들");
  }
  out.push("");
}
out.push("## 장비 (`assets/gear/`)", "");
for (const [k, g] of Object.entries(N.gear)) row(`gear/${k}.webp`, `${g.name}${g.scen ? ` (${SC.scenarios[g.scen].name})` : ""} — ${g.desc}`);
fs.writeFileSync(path.join(root, "assets/scenarios/ART_LIST.md"), out.join("\n") + "\n");
const total = out.filter((l) => /^- (✅|⬜)/.test(l)).length, done = out.filter((l) => l.startsWith("- ✅")).length;
console.log(`그림 목록: ${done}/${total}장 있음 → assets/scenarios/ART_LIST.md`);
