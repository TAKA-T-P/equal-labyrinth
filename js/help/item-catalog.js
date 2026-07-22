// アイテム図鑑：QUEST_ROOMS（部屋データ）とquest-storage.js（保存済みインベントリ）から、
// アイテム一覧を動的に構築する。アイテム名・絵文字・部屋の対応を、このファイルへ
// 手作業で重複登録しない（すべてQUEST_ROOMSのrewardから抽出する）。
//
// アイテム数を固定値（例：26）としてコード内に持たないこと。将来QUEST_ROOMSへ
// 部屋・報酬が追加されれば、buildItemMasterList()の結果もそのまま増える。
//
// rewardは1つの部屋につき1つ以上のアイテム（配列）を持つ（ステージ1〜3の部屋は、
// 宝箱を開けるたびにこの配列からランダムで1つを入手する。js/modes/quest-mode.jsを参照）。
// 図鑑には、その部屋で入手しうるすべてのアイテムを個別に一覧表示する。

import { QUEST_ROOMS } from "../quest/quest-room-data.js";
import { listInventoryItems } from "../quest/quest-storage.js";

/**
 * QUEST_ROOMSの各部屋のreward（アイテム候補の配列）から、アイテムのマスター一覧を構築する。
 * 同じitemIdが複数の部屋に登録されている場合は最初の1件だけを採用し、
 * コンソールへ警告する（README「クエストの部屋データの追加・変更方法」を参照）。
 * 並び順：ステージの小さい順→同じステージでは部屋ID順→同じ部屋の中ではreward配列の順。
 * @param {Array} rooms QUEST_ROOMS
 * @returns {Array<{itemId: string, emoji: string, name: string, description: string|null,
 *   roomId: string, stage: number}>}
 */
export function buildItemMasterList(rooms) {
  const seen = new Map();
  const duplicates = [];

  (Array.isArray(rooms) ? rooms : []).forEach((room) => {
    if (!room || !Array.isArray(room.reward)) {
      return;
    }
    room.reward.forEach((rewardItem, indexInRoom) => {
      if (!rewardItem || typeof rewardItem.itemId !== "string") {
        return;
      }
      const { itemId, emoji, name, description } = rewardItem;
      if (seen.has(itemId)) {
        duplicates.push({ itemId, existingRoomId: seen.get(itemId).roomId, roomId: room.roomId });
        return;
      }
      seen.set(itemId, {
        itemId,
        emoji,
        name,
        description: typeof description === "string" && description ? description : null,
        roomId: room.roomId,
        stage: room.stage,
        indexInRoom
      });
    });
  });

  duplicates.forEach(({ itemId, existingRoomId, roomId }) => {
    console.warn(
      `アイテム図鑑：itemId「${itemId}」が複数の部屋（${existingRoomId}・${roomId}）に登録されています。` +
        `最初に見つかった部屋（${existingRoomId}）の内容だけを使用します。`
    );
  });

  const items = [...seen.values()];
  items.sort((a, b) => {
    const stageA = Number.isFinite(a.stage) ? a.stage : Infinity;
    const stageB = Number.isFinite(b.stage) ? b.stage : Infinity;
    if (stageA !== stageB) return stageA - stageB;
    const roomCompare = String(a.roomId || "").localeCompare(String(b.roomId || ""));
    if (roomCompare !== 0) return roomCompare;
    return a.indexInRoom - b.indexInRoom;
  });

  return items.map(({ indexInRoom, ...item }) => item);
}

/**
 * 保存済みの所持数を、安全な非負整数へ補正する。
 */
function normalizeCount(rawCount) {
  return Number.isFinite(rawCount) && rawCount > 0 ? Math.floor(rawCount) : 0;
}

/**
 * アイテムのマスター一覧と、保存済みインベントリ（quest-storage.js）を
 * itemIdで結合し、図鑑の表示に必要な情報一式を返す。
 * 呼び出すたびに最新のインベントリを読み込むため、開くたびに最新の状態が反映される。
 *
 * インベントリにだけ存在するアイテム（部屋データの変更で将来存在しうる）は、
 * マスター一覧の最後へ追加し、保存済みのemoji・nameをそのまま使う
 * （見つからない場合は「旧アイテム」「❔」で表示し、データそのものは削除しない）。
 *
 * @returns {{
 *   items: Array<{itemId, emoji, name, description: string|null, roomId: string|null,
 *     stage: number|null, obtained: boolean, count: number, isOrphan: boolean}>,
 *   totalCount: number,
 *   obtainedCount: number,
 *   collectionRate: number,
 *   loadFailed: boolean
 * }}
 */
export function buildItemCatalog() {
  try {
    const masterList = buildItemMasterList(QUEST_ROOMS);
    const inventoryEntries = listInventoryItems();
    const inventoryById = new Map(inventoryEntries.map((entry) => [entry.itemId, entry]));
    const masterIds = new Set(masterList.map((entry) => entry.itemId));

    const items = masterList.map((master) => {
      const owned = inventoryById.get(master.itemId);
      const count = normalizeCount(owned ? owned.count : 0);
      return {
        itemId: master.itemId,
        emoji: master.emoji,
        name: master.name,
        description: master.description,
        roomId: master.roomId || null,
        stage: Number.isFinite(master.stage) ? master.stage : null,
        obtained: count > 0,
        count,
        isOrphan: false
      };
    });

    inventoryEntries
      .filter((entry) => !masterIds.has(entry.itemId))
      .forEach((entry) => {
        const count = normalizeCount(entry.count);
        items.push({
          itemId: entry.itemId,
          emoji: typeof entry.emoji === "string" && entry.emoji ? entry.emoji : "❔",
          name: typeof entry.name === "string" && entry.name ? entry.name : "旧アイテム",
          // インベントリには説明文を保存していないため、旧アイテムは常にdescription: nullになる。
          description: null,
          roomId: typeof entry.roomId === "string" && entry.roomId ? entry.roomId : null,
          stage: null,
          obtained: count > 0,
          count,
          isOrphan: true
        });
      });

    const totalCount = items.length;
    const obtainedCount = items.filter((item) => item.obtained).length;
    const collectionRate = totalCount === 0 ? 0 : Math.floor((obtainedCount / totalCount) * 100);

    return { items, totalCount, obtainedCount, collectionRate, loadFailed: false };
  } catch (error) {
    console.warn("アイテム図鑑の読み込みに失敗しました。", error);
    return { items: [], totalCount: 0, obtainedCount: 0, collectionRate: 0, loadFailed: true };
  }
}
