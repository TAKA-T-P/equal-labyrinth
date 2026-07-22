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
  popTokenBeforeCursor,
  replaceTokenAt,
  completeFractionAt,
  clearInput,
  getCurrentInputString,
  insertCharacterAtSystemCursor,
  moveSystemCursorLeft,
  moveSystemCursorRight,
  setSystemCursorPosition,
  deleteSystemCharacterBeforeCursor,
  popSystemTokenBeforeCursor,
  replaceSystemTokenAt,
  completeSystemFractionAt,
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
import { validateCurrentAnswer } from "./equation/answer-validator.js";
import { tokenize, TokenType } from "./equation/tokenizer.js";
import * as rankMode from "./modes/rank-mode.js";
import * as questMode from "./modes/quest-mode.js";
import { initHelpUI } from "./help/help-ui.js";
import { initExampleUI } from "./help/example-ui.js";

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

  // x²（POWERトークン）はxを含む1つの塊なので、「xが含まれている」の判定にも数える
  // （例：「x²＝144」のように、バラのxを含まない入力でも解答ボタンを有効にできるようにする）
  const hasAllRequiredVariables = requiredVariableNames.every((variableName) =>
    tokens.some(
      (token) =>
        (token.type === TokenType.VARIABLE && token.name === variableName) ||
        (token.type === TokenType.POWER && token.base === variableName)
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
  // 分母入力待ちの分数がある間は、必ず解答できないようにする
  if (gameState.fractionInputState.isWaitingForDenominator) {
    return false;
  }

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

  // タイトル画面のモード・単元の選択状態も、前回の続きから始められるよう復元する。
  gameState.mode = storage.loadSelectedMode(gameState.mode);
  gameState.unit = storage.loadSelectedUnit(gameState.unit);

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
    onCreateFraction: handleCreateFraction,
    onInsertPower: handleInsertPower,
    onInsertSquare: handleInsertSquare,
    onHintFractionPartPress: handleHintFractionPartPress,
    onInsertNumberFraction: handleInsertNumberFraction,
    onCursorLeft: handleCursorLeft,
    onCursorRight: handleCursorRight,
    onBackspace: handleBackspace,
    onClear: handleClear,
    onEquationSwitch: handleEquationSwitch,
    onEquationSlotSelect: handleEquationSlotSelect,
    onEquationInputTap: handleEquationInputTap,
    onSubmit: handleSubmit,
    onNextQuestion: handleNextQuestion,
    onRetryQuestion: handleRetryQuestion,
    onHintRequest: handleHintRequest,
    onPass: handlePass,
    onPassConfirmYes: handlePassConfirmYes,
    onPassConfirmNo: handlePassConfirmNo,
    onRetry: handleRetry,
    onGiveUp: handleGiveUp,
    onBackToTitle: handleBackToTitle,
    onReplay: handleReplay,
    onResultToTitle: handleBackToTitle,
    onRankReplay: handleReplay,
    onRankResultToTitle: handleBackToTitle,
    onPhysicalKeyDown: handlePhysicalKeyDown
  });

  questMode.initQuestModeUI({ onBackToTitle: handleBackToTitle });
  initHelpUI();
  initExampleUI();

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

  if (gameState.mode === "rank" || gameState.mode === "quest") {
    // 段位認定モードは難易度に、クエストモードは部屋データに既定値があるため、
    // どちらも問題数・カテゴリ選択なしで常に開始できる
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
  storage.saveSelectedMode(mode);
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
  storage.saveSelectedUnit(unit);
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

  if (gameState.mode === "quest") {
    // クエストモードは、共通のカウントダウン画面を経由せず、
    // 専用のオープニング画面から始まる
    await questMode.startQuest(gameState.unit);
    return;
  }

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
  // クエストモードではパスボタン自体を非表示にするため、直前にクエストモードを
  // 遊んでいた場合に備えて、トレーニングモードでは必ず表示し直す
  ui.setPassButtonVisible(true);
  ui.renderUnitLabel(gameState.unit);
  ui.showEquationInputMode(gameState.unit);
  ui.renderQuestionProgress(index + 1, gameState.totalQuestions);
  ui.renderQuestionPrompt(gameState.currentQuestion.prompt);
  ui.renderDiagram(gameState.currentQuestion.diagram || null);
  refreshEquationDisplay();
  ui.renderEquationKeypad(gameState.currentQuestion);
  ui.setSubmitButtonEnabled(false);

  // トレーニングモードでは、段位認定と異なりヒント・パスを最初から使用できる
  gameState.hintAvailable = true;
  gameState.passAvailable = true;
  ui.setHintButtonEnabled(true);
  ui.setPassButtonEnabled(true);

  timer.startQuestionTimer({});
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

/**
 * @param {string} char キー・記号の値。分母入力待ち中は数値キーかどうかで扱いを変える。
 * @param {boolean} isNumberKey 数値ボタン（keypad-numbers）から押されたかどうか
 */
function handleKeyPress(char, isNumberKey) {
  if (gameState.fractionInputState.isWaitingForDenominator) {
    handleDenominatorInput(char, isNumberKey);
    return;
  }
  insertValueAtCursor(char);
}

/**
 * x²ボタン（2次方程式専用）が押されたときの処理。x²は1つの塊（アトミックなトークン）
 * として挿入し、「1つ消す」で丸ごと削除される（xと2の間にカーソルは入らない）。
 * 分母入力待ち中は、他の記号キーと同様に受け付けない。
 */
function handleInsertPower() {
  if (gameState.fractionInputState.isWaitingForDenominator) return;
  insertValueAtCursor({ type: "power", base: "x", exponent: 2 });
}

/**
 * 「□²」ボタン（2次方程式専用）が押されたときの処理。直前に入力した「(...)」の
 * 中身をまとめて2乗する後置演算子を、1つの塊（アトミックなトークン）として挿入する
 * （例："(x-8)" の直後に押すと "(x-8)²" になる）。「1つ消す」で丸ごと削除される。
 * 分母入力待ち中は、他の記号キーと同様に受け付けない。
 */
function handleInsertSquare() {
  if (gameState.fractionInputState.isWaitingForDenominator) return;
  insertValueAtCursor({ type: "square" });
}

/**
 * ヒントで公開された式パーツ（(15-x)など）を、1つの塊として現在アクティブな
 * 入力欄のカーソル位置へ挿入する（連立方程式でも、式①・式②を自動判断しない）。
 */
function handleHintPartPress(value) {
  if (gameState.fractionInputState.isWaitingForDenominator) return;

  const inserted = insertValueAtCursor(value);
  if (!inserted) return;

  gameState.currentQuestionHintPartUsed = true;
  if (!gameState.usedHintPartValues.includes(value)) {
    gameState.usedHintPartValues.push(value);
  }
}

/**
 * ヒントの分数パーツ（x/8など）を、完成済みの分数トークンとして
 * 現在アクティブな入力欄のカーソル位置へ挿入する。
 * @param {{numerator: string, denominator: string, value: string}} part
 */
function handleHintFractionPartPress(part) {
  if (gameState.fractionInputState.isWaitingForDenominator) return;

  const fractionToken = {
    type: "fraction",
    numeratorTokens: [part.numerator],
    denominatorTokens: [part.denominator],
    isComplete: true,
    source: "hint-part"
  };
  const inserted = insertValueAtCursor(fractionToken);
  if (!inserted) return;

  gameState.currentQuestionHintPartUsed = true;
  if (!gameState.usedHintPartValues.includes(part.value)) {
    gameState.usedHintPartValues.push(part.value);
  }
}

/**
 * 「1/2」のような分数の数字カードを、完成済みの分数トークンとして
 * 現在アクティブな入力欄のカーソル位置へ挿入する。ヒントパーツではない
 * 通常の数値ボタンのため、ヒント使用のフラグ・履歴は更新しない。
 */
function handleInsertNumberFraction(numerator, denominator) {
  if (gameState.fractionInputState.isWaitingForDenominator) return;

  const fractionToken = {
    type: "fraction",
    numeratorTokens: [numerator],
    denominatorTokens: [denominator],
    isComplete: true,
    source: "keypad-number"
  };
  insertValueAtCursor(fractionToken);
}

// ============================================================
// 分数入力（上下型分数）
// ============================================================

/**
 * 分子として使えないトークンかどうかを判定する
 * （空・演算子・＝・かっこ・分数トークン自身は分子にできない）。
 * x²トークン（2次方程式専用）は、x²/2のような分子として使えるようにする。
 */
function isValidFractionNumerator(token) {
  if (token === undefined || token === null) return false;
  if (typeof token === "object") {
    return token.type === "power"; // 分数トークンを分子にはできないが、x²トークンは可
  }
  return !["+", "−", "-", "×", "=", "(", ")"].includes(token);
}

function getActiveTokensArray() {
  return gameState.unit === UNIT_IDS.SIMULTANEOUS
    ? gameState.currentSystemInputTokens[gameState.activeSystemEquationIndex]
    : gameState.currentInputTokens;
}

function getActiveCursorPosition() {
  return gameState.unit === UNIT_IDS.SIMULTANEOUS
    ? gameState.systemCursorPositions[gameState.activeSystemEquationIndex]
    : gameState.cursorPosition;
}

function getActiveEquationIndexForFraction() {
  return gameState.unit === UNIT_IDS.SIMULTANEOUS ? gameState.activeSystemEquationIndex : 0;
}

/**
 * 分数ボタンが押されたときの処理。カーソル直前の1トークンを分子にして、
 * 分母入力待ちの未完成な分数トークンを挿入する。
 */
function handleCreateFraction() {
  if (gameState.inputLocked) return;

  if (gameState.fractionInputState.isWaitingForDenominator) {
    ui.showInputGuidance("先に分母を入力してください。");
    return;
  }

  const tokens = getActiveTokensArray();
  const cursorPosition = getActiveCursorPosition();
  const previousToken = tokens[cursorPosition - 1];

  if (!isValidFractionNumerator(previousToken)) {
    ui.showInputGuidance("先に分子を入力してください。");
    return;
  }

  const numeratorToken =
    gameState.unit === UNIT_IDS.SIMULTANEOUS ? popSystemTokenBeforeCursor() : popTokenBeforeCursor();

  const fractionToken = {
    type: "fraction",
    numeratorTokens: [numeratorToken],
    denominatorTokens: [],
    isComplete: false
  };

  const equationIndex = getActiveEquationIndexForFraction();
  const fractionTokenIndex =
    gameState.unit === UNIT_IDS.SIMULTANEOUS
      ? gameState.systemCursorPositions[equationIndex]
      : gameState.cursorPosition;

  insertValueAtCursor(fractionToken);

  gameState.fractionInputState = {
    isWaitingForDenominator: true,
    equationIndex,
    fractionTokenIndex
  };

  ui.showInputGuidance("分母を選んでください。");
}

function isZeroDenominatorValue(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric === 0;
}

/**
 * 分母入力待ち中に押されたキーを処理する。数値ボタン（isNumberKey）のみ受け付け、
 * 0は拒否する。それ以外の記号・変数キーは無視して案内を表示する。
 */
function handleDenominatorInput(value, isNumberKey) {
  if (gameState.inputLocked) return;

  if (!isNumberKey) {
    ui.showInputGuidance("分母には数値を入力してください。");
    return;
  }

  if (isZeroDenominatorValue(value)) {
    ui.showInputGuidance("分母に0は使えません。");
    return;
  }

  const { equationIndex, fractionTokenIndex } = gameState.fractionInputState;

  if (gameState.unit === UNIT_IDS.SIMULTANEOUS) {
    completeSystemFractionAt(equationIndex, fractionTokenIndex, value);
  } else {
    completeFractionAt(fractionTokenIndex, value);
  }

  gameState.fractionInputState = {
    isWaitingForDenominator: false,
    equationIndex: 0,
    fractionTokenIndex: -1
  };

  ui.clearInputGuidance();
  audio.playKeySound();
  refreshEquationDisplay();
  updateSubmitButtonState();
}

/**
 * 分母入力待ち中に「1つ消す」が押されたときの処理。分数の作成を取り消し、
 * 分子だったトークンを元へ戻す（分子自体は消さない）。
 */
function revertPendingFraction() {
  const { equationIndex, fractionTokenIndex } = gameState.fractionInputState;
  const tokens =
    gameState.unit === UNIT_IDS.SIMULTANEOUS
      ? gameState.currentSystemInputTokens[equationIndex]
      : gameState.currentInputTokens;
  const fractionToken = tokens[fractionTokenIndex];
  const numeratorToken = fractionToken.numeratorTokens[0];

  if (gameState.unit === UNIT_IDS.SIMULTANEOUS) {
    replaceSystemTokenAt(equationIndex, fractionTokenIndex, numeratorToken);
    setSystemCursorPosition(equationIndex, fractionTokenIndex + 1);
  } else {
    replaceTokenAt(fractionTokenIndex, numeratorToken);
    setCursorPosition(fractionTokenIndex + 1);
  }

  gameState.fractionInputState = {
    isWaitingForDenominator: false,
    equationIndex: 0,
    fractionTokenIndex: -1
  };

  ui.clearInputGuidance();
  refreshEquationDisplay();
  updateSubmitButtonState();
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

  if (gameState.fractionInputState.isWaitingForDenominator) {
    revertPendingFraction();
    return;
  }

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
 * 分母入力待ち状態も、あわせて解除する。
 */
function handleClear() {
  if (gameState.inputLocked) return;
  if (gameState.unit === UNIT_IDS.SIMULTANEOUS) {
    clearActiveSystemInput();
  } else {
    clearInput();
  }
  gameState.fractionInputState = {
    isWaitingForDenominator: false,
    equationIndex: 0,
    fractionTokenIndex: -1
  };
  ui.clearInputGuidance();
  refreshEquationDisplay();
  updateSubmitButtonState();
}

/**
 * 連立方程式で、アクティブな入力欄（式①／式②）を切り替える
 * （「式切替」ボタン・PCキーボードのTabキーから呼ばれる）。
 * 分母入力待ち中は、どちらの式に属する分数か分からなくなるのを防ぐため切り替えを禁止する。
 */
function handleEquationSwitch() {
  if (gameState.inputLocked) return;
  if (gameState.unit !== UNIT_IDS.SIMULTANEOUS) return;
  if (gameState.fractionInputState.isWaitingForDenominator) {
    ui.showInputGuidance("先に分母を入力してください。");
    return;
  }
  const nextIndex = gameState.activeSystemEquationIndex === 0 ? 1 : 0;
  setActiveSystemEquationIndex(nextIndex);
  refreshEquationDisplay();
}

/**
 * 連立方程式で、式①・式②の入力欄を直接タップしてアクティブ欄を切り替える。
 * tapIndexが指定されている場合は、タップした位置へカーソルも移動する
 * （キーボード操作（Enter／Space）からの呼び出しではtapIndexを渡さず、切替のみ行う）。
 * 分母入力待ち中は切り替えを禁止する。
 */
function handleEquationSlotSelect(index, tapIndex) {
  if (gameState.inputLocked) return;
  if (gameState.unit !== UNIT_IDS.SIMULTANEOUS) return;
  if (
    gameState.fractionInputState.isWaitingForDenominator &&
    index !== gameState.activeSystemEquationIndex
  ) {
    ui.showInputGuidance("先に分母を入力してください。");
    return;
  }
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
  "*": "×"
};

function handlePhysicalKeyDown(event) {
  if (gameState.inputLocked) return;

  if (event.key === "Backspace") {
    event.preventDefault();
    handleBackspace();
    return;
  }

  // 分母入力待ち中は、数値キー以外は無視する（画面上の数値ボタンでの操作を優先する簡易対応）。
  if (gameState.fractionInputState.isWaitingForDenominator) {
    if (/^[0-9.]$/.test(event.key)) {
      event.preventDefault();
      handleDenominatorInput(event.key, true);
    }
    return;
  }

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

  if (event.key === "/") {
    event.preventDefault();
    handleCreateFraction();
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
  if (gameState.mode === "quest") {
    questMode.handleSubmit();
    return;
  }
  handleTrainingSubmit();
}

function handleTrainingSubmit() {
  if (gameState.inputLocked) return;

  const input =
    gameState.unit === UNIT_IDS.SIMULTANEOUS
      ? getCurrentSystemInputStrings()
      : getCurrentInputString();
  const result = validateCurrentAnswer(gameState.unit, input, gameState.currentQuestion);

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
 * 分数（/）を上下型で描画できるよう、あらかじめ整形されたdisplayではなく、
 * 内部表現（internal／canonicalEquation）をそのまま返す（ui.js側で解析して描画する）。
 */
function getDisplayEquationForCurrentQuestion() {
  if (gameState.unit === UNIT_IDS.SIMULTANEOUS) {
    return gameState.currentQuestion.canonicalEquations.map(
      (equation) => equation.internal
    );
  }
  if (gameState.unit === UNIT_IDS.QUADRATIC) {
    return gameState.currentQuestion.canonicalEquation.internal;
  }
  return gameState.currentQuestion.canonicalEquation;
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
  ui.showRetryQuestionButton(true);
}

/**
 * トレーニングモードで、正解表示の「次へ」ボタンが押されたときの処理。
 */
function handleNextQuestion() {
  ui.showNextQuestionButton(false);
  ui.showRetryQuestionButton(false);
  advanceToNextQuestionOrResult();
}

/**
 * トレーニングモードで、正解・パス表示の「もう一度」ボタンが押されたときの処理。
 * 次の問題へは進まず、同じ問題を出題直後の状態（入力欄・ヒント・パスの解禁状態など）
 * へ戻す。正解数・パス回数・履歴はすでに記録された分をそのまま残す。
 */
function handleRetryQuestion() {
  ui.showNextQuestionButton(false);
  ui.showRetryQuestionButton(false);
  ui.hideAnswerReveal();
  beginQuestion(gameState.currentQuestionIndex);
}

/**
 * 「パス」ボタンが押されたときの処理。即座にパスせず、まず確認カードを表示する
 * （トレーニング・段位認定共通）。
 */
function handlePass() {
  if (!gameState.passAvailable || gameState.inputLocked) return;
  ui.showPassConfirm();
}

/**
 * パス確認カードで「はい」が押されたときの処理。ここで初めてパスを実行する。
 */
function handlePassConfirmYes() {
  ui.hidePassConfirm();

  if (gameState.mode === "rank") {
    rankMode.handlePass();
    return;
  }
  handleTrainingPass();
}

/**
 * パス確認カードで「いいえ」（または背景タップ）が押されたときの処理。何もせず閉じる。
 */
function handlePassConfirmNo() {
  ui.hidePassConfirm();
}

function handleTrainingPass() {
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

  // 段位認定モードと異なり、トレーニングモードでは自動で次の問題へ進まず
  // 「次へ」ボタンを押すまで模範式を表示し続ける
  ui.showNextQuestionButton(true);
  ui.showRetryQuestionButton(true);
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
      modelEquation1: gameState.currentQuestion.canonicalEquations[0].internal,
      modelEquation2: gameState.currentQuestion.canonicalEquations[1].internal
    });
    return;
  }

  const modelEquation =
    gameState.unit === UNIT_IDS.QUADRATIC
      ? gameState.currentQuestion.canonicalEquation.internal
      : gameState.currentQuestion.canonicalEquation;

  gameState.history.push({
    ...baseEntry,
    variableDefinition: gameState.currentQuestion.variableDefinition,
    lastInput: getCurrentInputString(),
    modelEquation
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
 * クエストモードでは、同じボタンからクエスト専用のリタイア確認モーダルを開く
 * （即座に終了せず、確認を挟む）。
 */
function handleGiveUp() {
  if (gameState.mode === "quest") {
    questMode.handleRetireRequest();
    return;
  }
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
  if (gameState.mode === "quest") {
    questMode.stopQuestSession();
  }
  ui.hideAnswerReveal();
  ui.hideHintPanel();
  resetGameState();
  ui.showScreen("title");
}
