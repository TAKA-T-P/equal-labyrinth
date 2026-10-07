// クエストモードのアイテム価値（G）・累計ゴールド・称号のロジックを検証するスクリプト（Node.js用）
//
// 使い方（equal-labyrinthフォルダで実行）：
//   node tools/check-quest-gold.mjs
//
// localStorageはメモリ上の簡易実装で置き換えるため、ブラウザの保存データには影響しない。
// 問題があれば終了コード1で終わる。

const memoryStore = new Map();
globalThis.window = {
  localStorage: {
    getItem: (key) => (memoryStore.has(key) ? memoryStore.get(key) : null),
    setItem: (key, value) => memoryStore.set(key, String(value)),
    removeItem: (key) => memoryStore.delete(key),
    clear: () => memoryStore.clear(),
    key: (i) => [...memoryStore.keys()][i] ?? null,
    get length() {
      return memoryStore.size;
    }
  }
};

const { QUEST_ROOMS, validateQuestRoomData } = await import("../js/quest/quest-room-data.js");
const storage = await import("../js/quest/quest-storage.js");
const titles = await import("../js/quest/quest-titles.js");

const INVENTORY_KEY = "equalLabyrinth.quest.inventory";
let failures = 0;
const check = (condition, message) => {
  console.log(`${condition ? "PASS" : "FAIL"} ${message}`);
  if (!condition) failures += 1;
};
const findReward = (roomId, index = 0) => QUEST_ROOMS.find((r) => r.roomId === roomId).reward[index];
const reset = () => memoryStore.clear();

// ---- 価格 ----
console.log("\n■ 価格");
check(validateQuestRoomData().length === 0, "validateQuestRoomData()が問題0件（goldValueの検証を含む）");
const ranges = { 1: [50, 150], 2: [100, 250], 3: [400, 1000], 4: [1000, 7000], 5: [8000, 30000] };
QUEST_ROOMS.forEach((room) => {
  const values = room.reward.map((r) => r.goldValue);
  const [min, max] = ranges[room.stage];
  const allValid = values.every((v) => Number.isInteger(v) && v > 0 && v >= min && v <= max);
  const sameInRoom = new Set(values).size === 1;
  check(allValid && sameInRoom, `部屋${room.roomId}（STAGE${room.stage}）：${values[0].toLocaleString("ja-JP")}G×${values.length}種類（範囲${min}〜${max}G・同じ部屋は同価格）`);
});
const maxItem = QUEST_ROOMS.flatMap((r) => r.reward).reduce((a, b) => (b.goldValue > a.goldValue ? b : a));
check(maxItem.name === "覇王の冠" && maxItem.goldValue === 30000, "最高価値は「覇王の冠」30,000G");

// ---- 累計G ----
console.log("\n■ 累計G");
reset();
[findReward("B"), findReward("F"), findReward("U"), findReward("Z")].forEach((r, i) =>
  storage.recordItemAcquisition(r, ["B", "F", "U", "Z"][i])
);
check(storage.getTotalGold() === 38500, `100G＋400G＋8,000G＋30,000G＝${storage.getTotalGold()}G（38,500G）`);
check(JSON.parse(memoryStore.get(INVENTORY_KEY)).totalGold === 38500, "保存データ（再読み込み相当）でも38,500G");

reset();
const b = findReward("B");
for (let i = 0; i < 3; i += 1) storage.recordItemAcquisition(b, "B");
const saved = JSON.parse(memoryStore.get(INVENTORY_KEY));
check(
  saved.items[b.itemId].count === 3 && saved.items[b.itemId].totalGoldEarned === 300 && saved.totalGold === 300,
  "100Gのアイテムを3回：count 3・totalGoldEarned 300・totalGold 300"
);
check(saved.version === 2 && saved.items[b.itemId].roomId === "B", "version 2で保存され、入手した部屋も記録される");

// 獲得時点の価値で積み上げる（後から価格を変えても過去分は変わらない）
const originalValue = b.goldValue;
b.goldValue = 200;
storage.recordItemAcquisition(b, "B");
b.goldValue = originalValue;
check(storage.getTotalGold() === 500, "価格を100G→200Gに変えたあとの獲得は200Gだけ加算（過去の300Gは変わらず、合計500G）");

// ---- version 1 → 2 移行 ----
console.log("\n■ version 1 → 2 移行");
reset();
const a = findReward("D"); // 150G
const c = findReward("H"); // 700G
memoryStore.set(
  INVENTORY_KEY,
  JSON.stringify({
    version: 1,
    items: {
      [a.itemId]: { roomId: "D", emoji: a.emoji, name: a.name, count: 2, firstObtainedAt: "2026-07-01T00:00:00.000Z", lastObtainedAt: "2026-07-02T00:00:00.000Z" },
      [c.itemId]: { roomId: "H", emoji: c.emoji, name: c.name, count: 3, firstObtainedAt: "2026-07-03T00:00:00.000Z", lastObtainedAt: "2026-07-04T00:00:00.000Z" },
      "item-old": { emoji: "🧪", name: "旧アイテム", count: 4, firstObtainedAt: "2026-06-01T00:00:00.000Z", lastObtainedAt: "2026-06-01T00:00:00.000Z" }
    }
  })
);
const expected = a.goldValue * 2 + c.goldValue * 3;
const originalWarn = console.warn;
let warned = 0;
console.warn = () => { warned += 1; };
check(storage.getTotalGold() === expected, `移行後のtotalGold＝150G×2＋700G×3＝${expected}G`);
console.warn = originalWarn;
const migrated = JSON.parse(memoryStore.get(INVENTORY_KEY));
check(migrated.version === 2, "移行後はversion 2として保存される");
check(migrated.items[a.itemId].totalGoldEarned === 300 && migrated.items[c.itemId].totalGoldEarned === 2100, "アイテムごとのtotalGoldEarnedも設定される");
check(migrated.items["item-old"] && migrated.items["item-old"].totalGoldEarned === 0 && warned > 0, "部屋データにない旧アイテムは削除せず0G（コンソール警告）");
check(migrated.items[a.itemId].count === 2 && migrated.items[a.itemId].firstObtainedAt === "2026-07-01T00:00:00.000Z", "所持数・獲得日時は保たれる");
storage.getTotalGold();
storage.getTotalGold();
check(storage.getTotalGold() === expected, "何度読み込んでも再加算されない");
storage.recordItemAcquisition(a, "D");
check(storage.getTotalGold() === expected + 150, "移行後の獲得は通常どおり加算される");

// ---- 称号 ----
console.log("\n■ 称号");
check(titles.QUEST_TITLES.length === 20 && titles.QUEST_TITLES[19].minGold === 1000000, "称号は20種類、最高は1,000,000G");
const boundaries = [
  [0, "はじめての冒険者"],
  [9999, "はじめての冒険者"],
  [10000, "駆け出しトレジャーハンター"],
  [69999, "宝箱ハンター"],
  [70000, "お宝コレクター"],
  [999999, "イコール・レジェンド"],
  [1000000, "イコール・ラビリンスの覇王"],
  [1234500, "イコール・ラビリンスの覇王"]
];
boundaries.forEach(([gold, title]) =>
  check(titles.getQuestTitle(gold).title === title, `${gold.toLocaleString("ja-JP")}G → ${title}`)
);
const next = titles.getNextQuestTitle(487350);
check(
  titles.getQuestTitle(487350).title === "財宝の達人" && next.title === "黄金の冒険王" && next.requiredGold === 525000 && next.remainingGold === 37650,
  "487,350G：財宝の達人／次「黄金の冒険王」525,000G・あと37,650G"
);
check(titles.getQuestTitleProgressPercent(487350) === 42, "487,350Gの進捗率は42%");
check(titles.getNextQuestTitle(1000000) === null && titles.getQuestTitleProgressPercent(1500000) === 100, "最高称号では次の称号なし・進捗100%");
const rankUp = titles.getTitleRankUp(19000, 49000);
check(rankUp && rankUp.title === "迷宮の探索者", "19,000G＋30,000G＝49,000G：複数の称号を飛び越えても最終到達の「迷宮の探索者」だけ");
check(titles.getTitleRankUp(10000, 19999) === null, "同じ称号の範囲内ではランクアップしない");
check(titles.formatGold(1000000) === "1,000,000G" && titles.formatGold(100) === "100G", "3桁区切りの表示（1,000,000G）");

console.log(failures === 0 ? "\nすべて成功" : `\n失敗：${failures}件`);
if (failures > 0) process.exitCode = 1;
