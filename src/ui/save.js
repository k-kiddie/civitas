"use strict";
(function (root) {
  const KEY = "civitas-season-v1";
  let database;
  function db() {
    return (
      database ||
      (database = new Promise((resolve, reject) => {
        if (!root.indexedDB) {
          reject(Error("IndexedDB 없음"));
          return;
        }
        const request = indexedDB.open(KEY, 1);
        request.onupgradeneeded = () =>
          request.result.createObjectStore("saves");
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        request.onblocked = () =>
          reject(Error("저장소가 다른 창에서 사용 중입니다."));
      }))
    );
  }
  async function transaction(mode, value) {
    const d = await db();
    return new Promise((resolve, reject) => {
      const tx = d.transaction("saves", mode),
        store = tx.objectStore("saves");
      const req =
        mode === "readonly"
          ? store.get("current")
          : store.put(value, "current");
      let result;
      req.onsuccess = () => {
        result = req.result;
      };
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || Error("저장 중단"));
    });
  }
  async function load() {
    const candidates = [];
    let damaged = false;
    try {
      const value = localStorage.getItem(KEY);
      if (value) candidates.push(JSON.parse(value));
    } catch {
      damaged = true;
    }
    try {
      const value = await transaction("readonly");
      if (value) candidates.push(value);
    } catch {}
    candidates.sort((a, b) => (b?.savedAt || 0) - (a?.savedAt || 0));
    for (const candidate of candidates) {
      try {
        return {
          state: SeasonEngine.validate(candidate.state),
          warning: damaged
            ? "일부 저장을 읽지 못해 정상 백업을 복원했습니다."
            : "",
        };
      } catch {
        damaged = true;
      }
    }
    return {
      state: null,
      warning: damaged
        ? "저장을 읽지 못했습니다. 기존 데이터는 덮어쓰지 않았습니다. 백업을 가져오거나 새 가문을 시작하세요."
        : "",
    };
  }
  let pending = Promise.resolve();
  function save(state) {
    const envelope = {
      savedAt: Date.now(),
      state: JSON.parse(JSON.stringify(state)),
    };
    let fallback = false;
    try {
      localStorage.setItem(KEY, JSON.stringify(envelope));
      fallback = true;
    } catch {}
    const task = pending.then(async () => {
      try {
        await transaction("readwrite", envelope);
        return "기기에 자동 저장됨";
      } catch {
        if (fallback) return "기기에 저장됨 · 보조 저장소";
        throw Error("자동 저장 실패 · 백업 파일을 내보내세요.");
      }
    });
    pending = task.catch(() => {});
    return task;
  }
  root.SeasonSave = { load, save };
})(globalThis);
