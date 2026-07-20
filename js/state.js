// ゲーム状態の一元管理

import { APP_CONFIG } from "./config.js";

export const gameState = {
  screen: "title",

  mode: "training", // "training" | "rank"
  unit: "linear",
  rankDifficulty: "NORMAL", // "NORMAL" | "HARD"（段位認定モードでのみ使用）

  selectedCategories: [],
  totalQuestions: APP_CONFIG.defaultQuestions,

  currentQuestionIndex: 0,
  currentQuestion: null,

  correctCount: 0,
  incorrectCount: 0,
  passCount: 0,

  currentInputTokens: [],
  cursorPosition: 0,

  // ============================================================
  // 連立方程式（中2）専用：式①・式②の2入力欄
  // ============================================================
  currentSystemInputTokens: [[], []],
  activeSystemEquationIndex: 0,
  systemCursorPositions: [0, 0],

  // ============================================================
  // 分数入力（上下型分数）：分母入力待ち状態
  // equationIndexは、1次方程式では常に0として扱う。
  // ============================================================
  fractionInputState: {
    isWaitingForDenominator: false,
    equationIndex: 0,
    fractionTokenIndex: -1
  },

  questionStartTime: 0,
  questionElapsedTime: 0,

  currentQuestionIncorrectCount: 0,
  currentQuestionHintUsed: false,
  currentQuestionHintPartsRevealed: false,
  currentQuestionHintPartUsed: false,
  usedHintPartValues: [],

  hintAvailable: false,
  hintVisible: false,
  passAvailable: false,

  inputLocked: false,

  soundEnabled: true,

  recentTemplateIds: [],
  recentCategoryIds: [],

  history: [],

  // ============================================================
  // 段位認定モード専用の状態（トレーニングモードでは使用しない）
  // ============================================================

  remainingTimeMs: APP_CONFIG.rankDurationMs,
  globalTimerRunning: false,
  globalTimeExpired: false,
  finalGracePeriodRunning: false,
  finalTimedOut: false,

  score: 0,
  displayedScore: 0,
  lastScoreChange: 0,

  combo: 0,
  maxCombo: 0,
  comboGaugeRatio: 1,
  comboGaugeRunning: false,
  comboGaugeStartTime: 0,
  comboGaugeDurationMs: 0,
  comboBuildPending: true,

  rankResult: null
};

export function resetGameState() {
  gameState.currentQuestionIndex = 0;
  gameState.currentQuestion = null;

  gameState.correctCount = 0;
  gameState.incorrectCount = 0;
  gameState.passCount = 0;

  gameState.recentTemplateIds = [];
  gameState.recentCategoryIds = [];

  gameState.history = [];

  gameState.remainingTimeMs = APP_CONFIG.rankDurationMs;
  gameState.globalTimerRunning = false;
  gameState.globalTimeExpired = false;
  gameState.finalGracePeriodRunning = false;
  gameState.finalTimedOut = false;

  gameState.score = 0;
  gameState.displayedScore = 0;
  gameState.lastScoreChange = 0;

  gameState.combo = 0;
  gameState.maxCombo = 0;
  gameState.comboGaugeRatio = 1;
  gameState.comboGaugeRunning = false;
  gameState.comboGaugeStartTime = 0;
  gameState.comboGaugeDurationMs = 0;
  gameState.comboBuildPending = true;

  gameState.rankResult = null;

  resetQuestionState();
}

export function resetQuestionState() {
  gameState.currentInputTokens = [];
  gameState.cursorPosition = 0;

  gameState.currentSystemInputTokens = [[], []];
  gameState.activeSystemEquationIndex = 0;
  gameState.systemCursorPositions = [0, 0];

  gameState.fractionInputState = {
    isWaitingForDenominator: false,
    equationIndex: 0,
    fractionTokenIndex: -1
  };

  gameState.questionStartTime = 0;
  gameState.questionElapsedTime = 0;

  gameState.currentQuestionIncorrectCount = 0;
  gameState.currentQuestionHintUsed = false;
  gameState.currentQuestionHintPartsRevealed = false;
  gameState.currentQuestionHintPartUsed = false;
  gameState.usedHintPartValues = [];

  gameState.hintAvailable = false;
  gameState.hintVisible = false;
  gameState.passAvailable = false;

  gameState.inputLocked = false;
}

export function setScreen(screenName) {
  gameState.screen = screenName;
}

export function getGameState() {
  return gameState;
}

// ============================================================
// 数式入力欄の状態を操作する専用関数
// ============================================================

export function insertCharacterAtCursor(char) {
  gameState.currentInputTokens.splice(gameState.cursorPosition, 0, char);
  gameState.cursorPosition += 1;
}

export function moveCursorLeft() {
  if (gameState.cursorPosition > 0) {
    gameState.cursorPosition -= 1;
  }
}

export function moveCursorRight() {
  if (gameState.cursorPosition < gameState.currentInputTokens.length) {
    gameState.cursorPosition += 1;
  }
}

/**
 * 入力欄をタップした位置へ、カーソルを直接移動する（範囲外は端へ丸める）。
 */
export function setCursorPosition(position) {
  const max = gameState.currentInputTokens.length;
  gameState.cursorPosition = Math.max(0, Math.min(position, max));
}

export function deleteCharacterBeforeCursor() {
  if (gameState.cursorPosition > 0) {
    gameState.currentInputTokens.splice(gameState.cursorPosition - 1, 1);
    gameState.cursorPosition -= 1;
  }
}

/**
 * カーソル直前のトークンを取り除いて返す（分数作成時に分子として使う）。
 * カーソルが先頭にある場合はnullを返す。
 */
export function popTokenBeforeCursor() {
  if (gameState.cursorPosition === 0) return null;
  const [removed] = gameState.currentInputTokens.splice(gameState.cursorPosition - 1, 1);
  gameState.cursorPosition -= 1;
  return removed;
}

/**
 * 指定位置のトークンを、別のトークンで置き換える（分数入力の取り消しに使う）。
 */
export function replaceTokenAt(index, token) {
  gameState.currentInputTokens[index] = token;
}

/**
 * 指定位置にある分数トークン（分母入力待ち）の分母を確定させ、
 * カーソルをその直後へ移動する。
 */
export function completeFractionAt(index, denominatorToken) {
  const token = gameState.currentInputTokens[index];
  token.denominatorTokens = [denominatorToken];
  token.isComplete = true;
  gameState.cursorPosition = index + 1;
}

export function clearInput() {
  gameState.currentInputTokens = [];
  gameState.cursorPosition = 0;
}

/**
 * 分数トークンを "((分子)/(分母))" へ変換する。
 * 正誤判定用の数式パーサーには、この結果をそのまま渡す。
 */
export function serializeFractionToken(token) {
  const numerator = serializeInputTokens(token.numeratorTokens);
  const denominator = serializeInputTokens(token.denominatorTokens);
  return `((${numerator})/(${denominator}))`;
}

/**
 * x²（2次方程式専用）トークンを "x^2" へ変換する。
 * 正誤判定用の数式パーサーには、この結果をそのまま渡す。
 */
export function serializePowerToken(token) {
  return `${token.base}^${token.exponent}`;
}

/**
 * 「かっこの中身を2乗する」トークン（"square"、2次方程式専用）を "^2" へ変換する。
 * 直前に入力された "(...)" の直後に置かれることを前提とした後置演算子で、
 * 正誤判定用の数式パーサー（tokenizer.jsのSQUAREトークン）がこれをそのまま解析する。
 */
export function serializeSquareToken() {
  return "^2";
}

/**
 * 入力トークン列（文字列トークン、分数トークン、x²トークン、
 * かっこを2乗するsquareトークンが混在する配列）を、正誤判定用の1つの文字列へ変換する。
 */
export function serializeInputTokens(tokens) {
  return tokens
    .map((token) => {
      if (typeof token === "object" && token !== null) {
        if (token.type === "fraction") return serializeFractionToken(token);
        if (token.type === "power") return serializePowerToken(token);
        if (token.type === "square") return serializeSquareToken();
      }
      return token;
    })
    .join("");
}

export function getCurrentInputString() {
  return serializeInputTokens(gameState.currentInputTokens);
}

// ============================================================
// 連立方程式（中2）専用：式①・式②の入力欄を操作する専用関数
// 常に「現在アクティブな式（activeSystemEquationIndex）」へ適用する。
// ============================================================

export function setActiveSystemEquationIndex(index) {
  gameState.activeSystemEquationIndex = index;
}

export function insertCharacterAtSystemCursor(char) {
  const index = gameState.activeSystemEquationIndex;
  gameState.currentSystemInputTokens[index].splice(
    gameState.systemCursorPositions[index],
    0,
    char
  );
  gameState.systemCursorPositions[index] += 1;
}

export function moveSystemCursorLeft() {
  const index = gameState.activeSystemEquationIndex;
  if (gameState.systemCursorPositions[index] > 0) {
    gameState.systemCursorPositions[index] -= 1;
  }
}

export function moveSystemCursorRight() {
  const index = gameState.activeSystemEquationIndex;
  if (
    gameState.systemCursorPositions[index] <
    gameState.currentSystemInputTokens[index].length
  ) {
    gameState.systemCursorPositions[index] += 1;
  }
}

/**
 * 式①・式②いずれかの入力欄をタップした位置へ、カーソルを直接移動する
 * （どちらの式をタップしたかに関わらず、対象の式番号を明示的に指定する）。
 */
export function setSystemCursorPosition(equationIndex, position) {
  const max = gameState.currentSystemInputTokens[equationIndex].length;
  gameState.systemCursorPositions[equationIndex] = Math.max(0, Math.min(position, max));
}

export function deleteSystemCharacterBeforeCursor() {
  const index = gameState.activeSystemEquationIndex;
  if (gameState.systemCursorPositions[index] > 0) {
    gameState.currentSystemInputTokens[index].splice(
      gameState.systemCursorPositions[index] - 1,
      1
    );
    gameState.systemCursorPositions[index] -= 1;
  }
}

/**
 * アクティブな式で、カーソル直前のトークンを取り除いて返す
 * （分数作成時に分子として使う）。カーソルが先頭にある場合はnullを返す。
 */
export function popSystemTokenBeforeCursor() {
  const index = gameState.activeSystemEquationIndex;
  if (gameState.systemCursorPositions[index] === 0) return null;
  const [removed] = gameState.currentSystemInputTokens[index].splice(
    gameState.systemCursorPositions[index] - 1,
    1
  );
  gameState.systemCursorPositions[index] -= 1;
  return removed;
}

/**
 * 指定した式の指定位置のトークンを、別のトークンで置き換える
 * （分数入力の取り消しに使う）。
 */
export function replaceSystemTokenAt(equationIndex, index, token) {
  gameState.currentSystemInputTokens[equationIndex][index] = token;
}

/**
 * 指定した式・位置にある分数トークン（分母入力待ち）の分母を確定させ、
 * その式のカーソルを直後へ移動する。
 */
export function completeSystemFractionAt(equationIndex, index, denominatorToken) {
  const token = gameState.currentSystemInputTokens[equationIndex][index];
  token.denominatorTokens = [denominatorToken];
  token.isComplete = true;
  gameState.systemCursorPositions[equationIndex] = index + 1;
}

/**
 * アクティブな式だけを消去する（もう一方の式は残す）。
 */
export function clearActiveSystemInput() {
  const index = gameState.activeSystemEquationIndex;
  gameState.currentSystemInputTokens[index] = [];
  gameState.systemCursorPositions[index] = 0;
}

export function getCurrentSystemInputStrings() {
  return gameState.currentSystemInputTokens.map((tokens) => serializeInputTokens(tokens));
}
