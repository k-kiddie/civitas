"use strict";
// 그림 연결. 시나리오별 그림 파일이 있으면 그 그림을, 없으면 임시 그림(SVG)을 겹쳐 둔다.
// 장면: assets/scenarios/<시나리오>/scenes/<키>.webp · 초상: assets/scenarios/<시나리오>/portraits/<id>.webp
// 대홍수는 기존 유화(assets/events, assets/portraits)를 쓴다.
(function (root) {
  const BASE = "../assets/";
  const FLOOD_SCENES = {
    title: "storm-flood", shelter: "opening-factory", night: "storm-partial", dawn: "storm-partial", threat_held: "storm-safe", threat_hit: "storm-flood",
    store: "opening-factory", pharmacy: "opening-clerk", mill: "opening-farm", granary: "opening-police", wreck: "storm-flood",
    event_people: "hearing", event_rival: "election-win", ending_good: "storm-safe", ending_bad: "storm-flood",
  };
  const RIVAL_EVENTS = ["rival_offer", "doyun_offer", "rival_r1", "rival_r2", "rival_r3"];
  // ── 임시 장면 그림: 시나리오 분위기만 내는 단순한 풍경 ──
  function sceneSvg(sc) {
    const sky = { nuclear: ["#3a3f38", "#6b6a5c"], iceage: ["#1d3550", "#9fc0d6"], flood: ["#14232c", "#3c5a66"] }[sc] || ["#222", "#555"];
    let fg = "";
    if (sc === "nuclear") fg = `<path d="M0 400 L0 250 L60 250 L60 190 L110 190 L110 270 L170 270 L170 150 L200 120 L230 150 L230 300 L300 300 L300 210 L360 210 L360 260 L430 260 L430 170 L470 170 L470 280 L540 280 L540 230 L600 230 L600 400Z" fill="#1c1e1a"/><g fill="#cfcbbc" opacity=".5">${Array.from({ length: 40 }, (_, i) => `<circle cx="${(i * 73) % 600}" cy="${(i * 131) % 330}" r="${1 + (i % 3) * 0.6}"/>`).join("")}</g>`;
    if (sc === "iceage") fg = `<path d="M0 300 L90 190 L160 260 L250 150 L340 250 L420 180 L520 260 L600 210 L600 400 L0 400Z" fill="#dfeaf2"/><path d="M0 340 Q150 300 300 340 T600 330 V400 H0Z" fill="#f4f8fb"/><g fill="#fff" opacity=".8">${Array.from({ length: 50 }, (_, i) => `<circle cx="${(i * 67) % 600}" cy="${(i * 97) % 340}" r="${1 + (i % 4) * 0.5}"/>`).join("")}</g>`;
    if (sc === "flood") fg = `<path d="M0 260 L80 260 L80 210 L140 180 L200 210 L200 260 L320 260 L320 220 L380 190 L440 220 L440 260 L600 260 L600 400 L0 400Z" fill="#101a20"/><path d="M0 290 Q100 270 200 290 T400 290 T600 285 V400 H0Z" fill="#1f4652"/>`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/></linearGradient></defs><rect width="600" height="400" fill="url(#g)"/>${fg}</svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }
  function sceneUrl(sc, key) {
    if (sc === "flood") return `${BASE}events/${FLOOD_SCENES[key] || "storm-partial"}.webp`;
    return `${BASE}scenarios/${sc}/scenes/${key}.webp`;
  }
  // key: 장소 id, title, shelter, night, dawn, threat_held, threat_hit, ending_good/bad, 또는 사건 id
  // key: 문자열 또는 [가장 구체적인 이름, …, 기본 이름] 배열. 앞쪽 그림이 없으면 뒤쪽 그림이 보인다
  const own = (sc, k) => `${BASE}scenarios/${sc}/scenes/${k}.webp`;
  function scene(sc, key, cls = "banner") {
    const keys = (Array.isArray(key) ? key : [key]).filter(Boolean).map((k) => (k.startsWith?.("ev:") ? [k.slice(3), RIVAL_EVENTS.includes(k.slice(3)) ? "event_rival" : "event_people"] : [k])).flat();
    const urls = [];
    keys.forEach((k, i) => { const last = i === keys.length - 1; if (sc === "flood") { urls.push(own(sc, k)); if (last || FLOOD_SCENES[k]) urls.push(sceneUrl(sc, k)); } else urls.push(own(sc, k)); });
    return `<div class="art ${cls}" style='background-image:${[...new Set(urls)].map((u) => `url("${u}")`).join(",")},${sceneSvg(sc)}'></div>`;
  }
  // 장비 그림: assets/gear/<id>.webp (모든 재난 공통)
  const gearArt = (k, cls = "gicon") => `<span class="${cls}" style='background-image:url("${BASE}gear/${k}.webp")'></span>`;
  // ── 초상 ──
  const LOOKS = {
    leader: ["#e6be98", "#1f1a17", "#3f5f6e"], sora: ["#d6a37c", "#3b5f86", "#5b4868"], eunho: ["#c48f68", "#2a221c", "#6b5836"], yun: ["#d3a27a", "#cfcac0", "#4f6649"],
    minseok: ["#dfb18a", "#1e2a44", "#2c3c5c"], seoyun: ["#eec8a4", "#241c19", "#7a5a45"], harin: ["#e3b993", "#5a3a24", "#5f7044"], haejin: ["#d9aa82", "#151210", "#4b2c2c"],
    taeo: ["#d6a078", "#2b211b", "#46586a"], dodam: ["#f0c79d", "#2a1f19", "#c27845"],
  };
  function hash(str) { let h = 0; for (const c of String(str)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; }
  function faceSvg(p) {
    const skins = ["#e6be98", "#d6a37c", "#c48f68", "#eec8a4", "#d3a27a"], hairs = ["#1f1a17", "#3a2a20", "#5a3a24", "#cfcac0", "#151210"], cloths = ["#3f5f6e", "#5b4868", "#6b5836", "#4f6649", "#2c3c5c", "#7a5a45"];
    const h = hash(p.id);
    const [skin, hair, cloth] = LOOKS[p.id] || [skins[h % 5], hairs[(h >> 3) % 5], cloths[(h >> 6) % 6]];
    const child = p.child, fy = child ? 54 : 50, fr = child ? 17 : 19;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#26333a"/><path d="M${child ? 30 : 18} 100 Q${child ? 30 : 19} 76 50 74 Q${child ? 70 : 81} 76 ${child ? 70 : 82} 100Z" fill="${cloth}"/><ellipse cx="50" cy="${fy}" rx="${fr}" ry="${fr + 3}" fill="${skin}"/><path d="M31 ${fy - 4} Q31 ${fy - 26} 50 ${fy - 26} Q69 ${fy - 26} 69 ${fy - 4} Q63 ${fy - 16} 50 ${fy - 17} Q37 ${fy - 16} 31 ${fy - 4}Z" fill="${hair}"/><ellipse cx="42" cy="${fy - 1}" rx="2" ry="2.4" fill="#1c140f"/><ellipse cx="58" cy="${fy - 1}" rx="2" ry="2.4" fill="#1c140f"/><path d="M44 ${fy + 9} Q50 ${fy + 11} 56 ${fy + 9}" stroke="#7a3e30" stroke-width="1.6" fill="none"/></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }
  function portraitUrl(sc, p) {
    const id = /^sailor/.test(p.id) ? "sailor" : p.id;
    if (sc === "flood") return `${BASE}portraits/${id}.webp`;
    return `${BASE}scenarios/${sc}/portraits/${id}.webp`;
  }
  function portrait(sc, p, size = 56) {
    const cls = ["pt", !p.alive ? "dead" : "", p.hp === 1 ? "hurt" : "", p.hp >= 2 ? "sick" : "", p.stress >= 70 ? "worn" : ""].join(" ");
    return `<span class="${cls}" style='width:${size}px;height:${size}px;background-image:url("${portraitUrl(sc, p)}"),${faceSvg(p)}' role="img" aria-label="${p.name}"></span>`;
  }
  const api = { scene, portrait, sceneUrl, portraitUrl, gearArt };
  root.SurviveArt = api;
  if (typeof module !== "undefined") module.exports = api;
})(globalThis);
