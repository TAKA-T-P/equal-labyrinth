// ゲーム進行を管理するモジュール
// 数式解析の詳細はequation/、問題生成の詳細はquestions/、
// DOM操作の詳細はui.jsへ任せる。

import { APP_CONFIG, UNIT_IDS } from "./config.js";
import {
  gameState,
  resetGameState,
  resetQuestionState,
  insertCharacterAtCursor,
  moveCursorLeft,
  moveCursorRight,
  setCursorPosition,
  deleteCharacterBeforeCursor,
  clearInput,
  getCurrentInputString,
  insertCharacterAtSystemCursor,
  moveSystemCursorLeft,
  moveSystemCursorRight,
  setSystemCursorPosition,
  deleteSystemCharacterBeforeCursor,
  clearActiveSystemInput,
  setActiveSystemEquationIndex,
  getCurrentSystemInputStrings
} from "./state.js";
import * as ui from "./ui.js";
import * as timer from "./timer.js";
import * as audio from "./audio.js";
import * as storage from "./storage.js";
import {
  buildTrainingQuestionQueue,
  validateSelectedCategories,
  getCategoriesForUnit
} from "./questions/question-manager.js";
import { validateEquation } from "./equation/equation-validator.js";
import { validateSystemEquations } from "./equation/system-equation-validator.js";
import { tokenize, TokenType } from "./equation/tokenizer.js";
import * as rankMode from "./modes/rank-mode.js";

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

/**
 * @param {string} inputString
 * @param {string[]} requiredVariableNames 1次方程式では["x"]、連立方程式では["x","y"]
 */
function isInputStructurallyValid(inputString, requiredVariableNames = ["x"]) {
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

  const hasAllRequiredVariables = requiredVariableNames.every((variableName) =>
    tokens.some(
      (token) => token.type === TokenType.VARIABLE && token.name === variableName
    )
  );
  if (!hasAllRequiredVariables) {
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

function getRequiredVariableNamesForUnit() {
  return gameState.unit === UNIT_IDS.SIMULTANEOUS ? ["x", "y"] : ["x"];
}

/**
 * 現在の単元・入力状態から、解答ボタンを有効にしてよいか（Enterで解答してよいか）を判定する。
 * 連立方程式では、式①・式②の両方が構造的に妥当な場合のみtrueになる。
 */
function isCurrentInputSubmittable() {
  const requiredVariableNames = getRequiredVariableNamesForUnit();

  if (gameState.unit === UNIT_IDS.SIMULTANEOUS) {
    const [input1, input2] = getCurrentSystemInputStrings();
    return (
      isInputStructurallyValid(input1, requiredVariableNames) &&
      isInputStructurallyValid(input2, requiredVariableNames)
    );
  }

  return isInputStructurallyValid(getCurrentInputString(), requiredVariableNames);
}

// ============================================================
// 初期化
// ============================================================

export function initGame() {
  const savedSoundEnabled = storage.loadSoundEnabled(true);
  const savedTotalQuestions = storage.loadTotalQuestions(
    APP_CONFIG.defaultQuestions
  );
  const validCategoryIds = getCategoriesForUnit(gameState.unit).map(
    (category) => category.id
  );
  const savedCategories = storage
    .loadSelectedCategories(gameState.unit, validCategoryIds)
    .filter((id) => validCategoryIds.includes(id));

  gameState.soundEnabled = savedSoundEnabled;
  gameState.totalQuestions = savedTotalQuestions;
  gameState.selectedCategories =
    savedCategories.length > 0 ? savedCategories : validCategoryIds;

  audio.setSoundEnabled(gameState.soundEnabled);

  ui.initUI({
    onQuestionCountChange: handleQuestionCountChange,
    onCategoryToggle: handleCategoryToggle,
    onCategorySelectToggle: handleCategorySelectToggle,
    onSoundToggle: handleSoundToggle,
    onModeSelect: handleModeSelect,
    onUnitSelect: handleUnitSelect,
    onDifficultySelect: handleDifficultySelect,
    onStart: handleStart,
    onKeyPress: handleKeyPress,
    onHintPartPress: handleHintPartPress,
    onCursorLeft: handleCursorLeft,
    onCursorRight: handleCursorRight,
    onBackspace: handleBackspace,
    onClear: handleClear,
    onEquationSwitch: handleEquationSwitch,
    onEquationSlotSelect: handleEquationSlotSelect,
    onEquationInputTap: handleEquationInputTap,
    onSubmit: handleSubmit,
    onNextQuestion: handleNextQuestion,
    onHintRequest: handleHintRequest,
    onPass: handlePass,
    onRetry: handleRetry,
    onGiveUp: handleGiveUp,
    onBackToTitle: handleBackToTitle,
    onReplay: handleReplay,
    onResultToTitle: handleBackToTitle,
    onRankReplay: handleReplay,
    onRankResultToTitle: handleBackToTitle,
    onPhysicalKeyDown: handlePhysicalKeyDown
  });

  ui.renderQuestionCountLabel(gameState.totalQuestions);
  ui.renderCategoryCheckboxes(
    getCategoriesForUnit(gameState.unit),
    gameState.selectedCategories,
    handleCategoryToggle
  );
  ui.setSoundToggleState(gameState.soundEnabled);
  ui.renderModeSelection(gameState.mode);
  ui.renderUnitSelection(gameState.unit);
  ui.renderDifficultySelection(gameState.rankDifficulty);
  updateStartButtonAvailability();
  ui.showScreen("title");
}

// ============================================================
// タイトル・設定画面の操作
// ============================================================

function updateStartButtonAvailability() {
  ui.renderCategorySelectToggle(
    gameState.selectedCategories.length === getCategoriesForUnit(gameState.unit).length
  );

  if (gameState.mode === "rank") {
    // 段位認定モードは、難易度に既定値があるため常に開始できる
    ui.setStartButtonEnabled(true);
    ui.showCategoryWarning(false);
    return;
  }

  const result = validateSelectedCategories(gameState.selectedCategories, gameState.unit);
  ui.setStartButtonEnabled(result.valid);
  ui.showCategoryWarning(!result.valid);
}

function handleModeSelect(mode) {
  gameState.mode = mode;
  ui.renderModeSelection(mode);
  updateStartButtonAvailability();
}

/**
 * 単元（1次方程式／連立方程式）を切り替える。
 * 中1で選択していたカテゴリを、中2のカテゴリ選択へ誤って引き継がないよう、
 * 単元ごとに保存されたカテゴリ選択を読み直す。
 */
function handleUnitSelect(unit) {
  gameState.unit = unit;
  ui.renderUnitSelection(unit);

  const validCategoryIds = getCategoriesForUnit(unit).map((category) => category.id);
  const savedCategories = storage
    .loadSelectedCategories(unit, validCategoryIds)
    .filter((id) => validCategoryIds.includes(id));
  gameState.selectedCategories =
    savedCategories.length > 0 ? savedCategories : validCategoryIds;

  ui.renderCategoryCheckboxes(
    getCategoriesForUnit(unit),
    gameState.selectedCategories,
    handleCategoryToggle
  );
  updateStartButtonAvailability();
}

function handleDifficultySelect(difficulty) {
  gameState.rankDifficulty = difficulty;
  ui.renderDifficultySelection(difficulty);
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
  storage.saveSelectedCategories(gameState.unit, gameState.selectedCategories);
  updateStartButtonAvailability();
}

function handleSelectAllCategories() {
  gameState.selectedCategories = getCategoriesForUnit(gameState.unit).map(
    (category) => category.id
  );
  ui.setAllCategoryCheckboxes(getCategoriesForUnit(gameState.unit), true);
  storage.saveSelectedCategories(gameState.unit, gameState.selectedCategories);
  updateStartButtonAvailability();
}

function handleDeselectAllCategories() {
  gameState.selectedCategories = [];
  ui.setAllCategoryCheckboxes(getCategoriesForUnit(gameState.unit), false);
  storage.saveSelectedCategories(gameState.unit, gameState.selectedCategories);
  updateStartButtonAvailability();
}

function handleCategorySelectToggle() {
  const allSelected =
    gameState.selectedCategories.length === getCategoriesForUnit(gameState.unit).length;
  if (allSelected) {
    handleDeselectAllCategories();
  } else {
    handleSelectAllCategories();
  }
}

function handleSoundToggle(enabled) {
  gameState.soundEnabled = enabled;
  audio.setSoundEnabled(enabled);
  storage.saveSoundEnabled(enabled);
  ui.setSoundToggleState(enabled);
}

// ============================================================
// ゲーム開始・カウントダウン
// ============================================================

async function handleStart() {
  await startNewGame();
}

async function startNewGame() {
  resetGameState();

  if (gameState.mode === "training") {
    questionQueue = buildTrainingQuestionQueue(
      gameState.unit,
      gameState.selectedCategories,
      gameState.totalQuestions
    );
  }

  await runCountdown();

  if (gameState.mode === "rank") {
    rankMode.startRankGame(gameState.unit, gameState.rankDifficulty);
  } else {
    beginQuestion(0);
  }
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
  ui.showRankHud(false);
  ui.showRetireButton(true);
  ui.renderUnitLabel(gameState.unit);
  ui.showEquationInputMode(gameState.unit);
  ui.renderQuestionProgress(index + 1, gameState.totalQuestions);
  ui.renderQuestionPrompt(gameState.currentQuestion.prompt);
  refreshEquationDisplay();
  ui.renderEquationKeypad(gameState.currentQuestion);
  ui.setSubmitButtonEnabled(false);

  timer.startQuestionTimer({
    onHintAvailable: handleHintAvailable,
    onPassAvailable: handlePassAvailable
  });
}

function handleHintAvailable() {
  gameState.hintAvailable = true;
  ui.setHintButtonEnabled(true);
}

function handlePassAvailable() {
  gameState.passAvailable = true;
  ui.setPassButtonEnabled(true);
}

// ============================================================
// 数式入力
// ============================================================

function refreshEquationDisplay() {
  if (gameState.unit === UNIT_IDS.SIMULTANEOUS) {
    ui.renderSystemEquationInput(
      gameState.currentSystemInputTokens,
      gameState.systemCursorPositions,
      gameState.activeSystemEquationIndex
    );
  } else {
    ui.renderEquationInput(gameState.currentInputTokens, gameState.cursorPosition);
  }
}

function updateSubmitButtonState() {
  const valid = !gameState.inputLocked && isCurrentInputSubmittable();
  ui.setSubmitButtonEnabled(valid);
}

function insertValueAtCursor(value) {
  if (gameState.inputLocked) return false;
  if (gameState.unit === UNIT_IDS.SIMULTANEOUS) {
    insertCharacterAtSystemCursor(value);
  } else {
    insertCharacterAtCursor(value);
  }
  audio.playKeySound();
  refreshEquationDisplay();
  updateSubmitButtonState();
  return true;
}

function handleKeyPress(char) {
  insertValueAtCursor(char);
}

/**
 * ヒントで公開された式パーツ（(15-x)など）を、1つの塊として現在アクティブな
 * 入力欄のカーソル位置へ挿入する（連立方程式でも、式①・式②を自動判断しない）。
 */
function handleHintPartPress(value) {
  const inserted = insertValueAtCursor(value);
  if (!inserted) return;

  gameState.currentQuestionHintPartUsed = true;
  if (!gameState.usedHintPartValues.includes(value)) {
    gameState.usedHintPartValues.push(value);
  }
}

function handleCursorLeft() {
  if (gameState.inputLocked) return;
  if (gameState.unit === UNIT_IDS.SIMULTANEOUS) {
    moveSystemCursorLeft();
  } else {
    moveCursorLeft();
  }
  refreshEquationDisplay();
}

function handleCursorRight() {
  if (gameState.inputLocked) return;
  if (gameState.unit === UNIT_IDS.SIMULTANEOUS) {
    moveSystemCursorRight();
  } else {
    moveCursorRight();
  }
  refreshEquationDisplay();
}

function handleBackspace() {
  if (gameState.inputLocked) return;
  if (gameState.unit === UNIT_IDS.SIMULTANEOUS) {
    deleteSystemCharacterBeforeCursor();
  } else {
    deleteCharacterBeforeCursor();
  }
  refreshEquationDisplay();
  updateSubmitButtonState();
}

/**
 * 全消去は、連立方程式ではアクティブな式だけを消す（もう一方は残す）。
 */
function handleClear() {
  if (gameState.inputLocked) return;
  if (gameState.unit === UNIT_IDS.SIMULTANEOUS) {
    clearActiveSystemInput();
  } else {
    clearInput();
  }
  refreshEquationDisplay();
  updateSubmitButtonState();
}

/**
 * 連立方程式で、アクティブな入力欄（式①／式②）を切り替える
 * （「式切替」ボタン・PCキーボードのTabキーから呼ばれる）。
 */
function handleEquationSwitch() {
  if (gameState.inputLocked) return;
  if (gameState.unit !== UNIT_IDS.SIMULTANEOUS) return;
  const nextIndex = gameState.activeSystemEquationIndex === 0 ? 1 : 0;
  setActiveSystemEquationIndex(nextIndex);
  refreshEquationDisplay();
}

/**
 * 連立方程式で、式①・式②の入力欄を直接タップしてアクティブ欄を切り替える。
 * tapIndexが指定されている場合は、タップした位置へカーソルも移動する
 * （キーボード操作（Enter／Space）からの呼び出しではtapIndexを渡さず、切替のみ行う）。
 */
function handleEquationSlotSelect(index, tapIndex) {
  if (gameState.inputLocked) return;
  if (gameState.unit !== UNIT_IDS.SIMULTANEOUS) return;
  setActiveSystemEquationIndex(index);
  if (tapIndex !== undefined) {
    setSystemCursorPosition(index, tapIndex);
  }
  refreshEquationDisplay();
}

/**
 * 1次方程式で、入力欄をタップした位置へカーソルを直接移動する。
 */
function handleEquationInputTap(tapIndex) {
  if (gameState.inputLocked) return;
  if (gameState.unit === UNIT_IDS.SIMULTANEOUS) return;
  setCursorPosition(tapIndex);
  refreshEquationDisplay();
}

const PHYSICAL_KEY_MAP = {
  "-": "−",
  "*": "×",
  "/": "÷"
};

function handlePhysicalKeyDown(event) {
  if (gameState.inputLocked) return;

  if (gameState.unit === UNIT_IDS.SIMULTANEOUS) {
    if (event.key === "Tab") {
      event.preventDefault();
      handleEquationSwitch();
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (gameState.activeSystemEquationIndex === 0) {
        handleEquationSwitch();
      } else if (isCurrentInputSubmittable()) {
        handleSubmit();
      }
      return;
    }
  } else if (event.key === "Enter") {
    if (isCurrentInputSubmittable()) {
      event.preventDefault();
      handleSubmit();
    }
    return;
  }

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

  const key = event.key;
  if (/^[0-9.()=+xXyY]$/.test(key)) {
    event.preventDefault();
    if (key === "X" || key === "Y") {
      handleKeyPress(key.toLowerCase());
    } else {
      handleKeyPress(key);
    }
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
  if (gameState.mode === "rank") {
    rankMode.handleSubmit();
    return;
  }
  handleTrainingSubmit();
}

function handleTrainingSubmit() {
  if (gameState.inputLocked) return;

  const result =
    gameState.unit === UNIT_IDS.SIMULTANEOUS
      ? validateSystemEquations(getCurrentSystemInputStrings(), gameState.currentQuestion)
      : validateEquation(getCurrentInputString(), gameState.currentQuestion.expectedX);

  if (result.status === "correct") {
    handleCorrectAnswer();
  } else if (result.status === "incorrect") {
    handleIncorrectAnswer();
  } else {
    handleInputError(result);
  }
}

/**
 * 正解・パス演出で表示する模範式を、単元に応じて組み立てる。
 * 1次方程式は文字列1つ、連立方程式は[式①, 式②]の配列を返す。
 */
function getDisplayEquationForCurrentQuestion() {
  if (gameState.unit === UNIT_IDS.SIMULTANEOUS) {
    return gameState.currentQuestion.canonicalEquations.map(
      (equation) => equation.display
    );
  }
  return gameState.currentQuestion.displayEquation;
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

function handleCorrectAnswer() {
  const elapsedSeconds = timer.stopQuestionTimer();
  lockQuestionInput();

  audio.playCorrectSound();
  ui.showAnswerReveal(
    "correct",
    "正解です！",
    getDisplayEquationForCurrentQuestion(),
    gameState.currentQuestion.solutionDisplay
  );

  gameState.correctCount += 1;
  recordHistory("correct", elapsedSeconds);

  // トレーニングモードでは、生徒が「次へ」を押すまで正解表示を残す
  ui.showNextQuestionButton(true);
}

/**
 * トレーニングモードで、正解表示の「次へ」ボタンが押されたときの処理。
 */
function handleNextQuestion() {
  ui.showNextQuestionButton(false);
  advanceToNextQuestionOrResult();
}

function handlePass() {
  if (gameState.mode === "rank") {
    rankMode.handlePass();
    return;
  }
  handleTrainingPass();
}

async function handleTrainingPass() {
  if (!gameState.passAvailable || gameState.inputLocked) return;

  const elapsedSeconds = timer.stopQuestionTimer();
  lockQuestionInput();

  audio.playPassSound();
  ui.showAnswerReveal(
    "pass",
    "パスしました",
    getDisplayEquationForCurrentQuestion(),
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
  ui.setHintButtonEnabled(false);
  ui.setPassButtonEnabled(false);
  ui.clearJudgeMessage();
}

function recordHistory(result, elapsedSeconds) {
  const baseEntry = {
    questionNumber: gameState.currentQuestionIndex + 1,
    unit: gameState.unit,
    categoryName: gameState.currentQuestion.categoryName,
    prompt: gameState.currentQuestion.prompt,
    solutionDisplay: gameState.currentQuestion.solutionDisplay,
    result,
    elapsedSeconds,
    elapsedTimeText: elapsedSeconds.toFixed(2),
    incorrectCount: gameState.currentQuestionIncorrectCount,
    hintUsed: gameState.currentQuestionHintUsed,
    hintPartsRevealed: gameState.currentQuestionHintPartsRevealed,
    hintPartUsed: gameState.currentQuestionHintPartUsed,
    usedHintPartValues: [...gameState.usedHintPartValues]
  };

  if (gameState.unit === UNIT_IDS.SIMULTANEOUS) {
    const [lastInput1, lastInput2] = getCurrentSystemInputStrings();
    gameState.history.push({
      ...baseEntry,
      lastInput1,
      lastInput2,
      modelEquation1: gameState.currentQuestion.canonicalEquations[0].display,
      modelEquation2: gameState.currentQuestion.canonicalEquations[1].display
    });
    return;
  }

  gameState.history.push({
    ...baseEntry,
    variableDefinition: gameState.currentQuestion.variableDefinition,
    lastInput: getCurrentInputString(),
    modelEquation: gameState.currentQuestion.displayEquation
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
  ui.showHintPanel(gameState.currentQuestion.hint);

  // 二重実行防止：式パーツの公開は最初の1回だけ行う
  if (gameState.currentQuestionHintUsed) return;
  gameState.currentQuestionHintUsed = true;

  const hintParts = Array.isArray(gameState.currentQuestion.hintKeypadParts)
    ? gameState.currentQuestion.hintKeypadParts
    : [];

  if (hintParts.length > 0) {
    gameState.currentQuestionHintPartsRevealed = true;
    ui.renderHintKeypadParts(hintParts);
  }

  ui.setHintButtonRevealed(true);
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
  ui.hideAnswerReveal();
  ui.hideHintPanel();
  audio.playResultSound();
  ui.renderResultHeading(gameState.unit);
  ui.renderResultSummary(computeResultSummary());
  ui.renderHistory(gameState.history);
  ui.showScreen("result");
}

// ============================================================
// リトライ・戻る・もう一度
// ============================================================

function handleRetry() {
  timer.stopQuestionTimer();
  if (gameState.mode === "rank") {
    rankMode.stopRankSession();
  }
  ui.hideAnswerReveal();
  ui.hideHintPanel();
  startNewGame();
}

/**
 * トレーニングモードの「リタイア」ボタン。ゲームをその場で終了し、結果画面へ進む。
 */
function handleGiveUp() {
  timer.stopQuestionTimer();
  ui.hideAnswerReveal();
  ui.hideHintPanel();
  endGame();
}

function handleReplay() {
  timer.stopQuestionTimer();
  if (gameState.mode === "rank") {
    rankMode.stopRankSession();
  }
  ui.hideAnswerReveal();
  ui.hideHintPanel();
  startNewGame();
}

function handleBackToTitle() {
  timer.stopQuestionTimer();
  if (gameState.mode === "rank") {
    rankMode.stopRankSession();
  }
  ui.hideAnswerReveal();
  ui.hideHintPanel();
  resetGameState();
  ui.showScreen("title");
}
