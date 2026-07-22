// クエストモード：A〜Zの部屋データ（正式データ）
// 「クエストモード各部屋のミッション一覧.pdf」の内容をそのままコード化したもの。
// 部屋データの形式は README「クエストモード」を参照。
//
// rewardは常に配列（1つ以上のアイテム候補）。ステージ1〜3（A〜Kの部屋）は複数候補を
// 持たせており、宝箱を開けたときに配列からランダムで1つを選ぶ（js/modes/quest-mode.jsの
// handleOpenChest()を参照）。ステージ4・5（L〜Zの部屋）は、これまでどおり要素1つの配列。

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
    reward: [
      {
        itemId: "item-A",
        emoji: "🍏",
        name: "熟した果実",
        description: "ひと口かじれば元気いっぱい！冒険で減った体力を少し回復する。"
      },
      {
        itemId: "item-A2",
        emoji: "🍓",
        name: "妖精のいちご",
        description: "妖精の森で育った甘い実で、食べると体がふわっと軽くなる。"
      },
      {
        itemId: "item-A3",
        emoji: "🍇",
        name: "ムラサキぶどう玉",
        description: "魔力をたっぷり吸い込んだぶどうで、ひと粒ごとに元気がわいてくる。"
      },
      {
        itemId: "item-A4",
        emoji: "🍉",
        name: "オアシススイカ",
        description: "砂漠の真ん中で育ったみずみずしいスイカで、疲れを吹き飛ばす。"
      },
      {
        itemId: "item-A5",
        emoji: "🍒",
        name: "ふたごチェリー",
        description: "2つ同時に食べると、うれしい出来事が2倍になるといわれている。"
      }
    ],
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
    reward: [
      {
        itemId: "item-B",
        emoji: "🍖",
        name: "完熟ケモノ肉",
        description: "うまみとパワーがぎっしり詰まった、野性味あふれる極上の肉。"
      },
      {
        itemId: "item-B2",
        emoji: "🍌",
        name: "パワーバナナ",
        description: "食べた瞬間に力がみなぎり、重たい岩も持ち上げられそうになる。"
      },
      {
        itemId: "item-B3",
        emoji: "🍑",
        name: "天界のもも",
        description: "雲の上で育った幻のももで、ひと口食べれば傷がたちまち癒える。"
      },
      {
        itemId: "item-B4",
        emoji: "🍍",
        name: "トゲトゲパイン",
        description: "見た目は危険だが中身は極上で、食べると防御力が高まる。"
      },
      {
        itemId: "item-B5",
        emoji: "🍳",
        name: "ドラゴンエッグ焼き",
        description: "ドラゴンの卵に似た巨大な目玉焼きで、食べれば力がぐんぐん湧いてくる。"
      }
    ],
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
    reward: [
      {
        itemId: "item-C",
        emoji: "💊",
        name: "ハーブカプセル",
        description: "貴重な薬草の力を閉じ込めた、持ち運びに便利な回復カプセル。"
      },
      {
        itemId: "item-C2",
        emoji: "🥕",
        name: "俊足ニンジン",
        description: "かじると足が速くなり、敵より先に動けるようになる。"
      },
      {
        itemId: "item-C3",
        emoji: "🍄",
        name: "巨大化キノコ",
        description: "食べると一時的に体が大きくなり、いつも以上の力を発揮できる。"
      },
      {
        itemId: "item-C4",
        emoji: "🧲",
        name: "お宝マグネット",
        description: "周囲に落ちているコインや小さな宝物を引き寄せる不思議な磁石。"
      },
      {
        itemId: "item-C5",
        emoji: "🌽",
        name: "黄金のとうもろこし",
        description: "粒の一つ一つが金色に輝き、食べると幸運を呼び寄せる。"
      }
    ],
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
    reward: [
      {
        itemId: "item-D",
        emoji: "🌿",
        name: "毒消し草",
        description: "かむと少し苦いが、体に回った毒をたちまち消してくれる。"
      },
      {
        itemId: "item-D2",
        emoji: "🍞",
        name: "勇者の焼きたてパン",
        description: "冒険者たちに愛される香ばしいパンで、心と体を元気にする。"
      },
      {
        itemId: "item-D3",
        emoji: "🧀",
        name: "満月チーズ",
        description: "満月の夜に完成する特別なチーズで、不思議な魔力を回復する。"
      },
      {
        itemId: "item-D4",
        emoji: "🔔",
        name: "精霊呼びの鈴",
        description: "澄んだ音を鳴らすと、小さな精霊が冒険を助けに来てくれる。"
      },
      {
        itemId: "item-D5",
        emoji: "🃏",
        name: "切り札のジョーカー",
        description: "ここぞという場面で使うと、思いもよらない奇跡を起こす。"
      }
    ],
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
    reward: [
      {
        itemId: "item-E",
        emoji: "🧪",
        name: "ハイポーション",
        description: "虹色に輝く魔法の薬で、傷ついた体力を一気に回復する。"
      },
      {
        itemId: "item-E2",
        emoji: "🍨",
        name: "永久氷河アイス",
        description: "決して溶けない氷で作られ、熱や炎の攻撃から身を守ってくれる。"
      },
      {
        itemId: "item-E3",
        emoji: "🍛",
        name: "灼熱ドラゴンカレー",
        description: "口から火が出るほど辛いが、攻撃力を大きく高めてくれる。"
      },
      {
        itemId: "item-E4",
        emoji: "⏳",
        name: "時戻しの砂時計",
        description: "砂が落ちきる前に使うと、少し前の時間まで戻ることができる。"
      },
      {
        itemId: "item-E5",
        emoji: "🧵",
        name: "アリアドネの糸",
        description: "迷宮の入り口から伸び続け、迷わず元の場所へ戻れる魔法の糸。"
      }
    ],
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
    reward: [
      {
        itemId: "item-F",
        emoji: "⚙️",
        name: "古代文明の歯車",
        description: "失われた機械を動かすという、謎のエネルギーを秘めた歯車。"
      },
      {
        itemId: "item-F2",
        emoji: "🕯️",
        name: "導きの聖火",
        description: "暗い迷宮を明るく照らし、隠された道や宝箱を見つけ出す。"
      }
    ],
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
    reward: [
      {
        itemId: "item-G",
        emoji: "🧭",
        name: "真実の羅針盤",
        description: "どんな迷宮でも、本当に進むべき道を指し示してくれる。"
      },
      {
        itemId: "item-G2",
        emoji: "🪶",
        name: "天空鳥の羽根",
        description: "空を飛ぶ伝説の鳥の羽根で、高い場所へひと飛びできる。"
      }
    ],
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
    reward: [
      {
        itemId: "item-H",
        emoji: "🗺️",
        name: "秘境の古地図",
        description: "誰も知らない洞窟や、秘密の宝箱の場所が描かれた古い地図。"
      },
      {
        itemId: "item-H2",
        emoji: "🎲",
        name: "運命のダイス",
        description: "振るたびに何が起こるか分からない、幸運と危険を秘めたサイコロ。"
      }
    ],
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
    reward: [
      {
        itemId: "item-I",
        emoji: "💧",
        name: "流水の魔石",
        description: "清らかな水の力を宿し、激しい水流を生み出す青き魔石。"
      },
      {
        itemId: "item-I2",
        emoji: "🪞",
        name: "真実を映す鏡",
        description: "変身や幻を見破り、隠された本当の姿を映し出す。"
      }
    ],
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
    reward: [
      {
        itemId: "item-J",
        emoji: "🔥",
        name: "烈火の魔石",
        description: "触れるだけで熱が伝わる、燃えさかる炎の力を秘めた魔石。"
      },
      {
        itemId: "item-J2",
        emoji: "📖",
        name: "賢者の攻略書",
        description: "強敵の弱点や迷宮の仕掛けが、読む者にだけ浮かび上がる。"
      }
    ],
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
    reward: [
      {
        itemId: "item-K",
        emoji: "🌟",
        name: "進化の輝星",
        description: "限界を超える力を与え、眠っていた新たな能力を目覚めさせる。"
      },
      {
        itemId: "item-K2",
        emoji: "💣",
        name: "びっくり魔法爆弾",
        description: "爆発と同時に星や煙が飛び出し、敵を驚かせて動きを止める。"
      }
    ],
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
    reward: [
      {
        itemId: "item-L",
        emoji: "🔑",
        name: "ゴールドキー",
        description: "黄金の宝箱や、固く閉ざされた秘密の扉を開く特別なカギ。"
      }
    ],
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
    reward: [
      {
        itemId: "item-M",
        emoji: "🪙",
        name: "マジカルコイン",
        description: "集めるほど不思議な力が高まり、珍しいアイテムと交換できる。"
      }
    ],
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
    reward: [
      {
        itemId: "item-N",
        emoji: "🎁",
        name: "サンタの贈り物",
        description: "開けるまで中身は分からない、夢と驚きが詰まった贈り物。"
      }
    ],
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
    reward: [
      {
        itemId: "item-O",
        emoji: "💴",
        name: "袖の下",
        description: "こっそり渡すと、気むずかしい相手の態度が少し変わるらしい。"
      }
    ],
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
    reward: [
      {
        itemId: "item-P",
        emoji: "🪄",
        name: "魔導士の杖",
        description: "ひと振りすれば魔力があふれ、強力な魔法を呼び起こす。"
      }
    ],
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
    reward: [
      {
        itemId: "item-Q",
        emoji: "💍",
        name: "幸運の指輪",
        description: "身につけた者に幸運を呼び込み、珍しい宝との出会いを増やす。"
      }
    ],
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
    reward: [
      {
        itemId: "item-R",
        emoji: "🛡️",
        name: "守護神のシールド",
        description: "守護神の加護を宿し、どんな強烈な攻撃も受け止める伝説の盾。"
      }
    ],
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
    reward: [
      {
        itemId: "item-S",
        emoji: "🏹",
        name: "天駆ける精霊の弓",
        description: "風の精霊が矢を導き、はるか遠くの敵さえ正確に射抜く。"
      }
    ],
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
    reward: [
      {
        itemId: "item-T",
        emoji: "⚔️",
        name: "聖剣エクスカリバー",
        description: "選ばれし勇者だけが使える、闇を切り裂く最強の聖剣。"
      }
    ],
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
    reward: [
      {
        itemId: "item-U",
        emoji: "📜",
        name: "禁忌の召喚書",
        description: "封印された魔物を呼び出す、決して開いてはならない禁断の書。"
      }
    ],
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
    reward: [
      {
        itemId: "item-V",
        emoji: "🔮",
        name: "時空の予言球",
        description: "過去と未来の景色を映し出し、これから起こる運命を告げる。"
      }
    ],
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
    reward: [
      {
        itemId: "item-W",
        emoji: "💎",
        name: "星屑のダイヤ",
        description: "夜空からこぼれ落ちた星の光が、長い年月をかけて結晶になった。"
      }
    ],
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
    reward: [
      {
        itemId: "item-X",
        emoji: "💰",
        name: "伝説の財宝袋",
        description: "金貨や宝石が次々にあふれ出す、底が見えない不思議な袋。"
      }
    ],
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
    reward: [
      {
        itemId: "item-Y",
        emoji: "🏆",
        name: "栄光のトロフィー",
        description: "数々の試練を乗り越えた、真の冒険者だけに贈られる証。"
      }
    ],
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
    reward: [
      {
        itemId: "item-Z",
        emoji: "👑",
        name: "覇王の冠",
        description: "最強の敵を打ち破り、世界の頂点に立った者がかぶる黄金の冠。"
      }
    ],
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
    if (!Array.isArray(room.reward) || room.reward.length === 0) {
      problems.push(`${label}：rewardは1つ以上のアイテムを持つ配列である必要があります。`);
    } else if (room.reward.some((item) => !item || !item.name || !item.emoji || !item.itemId)) {
      problems.push(`${label}：rewardの中に、名前・絵文字・itemIdが不足しているアイテムがあります。`);
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
