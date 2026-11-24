"use strict";
(function (root) {
  // Both versions share the original campaign's project prices and flood consequences.
  const plans = {
    short: {
      name: "항구 제방",
      cost: 24,
      homes: 68,
      description: "항구를 보호한다. 어촌 18가구가 침수된다.",
    },
    long: {
      name: "어촌까지 잇는 제방",
      cost: 60,
      homes: 86,
      description:
        "모든 86가구를 보호한다. 선주 계약 또는 주민 공동 출자가 필요하다.",
    },
    none: {
      name: "공사를 보류한다",
      cost: 0,
      homes: 0,
      description: "돈을 쓰지 않는다. 장마 때 34가구가 침수된다.",
    },
  };
  const floodLoss = (plan) =>
    plan === "long" ? 0 : plan === "short" ? 18 : 34;
  const api = { plans, floodLoss };
  if (typeof module !== "undefined") module.exports = api;
  root.HarborRules = api;
})(globalThis);
