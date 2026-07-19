// ゲーム状態の一元管理

import { APP_CONFIG } from "./config.js";

export const gameState = {
  screen: "title",

  mode: "training",
  unit: "linear",

  selectedCategories: [],
  totalQuestions: APP_CONFIG.defaultQuestions,

  currentQuestionIndex: 0,
  currentQuestion: null,

  correctCount: 0,
  incorrectCount: 0,
  passCount: 0,

  currentInputTokens: [],
  cursorPosition: 0,

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

  history: []
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

  resetQuestionState();
}

export function resetQuestionState() {
  gameState.currentInputTokens = [];
  gameState.cursorPosition = 0;

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

export function deleteCharacterBeforeCursor() {
  if (gameState.cursorPosition > 0) {
    gameState.currentInputTokens.splice(gameState.cursorPosition - 1, 1);
    gameState.cursorPosition -= 1;
  }
}

export function clearInput() {
  gameState.currentInputTokens = [];
  gameState.cursorPosition = 0;
}

export function getCurrentInputString() {
  return gameState.currentInputTokens.join("");
}
