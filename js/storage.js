// localStorageの読み書きを担当するモジュール
// 保存に失敗しても、アプリが停止しないようにする。

import { APP_CONFIG } from "./config.js";

const KEYS = {
  soundEnabled: `${APP_CONFIG.storageKeyPrefix}.soundEnabled`,
  totalQuestions: `${APP_CONFIG.storageKeyPrefix}.totalQuestions`,
  selectedCategories: `${APP_CONFIG.storageKeyPrefix}.selectedCategories`
};

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

export function saveSelectedCategories(categoryIds) {
  try {
    safeSetItem(KEYS.selectedCategories, JSON.stringify(categoryIds));
  } catch (error) {
    // JSON化に失敗してもアプリは続行する
  }
}

export function loadSelectedCategories(defaultValue) {
  const raw = safeGetItem(KEYS.selectedCategories);
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
