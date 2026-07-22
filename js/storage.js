// localStorageの読み書きを担当するモジュール
// 保存に失敗しても、アプリが停止しないようにする。

import { APP_CONFIG, SELECTABLE_MODE_IDS, SELECTABLE_UNIT_IDS } from "./config.js";

const KEYS = {
  soundEnabled: `${APP_CONFIG.storageKeyPrefix}.soundEnabled`,
  totalQuestions: `${APP_CONFIG.storageKeyPrefix}.totalQuestions`,
  selectedMode: `${APP_CONFIG.storageKeyPrefix}.selectedMode`,
  selectedUnit: `${APP_CONFIG.storageKeyPrefix}.selectedUnit`
};

function selectedCategoriesKey(unit) {
  return `${APP_CONFIG.storageKeyPrefix}.training.${unit}.categories`;
}

function safeGetItem(key) {
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    return null;
  }
}

function safeSetItem(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    // 保存に失敗してもアプリは続行する
  }
}

export function saveSoundEnabled(enabled) {
  safeSetItem(KEYS.soundEnabled, enabled ? "true" : "false");
}

export function loadSoundEnabled(defaultValue = true) {
  const raw = safeGetItem(KEYS.soundEnabled);
  if (raw === null) {
    return defaultValue;
  }
  return raw === "true";
}

export function saveTotalQuestions(totalQuestions) {
  safeSetItem(KEYS.totalQuestions, String(totalQuestions));
}

export function loadTotalQuestions(defaultValue) {
  const raw = safeGetItem(KEYS.totalQuestions);
  if (raw === null) {
    return defaultValue;
  }
  const parsed = Number(raw);
  if (
    !Number.isFinite(parsed) ||
    parsed < APP_CONFIG.minQuestions ||
    parsed > APP_CONFIG.maxQuestions
  ) {
    return defaultValue;
  }
  return parsed;
}

/**
 * タイトル画面で選んだモード（トレーニング・クエスト・段位認定）を保存する。
 * タイトル画面へ戻ったとき・アプリを再起動したときも、直前の選択状態を
 * 復元できるようにするため。
 */
export function saveSelectedMode(mode) {
  safeSetItem(KEYS.selectedMode, mode);
}

export function loadSelectedMode(defaultValue) {
  const raw = safeGetItem(KEYS.selectedMode);
  if (raw === null || !SELECTABLE_MODE_IDS.includes(raw)) {
    return defaultValue;
  }
  return raw;
}

/**
 * タイトル画面で選んだ単元（1次方程式・連立方程式・2次方程式）を保存する。
 */
export function saveSelectedUnit(unit) {
  safeSetItem(KEYS.selectedUnit, unit);
}

export function loadSelectedUnit(defaultValue) {
  const raw = safeGetItem(KEYS.selectedUnit);
  if (raw === null || !SELECTABLE_UNIT_IDS.includes(raw)) {
    return defaultValue;
  }
  return raw;
}

/**
 * 出題カテゴリの選択状態を、単元ごとに別々のキーで保存する
 * （例：equalLabyrinth.training.linear.categories）。
 * @param {string} unit 例："linear" | "simultaneous"
 * @param {string[]} categoryIds
 */
export function saveSelectedCategories(unit, categoryIds) {
  try {
    safeSetItem(selectedCategoriesKey(unit), JSON.stringify(categoryIds));
  } catch (error) {
    // JSON化に失敗してもアプリは続行する
  }
}

export function loadSelectedCategories(unit, defaultValue) {
  const raw = safeGetItem(selectedCategoriesKey(unit));
  if (raw === null) {
    return defaultValue;
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return defaultValue;
    }
    return parsed;
  } catch (error) {
    return defaultValue;
  }
}

// ============================================================
// 段位認定モードのハイスコア（単元・難易度の組み合わせごとに保存する）
// ============================================================

function rankHighScoreKey(unit, difficulty) {
  return `${APP_CONFIG.storageKeyPrefix}.rank.${unit}.${difficulty}`;
}

/**
 * 段位認定のハイスコア記録を保存する。
 * @param {string} unit 例："linear"
 * @param {"NORMAL"|"HARD"} difficulty
 * @param {{
 *   highScore: number,
 *   bestRankCoefficient: number,
 *   bestRankName: string,
 *   maxCorrectCount: number,
 *   maxCombo: number,
 *   updatedAt: string
 * }} record
 */
export function saveRankHighScore(unit, difficulty, record) {
  try {
    safeSetItem(rankHighScoreKey(unit, difficulty), JSON.stringify(record));
  } catch (error) {
    // JSON化に失敗してもアプリは続行する
  }
}

/**
 * 段位認定のハイスコア記録を読み込む。未保存・破損時はnullを返す。
 */
export function loadRankHighScore(unit, difficulty) {
  const raw = safeGetItem(rankHighScoreKey(unit, difficulty));
  if (raw === null) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    return parsed;
  } catch (error) {
    return null;
  }
}
