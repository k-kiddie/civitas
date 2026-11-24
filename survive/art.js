"use strict";
// 「물에 잠기는 항구」 그림: 주민 초상화(SVG로 직접 그림)와 장면 삽화(기존 유화 삽화) 연결.
(function (root) {
  // 사람마다: 피부, 머리 모양·색, 옷, 배경, 장식
  const LOOKS = {
    leader: { skin: "#e6be98", hair: "short", hairC: "#1f1a17", cloth: "#3f5f6e", bg: "#2b4650", extra: "collar" },
    sora: { skin: "#d6a37c", hair: "scarf", hairC: "#3b5f86", cloth: "#5b4868", bg: "#33415a", extra: "" },
    eunho: { skin: "#c48f68", hair: "cap", hairC: "#d9a531", cloth: "#6b5836", bg: "#4a3d2a", extra: "stubble" },
    yun: { skin: "#d3a27a", hair: "bald", hairC: "#cfcac0", cloth: "#4f6649", bg: "#35473a", extra: "beard old" },
    minseok: { skin: "#dfb18a", hair: "police", hairC: "#1e2a44", cloth: "#2c3c5c", bg: "#26324a", extra: "badge" },
    seoyun: { skin: "#eec8a4", hair: "long", hairC: "#241c19", cloth: "#7a5a45", bg: "#4a3a30", extra: "glasses" },
    harin: { skin: "#e3b993", hair: "messy", hairC: "#5a3a24", cloth: "#5f7044", bg: "#3c4a30", extra: "" },
    sundeok: { skin: "#d19e76", hair: "bun", hairC: "#bdb7ad", cloth: "#8a5444", bg: "#553a32", extra: "old apron" },
    haejin: { skin: "#d9aa82", hair: "slick", hairC: "#151210", cloth: "#4b2c2c", bg: "#3d2626", extra: "mustache" },
    taeo: { skin: "#d6a078", hair: "spiky", hairC: "#2b211b", cloth: "#46586a", bg: "#2f3d4a", extra: "freckles young" },
    dodam: { skin: "#f0c79d", hair: "bowl", hairC: "#2a1f19", cloth: "#c27845", bg: "#5a4130", extra: "child" },
  };
  const SAILOR = { skin: "#c99a74", hair: "cap2", hairC: "#283848", cloth: "#2f4a5a", bg: "#2a3c46", extra: "beard" };
  function mix(hex, toward, t) {
    const a = hex.match(/\w\w/g).map((x) => parseInt(x, 16)), b = toward.match(/\w\w/g).map((x) => parseInt(x, 16));
    return "#" + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, "0")).join("");
  }
  // p: { id, hp, stress, alive }  size: px
  function portrait(p, size = 56) {
    const L = LOOKS[p.id] || SAILOR;
    const ex = L.extra.split(" ");
    const sick = p.hp >= 2, hurt = p.hp >= 1, sad = p.stress >= 70 || !p.alive;
    const skin = sick ? mix(L.skin, "#b8c4b0", 0.35) : L.skin;
    const shade = mix(skin, "#5a3a2a", 0.25);
    const child = ex.includes("child"), old = ex.includes("old");
    const fy = child ? 54 : 50; // 얼굴 중심 y
    const fr = child ? 17 : 19;
    let hairBack = "", hairFront = "", extras = "";
    const H = L.hairC;
    switch (L.hair) {
      case "short": hairFront = `<path d="M31 ${fy - 6} Q31 ${fy - 26} 50 ${fy - 26} Q69 ${fy - 26} 69 ${fy - 6} Q64 ${fy - 16} 50 ${fy - 17} Q38 ${fy - 16} 31 ${fy - 6}Z" fill="${H}"/>`; break;
      case "messy": hairFront = `<path d="M30 ${fy - 4} Q28 ${fy - 27} 50 ${fy - 27} Q73 ${fy - 27} 70 ${fy - 4} L66 ${fy - 14} L60 ${fy - 9} L55 ${fy - 16} L48 ${fy - 10} L42 ${fy - 16} L36 ${fy - 9}Z" fill="${H}"/>`; break;
      case "spiky": hairFront = `<path d="M31 ${fy - 6} L33 ${fy - 24} L39 ${fy - 19} L43 ${fy - 29} L49 ${fy - 21} L55 ${fy - 30} L59 ${fy - 20} L66 ${fy - 26} L69 ${fy - 6} Q60 ${fy - 15} 50 ${fy - 15} Q40 ${fy - 15} 31 ${fy - 6}Z" fill="${H}"/>`; break;
      case "slick": hairFront = `<path d="M31 ${fy - 5} Q30 ${fy - 26} 52 ${fy - 26} Q70 ${fy - 25} 69 ${fy - 7} Q62 ${fy - 19} 44 ${fy - 17} Q36 ${fy - 14} 31 ${fy - 5}Z" fill="${H}"/><path d="M40 ${fy - 21} Q54 ${fy - 25} 64 ${fy - 17}" stroke="#3a3330" stroke-width="1.2" fill="none"/>`; break;
      case "long": hairBack = `<path d="M28 ${fy - 4} Q27 ${fy - 28} 50 ${fy - 28} Q73 ${fy - 28} 72 ${fy - 4} L74 ${fy + 22} L26 ${fy + 22}Z" fill="${H}"/>`; hairFront = `<path d="M31 ${fy - 2} Q32 ${fy - 24} 50 ${fy - 24} Q68 ${fy - 24} 69 ${fy - 2} Q63 ${fy - 18} 50 ${fy - 18} Q37 ${fy - 18} 31 ${fy - 2}Z" fill="${H}"/>`; break;
      case "bun": hairFront = `<circle cx="50" cy="${fy - 26}" r="8" fill="${H}"/><path d="M31 ${fy - 4} Q31 ${fy - 24} 50 ${fy - 24} Q69 ${fy - 24} 69 ${fy - 4} Q63 ${fy - 15} 50 ${fy - 16} Q37 ${fy - 15} 31 ${fy - 4}Z" fill="${H}"/>`; break;
      case "bowl": hairFront = `<path d="M32 ${fy} Q31 ${fy - 22} 50 ${fy - 22} Q69 ${fy - 22} 68 ${fy} L66 ${fy - 6} Q50 ${fy - 9} 34 ${fy - 6}Z" fill="${H}"/>`; break;
      case "bald": hairFront = `<path d="M31 ${fy - 2} Q30 ${fy - 9} 33 ${fy - 12} L35 ${fy - 2}Z M69 ${fy - 2} Q70 ${fy - 9} 67 ${fy - 12} L65 ${fy - 2}Z" fill="${H}"/>`; break;
      case "scarf": hairBack = `<path d="M26 ${fy + 24} Q24 ${fy - 30} 50 ${fy - 30} Q76 ${fy - 30} 74 ${fy + 24}Z" fill="${H}"/>`; hairFront = `<path d="M30 ${fy + 2} Q29 ${fy - 25} 50 ${fy - 25} Q71 ${fy - 25} 70 ${fy + 2} Q66 ${fy - 16} 50 ${fy - 17} Q34 ${fy - 16} 30 ${fy + 2}Z" fill="${mix(H, "#ffffff", 0.12)}"/>`; break;
      case "cap": hairFront = `<path d="M30 ${fy - 9} Q30 ${fy - 29} 50 ${fy - 29} Q70 ${fy - 29} 70 ${fy - 9}Z" fill="${H}"/><rect x="27" y="${fy - 11}" width="46" height="5" rx="2" fill="${mix(H, "#000000", 0.25)}"/>`; break;
      case "cap2": hairFront = `<path d="M31 ${fy - 9} Q31 ${fy - 27} 50 ${fy - 27} Q69 ${fy - 27} 69 ${fy - 9}Z" fill="${H}"/><path d="M50 ${fy - 9} L76 ${fy - 8} L70 ${fy - 4} L50 ${fy - 5}Z" fill="${mix(H, "#000000", 0.3)}"/>`; break;
      case "police": hairFront = `<path d="M30 ${fy - 10} L33 ${fy - 27} L67 ${fy - 27} L70 ${fy - 10}Z" fill="${H}"/><rect x="28" y="${fy - 12}" width="44" height="5" rx="1.5" fill="#11182a"/><circle cx="50" cy="${fy - 19}" r="3.2" fill="#d9b44a"/>`; break;
    }
    // 눈·눈썹·입: 지치거나 죽으면 처진 눈썹과 입
    const ey = fy - 1, brow = sad ? `<path d="M38 ${ey - 7} L45 ${ey - 5}" stroke="#2a1d16" stroke-width="1.8" stroke-linecap="round"/><path d="M62 ${ey - 7} L55 ${ey - 5}" stroke="#2a1d16" stroke-width="1.8" stroke-linecap="round"/>` : `<path d="M38 ${ey - 6} Q41.5 ${ey - 8} 45 ${ey - 6}" stroke="#2a1d16" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M55 ${ey - 6} Q58.5 ${ey - 8} 62 ${ey - 6}" stroke="#2a1d16" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
    const eyes = !p.alive ? `<path d="M39 ${ey} L44 ${ey}" stroke="#2a1d16" stroke-width="1.6"/><path d="M56 ${ey} L61 ${ey}" stroke="#2a1d16" stroke-width="1.6"/>` : `<ellipse cx="41.5" cy="${ey}" rx="2.1" ry="${sick ? 1.2 : 2.4}" fill="#1c140f"/><ellipse cx="58.5" cy="${ey}" rx="2.1" ry="${sick ? 1.2 : 2.4}" fill="#1c140f"/>`;
    const my = fy + 9;
    const mouth = sad ? `<path d="M44 ${my + 1} Q50 ${my - 2} 56 ${my + 1}" stroke="#7a3e30" stroke-width="1.6" fill="none" stroke-linecap="round"/>` : `<path d="M44 ${my - 1} Q50 ${my + 3} 56 ${my - 1}" stroke="#7a3e30" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
    const nose = `<path d="M50 ${fy + 1} Q48.5 ${fy + 5} 50.5 ${fy + 5.5}" stroke="${shade}" stroke-width="1.3" fill="none" stroke-linecap="round"/>`;
    if (ex.includes("glasses")) extras += `<circle cx="41.5" cy="${ey}" r="4.6" stroke="#2a2a2a" stroke-width="1.2" fill="#ffffff22"/><circle cx="58.5" cy="${ey}" r="4.6" stroke="#2a2a2a" stroke-width="1.2" fill="#ffffff22"/><path d="M46 ${ey} L54 ${ey}" stroke="#2a2a2a" stroke-width="1.2"/>`;
    if (ex.includes("beard")) extras += `<path d="M34 ${fy + 3} Q36 ${fy + 22} 50 ${fy + 24} Q64 ${fy + 22} 66 ${fy + 3} Q60 ${fy + 12} 50 ${fy + 12} Q40 ${fy + 12} 34 ${fy + 3}Z" fill="${L.hair === "bald" ? H : mix(H, "#000000", 0.1)}"/>`;
    if (ex.includes("mustache")) extras += `<path d="M42 ${my - 3} Q46 ${my - 6} 50 ${my - 3} Q54 ${my - 6} 58 ${my - 3} Q54 ${my - 1} 50 ${my - 2} Q46 ${my - 1} 42 ${my - 3}Z" fill="${H}"/>`;
    if (ex.includes("stubble")) extras += `<path d="M36 ${fy + 6} Q50 ${fy + 22} 64 ${fy + 6}" stroke="${mix(skin, "#000000", 0.35)}" stroke-width="5" stroke-dasharray="1 1.6" fill="none" opacity=".5"/>`;
    if (ex.includes("freckles")) extras += `<g fill="${mix(skin, "#7a4a2a", 0.5)}"><circle cx="39" cy="${fy + 4}" r=".9"/><circle cx="42" cy="${fy + 5}" r=".9"/><circle cx="58" cy="${fy + 5}" r=".9"/><circle cx="61" cy="${fy + 4}" r=".9"/></g>`;
    if (old) extras += `<path d="M36 ${ey - 11} Q41 ${ey - 13} 46 ${ey - 11} M54 ${ey - 11} Q59 ${ey - 13} 64 ${ey - 11}" stroke="${shade}" stroke-width="1" fill="none"/><path d="M38 ${my - 4} Q37 ${my} 39 ${my + 2} M62 ${my - 4} Q63 ${my} 61 ${my + 2}" stroke="${shade}" stroke-width="1" fill="none"/>`;
    if (hurt) extras += `<path d="M30 ${fy - 14} Q50 ${fy - 21} 70 ${fy - 14} L70 ${fy - 9} Q50 ${fy - 16} 30 ${fy - 9}Z" fill="#f2efe6" opacity=".95"/><circle cx="60" cy="${fy - 13}" r="2" fill="#b33a2c" opacity=".8"/>`;
    if (sick) extras += `<path d="M66 ${fy - 4} q2 4 0 6 q-2 -2 0 -6Z" fill="#9fd3e6"/>`;
    // 몸
    const body = child
      ? `<path d="M30 100 Q30 80 50 79 Q70 80 70 100Z" fill="${L.cloth}"/>`
      : `<path d="M18 100 Q19 76 50 74 Q81 76 82 100Z" fill="${L.cloth}"/>`;
    const collar = ex.includes("collar") ? `<path d="M42 75 L50 84 L58 75" stroke="#e8e2d0" stroke-width="2.5" fill="none"/>` : ex.includes("badge") ? `<path d="M60 84 l3 -2 l3 2 l-1 4 h-4z" fill="#d9b44a"/>` : ex.includes("apron") ? `<path d="M38 80 L62 80 L64 100 L36 100Z" fill="#e8dcc0" opacity=".9"/>` : "";
    const neck = `<rect x="${child ? 45 : 44}" y="${fy + 12}" width="${child ? 10 : 12}" height="${child ? 10 : 12}" fill="${shade}"/>`;
    const filter = !p.alive ? ' style="filter:grayscale(1) brightness(.8)"' : "";
    return `<svg class="portrait" viewBox="0 0 100 100" width="${size}" height="${size}" role="img" aria-label="${p.name || ""} 초상"${filter}><circle cx="50" cy="50" r="50" fill="${L.bg}"/><path d="M0 70 Q50 58 100 70 V100 H0Z" fill="#000" opacity=".12"/>${hairBack}${body}${collar}${neck}<ellipse cx="50" cy="${fy}" rx="${fr}" ry="${fr + 3}" fill="${skin}"/><ellipse cx="${50 - fr}" cy="${fy + 1}" rx="3" ry="4.5" fill="${shade}"/><ellipse cx="${50 + fr}" cy="${fy + 1}" rx="3" ry="4.5" fill="${shade}"/>${hairFront}${brow}${eyes}${nose}${mouth}${extras}<circle cx="38" cy="${fy + 7}" r="3" fill="#e0806a" opacity="${sick ? 0 : 0.18}"/><circle cx="62" cy="${fy + 7}" r="3" fill="#e0806a" opacity="${sick ? 0 : 0.18}"/></svg>`;
  }
  // 장면 삽화(기존 유화)
  const ART = {
    title: "storm-flood", night: "storm-partial", dawn: "storm-partial", stormSafe: "storm-safe", stormHit: "storm-flood",
    store: "opening-factory", pharmacy: "opening-clerk", mill: "opening-farm", granary: "opening-police", wreck: "storm-flood",
    theft: "opening-farm", cough: "opening-clerk", doyun_offer: "election-win", argue: "hearing", swim: "storm-flood",
    despair: "storm-partial", law_order: "hearing", haejin: "opening-police",
    all: "storm-safe", most: "storm-partial", few: "storm-flood", riot: "election-loss", lost: "storm-flood",
  };
  const img = (key, cls = "art") => `<img class="${cls}" src="../assets/events/${ART[key] || "storm-partial"}.webp" alt="" loading="lazy">`;
  const api = { portrait, img, ART };
  root.SurviveArt = api;
  if (typeof module !== "undefined") module.exports = api;
})(globalThis);
