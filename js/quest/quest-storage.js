// クエストモード：アイテムコレクション（localStorage）の読み書きを担当するモジュール
// storage.jsと同じ「保存に失敗してもアプリを止めない」方針を踏襲する。

import { APP_CONFIG } from "../config.js";

const INVENTORY_KEY = `${APP_CONFIG.storageKeyPrefix}.quest.inventory`;
const INVENTORY_VERSION = 1;

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

function emptyInventory() {
  return { version: INVENTORY_VERSION, items: {} };
}

/**
 * アイテムコレクションを読み込む。未保存・破損時は空のコレクションを返す。
 */
export function loadInventory() {
  const raw = safeGetItem(INVENTORY_KEY);
  if (raw === null) {
    return emptyInventory();
  }
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || typeof parsed.items !== "object" || parsed.items === null) {
      return emptyInventory();
    }
    return { version: INVENTORY_VERSION, items: parsed.items };
  } catch (error) {
    return emptyInventory();
  }
}

function saveInventory(inventory) {
  try {
    safeSetItem(INVENTORY_KEY, JSON.stringify(inventory));
  } catch (error) {
    // JSON化に失敗してもアプリは続行する
  }
}

/**
 * アイテムを1個獲得したことをコレクションへ記録する（即座にlocalStorageへ保存する）。
 * 同じアイテムをすでに持っている場合は所持数を1増やす。
 * @param {{itemId: string, roomId: string, emoji: string, name: string}} reward
 * @returns {{roomId: string, emoji: string, name: string, count: number,
 *   firstObtainedAt: string, lastObtainedAt: string}} 保存後のアイテムの状態
 */
export function recordItemObtained(reward) {
  const inventory = loadInventory();
  const nowIso = new Date().toISOString();
  const existing = inventory.items[reward.itemId];

  const updatedEntry = existing
    ? { ...existing, count: existing.count + 1, lastObtainedAt: nowIso }
    : {
        roomId: reward.roomId,
        emoji: reward.emoji,
        name: reward.name,
        count: 1,
        firstObtainedAt: nowIso,
        lastObtainedAt: nowIso
      };

  inventory.items[reward.itemId] = updatedEntry;
  saveInventory(inventory);
  return updatedEntry;
}

/**
 * 保存済みの全アイテムを、獲得順（初回獲得日時の昇順）の配列で返す。
 */
export function listInventoryItems() {
  const inventory = loadInventory();
  return Object.entries(inventory.items)
    .map(([itemId, entry]) => ({ itemId, ...entry }))
    .sort((a, b) => new Date(a.firstObtainedAt) - new Date(b.firstObtainedAt));
}
