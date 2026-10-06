// アプリ全体で利用する定数

export const APP_CONFIG = {
  minQuestions: 3,
  maxQuestions: 20,
  defaultQuestions: 5,
  hintDelaySeconds: 20,
  passDelaySeconds: 40,
  correctDisplayMilliseconds: 2000,
  passDisplayMilliseconds: 1500,
  countdownMilliseconds: 750,
  numericTolerance: 1e-9,
  maxGenerationAttempts: 30,
  storageKeyPrefix: "equalLabyrinth",

  // 段位認定モード
  rankDurationMs: 120000,
  rankFinalGracePeriodMs: 30000,
  rankUrgentThresholdSeconds: 10,
  rankDefaultDifficulty: "NORMAL"
};

// 単元の内部識別子
export const UNIT_IDS = {
  LINEAR: "linear",
  SIMULTANEOUS: "simultaneous",
  QUADRATIC: "quadratic"
};

// 入力欄の種類（1本の式 or 連立の2本）
export const INPUT_MODES = {
  SINGLE: "single",
  SYSTEM: "system"
};

// 単元ごとの表示名・段位計算とコンボゲージの基準時間（timeB、秒）・入力欄の種類
export const UNIT_CONFIG = {
  [UNIT_IDS.LINEAR]: {
    displayName: "1次方程式",
    baseTimeSeconds: 12,
    inputMode: INPUT_MODES.SINGLE
  },
  [UNIT_IDS.SIMULTANEOUS]: {
    displayName: "連立方程式",
    baseTimeSeconds: 20,
    inputMode: INPUT_MODES.SYSTEM
  },
  [UNIT_IDS.QUADRATIC]: {
    displayName: "2次方程式",
    baseTimeSeconds: 16,
    inputMode: INPUT_MODES.SINGLE
  }
};

// 今回選択可能な単元
export const SELECTABLE_UNIT_IDS = [UNIT_IDS.LINEAR, UNIT_IDS.SIMULTANEOUS, UNIT_IDS.QUADRATIC];

// タイトル画面で選べるモードの内部識別子
export const MODE_IDS = {
  TRAINING: "training",
  QUEST: "quest",
  RANK: "rank"
};

export const SELECTABLE_MODE_IDS = [MODE_IDS.TRAINING, MODE_IDS.QUEST, MODE_IDS.RANK];

// トレーニングモードの出題形式の内部識別子（段位認定・クエストには存在しない）
// - easy：おてがる（4つの方程式から正しい式を選ぶ4択）
// - standard：スタンダード（数字や記号を使って自分で式を作る、従来の形式）
export const TRAINING_ANSWER_FORMAT = {
  EASY: "easy",
  STANDARD: "standard"
};

// 出題形式の表示名（内部値とは分離して管理する）
export const TRAINING_ANSWER_FORMAT_NAMES = {
  [TRAINING_ANSWER_FORMAT.EASY]: "おてがる",
  [TRAINING_ANSWER_FORMAT.STANDARD]: "スタンダード"
};

// 既存ユーザーへの影響を避けるため、初期値は従来どおりの「スタンダード」
export const DEFAULT_TRAINING_ANSWER_FORMAT = TRAINING_ANSWER_FORMAT.STANDARD;

export const SELECTABLE_TRAINING_ANSWER_FORMATS = [
  TRAINING_ANSWER_FORMAT.EASY,
  TRAINING_ANSWER_FORMAT.STANDARD
];
