// クエストモード：アイテムコレクション（localStorage）の読み書きを担当するモジュール
// storage.jsと同じ「保存に失敗してもアプリを止めない」方針を踏襲する。
//
// 保存形式（キー：equalLabyrinth.quest.inventory）
// {
//   version: 2,
//   totalGold: 12850,                 // これまでに獲得したアイテムの価値（G）の合計（減らない）
//   items: {
//     "item-D": {
//       roomId: "D", emoji: "🌿", name: "毒消し草",
//       count: 2,                     // 所持数（獲得回数）
//       goldValue: 150,               // 最後に獲得したときの1個あたりの価値
//       totalGoldEarned: 300,         // このアイテムで獲得したGの合計（獲得した時点の価値で積み上げ）
//       firstObtainedAt: "...", lastObtainedAt: "..."
//     }
//   }
// }
//
// 累計Gは「現在のgoldValue × count」の再計算ではなく、獲得した時点の価値を積み上げて保存する
// （将来アイテムの価格を調整しても、過去に獲得した分の価値が変わらないようにするため）。

import { APP_CONFIG } from "../config.js";
import { QUEST_ROOMS, isValidGoldValue } from "./quest-room-data.js";

const INVENTORY_KEY = `${APP_CONFIG.storageKeyPrefix}.quest.inventory`;
const INVENTORY_VERSION = 2;

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
  return { version: INVENTORY_VERSION, totalGold: 0, items: {} };
}

function toNonNegativeInteger(value) {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

/**
 * 現在の部屋データ（QUEST_ROOMS）から、アイテムIDごとの価値・部屋を引けるようにする。
 */
function buildRewardMasterMap() {
  const map = new Map();
  QUEST_ROOMS.forEach((room) => {
    (room.reward || []).forEach((reward) => {
      if (reward && reward.itemId && !map.has(reward.itemId)) {
        map.set(reward.itemId, { ...reward, roomId: room.roomId });
      }
    });
  });
  return map;
}

/**
 * version 1（累計Gなし）のデータを、version 2へ移行する（1回だけ実行される）。
 * 移行前に獲得したアイテムの過去分Gは、「現在の所持数 × 現在設定されているgoldValue」で算出する。
 * 現在のQUEST_ROOMSにないアイテム（旧アイテム）は、保存済みのtotalGoldEarned・goldValueが
 * あればそれを使い、どちらもなければ0Gとする（アイテム自体は削除しない）。
 */
export function migrateInventoryToV2(parsed) {
  const master = buildRewardMasterMap();
  const items = {};
  let totalGold = 0;

  Object.entries(parsed.items || {}).forEach(([itemId, entry]) => {
    if (!entry || typeof entry !== "object") return;
    const count = toNonNegativeInteger(entry.count);
    const masterReward = master.get(itemId);

    let goldValue = null;
    let totalGoldEarned;
    if (Number.isFinite(entry.totalGoldEarned) && entry.totalGoldEarned >= 0) {
      totalGoldEarned = Math.floor(entry.totalGoldEarned);
      goldValue = isValidGoldValue(entry.goldValue) ? entry.goldValue : null;
    } else if (masterReward && isValidGoldValue(masterReward.goldValue)) {
      goldValue = masterReward.goldValue;
      totalGoldEarned = count * goldValue;
    } else if (isValidGoldValue(entry.goldValue)) {
      goldValue = entry.goldValue;
      totalGoldEarned = count * goldValue;
    } else {
      totalGoldEarned = 0;
      console.warn(
        `アイテム「${itemId}」は現在の部屋データに存在せず、価値（G）も保存されていないため、` +
          "移行時の累計ゴールドを0Gとして扱います（アイテム自体は残します）。"
      );
    }

    items[itemId] = {
      ...entry,
      roomId: entry.roomId || (masterReward ? masterReward.roomId : entry.roomId),
      count,
      ...(goldValue !== null ? { goldValue } : {}),
      totalGoldEarned
    };
    totalGold += totalGoldEarned;
  });

  return { version: INVENTORY_VERSION, totalGold, items };
}

/**
 * アイテムコレクションを読み込む。未保存・破損時は空のコレクションを返す。
 * version 1のデータは、ここでversion 2へ移行して保存し直す（以後は移行しない）。
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
    if (parsed.version !== INVENTORY_VERSION) {
      const migrated = migrateInventoryToV2(parsed);
      saveInventory(migrated);
      return migrated;
    }
    return {
      version: INVENTORY_VERSION,
      totalGold: toNonNegativeInteger(parsed.totalGold),
      items: parsed.items
    };
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
 * これまでに獲得したアイテムの価値の合計（累計ゴールド）を返す。
 */
export function getTotalGold() {
  return loadInventory().totalGold;
}

/**
 * アイテムを1個獲得したことを記録する（即座にlocalStorageへ保存する）。
 * 所持数＋1・アイテム別totalGoldEarned＋goldValue・全体totalGold＋goldValueを、
 * 1回の保存処理でまとめて行う（アイテムとGが別々に保存されてずれることがないようにする）。
 * @param {{itemId: string, emoji: string, name: string, goldValue: number}} reward
 * @param {string} roomId 入手した部屋
 * @returns {{item: object, goldValue: number, previousTotalGold: number, totalGold: number}}
 */
export function recordItemAcquisition(reward, roomId) {
  const inventory = loadInventory();
  const nowIso = new Date().toISOString();
  const existing = inventory.items[reward.itemId];
  const goldValue = isValidGoldValue(reward.goldValue) ? reward.goldValue : 0;
  if (goldValue === 0) {
    console.warn(`アイテム「${reward.itemId}」のgoldValueが不正なため、0Gとして記録します。`);
  }

  const updatedEntry = existing
    ? {
        ...existing,
        roomId: existing.roomId || roomId,
        count: toNonNegativeInteger(existing.count) + 1,
        goldValue,
        totalGoldEarned: toNonNegativeInteger(existing.totalGoldEarned) + goldValue,
        lastObtainedAt: nowIso
      }
    : {
        roomId,
        emoji: reward.emoji,
        name: reward.name,
        count: 1,
        goldValue,
        totalGoldEarned: goldValue,
        firstObtainedAt: nowIso,
        lastObtainedAt: nowIso
      };

  const previousTotalGold = inventory.totalGold;
  inventory.items[reward.itemId] = updatedEntry;
  inventory.totalGold = previousTotalGold + goldValue;
  saveInventory(inventory);

  return { item: updatedEntry, goldValue, previousTotalGold, totalGold: inventory.totalGold };
}

/**
 * これまでに一度でもクリアした（＝宝箱からアイテムを入手した）部屋IDの集合を返す。
 * 部屋をクリアすると必ずアイテムを1つ入手するため、保存済みのアイテムから求める
 * （新しい保存データは増やさない）。部屋は現在の部屋データ（QUEST_ROOMS）を優先し、
 * 部屋データにない旧アイテムは保存済みのroomIdを使う。
 * @returns {Set<string>}
 */
export function getClearedRoomIds() {
  const master = buildRewardMasterMap();
  const roomIds = new Set();
  Object.entries(loadInventory().items).forEach(([itemId, entry]) => {
    if (!entry || toNonNegativeInteger(entry.count) <= 0) return;
    const masterReward = master.get(itemId);
    const roomId = masterReward ? masterReward.roomId : entry.roomId;
    if (roomId) roomIds.add(roomId);
  });
  return roomIds;
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
