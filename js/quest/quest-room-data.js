// クエストモード：A〜Zの部屋データ（正式データ）
// 「クエストモード各部屋のミッション一覧.pdf」の内容をそのままコード化したもの。
// 部屋データの形式は README「クエストモード」を参照。

export const QUEST_ROOMS = [
  {
    roomId: "A", stage: 1,
    enemy: { emoji: "🦇", name: "バサット" },
    mission: {
      hintMode: "immediate",
      requiredCorrect: 1,
      timeLimitMultiplier: null,
      maxIncorrect: null,
      categoryGroup: "normal"
    },
    reward: { itemId: "item-A", emoji: "🍏", name: "熟した果実" },
    successRooms: ["C", "D"],
    failureRoom: null
  },
  {
    roomId: "B", stage: 1,
    enemy: { emoji: "🐗", name: "トッシンボー" },
    mission: {
      hintMode: "after20",
      requiredCorrect: 1,
      timeLimitMultiplier: 3,
      maxIncorrect: null,
      categoryGroup: "normal"
    },
    reward: { itemId: "item-B", emoji: "🍖", name: "完熟ケモノ肉" },
    successRooms: ["D", "E"],
    failureRoom: "C"
  },

  {
    roomId: "C", stage: 2,
    enemy: { emoji: "🦟", name: "チクリン" },
    mission: {
      hintMode: "immediate",
      requiredCorrect: 1,
      timeLimitMultiplier: null,
      maxIncorrect: null,
      categoryGroup: "normal"
    },
    reward: { itemId: "item-C", emoji: "💊", name: "ハーブカプセル" },
    successRooms: ["F", "G"],
    failureRoom: null
  },
  {
    roomId: "D", stage: 2,
    enemy: { emoji: "🐍", name: "ニョロキング" },
    mission: {
      hintMode: "immediate",
      requiredCorrect: 1,
      timeLimitMultiplier: null,
      maxIncorrect: 3,
      categoryGroup: "normal"
    },
    reward: { itemId: "item-D", emoji: "🌿", name: "毒消し草" },
    successRooms: ["H", "I"],
    failureRoom: "F"
  },
  {
    roomId: "E", stage: 2,
    enemy: { emoji: "🐙", name: "タコンスター" },
    mission: {
      hintMode: "after20",
      requiredCorrect: 1,
      timeLimitMultiplier: 2.5,
      maxIncorrect: null,
      categoryGroup: "normal"
    },
    reward: { itemId: "item-E", emoji: "🧪", name: "ハイポーション" },
    successRooms: ["J", "K"],
    failureRoom: "G"
  },

  {
    roomId: "F", stage: 3,
    enemy: { emoji: "🦎", name: "ペタペタン" },
    mission: {
      hintMode: "immediate",
      requiredCorrect: 1,
      timeLimitMultiplier: null,
      maxIncorrect: null,
      categoryGroup: "normal"
    },
    reward: { itemId: "item-F", emoji: "⚙️", name: "古代文明の歯車" },
    successRooms: ["L", "M"],
    failureRoom: null
  },
  {
    roomId: "G", stage: 3,
    enemy: { emoji: "🦅", name: "イーグルン" },
    mission: {
      hintMode: "after20",
      requiredCorrect: 1,
      timeLimitMultiplier: 4,
      maxIncorrect: null,
      categoryGroup: "commerce"
    },
    reward: { itemId: "item-G", emoji: "🧭", name: "真実の羅針盤" },
    successRooms: ["M", "N"],
    failureRoom: "L"
  },
  {
    roomId: "H", stage: 3,
    enemy: { emoji: "🐺", name: "ガウルフ" },
    mission: {
      hintMode: "immediate",
      requiredCorrect: 1,
      timeLimitMultiplier: null,
      maxIncorrect: 3,
      categoryGroup: "integer"
    },
    reward: { itemId: "item-H", emoji: "🗺️", name: "秘境の古地図" },
    successRooms: ["O", "P"],
    failureRoom: "N"
  },
  {
    roomId: "I", stage: 3,
    enemy: { emoji: "👁️", name: "ギョロリン" },
    mission: {
      hintMode: "after20",
      requiredCorrect: 1,
      timeLimitMultiplier: 3,
      maxIncorrect: null,
      categoryGroup: "speedGeometry"
    },
    reward: { itemId: "item-I", emoji: "💧", name: "流水の魔石" },
    successRooms: ["P", "Q"],
    failureRoom: "O"
  },
  {
    roomId: "J", stage: 3,
    enemy: { emoji: "💀", name: "ホネボーン" },
    mission: {
      hintMode: "none",
      requiredCorrect: 1,
      timeLimitMultiplier: null,
      maxIncorrect: 2,
      categoryGroup: "percentage"
    },
    reward: { itemId: "item-J", emoji: "🔥", name: "烈火の魔石" },
    successRooms: ["R", "S"],
    failureRoom: "Q"
  },
  {
    roomId: "K", stage: 3,
    enemy: { emoji: "🤖", name: "ロボスターMk.II" },
    mission: {
      hintMode: "after20",
      requiredCorrect: 2,
      timeLimitMultiplier: 4.5,
      maxIncorrect: null,
      categoryGroup: "hard"
    },
    reward: { itemId: "item-K", emoji: "🌟", name: "進化の輝星" },
    successRooms: ["S", "T"],
    failureRoom: "R"
  },

  {
    roomId: "L", stage: 4,
    enemy: { emoji: "🕷️", name: "スパイダー！" },
    mission: {
      hintMode: "immediate",
      requiredCorrect: 1,
      timeLimitMultiplier: null,
      maxIncorrect: null,
      categoryGroup: "normal"
    },
    reward: { itemId: "item-L", emoji: "🔑", name: "ゴールドキー" },
    successRooms: ["U"],
    failureRoom: null
  },
  {
    roomId: "M", stage: 4,
    enemy: { emoji: "🦂", name: "サソリンガー" },
    mission: {
      hintMode: "immediate",
      requiredCorrect: 1,
      timeLimitMultiplier: null,
      maxIncorrect: 2,
      categoryGroup: "normal"
    },
    reward: { itemId: "item-M", emoji: "🪙", name: "マジカルコイン" },
    successRooms: ["V"],
    failureRoom: "U"
  },
  {
    roomId: "N", stage: 4,
    enemy: { emoji: "👻", name: "ユラリン" },
    mission: {
      hintMode: "after20",
      requiredCorrect: 2,
      timeLimitMultiplier: 6,
      maxIncorrect: null,
      categoryGroup: "all"
    },
    reward: { itemId: "item-N", emoji: "🎁", name: "サンタの贈り物" },
    successRooms: ["W"],
    failureRoom: "U"
  },
  {
    roomId: "O", stage: 4,
    enemy: { emoji: "😈", name: "ワルイモン" },
    mission: {
      hintMode: "immediate",
      requiredCorrect: 1,
      timeLimitMultiplier: null,
      maxIncorrect: 2,
      categoryGroup: "normal"
    },
    reward: { itemId: "item-O", emoji: "💴", name: "袖の下" },
    successRooms: ["V"],
    failureRoom: "U"
  },
  {
    roomId: "P", stage: 4,
    enemy: { emoji: "🧙", name: "まほじい" },
    mission: {
      hintMode: "none",
      requiredCorrect: 2,
      timeLimitMultiplier: null,
      maxIncorrect: 2,
      categoryGroup: "normal"
    },
    reward: { itemId: "item-P", emoji: "🪄", name: "魔導士の杖" },
    successRooms: ["W"],
    failureRoom: "V"
  },
  {
    roomId: "Q", stage: 4,
    enemy: { emoji: "👾", name: "インベーダ" },
    mission: {
      hintMode: "after20",
      requiredCorrect: 2,
      timeLimitMultiplier: 5,
      maxIncorrect: null,
      categoryGroup: "all"
    },
    reward: { itemId: "item-Q", emoji: "💍", name: "幸運の指輪" },
    successRooms: ["X"],
    failureRoom: "V"
  },
  {
    roomId: "R", stage: 4,
    enemy: { emoji: "👹", name: "大あかおに" },
    mission: {
      hintMode: "none",
      requiredCorrect: 1,
      timeLimitMultiplier: null,
      maxIncorrect: 1,
      categoryGroup: "normal"
    },
    reward: { itemId: "item-R", emoji: "🛡️", name: "守護神のシールド" },
    successRooms: ["X"],
    failureRoom: "W"
  },
  {
    roomId: "S", stage: 4,
    enemy: { emoji: "👺", name: "テングスター" },
    mission: {
      hintMode: "after20",
      requiredCorrect: 2,
      timeLimitMultiplier: 4.5,
      maxIncorrect: null,
      categoryGroup: "hard"
    },
    reward: { itemId: "item-S", emoji: "🏹", name: "天駆ける精霊の弓" },
    successRooms: ["Y"],
    failureRoom: "X"
  },
  {
    roomId: "T", stage: 4,
    enemy: { emoji: "🦖", name: "ガブリュウ" },
    mission: {
      hintMode: "none",
      requiredCorrect: 3,
      timeLimitMultiplier: 6,
      maxIncorrect: 2,
      categoryGroup: "all"
    },
    reward: { itemId: "item-T", emoji: "⚔️", name: "聖剣エクスカリバー" },
    successRooms: ["Z"],
    failureRoom: "Y"
  },

  {
    roomId: "U", stage: 5,
    enemy: { emoji: "🧛", name: "バンパイアン" },
    mission: {
      hintMode: "immediate",
      requiredCorrect: 1,
      timeLimitMultiplier: null,
      maxIncorrect: null,
      categoryGroup: "normal"
    },
    reward: { itemId: "item-U", emoji: "📜", name: "禁忌の召喚書" },
    successRooms: [],
    failureRoom: null
  },
  {
    roomId: "V", stage: 5,
    enemy: { emoji: "👽", name: "ウチュウジンZ" },
    mission: {
      hintMode: "none",
      requiredCorrect: 2,
      timeLimitMultiplier: null,
      maxIncorrect: 3,
      categoryGroup: "normal"
    },
    reward: { itemId: "item-V", emoji: "🔮", name: "時空の予言球" },
    successRooms: [],
    failureRoom: null
  },
  {
    roomId: "W", stage: 5,
    enemy: { emoji: "🛸", name: "クルクルーン" },
    mission: {
      hintMode: "after20",
      requiredCorrect: 2,
      timeLimitMultiplier: 4.5,
      maxIncorrect: null,
      categoryGroup: "all"
    },
    reward: { itemId: "item-W", emoji: "💎", name: "星屑のダイヤ" },
    successRooms: [],
    failureRoom: null
  },
  {
    roomId: "X", stage: 5,
    enemy: { emoji: "🐲", name: "リュウキング" },
    mission: {
      hintMode: "none",
      requiredCorrect: 3,
      timeLimitMultiplier: null,
      maxIncorrect: 2,
      categoryGroup: "all"
    },
    reward: { itemId: "item-X", emoji: "💰", name: "伝説の財宝袋" },
    successRooms: [],
    failureRoom: null
  },
  {
    roomId: "Y", stage: 5,
    enemy: { emoji: "🦹", name: "フォーミュラ仮面" },
    mission: {
      hintMode: "none",
      requiredCorrect: 3,
      timeLimitMultiplier: null,
      maxIncorrect: 2,
      categoryGroup: "all"
    },
    reward: { itemId: "item-Y", emoji: "🏆", name: "栄光のトロフィー" },
    successRooms: [],
    failureRoom: null
  },
  {
    roomId: "Z", stage: 5,
    enemy: { emoji: "🦹‍♂️", name: "フォーミュラ仮面エース" },
    mission: {
      hintMode: "none",
      requiredCorrect: 5,
      timeLimitMultiplier: 8,
      maxIncorrect: 2,
      categoryGroup: "all"
    },
    reward: { itemId: "item-Z", emoji: "👑", name: "覇王の冠" },
    successRooms: [],
    failureRoom: null
  }
];

export const QUEST_ROOMS_BY_ID = Object.fromEntries(
  QUEST_ROOMS.map((room) => [room.roomId, room])
);

export const QUEST_OPENING_ROOM_IDS = ["A", "B"];

const VALID_HINT_MODES = new Set(["immediate", "after20", "none"]);
const VALID_CATEGORY_GROUPS = new Set([
  "normal",
  "hard",
  "all",
  "commerce",
  "integer",
  "speedGeometry",
  "percentage"
]);

/**
 * A〜Zの部屋データを検証する（開発時チェック用）。
 * 不正なデータがあっても例外は投げず、問題点の一覧を返す
 * （呼び出し側がコンソールへ警告するかどうかを判断できるようにするため）。
 * @returns {string[]} 問題点の一覧（空配列なら正常）
 */
export function validateQuestRoomData() {
  const problems = [];
  const seenIds = new Set();

  QUEST_ROOMS.forEach((room) => {
    const label = `部屋${room.roomId || "(不明)"}`;

    if (!room.roomId || typeof room.roomId !== "string") {
      problems.push(`${label}：roomIdが不正です。`);
      return;
    }
    if (seenIds.has(room.roomId)) {
      problems.push(`${label}：roomIdが重複しています。`);
    }
    seenIds.add(room.roomId);

    if (!Number.isInteger(room.stage) || room.stage < 1 || room.stage > 5) {
      problems.push(`${label}：stageは1〜5の整数である必要があります。`);
    }

    if (!room.enemy || !room.enemy.name || !room.enemy.emoji) {
      problems.push(`${label}：enemyの名前・絵文字が不足しています。`);
    }
    if (!room.reward || !room.reward.name || !room.reward.emoji || !room.reward.itemId) {
      problems.push(`${label}：rewardの名前・絵文字・itemIdが不足しています。`);
    }

    const mission = room.mission || {};
    if (!Number.isInteger(mission.requiredCorrect) || mission.requiredCorrect < 1) {
      problems.push(`${label}：requiredCorrectは1以上の整数である必要があります。`);
    }
    if (
      mission.timeLimitMultiplier !== null &&
      (typeof mission.timeLimitMultiplier !== "number" || mission.timeLimitMultiplier <= 0)
    ) {
      problems.push(`${label}：timeLimitMultiplierは正の数またはnullである必要があります。`);
    }
    if (
      mission.maxIncorrect !== null &&
      (!Number.isInteger(mission.maxIncorrect) || mission.maxIncorrect < 1)
    ) {
      problems.push(`${label}：maxIncorrectは正の整数またはnullである必要があります。`);
    }
    if (!VALID_HINT_MODES.has(mission.hintMode)) {
      problems.push(`${label}：hintModeが不正です（${mission.hintMode}）。`);
    }
    if (!VALID_CATEGORY_GROUPS.has(mission.categoryGroup)) {
      problems.push(`${label}：categoryGroupが不正です（${mission.categoryGroup}）。`);
    }

    if (mission.timeLimitMultiplier === null && mission.maxIncorrect === null) {
      if (room.failureRoom !== null) {
        problems.push(`${label}：失敗条件がないのにfailureRoomがnullではありません。`);
      }
    }

    if (room.stage >= 1 && room.stage <= 3) {
      if (!Array.isArray(room.successRooms) || room.successRooms.length !== 2) {
        problems.push(`${label}：ステージ1〜3のsuccessRoomsは2部屋である必要があります。`);
      }
    } else if (room.stage === 4) {
      if (!Array.isArray(room.successRooms) || room.successRooms.length !== 1) {
        problems.push(`${label}：ステージ4のsuccessRoomsは1部屋である必要があります。`);
      }
    } else if (room.stage === 5) {
      if (!Array.isArray(room.successRooms) || room.successRooms.length !== 0) {
        problems.push(`${label}：ステージ5のsuccessRoomsは空である必要があります。`);
      }
    }

    (room.successRooms || []).forEach((targetId) => {
      const target = QUEST_ROOMS_BY_ID[targetId];
      if (!target) {
        problems.push(`${label}：successRoomsに存在しない部屋ID「${targetId}」があります。`);
      } else if (target.stage !== room.stage + 1) {
        problems.push(
          `${label}：successRoomsの「${targetId}」がステージ${room.stage + 1}ではありません。`
        );
      }
    });

    if (room.failureRoom !== null) {
      const target = QUEST_ROOMS_BY_ID[room.failureRoom];
      if (!target) {
        problems.push(`${label}：failureRoomに存在しない部屋ID「${room.failureRoom}」があります。`);
      } else if (target.stage !== room.stage + 1) {
        problems.push(
          `${label}：failureRoomの「${room.failureRoom}」がステージ${room.stage + 1}ではありません。`
        );
      }
    }
  });

  if (QUEST_ROOMS.length !== 26) {
    problems.push(`全26部屋である必要がありますが、${QUEST_ROOMS.length}件でした。`);
  }

  return problems;
}

/**
 * 起動時にA〜Zの部屋データを検証し、問題があればコンソールへ警告する。
 * アプリの起動は止めない。
 */
export function reportQuestRoomDataProblems() {
  const problems = validateQuestRoomData();
  if (problems.length > 0) {
    console.warn(
      `クエストモードの部屋データに${problems.length}件の問題があります：\n` +
        problems.map((p) => `- ${p}`).join("\n")
    );
  }
  return problems;
}
