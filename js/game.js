// ゲーム進行を管理するモジュール
// 数式解析の詳細はequation/、問題生成の詳細はquestions/、
// DOM操作の詳細はui.jsへ任せる。

import { APP_CONFIG } from "./config.js";
import {
  gameState,
  resetGameState,
  resetQuestionState,
  insertCharacterAtCursor,
  moveCursorLeft,
  moveCursorRight,
  deleteCharacterBeforeCursor,
  clearInput,
  getCurrentInputString
} from "./state.js";
import * as ui from "./ui.js";
import * as timer from "./timer.js";
import * as audio from "./audio.js";
import * as storage from "./storage.js";
import {
  buildQuestionQueue,
  validateSelectedCategories
} from "./questions/question-manager.js";
import { LINEAR_CATEGORIES } from "./questions/linear/categories.js";
import { validateEquation } from "./equation/equation-validator.js";
import { tokenize, TokenType } from "./equation/tokenizer.js";

let questionQueue = [];

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

// ============================================================
// 入力の構造チェック（解答ボタンの有効条件）
// ============================================================

function isParensBalanced(tokens) {
  let depth = 0;
  for (const token of tokens) {
    if (token.type === TokenType.LPAREN) {
      depth += 1;
    } else if (token.type === TokenType.RPAREN) {
      depth -= 1;
      if (depth < 0) {
        return false;
      }
    }
  }
  return depth === 0;
}

function isInputStructurallyValid(inputString) {
  if (!inputString || inputString.trim() === "") {
    return false;
  }

  let tokens;
  try {
    tokens = tokenize(inputString);
  } catch (error) {
    return false;
  }

  if (tokens.length === 0) {
    return false;
  }

  const hasVariable = tokens.some((token) => token.type === TokenType.VARIABLE);
  if (!hasVariable) {
    return false;
  }

  const equalsIndexes = [];
  tokens.forEach((token, index) => {
    if (token.type === TokenType.EQUALS) {
      equalsIndexes.push(index);
    }
  });

  if (equalsIndexes.length !== 1) {
    return false;
  }

  const equalsIndex = equalsIndexes[0];
  if (equalsIndex === 0 || equalsIndex === tokens.length - 1) {
    return false;
  }

  if (!isParensBalanced(tokens)) {
    return false;
  }

  return true;
}

// ============================================================
// 初期化
// ============================================================

export function initGame() {
  const savedSoundEnabled = storage.loadSoundEnabled(true);
  const savedTotalQuestions = storage.loadTotalQuestions(
    APP_CONFIG.defaultQuestions
  );
  const validCategoryIds = LINEAR_CATEGORIES.map((category) => category.id);
  const savedCategories = storage
    .loadSelectedCategories(validCategoryIds)
    .filter((id) => validCategoryIds.includes(id));

  gameState.soundEnabled = savedSoundEnabled;
  gameState.totalQuestions = savedTotalQuestions;
  gameState.selectedCategories =
    savedCategories.length > 0 ? savedCategories : validCategoryIds;

  audio.setSoundEnabled(gameState.soundEnabled);

  ui.initUI({
    onQuestionCountChange: handleQuestionCountChange,
    onCategoryToggle: handleCategoryToggle,
    onSelectAllCategories: handleSelectAllCategories,
    onDeselectAllCategories: handleDeselectAllCategories,
    onSoundToggle: handleSoundToggle,
    onStart: handleStart,
    onKeyPress: handleKeyPress,
    onCursorLeft: handleCursorLeft,
    onCursorRight: handleCursorRight,
    onBackspace: handleBackspace,
    onClear: handleClear,
    onSubmit: handleSubmit,
    onHintRequest: handleHintRequest,
    onPass: handlePass,
    onRetry: handleRetry,
    onBackToTitle: handleBackToTitle,
    onReplay: handleReplay,
    onResultToTitle: handleBackToTitle,
    onPhysicalKeyDown: handlePhysicalKeyDown
  });

  ui.renderQuestionCountLabel(gameState.totalQuestions);
  ui.renderCategoryCheckboxes(gameState.selectedCategories, handleCategoryToggle);
  ui.setSoundToggleState(gameState.soundEnabled);
  updateStartButtonAvailability();
  ui.showScreen("title");
}

// ============================================================
// タイトル・設定画面の操作
// ============================================================

function updateStartButtonAvailability() {
  const result = validateSelectedCategories(gameState.selectedCategories);
  ui.setStartButtonEnabled(result.valid);
  ui.showCategoryWarning(!result.valid);
}

function handleQuestionCountChange(value) {
  gameState.totalQuestions = value;
  ui.renderQuestionCountLabel(value);
  storage.saveTotalQuestions(value);
}

function handleCategoryToggle(categoryId, checked) {
  if (checked) {
    if (!gameState.selectedCategories.includes(categoryId)) {
      gameState.selectedCategories.push(categoryId);
    }
  } else {
    gameState.selectedCategories = gameState.selectedCategories.filter(
      (id) => id !== categoryId
    );
  }
  storage.saveSelectedCategories(gameState.selectedCategories);
  updateStartButtonAvailability();
}

function handleSelectAllCategories() {
  gameState.selectedCategories = LINEAR_CATEGORIES.map(
    (category) => category.id
  );
  ui.setAllCategoryCheckboxes(true);
  storage.saveSelectedCategories(gameState.selectedCategories);
  updateStartButtonAvailability();
}

function handleDeselectAllCategories() {
  gameState.selectedCategories = [];
  ui.setAllCategoryCheckboxes(false);
  storage.saveSelectedCategories(gameState.selectedCategories);
  updateStartButtonAvailability();
}

function handleSoundToggle(enabled) {
  gameState.soundEnabled = enabled;
  audio.setSoundEnabled(enabled);
  storage.saveSoundEnabled(enabled);
}

// ============================================================
// ゲーム開始・カウントダウン
// ============================================================

async function handleStart() {
  await startNewGame();
}

async function startNewGame() {
  resetGameState();
  questionQueue = buildQuestionQueue(
    gameState.selectedCategories,
    gameState.totalQuestions
  );
  await runCountdown();
  beginQuestion(0);
}

async function runCountdown() {
  ui.showScreen("countdown");
  const steps = ["3", "2", "1", "START!"];

  for (const step of steps) {
    ui.renderCountdownValue(step);
    if (step === "START!") {
      audio.playStartSound();
    } else {
      audio.playCountdownSound();
    }
    await sleep(APP_CONFIG.countdownMilliseconds);
  }
}

// ============================================================
// 問題の開始
// ============================================================

function beginQuestion(index) {
  resetQuestionState();

  gameState.currentQuestionIndex = index;
  gameState.currentQuestion = questionQueue[index];

  ui.showScreen("game");
  ui.resetGameScreenPanels();
  ui.renderQuestionProgress(index + 1, gameState.totalQuestions);
  ui.renderQuestionPrompt(gameState.currentQuestion.prompt);
  ui.renderEquationInput(gameState.currentInputTokens, gameState.cursorPosition);
  ui.renderEquationKeypad(gameState.currentQuestion);
  ui.setSubmitButtonEnabled(false);

  timer.startQuestionTimer({
    onHintAvailable: handleHintAvailable,
    onPassAvailable: handlePassAvailable
  });
}

function handleHintAvailable() {
  gameState.hintAvailable = true;
  ui.showHintButton(true);
}

function handlePassAvailable() {
  gameState.passAvailable = true;
  ui.showPassButton(true);
}

// ============================================================
// 数式入力
// ============================================================

function refreshEquationDisplay() {
  ui.renderEquationInput(gameState.currentInputTokens, gameState.cursorPosition);
}

function updateSubmitButtonState() {
  const valid =
    !gameState.inputLocked && isInputStructurallyValid(getCurrentInputString());
  ui.setSubmitButtonEnabled(valid);
}

function handleKeyPress(char) {
  if (gameState.inputLocked) return;
  insertCharacterAtCursor(char);
  audio.playKeySound();
  refreshEquationDisplay();
  updateSubmitButtonState();
}

function handleCursorLeft() {
  if (gameState.inputLocked) return;
  moveCursorLeft();
  refreshEquationDisplay();
}

function handleCursorRight() {
  if (gameState.inputLocked) return;
  moveCursorRight();
  refreshEquationDisplay();
}

function handleBackspace() {
  if (gameState.inputLocked) return;
  deleteCharacterBeforeCursor();
  refreshEquationDisplay();
  updateSubmitButtonState();
}

function handleClear() {
  if (gameState.inputLocked) return;
  clearInput();
  refreshEquationDisplay();
  updateSubmitButtonState();
}

const PHYSICAL_KEY_MAP = {
  "-": "−",
  "*": "×",
  "/": "÷"
};

function handlePhysicalKeyDown(event) {
  if (gameState.inputLocked) return;

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    handleCursorLeft();
    return;
  }
  if (event.key === "ArrowRight") {
    event.preventDefault();
    handleCursorRight();
    return;
  }
  if (event.key === "Backspace") {
    event.preventDefault();
    handleBackspace();
    return;
  }
  if (event.key === "Enter") {
    if (isInputStructurallyValid(getCurrentInputString())) {
      event.preventDefault();
      handleSubmit();
    }
    return;
  }

  const key = event.key;
  if (/^[0-9.()=+xX]$/.test(key)) {
    event.preventDefault();
    handleKeyPress(key === "X" ? "x" : key);
    return;
  }
  if (PHYSICAL_KEY_MAP[key]) {
    event.preventDefault();
    handleKeyPress(PHYSICAL_KEY_MAP[key]);
  }
}

// ============================================================
// 解答処理
// ============================================================

function handleSubmit() {
  if (gameState.inputLocked) return;

  const inputString = getCurrentInputString();
  const result = validateEquation(inputString, gameState.currentQuestion.expectedX);

  if (result.status === "correct") {
    handleCorrectAnswer();
  } else if (result.status === "incorrect") {
    handleIncorrectAnswer();
  } else {
    handleInputError(result);
  }
}

function handleInputError(result) {
  ui.showJudgeMessage("input-error", result.message);
}

function handleIncorrectAnswer() {
  gameState.currentQuestionIncorrectCount += 1;
  gameState.incorrectCount += 1;
  audio.playIncorrectSound();
  ui.showJudgeMessage("incorrect", "もう一度考えよう");
}

async function handleCorrectAnswer() {
  const elapsedSeconds = timer.stopQuestionTimer();
  lockQuestionInput();

  audio.playCorrectSound();
  ui.showAnswerReveal(
    "correct",
    "正解です！",
    gameState.currentQuestion.displayEquation,
    gameState.currentQuestion.solutionDisplay
  );

  gameState.correctCount += 1;
  recordHistory("correct", elapsedSeconds);

  await sleep(APP_CONFIG.correctDisplayMilliseconds);
  advanceToNextQuestionOrResult();
}

async function handlePass() {
  if (!gameState.passAvailable || gameState.inputLocked) return;

  const elapsedSeconds = timer.stopQuestionTimer();
  lockQuestionInput();

  audio.playPassSound();
  ui.showAnswerReveal(
    "pass",
    "パスしました",
    gameState.currentQuestion.displayEquation,
    gameState.currentQuestion.solutionDisplay
  );

  gameState.passCount += 1;
  recordHistory("pass", elapsedSeconds);

  await sleep(APP_CONFIG.passDisplayMilliseconds);
  advanceToNextQuestionOrResult();
}

function lockQuestionInput() {
  gameState.inputLocked = true;
  ui.setKeyboardEnabled(false);
  ui.setSubmitButtonEnabled(false);
  ui.showHintButton(false);
  ui.showPassButton(false);
  ui.clearJudgeMessage();
}

function recordHistory(result, elapsedSeconds) {
  gameState.history.push({
    questionNumber: gameState.currentQuestionIndex + 1,
    categoryName: gameState.currentQuestion.categoryName,
    prompt: gameState.currentQuestion.prompt,
    variableDefinition: gameState.currentQuestion.variableDefinition,
    lastInput: getCurrentInputString(),
    modelEquation: gameState.currentQuestion.displayEquation,
    solutionDisplay: gameState.currentQuestion.solutionDisplay,
    result,
    elapsedSeconds,
    elapsedTimeText: elapsedSeconds.toFixed(2),
    incorrectCount: gameState.currentQuestionIncorrectCount,
    hintUsed: gameState.currentQuestionHintUsed
  });
}

function advanceToNextQuestionOrResult() {
  const nextIndex = gameState.currentQuestionIndex + 1;
  if (nextIndex < gameState.totalQuestions) {
    beginQuestion(nextIndex);
  } else {
    endGame();
  }
}

// ============================================================
// ヒント
// ============================================================

function handleHintRequest() {
  if (!gameState.hintAvailable || gameState.inputLocked) return;
  gameState.hintVisible = true;
  gameState.currentQuestionHintUsed = true;
  ui.showHintPanel(gameState.currentQuestion.hint);
}

// ============================================================
// 結果画面
// ============================================================

function computeResultSummary() {
  const totalQuestions = gameState.totalQuestions;
  const correctCount = gameState.correctCount;
  const incorrectCount = gameState.incorrectCount;
  const passCount = gameState.passCount;

  const accuracyText =
    totalQuestions > 0
      ? ((correctCount / totalQuestions) * 100).toFixed(1)
      : "0.0";

  const correctElapsedSeconds = gameState.history
    .filter((entry) => entry.result === "correct")
    .map((entry) => entry.elapsedSeconds);

  const averageTimeText =
    correctElapsedSeconds.length === 0
      ? "―"
      : `${(
          correctElapsedSeconds.reduce((sum, value) => sum + value, 0) /
          correctElapsedSeconds.length
        ).toFixed(2)}秒`;

  return {
    totalQuestions,
    correctCount,
    incorrectCount,
    passCount,
    accuracyText,
    averageTimeText
  };
}

function endGame() {
  timer.stopQuestionTimer();
  audio.playResultSound();
  ui.renderResultSummary(computeResultSummary());
  ui.renderHistory(gameState.history);
  ui.showScreen("result");
}

// ============================================================
// リトライ・戻る・もう一度
// ============================================================

function handleRetry() {
  timer.stopQuestionTimer();
  startNewGame();
}

function handleReplay() {
  timer.stopQuestionTimer();
  startNewGame();
}

function handleBackToTitle() {
  timer.stopQuestionTimer();
  resetGameState();
  ui.showScreen("title");
}
