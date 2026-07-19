// 段位認定モードの進行を管理するモジュール
// 120秒の全体タイマー・スコア・コンボ・コンボゲージ・段位計算・ハイスコアを、
// トレーニングモード（game.js）から切り離して管理する。
//
// 数式入力（キー入力・カーソル移動・ヒント表示・ヒント式パーツ）は
// モードに依存しない共通処理のため、game.js側の実装をそのまま利用する。
// このモジュールが担当するのは「解答の判定後に何をするか」（スコア・コンボ・
// 全体タイマーへの影響）と、段位認定に固有の出題・終了処理だけである。

import { APP_CONFIG } from "../config.js";
import { gameState, resetQuestionState, getCurrentInputString } from "../state.js";
import * as ui from "../ui.js";
import * as timer from "../timer.js";
import * as audio from "../audio.js";
import * as storage from "../storage.js";
import { getNextRankQuestion } from "../questions/question-manager.js";
import { validateEquation } from "../equation/equation-validator.js";
import {
  calculateCorrectPoints,
  calculateIncorrectPoints,
  formatScore,
  formatScoreDelta
} from "../rank/score-manager.js";
import {
  createComboState,
  tick as tickComboGauge,
  registerCorrect as registerComboCorrect,
  registerPass as registerComboPass,
  startGaugeForNextQuestion
} from "../rank/combo-manager.js";
import {
  calculateRankResult,
  isBetterRankCoefficient
} from "../rank/rank-calculator.js";

const POLL_INTERVAL_MS = 100;
const UNIT = "linear";

let comboState = null;
let recentTemplateIds = [];
let recentCategoryIds = [];
let rankQuestionNumber = 0;

let pollIntervalId = null;
let lastTickTime = 0;
let paused = false;
let pauseStartedAt = 0;

let graceRemainingMs = 0;
let lastUrgentSecond = null;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================
// セッションの開始・停止
// ============================================================

/**
 * 段位認定セッションを開始する（カウントダウンの終了後に呼び出す）。
 * @param {"NORMAL"|"HARD"} difficulty
 */
export function startRankGame(difficulty) {
  gameState.rankDifficulty = difficulty;
  comboState = createComboState();
  recentTemplateIds = [];
  recentCategoryIds = [];
  rankQuestionNumber = 0;
  graceRemainingMs = 0;
  lastUrgentSecond = null;
  paused = false;

  ui.showRankHud(true);
  ui.renderRankComboGauge(1);
  ui.animateScoreTo(0);
  ui.renderRankRemainingTime(Math.ceil(gameState.remainingTimeMs / 1000), false);

  gameState.globalTimerRunning = true;
  lastTickTime = performance.now();
  pollIntervalId = setInterval(onTick, POLL_INTERVAL_MS);

  beginRankQuestion();
}

/**
 * 段位認定セッションのタイマー類をすべて停止する。
 * リトライ・タイトルへ戻る・結果画面への遷移のいずれでも必ず呼び出す。
 */
export function stopRankSession() {
  if (pollIntervalId !== null) {
    clearInterval(pollIntervalId);
    pollIntervalId = null;
  }
  gameState.globalTimerRunning = false;
  gameState.finalGracePeriodRunning = false;
  timer.stopQuestionTimer();
  ui.showRankHud(false);
}

function pauseAll() {
  paused = true;
  pauseStartedAt = performance.now();
}

function resumeAll() {
  const now = performance.now();
  const pausedDuration = now - pauseStartedAt;
  lastTickTime = now;
  if (comboState.gaugeRunning) {
    comboState.gaugeStartTime += pausedDuration;
  }
  paused = false;
}

// ============================================================
// 全体タイマー・コンボゲージのポーリング
// ============================================================

function onTick() {
  const now = performance.now();
  const delta = now - lastTickTime;
  lastTickTime = now;

  if (paused || !gameState.globalTimerRunning) {
    return;
  }

  if (comboState.gaugeRunning) {
    const result = tickComboGauge(comboState, now);
    ui.renderRankComboGauge(comboState.gaugeRatio);
    if (result.gaugeExpired) {
      gameState.combo = 0;
      audio.playComboBreakSound();
    }
  }

  if (gameState.finalGracePeriodRunning) {
    graceRemainingMs = Math.max(0, graceRemainingMs - delta);
    if (graceRemainingMs <= 0) {
      handleFinalTimeout();
    }
    return;
  }

  if (gameState.globalTimeExpired) {
    return;
  }

  gameState.remainingTimeMs = Math.max(0, gameState.remainingTimeMs - delta);
  const remainingSeconds = Math.ceil(gameState.remainingTimeMs / 1000);
  const isUrgent =
    gameState.remainingTimeMs > 0 &&
    gameState.remainingTimeMs <= APP_CONFIG.rankUrgentThresholdSeconds * 1000;

  ui.renderRankRemainingTime(remainingSeconds, isUrgent);

  if (isUrgent && lastUrgentSecond !== remainingSeconds) {
    lastUrgentSecond = remainingSeconds;
    audio.playUrgentTickSound();
  }

  if (gameState.remainingTimeMs <= 0) {
    handleGlobalTimeExpired();
  }
}

/**
 * 残り時間が0秒になった瞬間の処理。
 * 表示中の問題を最終問題とし、30秒の猶予期間を開始する。
 */
function handleGlobalTimeExpired() {
  gameState.globalTimeExpired = true;
  gameState.finalGracePeriodRunning = true;
  graceRemainingMs = APP_CONFIG.rankFinalGracePeriodMs;

  // ヒント解禁前でも、残り時間0秒後はヒントを使用可能にする
  if (!gameState.inputLocked) {
    gameState.hintAvailable = true;
    ui.showHintButton(true);
  }

  // パスは使えなくする
  gameState.passAvailable = false;
  ui.showPassButton(false);

  ui.renderRankRemainingTime(0, false);
}

/**
 * 猶予期間（30秒）が経過しても正解できなかった場合の処理。
 */
async function handleFinalTimeout() {
  gameState.finalGracePeriodRunning = false;
  gameState.finalTimedOut = true;

  const elapsedSeconds = timer.stopQuestionTimer();
  lockRankInput();

  audio.playTimeUpSound();
  ui.showJudgeMessage("incorrect", "時間切れ");
  ui.showAnswerReveal(
    "pass",
    "時間切れ",
    gameState.currentQuestion.displayEquation,
    gameState.currentQuestion.solutionDisplay
  );

  recordRankHistory("timeout", elapsedSeconds, { scoreDelta: 0, comboAtCorrect: null });

  await sleep(1000);
  finishRankSession();
}

// ============================================================
// 出題
// ============================================================

function beginRankQuestion() {
  resetQuestionState();

  const { question, template } = getNextRankQuestion(
    gameState.rankDifficulty,
    recentTemplateIds,
    recentCategoryIds
  );
  recentTemplateIds.push(template.templateId);
  recentCategoryIds.push(template.categoryId);

  rankQuestionNumber += 1;
  gameState.currentQuestion = question;

  ui.showScreen("game");
  ui.resetGameScreenPanels();
  ui.renderQuestionPrompt(question.prompt);
  ui.renderEquationInput(gameState.currentInputTokens, gameState.cursorPosition);
  ui.renderEquationKeypad(question);
  ui.setSubmitButtonEnabled(false);

  startGaugeForNextQuestion(comboState, performance.now());
  ui.renderRankComboGauge(comboState.gaugeRatio);

  timer.startQuestionTimer({
    onHintAvailable: () => {
      gameState.hintAvailable = true;
      ui.showHintButton(true);
    },
    onPassAvailable: () => {
      if (gameState.globalTimeExpired) return;
      gameState.passAvailable = true;
      ui.showPassButton(true);
    }
  });

  if (gameState.globalTimeExpired) {
    gameState.hintAvailable = true;
    ui.showHintButton(true);
  }
}

// ============================================================
// 解答処理
// ============================================================

export function handleSubmit() {
  if (gameState.inputLocked) return;

  const inputString = getCurrentInputString();
  const result = validateEquation(inputString, gameState.currentQuestion.expectedX);

  if (result.status === "correct") {
    handleCorrectAnswer();
  } else if (result.status === "incorrect") {
    handleIncorrectAnswer();
  } else {
    ui.showJudgeMessage("input-error", result.message);
  }
}

function handleIncorrectAnswer() {
  gameState.currentQuestionIncorrectCount += 1;
  gameState.incorrectCount += 1;

  const delta = calculateIncorrectPoints();
  gameState.score += delta;
  gameState.lastScoreChange = delta;
  ui.animateScoreTo(gameState.score);
  ui.showRankScoreChange(formatScoreDelta(delta), false);

  audio.playIncorrectSound();
  ui.showJudgeMessage("incorrect", "もう一度考えよう");
}

function lockRankInput() {
  gameState.inputLocked = true;
  ui.setKeyboardEnabled(false);
  ui.setSubmitButtonEnabled(false);
  ui.showHintButton(false);
  ui.showPassButton(false);
  ui.clearJudgeMessage();
}

async function handleCorrectAnswer() {
  const elapsedSeconds = timer.stopQuestionTimer();
  lockRankInput();

  const comboAfter = registerComboCorrect(comboState);
  gameState.combo = comboAfter;
  gameState.maxCombo = comboState.maxCombo;
  audio.playComboSound(comboAfter);

  const points = calculateCorrectPoints(comboAfter);
  gameState.score += points;
  gameState.lastScoreChange = points;
  ui.animateScoreTo(gameState.score);
  ui.showRankScoreChange(`${formatScoreDelta(points)}点\n${comboAfter}Combo!`, true);

  audio.playCorrectSound();
  ui.showAnswerReveal(
    "correct",
    "正解です！",
    gameState.currentQuestion.displayEquation,
    gameState.currentQuestion.solutionDisplay
  );

  gameState.correctCount += 1;
  recordRankHistory("correct", elapsedSeconds, {
    scoreDelta: points,
    comboAtCorrect: comboAfter
  });

  if (gameState.globalTimeExpired) {
    // 猶予期間中の最終問題に正解：時間切れ扱いにはしない
    await sleep(APP_CONFIG.correctDisplayMilliseconds);
    finishRankSession();
    return;
  }

  pauseAll();
  await sleep(APP_CONFIG.correctDisplayMilliseconds);
  resumeAll();

  beginRankQuestion();
}

export async function handlePass() {
  if (!gameState.passAvailable || gameState.inputLocked) return;
  if (gameState.globalTimeExpired) return;

  const elapsedSeconds = timer.stopQuestionTimer();
  lockRankInput();

  registerComboPass(comboState);
  gameState.combo = 0;
  ui.renderRankComboGauge(1);

  audio.playPassSound();
  ui.showAnswerReveal(
    "pass",
    "パスしました",
    gameState.currentQuestion.displayEquation,
    gameState.currentQuestion.solutionDisplay
  );

  gameState.passCount += 1;
  recordRankHistory("pass", elapsedSeconds, { scoreDelta: 0, comboAtCorrect: null });

  await sleep(APP_CONFIG.passDisplayMilliseconds);
  beginRankQuestion();
}

function recordRankHistory(result, elapsedSeconds, extra) {
  const scoreDelta = extra.scoreDelta || 0;

  gameState.history.push({
    questionNumber: rankQuestionNumber,
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
    hintUsed: gameState.currentQuestionHintUsed,
    hintPartsRevealed: gameState.currentQuestionHintPartsRevealed,
    hintPartUsed: gameState.currentQuestionHintPartUsed,
    usedHintPartValues: [...gameState.usedHintPartValues],
    scoreDelta,
    scoreDeltaText: formatScoreDelta(scoreDelta),
    comboAtCorrect: extra.comboAtCorrect
  });
}

// ============================================================
// セッション終了・段位計算・ハイスコア
// ============================================================

function computeAverageCorrectTime() {
  const correctEntries = gameState.history.filter((entry) => entry.result === "correct");
  if (correctEntries.length === 0) {
    return null;
  }
  const totalSeconds = correctEntries.reduce(
    (sum, entry) => sum + entry.elapsedSeconds,
    0
  );
  return totalSeconds / correctEntries.length;
}

function finishRankSession() {
  stopRankSession();

  const averageCorrectTime = computeAverageCorrectTime();

  const rankResult = calculateRankResult({
    averageCorrectTime,
    baseTime: APP_CONFIG.rankBaseTimeSeconds,
    correctCount: gameState.correctCount,
    incorrectCount: gameState.incorrectCount,
    passCount: gameState.passCount,
    finalTimedOut: gameState.finalTimedOut,
    difficulty: gameState.rankDifficulty
  });
  gameState.rankResult = rankResult;

  const existingRecord = storage.loadRankHighScore(UNIT, gameState.rankDifficulty);
  const isNewScoreRecord =
    !existingRecord || gameState.score > existingRecord.highScore;
  const isNewRankRecord = isBetterRankCoefficient(
    rankResult.finalCoefficient,
    existingRecord ? existingRecord.bestRankCoefficient : null
  );

  const updatedRecord = {
    highScore: isNewScoreRecord
      ? gameState.score
      : existingRecord.highScore,
    bestRankCoefficient: isNewRankRecord
      ? rankResult.finalCoefficient
      : existingRecord.bestRankCoefficient,
    bestRankName: isNewRankRecord
      ? rankResult.displayRankName
      : existingRecord.bestRankName,
    maxCorrectCount: Math.max(
      gameState.correctCount,
      existingRecord ? existingRecord.maxCorrectCount : 0
    ),
    maxCombo: Math.max(
      gameState.maxCombo,
      existingRecord ? existingRecord.maxCombo : 0
    ),
    updatedAt: new Date().toISOString()
  };
  storage.saveRankHighScore(UNIT, gameState.rankDifficulty, updatedRecord);

  audio.playRankDecidedSound();
  if (isNewScoreRecord) {
    setTimeout(() => audio.playHighScoreSound(), 500);
  }

  ui.renderRankResult({
    displayRankName: rankResult.displayRankName,
    difficulty: gameState.rankDifficulty,
    correctCount: gameState.correctCount,
    incorrectCount: gameState.incorrectCount,
    passCount: gameState.passCount,
    maxCombo: gameState.maxCombo,
    averageTimeText:
      averageCorrectTime === null ? "―" : `${averageCorrectTime.toFixed(2)}秒`,
    scoreText: formatScore(gameState.score),
    highScoreText: formatScore(updatedRecord.highScore),
    finalTimedOut: gameState.finalTimedOut
  });
  ui.renderRankHistory(gameState.history);
  ui.showScreen("rank-result");
}
