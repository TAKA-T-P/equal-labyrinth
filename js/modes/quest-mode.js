// クエストモードの進行を管理するモジュール
// 段位認定モード（rank-mode.js）と同じ方針：数式入力（キー入力・カーソル移動・
// ヒント表示・ヒント式パーツ・x²/□²入力）はモードに依存しない共通処理のため、
// game.js側の実装をそのまま利用する。このモジュールが担当するのは、
// 「A〜Zの部屋をどう巡るか」「部屋クリア後に何をするか」「演出をどう見せるか」
// という、クエストモードに固有の進行管理だけである。
//
// 数式の正誤判定・問題生成は、既存のanswer-validator.js／question-manager.jsを
// そのまま呼び出す（クエスト専用の判定ロジックは持たない）。

import {
  APP_CONFIG,
  UNIT_CONFIG,
  UNIT_IDS,
  TRAINING_ANSWER_FORMAT,
  TRAINING_ANSWER_FORMAT_NAMES
} from "../config.js";
import {
  gameState,
  resetQuestionState,
  getCurrentInputString,
  getCurrentSystemInputStrings,
  setEasyChoices,
  getEasyChoiceById,
  getEasyChoiceView,
  eliminateEasyChoice,
  clearEasyChoiceSelection,
  recordEasyChoiceAttempt
} from "../state.js";
import { buildEasyChoices } from "../training/easy-choice-builder.js";
import { toValidatorInput } from "../training/distractor-validator.js";
import * as ui from "../ui.js";
import * as questUi from "../quest/quest-ui.js";
import * as timer from "../timer.js";
import * as questTimer from "../quest/quest-timer.js";
import * as audio from "../audio.js";
import * as questEffects from "../quest/quest-effects.js";
import { generateQuestionFromTemplate } from "../questions/question-manager.js";
import { getCategoriesForUnit } from "../questions/question-manager.js";
import { validateCurrentAnswer } from "../equation/answer-validator.js";
import {
  QUEST_OPENING_ROOM_IDS,
  reportQuestRoomDataProblems
} from "../quest/quest-room-data.js";
import {
  getRoom,
  resolveSuccessTransition,
  resolveFailureTransition,
  isBossRoom
} from "../quest/quest-route-manager.js";
import { isHiddenCategoryMission } from "../quest/quest-category-groups.js";
import {
  pickCategoriesForRoomChoices,
  pickCategoryFromGroup,
  buildCategorySequence,
  pickTemplateForCategory
} from "../quest/quest-category-selector.js";
import {
  questState,
  resetQuestState,
  enterRoom,
  recordEnemyEncounter,
  recordItemAcquired,
  recordRoomResult,
  claimRoomReward,
  addEarnedGoldThisQuest,
  getQuestState
} from "../quest/quest-state.js";
import {
  recordItemAcquisition,
  getTotalGold,
  getClearedRoomIds
} from "../quest/quest-storage.js";
import { getQuestTitle, getTitleRankUp, formatGold } from "../quest/quest-titles.js";

const HINT_MODE_LABELS = {
  immediate: "はじめから",
  after20: "20秒後",
  none: "なし"
};

const OPENING_LINES = [
  "キミは数多くの財宝が眠るという危険なダンジョン――",
  "「イコール・ラビリンス」",
  "に足を踏み入れた。",
  "目の前には、2つの扉がある。",
  "どちらの部屋を選びますか？"
];

let pendingRoomCategoryAssignment = {};
let pendingFailureNextRoomId = null;
let pendingIsBossFailure = false;
let lastUrgentTickSecond = null;

// 直前に表示した部屋選択（オープニングのA・B、または部屋選択画面の2択）と、
// 部屋を選ぶ直前の状態。敵出現画面の「もどる」で部屋選択画面へ戻すために使う。
// 失敗ルート・ボス部屋への直行など、部屋選択を経由しない入室ではnull。
let lastRoomChoiceContext = null;
let pendingBackContext = null;

// 正解表示の「次へ」が押されるのを待っている間の解決関数
let resolveQuestNextAfterCorrect = null;

// 「おてがる」：4択を作れなかった問題を、同じカテゴリから作り直す最大回数
const EASY_REPLACEMENT_ATTEMPTS = 10;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================
// 表示用の小さなヘルパー
// ============================================================

function computeTimeLimitSeconds(timeLimitMultiplier, unit) {
  if (timeLimitMultiplier === null) return null;
  return Math.round(timeLimitMultiplier * UNIT_CONFIG[unit].baseTimeSeconds);
}

function getCategoryNameById(unit, categoryId) {
  const category = getCategoriesForUnit(unit).find((c) => c.id === categoryId);
  return category ? category.name : "―";
}

function buildMissionDisplay(room, categoryLabel) {
  const timeLimitSeconds = computeTimeLimitSeconds(room.mission.timeLimitMultiplier, questState.unit);
  return {
    requiredCorrectText: `${room.mission.requiredCorrect}問`,
    timeLimitText: timeLimitSeconds === null ? "なし" : `${timeLimitSeconds}秒`,
    maxIncorrectText: room.mission.maxIncorrect === null ? "なし" : `${room.mission.maxIncorrect}回`,
    hintText: HINT_MODE_LABELS[room.mission.hintMode],
    categoryLabel
  };
}

function buildRoomChoiceDisplay(room, categoryId, clearedRoomIds) {
  const isHidden = isHiddenCategoryMission(room.mission.requiredCorrect);
  const categoryLabel = isHidden ? "？？？" : getCategoryNameById(questState.unit, categoryId);
  return {
    roomId: room.roomId,
    // 一度もクリアしたことがない部屋には「New!」を付ける
    isNew: !clearedRoomIds.has(room.roomId),
    enemy: room.enemy,
    reward: room.reward,
    missionDisplay: buildMissionDisplay(room, categoryLabel)
  };
}

/**
 * マップ表示用に、訪れた部屋IDの列を「部屋ID＋敵の絵文字」の列へ変換する。
 */
function buildVisitedRoomsForMap() {
  return questState.visitedRoomIds.map((roomId) => ({
    roomId,
    emoji: getRoom(roomId).enemy.emoji
  }));
}

/**
 * 2部屋分のカテゴリを、重複しないよう選出する
 * （必要正解数3問以上の「？？？」部屋は対象外＝groupIdにnullを渡す）。
 */
function buildTwoRoomChoices(roomIdA, roomIdB) {
  const roomA = getRoom(roomIdA);
  const roomB = getRoom(roomIdB);

  const groupInfoA = {
    groupId: isHiddenCategoryMission(roomA.mission.requiredCorrect) ? null : roomA.mission.categoryGroup
  };
  const groupInfoB = {
    groupId: isHiddenCategoryMission(roomB.mission.requiredCorrect) ? null : roomB.mission.categoryGroup
  };

  const [categoryIdA, categoryIdB] = pickCategoriesForRoomChoices(questState.unit, groupInfoA, groupInfoB);
  pendingRoomCategoryAssignment = { [roomIdA]: categoryIdA, [roomIdB]: categoryIdB };

  const clearedRoomIds = getClearedRoomIds();
  return [
    buildRoomChoiceDisplay(roomA, categoryIdA, clearedRoomIds),
    buildRoomChoiceDisplay(roomB, categoryIdB, clearedRoomIds)
  ];
}

// ============================================================
// セッションの開始・停止
// ============================================================

/**
 * クエストモードを開始する（タイトル画面の「冒険を始める」から呼ばれる。
 * トレーニング・段位認定と異なり、共通のカウントダウン画面は経由しない）。
 * @param {string} unit
 */
export async function startQuest(unit) {
  reportQuestRoomDataProblems();

  resetQuestState(unit);
  gameState.unit = unit;
  pendingRoomCategoryAssignment = {};
  pendingFailureNextRoomId = null;
  pendingIsBossFailure = false;

  ui.showScreen("quest");
  questUi.showQuestScreen();
  questUi.renderQuestMap([]);
  questUi.showQuestView("opening");

  await questUi.playOpeningLines(OPENING_LINES);
  const [choiceA, choiceB] = buildTwoRoomChoices(QUEST_OPENING_ROOM_IDS[0], QUEST_OPENING_ROOM_IDS[1]);
  lastRoomChoiceContext = { view: "opening", choices: [choiceA, choiceB] };
  questUi.renderOpeningRoomChoices([choiceA, choiceB], handleRoomChoiceSelected);
  questUi.showOpeningRoomChoices();
}

/**
 * クエストモードのタイマー類をすべて停止する。
 * リタイア・タイトルへ戻るのいずれでも必ず呼び出す。
 */
export function stopQuestSession() {
  questTimer.stopRoomTimer();
  timer.stopQuestionTimer();
  audio.stopQuestEffectSounds();
  questUi.closeTitleRankUp();
  questUi.hideQuestScreen();
  ui.showQuestHud(false);
  ui.showNextQuestionButton(false);
  resolveQuestNextAfterCorrect = null;
  lastRoomChoiceContext = null;
  pendingBackContext = null;
}

// ============================================================
// 部屋選択・入室
// ============================================================

function handleRoomChoiceSelected(roomId) {
  const categoryId = pendingRoomCategoryAssignment[roomId] || null;

  // 敵出現画面の「もどる」で、部屋を選ぶ前の状態へ戻せるよう記録しておく
  pendingBackContext = lastRoomChoiceContext
    ? {
        ...lastRoomChoiceContext,
        snapshot: {
          status: questState.status,
          currentRoomId: questState.currentRoomId,
          currentStage: questState.currentStage,
          currentRoom: questState.currentRoom,
          visitedRoomIds: [...questState.visitedRoomIds],
          encounteredEnemyCount: questState.encounteredEnemies.length,
          pendingRoomCategoryAssignment: { ...pendingRoomCategoryAssignment }
        }
      }
    : null;

  enterRoomAndBeginMission(roomId, {
    preAssignedCategoryId: categoryId,
    canGoBack: pendingBackContext !== null
  });
}

/**
 * 敵出現画面の「もどる」：部屋を選ぶ前の状態（訪れた部屋・出会った敵・マップ）へ戻し、
 * 同じ2択（同じ出題カテゴリ）の部屋選択画面を表示し直す。タイマーはまだ動いていない。
 */
function handleIntroBack() {
  if (!pendingBackContext || questState.status !== "enemy-intro") return;
  const { view, choices, snapshot } = pendingBackContext;
  pendingBackContext = null;

  questState.currentRoomId = snapshot.currentRoomId;
  questState.currentStage = snapshot.currentStage;
  questState.currentRoom = snapshot.currentRoom;
  questState.visitedRoomIds = snapshot.visitedRoomIds;
  questState.encounteredEnemies = questState.encounteredEnemies.slice(0, snapshot.encounteredEnemyCount);
  pendingRoomCategoryAssignment = snapshot.pendingRoomCategoryAssignment;
  questUi.renderQuestMap(buildVisitedRoomsForMap());

  if (view === "opening") {
    questState.status = snapshot.status;
    questUi.showQuestView("opening");
    questUi.renderOpeningRoomChoices(choices, handleRoomChoiceSelected);
    questUi.showOpeningRoomChoices();
  } else {
    questState.status = "room-select";
    questUi.showQuestView("room-select");
    questUi.renderRoomSelectChoices(choices, handleRoomChoiceSelected);
  }
}

async function enterRoomAndBeginMission(roomId, options = {}) {
  const { preAssignedCategoryId = null, canGoBack = false } = options;
  if (!canGoBack) {
    pendingBackContext = null;
  }
  const room = getRoom(roomId);
  const previousCategoryId = questState.currentRoom.categoryId;

  enterRoom(roomId);
  questState.currentStage = room.stage;
  recordEnemyEncounter(room.enemy);
  questUi.renderQuestMap(buildVisitedRoomsForMap());

  const isHidden = isHiddenCategoryMission(room.mission.requiredCorrect);
  if (isHidden) {
    questState.currentRoom.questionCategorySequence = buildCategorySequence(
      questState.unit,
      room.mission.categoryGroup,
      room.mission.requiredCorrect
    );
    questState.currentRoom.categoryId = questState.currentRoom.questionCategorySequence[0];
  } else {
    const categoryId =
      preAssignedCategoryId ||
      pickCategoryFromGroup(
        questState.unit,
        room.mission.categoryGroup,
        previousCategoryId ? [previousCategoryId] : []
      );
    questState.currentRoom.categoryId = categoryId;
    // 必要正解数1〜2問の部屋は、同じカテゴリを部屋内の全問で使う（「？？？」にはしない）ため、
    // 必要正解数の分だけ同じcategoryIdを並べ、2問目以降もquestionCategorySequenceの
    // 範囲内に収まるようにする（1要素だけだと2問目でundefinedになり出題が止まってしまう）。
    questState.currentRoom.questionCategorySequence = Array(room.mission.requiredCorrect).fill(categoryId);
  }

  const timeLimitSeconds = computeTimeLimitSeconds(room.mission.timeLimitMultiplier, questState.unit);
  questState.currentRoom.timeLimitMs = timeLimitSeconds === null ? null : timeLimitSeconds * 1000;
  questState.currentRoom.remainingTimeMs = questState.currentRoom.timeLimitMs;

  showEnemyIntro(room, isHidden, canGoBack);
}

function showEnemyIntro(room, isHidden, canGoBack = false) {
  const categoryLabel = isHidden ? "？？？" : getCategoryNameById(questState.unit, questState.currentRoom.categoryId);
  const isBoss = isBossRoom(room);

  questState.status = "enemy-intro";
  questUi.showQuestView("enemy-intro");
  questUi.renderEnemyIntro({
    roomId: room.roomId,
    enemy: room.enemy,
    reward: room.reward,
    isBoss,
    canGoBack,
    missionDisplay: buildMissionDisplay(room, categoryLabel)
  });

  questEffects.playEnemyAppearEffect(questUi.getEnemyIntroEmojiElement(), { isBoss });
}

// ============================================================
// 「たたかう」→ カウントダウン → 出題
// ============================================================

/**
 * トレーニング・段位認定と同じ「3・2・1・START!」のカウントダウン画面を挟む。
 * 部屋タイマー・問題タイマーはこの後のbeginQuestQuestion()内で開始するため、
 * カウントダウン中はどちらのタイマーも動いていない。
 */
async function runQuestCountdown() {
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

async function handleFight() {
  await runQuestCountdown();
  await beginQuestQuestion();
}

// ============================================================
// 「おてがる」（4択）
// トレーニングと同じ4択の作り方・判定（既存のvalidateCurrentAnswer()）を使う。
// 部屋のルール（必要正解数・ミス上限・制限時間・ヒント条件）はスタンダードと同じ。
// ============================================================

function isQuestEasyFormat() {
  return gameState.questAnswerFormat === TRAINING_ANSWER_FORMAT.EASY;
}

/**
 * 現在の問題が4択で出題されているか（4択を作れずスタンダードで出題した問題はfalse）。
 */
function isCurrentQuestionEasy() {
  return isQuestEasyFormat() && gameState.currentEasyChoices.length > 0;
}

/**
 * 問題の4択を1回だけ用意する。作れない場合は同じカテゴリから問題を作り直し、
 * それでも作れなければnullを返す（その問題はスタンダードで出題する）。
 * @returns {{question: object, template: object, choices: object}|null}
 */
function prepareEasyQuestion(question, template, categoryId) {
  let built = buildEasyChoices(question, questState.unit);
  let currentQuestion = question;
  let currentTemplate = template;

  for (let attempt = 0; !built && attempt < EASY_REPLACEMENT_ATTEMPTS; attempt += 1) {
    currentTemplate = pickTemplateForCategory(questState.unit, categoryId, null);
    currentQuestion = generateQuestionFromTemplate(currentTemplate, questState.unit);
    built = buildEasyChoices(currentQuestion, questState.unit);
  }

  if (!built) {
    console.warn(
      `おてがるの4択を作れなかったため、この問題はスタンダード（数式入力）で出題します（${question.templateId}）。`
    );
    return null;
  }
  return { question: currentQuestion, template: currentTemplate, choices: built };
}

function refreshQuestEasyChoices(options = {}) {
  ui.renderEasyChoices(gameState.currentEasyChoices, getEasyChoiceView(options));
}

/**
 * 4択で選んだ式を、既存の正誤判定へ渡して判定する（選択肢のisCorrectフラグでは判定しない）。
 * 不正解の選択肢には×をつけて選べなくし、部屋のミス数を1つ増やす（ミス上限に達すれば失敗）。
 */
async function handleQuestEasySubmit() {
  const choice = getEasyChoiceById(gameState.selectedEasyChoiceId);
  if (!choice || gameState.eliminatedEasyChoiceIds.includes(choice.id)) return;

  const result = validateCurrentAnswer(
    questState.unit,
    toValidatorInput(questState.unit, choice.equations),
    gameState.currentQuestion
  );

  if (result.status === "correct") {
    recordEasyChoiceAttempt(choice, true);
    await handleQuestCorrectAnswer();
    return;
  }

  if (result.status === "incorrect") {
    recordEasyChoiceAttempt(choice, false);
    eliminateEasyChoice(choice.id);
    clearEasyChoiceSelection();
    ui.setSubmitButtonEnabled(false);
    ui.setEasyChoiceFeedback(
      `✕ ${choice.label}　もう一度、問題文と式を見比べてみよう！`,
      "incorrect"
    );
    refreshQuestEasyChoices({ flashChoiceId: choice.id });
    await handleQuestIncorrectAnswer();
    return;
  }

  console.warn("おてがるの選択肢が入力エラーと判定されました。", choice.equations, result);
  ui.showJudgeMessage("input-error", result.message);
}

async function beginQuestQuestion() {
  questState.status = "playing";
  resetQuestionState();

  const room = getRoom(questState.currentRoomId);
  const categoryId = questState.currentRoom.questionCategorySequence[questState.currentRoom.currentQuestionIndex];
  let template = pickTemplateForCategory(questState.unit, categoryId, questState.currentRoom.lastTemplateId);
  let question = generateQuestionFromTemplate(template, questState.unit);

  if (isQuestEasyFormat()) {
    const prepared = prepareEasyQuestion(question, template, categoryId);
    if (prepared) {
      question = prepared.question;
      template = prepared.template;
      setEasyChoices(prepared.choices.choices, prepared.choices.correctChoiceId);
    }
  }

  questState.currentRoom.lastTemplateId = template.templateId;
  gameState.currentQuestion = question;

  ui.showScreen("game");
  ui.resetGameScreenPanels();
  ui.showRankHud(false);
  ui.showQuestHud(true);
  ui.showRetireButton(true);
  ui.setPassButtonVisible(false);
  ui.showEquationInputMode(questState.unit);
  ui.renderQuestionPrompt(question.prompt);
  ui.renderDiagram(question.diagram || null);
  refreshQuestEquationDisplay();
  ui.renderEquationKeypad(question);
  ui.setSubmitButtonEnabled(false);

  // おてがる：数式入力欄・数式キーボードの代わりに4択を表示する
  if (isCurrentQuestionEasy()) {
    ui.showEasyChoiceMode(true);
    refreshQuestEasyChoices();
  }

  updateQuestHudDisplay();
  applyHintModeForQuestion(room.mission.hintMode);

  gameState.passAvailable = false;
  ui.setPassButtonEnabled(false);

  if (questState.currentRoom.currentQuestionIndex === 0) {
    startRoomTimerForCurrentRoom();
  } else {
    questTimer.resumeRoomTimer();
  }

  timer.startQuestionTimer(
    room.mission.hintMode === "after20"
      ? {
          onHintAvailable: () => {
            gameState.hintAvailable = true;
            ui.setHintButtonEnabled(true);
          }
        }
      : {}
  );
}

function refreshQuestEquationDisplay() {
  if (questState.unit === UNIT_IDS.SIMULTANEOUS) {
    ui.renderSystemEquationInput(
      gameState.currentSystemInputTokens,
      gameState.systemCursorPositions,
      gameState.activeSystemEquationIndex
    );
  } else {
    ui.renderEquationInput(gameState.currentInputTokens, gameState.cursorPosition);
  }
}

function applyHintModeForQuestion(hintMode) {
  if (hintMode === "immediate") {
    gameState.hintAvailable = true;
    ui.setHintButtonEnabled(true);
  } else {
    // "after20"は、開始したtimer.startQuestionTimer()のonHintAvailableが解禁する
    gameState.hintAvailable = false;
    ui.setHintButtonEnabled(false);
  }
}

function startRoomTimerForCurrentRoom() {
  lastUrgentTickSecond = null;
  questTimer.startRoomTimer(questState.currentRoom.timeLimitMs, {
    onTick: (remainingMs) => {
      questState.currentRoom.remainingTimeMs = remainingMs;
      updateQuestHudDisplay();

      // 制限時間のある部屋でのみ発火する（onTick自体、制限時間なしの部屋では
      // quest-timer.jsがタイマーを起動しないため呼ばれない）。段位認定モードと
      // 同じ残り時間から、1秒につき1回だけ効果音を鳴らす。
      const remainingSeconds = Math.ceil(remainingMs / 1000);
      const isUrgent = remainingMs > 0 && remainingMs <= APP_CONFIG.rankUrgentThresholdSeconds * 1000;
      if (isUrgent && lastUrgentTickSecond !== remainingSeconds) {
        lastUrgentTickSecond = remainingSeconds;
        audio.playUrgentTickSound();
      }
    },
    onExpired: handleRoomTimeExpired
  });
}

function updateQuestHudDisplay() {
  const room = getRoom(questState.currentRoomId);
  ui.renderQuestHud({
    stage: questState.currentStage,
    roomId: questState.currentRoomId,
    enemyEmoji: room.enemy.emoji,
    correctCount: questState.currentRoom.correctCount,
    requiredCorrect: room.mission.requiredCorrect,
    incorrectCount: questState.currentRoom.incorrectCount,
    maxIncorrect: room.mission.maxIncorrect,
    remainingSecondsText:
      questState.currentRoom.remainingTimeMs === null
        ? null
        : Math.ceil(questState.currentRoom.remainingTimeMs / 1000)
  });
}

// ============================================================
// 解答処理
// ============================================================

function lockQuestQuestionInput() {
  gameState.inputLocked = true;
  ui.setKeyboardEnabled(false);
  ui.setSubmitButtonEnabled(false);
  ui.setHintButtonEnabled(false);
  ui.clearJudgeMessage();
  if (isCurrentQuestionEasy()) {
    refreshQuestEasyChoices();
  }
}

function getQuestDisplayEquation() {
  if (questState.unit === UNIT_IDS.SIMULTANEOUS) {
    return gameState.currentQuestion.canonicalEquations.map((equation) => equation.internal);
  }
  if (questState.unit === UNIT_IDS.QUADRATIC) {
    return gameState.currentQuestion.canonicalEquation.internal;
  }
  return gameState.currentQuestion.canonicalEquation;
}

export async function handleSubmit() {
  if (gameState.inputLocked) return;

  if (isCurrentQuestionEasy()) {
    await handleQuestEasySubmit();
    return;
  }

  const input =
    questState.unit === UNIT_IDS.SIMULTANEOUS
      ? getCurrentSystemInputStrings()
      : getCurrentInputString();
  const result = validateCurrentAnswer(questState.unit, input, gameState.currentQuestion);

  if (result.status === "correct") {
    await handleQuestCorrectAnswer();
  } else if (result.status === "incorrect") {
    await handleQuestIncorrectAnswer();
  } else {
    ui.showJudgeMessage("input-error", result.message);
  }
}

async function handleQuestIncorrectAnswer() {
  questState.currentRoom.incorrectCount += 1;
  questState.totals.incorrectCount += 1;
  gameState.currentQuestionIncorrectCount += 1;

  questTimer.pauseRoomTimer();
  audio.playIncorrectSound();
  ui.showJudgeMessage("incorrect", "もう一度考えよう");
  updateQuestHudDisplay();

  const room = getRoom(questState.currentRoomId);
  if (room.mission.maxIncorrect !== null && questState.currentRoom.incorrectCount >= room.mission.maxIncorrect) {
    await sleep(700);
    const elapsedSeconds = timer.stopQuestionTimer();
    recordQuestHistory("incorrect", elapsedSeconds);
    await handleMissionFailure("incorrect-limit");
    return;
  }

  await sleep(1000);
  questTimer.resumeRoomTimer();
}

async function handleQuestCorrectAnswer() {
  const elapsedSeconds = timer.stopQuestionTimer();
  lockQuestQuestionInput();
  questTimer.pauseRoomTimer();

  // おてがる：正解の選択肢に○をつけ、「ここがポイント！」（explanation）を用意する
  if (isCurrentQuestionEasy()) {
    refreshQuestEasyChoices({ revealCorrect: true });
    ui.setEasyChoiceFeedback("");
    ui.setAnswerRevealPoint(gameState.currentQuestion.explanation || null);
  }

  audio.playCorrectSound();
  ui.showAnswerReveal(
    "correct",
    "正解です！",
    getQuestDisplayEquation(),
    gameState.currentQuestion.solutionDisplay
  );

  questState.currentRoom.correctCount += 1;
  questState.totals.correctCount += 1;
  recordQuestHistory("correct", elapsedSeconds);
  updateQuestHudDisplay();

  const room = getRoom(questState.currentRoomId);

  // 「次へ」を押すまで正解表示を残す（部屋の制限時間は止まったまま）
  await waitForQuestNextAfterCorrect();
  ui.hideAnswerReveal();

  if (questState.currentRoom.correctCount >= room.mission.requiredCorrect) {
    await handleMissionSuccess();
    return;
  }

  const remaining = room.mission.requiredCorrect - questState.currentRoom.correctCount;
  ui.showJudgeMessage("correct", `あと${remaining}問！`);
  await sleep(700);

  questState.currentRoom.currentQuestionIndex += 1;
  questState.currentRoom.categoryId =
    questState.currentRoom.questionCategorySequence[questState.currentRoom.currentQuestionIndex];

  await beginQuestQuestion();
  questTimer.resumeRoomTimer();
}

/**
 * 正解表示の「次へ」ボタンを表示し、押されるまで待つ。
 */
function waitForQuestNextAfterCorrect() {
  ui.showNextQuestionButton(true);
  return new Promise((resolve) => {
    resolveQuestNextAfterCorrect = resolve;
  });
}

/**
 * 正解表示の「次へ」が押されたとき（game.jsのhandleNextQuestion()から呼ばれる）。
 */
export function handleNextAfterCorrect() {
  ui.showNextQuestionButton(false);
  if (!resolveQuestNextAfterCorrect) return;
  const resolve = resolveQuestNextAfterCorrect;
  resolveQuestNextAfterCorrect = null;
  resolve();
}

async function handleRoomTimeExpired() {
  if (gameState.inputLocked) return;

  const elapsedSeconds = timer.stopQuestionTimer();
  lockQuestQuestionInput();

  audio.playTimeUpSound();
  ui.showJudgeMessage("incorrect", "時間切れ");
  recordQuestHistory("timeout", elapsedSeconds);

  await sleep(700);
  await handleMissionFailure("timeout");
}

function recordQuestHistory(result, elapsedSeconds) {
  const room = getRoom(questState.currentRoomId);

  if (gameState.currentQuestionHintUsed) {
    questState.currentRoom.hintUseCount += 1;
    questState.totals.hintUseCount += 1;
  }

  const baseEntry = {
    questionNumber: questState.currentRoom.currentQuestionIndex + 1,
    unit: questState.unit,
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
    usedHintPartValues: [...gameState.usedHintPartValues],

    // 出題形式（おてがるで出題した問題は、選んだ式の順番と4択の内容も記録する）
    answerFormat: isCurrentQuestionEasy() ? TRAINING_ANSWER_FORMAT.EASY : TRAINING_ANSWER_FORMAT.STANDARD,
    answerFormatName: TRAINING_ANSWER_FORMAT_NAMES[
      isCurrentQuestionEasy() ? TRAINING_ANSWER_FORMAT.EASY : TRAINING_ANSWER_FORMAT.STANDARD
    ],
    ...(isCurrentQuestionEasy()
      ? {
          selectedChoiceHistory: gameState.easyChoiceAttempts.map((attempt) => ({
            label: attempt.label,
            equations: [...attempt.equations],
            correct: attempt.correct
          })),
          easyChoices: gameState.currentEasyChoices.map((choice) => ({
            label: choice.label,
            equations: [...choice.equations],
            isCorrect: choice.isCorrect,
            distractorType: choice.distractorType
          }))
        }
      : {}),

    // クエストモード専用の追加項目
    questMode: true,
    stage: questState.currentStage,
    roomId: questState.currentRoomId,
    enemyName: room.enemy.name,
    roomQuestionNumber: questState.currentRoom.currentQuestionIndex + 1,
    roomRemainingTimeText:
      questState.currentRoom.remainingTimeMs === null
        ? null
        : (questState.currentRoom.remainingTimeMs / 1000).toFixed(1),
    roomIncorrectCount: questState.currentRoom.incorrectCount,
    beforeMissionClear: result === "correct"
      ? questState.currentRoom.correctCount < room.mission.requiredCorrect
      : true,
    isTimeout: result === "timeout",
    isMaxIncorrectReached:
      room.mission.maxIncorrect !== null && questState.currentRoom.incorrectCount >= room.mission.maxIncorrect
  };

  let entry;
  if (questState.unit === UNIT_IDS.SIMULTANEOUS) {
    const [lastInput1, lastInput2] = getCurrentSystemInputStrings();
    entry = {
      ...baseEntry,
      lastInput1,
      lastInput2,
      modelEquation1: gameState.currentQuestion.canonicalEquations[0].internal,
      modelEquation2: gameState.currentQuestion.canonicalEquations[1].internal
    };
  } else {
    const modelEquation =
      questState.unit === UNIT_IDS.QUADRATIC
        ? gameState.currentQuestion.canonicalEquation.internal
        : gameState.currentQuestion.canonicalEquation;
    entry = {
      ...baseEntry,
      variableDefinition: gameState.currentQuestion.variableDefinition,
      lastInput: getCurrentInputString(),
      modelEquation
    };
  }

  gameState.history.push(entry);
}

// ============================================================
// ミッション成功
// ============================================================

async function handleMissionSuccess() {
  const room = getRoom(questState.currentRoomId);

  recordRoomResult({
    roomId: room.roomId,
    outcome: "success",
    correctCount: questState.currentRoom.correctCount,
    incorrectCount: questState.currentRoom.incorrectCount
  });

  questTimer.stopRoomTimer();
  ui.showQuestHud(false);

  questState.status = "victory";
  ui.showScreen("quest");
  questUi.showQuestScreen();
  questUi.showQuestView("victory");
  questUi.renderVictory(room);

  await questEffects.playEnemyDefeatEffect(questUi.getVictoryEmojiElement(), { isBoss: isBossRoom(room) });
  await sleep(400);

  questState.status = "treasure";
  questUi.showQuestView("treasure");
  questUi.resetTreasureChest();
  questEffects.playTreasureFoundEffect();
}

/**
 * 部屋のreward（1つ以上のアイテム候補の配列）から、宝箱を開けたときに実際に
 * 手に入るアイテムを1つランダムに選ぶ。要素が1つの部屋（ステージ4・5）は、
 * 常にその1つになる。
 */
function pickRandomReward(rewardPool) {
  const index = Math.floor(Math.random() * rewardPool.length);
  return rewardPool[index];
}

/**
 * 宝箱を開ける。入手アイテムを確定したら、演出より先にアイテム（所持数）と価値（G）を
 * まとめて保存する（演出の途中でブラウザを閉じても、アイテム・所持数・累計Gが残るように）。
 * 1回の部屋クリアにつき報酬の保存は1回だけ（claimRoomReward()）で、ダブルクリックや
 * 演出の再実行があっても、所持数とGが二重に増えることはない。
 */
async function handleOpenChest() {
  if (!claimRoomReward()) return;

  const room = getRoom(questState.currentRoomId);
  const reward = pickRandomReward(room.reward);

  const acquisition = recordItemAcquisition(reward, room.roomId);
  recordItemAcquired(reward);
  addEarnedGoldThisQuest(acquisition.goldValue);
  const rankUpTitle = getTitleRankUp(acquisition.previousTotalGold, acquisition.totalGold);

  questUi.markTreasureChestOpen();
  await questEffects.playTreasureOpenEffect(questUi.getTreasureChestElement());

  questUi.showQuestView("item-get");
  questUi.setItemGetNextEnabled(false);
  questUi.renderItemGet({
    reward,
    count: acquisition.item.count,
    // 初めて獲得したアイテムには「New!」を付ける
    isNew: acquisition.item.count === 1,
    goldValue: acquisition.goldValue,
    previousTotalGold: acquisition.previousTotalGold,
    totalGold: acquisition.totalGold
  });
  await questEffects.playItemRevealEffect(questUi.getItemGetEmojiElement());
  await questEffects.playGoldCountUpEffect(
    questUi.getItemGetTotalAfterElement(),
    acquisition.previousTotalGold,
    acquisition.totalGold,
    formatGold
  );

  // 称号が上がった場合だけ、アイテム獲得演出のあとに短く表示する
  // （部屋はクリア済みで、部屋の制限時間も止まっているため、攻略上の時間には影響しない）
  // 称号ランクアップはポップアップで表示し、閉じてから「次へ」を押せるようにする
  if (rankUpTitle) {
    await sleep(300);
    const { panel, closed } = questUi.openTitleRankUp(rankUpTitle);
    await questEffects.playTitleRankUpEffect(panel);
    await closed;
  }
  questUi.setItemGetNextEnabled(true);
}

async function handleItemGetNext() {
  const room = getRoom(questState.currentRoomId);
  const transition = resolveSuccessTransition(room);

  if (transition.type === "ending") {
    await showQuestClearEnding();
    return;
  }

  if (transition.type === "direct") {
    questUi.showQuestView("opening");
    await questUi.playOpeningLines(["迷宮の最深部へ進む……"]);
    await enterRoomAndBeginMission(transition.roomId);
    return;
  }

  const [choiceA, choiceB] = buildTwoRoomChoices(transition.roomIds[0], transition.roomIds[1]);
  questState.status = "room-select";
  questUi.showQuestView("room-select");
  lastRoomChoiceContext = { view: "room-select", choices: [choiceA, choiceB] };
  questUi.renderRoomSelectChoices([choiceA, choiceB], handleRoomChoiceSelected);
}

// ============================================================
// ミッション失敗
// ============================================================

async function handleMissionFailure(reason) {
  const room = getRoom(questState.currentRoomId);

  recordRoomResult({
    roomId: room.roomId,
    outcome: "failure",
    reason,
    correctCount: questState.currentRoom.correctCount,
    incorrectCount: questState.currentRoom.incorrectCount
  });

  lockQuestQuestionInput();
  questTimer.stopRoomTimer();
  timer.stopQuestionTimer();
  ui.hideAnswerReveal();

  await questEffects.playRetreatEffect();

  ui.showScreen("quest");
  questUi.showQuestScreen();

  const transition = resolveFailureTransition(room);

  if (transition.type === "ending") {
    questState.status = "failed";
    pendingIsBossFailure = true;
    questUi.showQuestView("failure");
    questUi.renderFailureMessage([
      "このままでは勝てない！",
      "キミは全速力で逃げ出し、",
      "イコール・ラビリンスを脱出した……。"
    ]);
    return;
  }

  questState.status = "failed";
  const nextRoom = getRoom(transition.roomId);
  pendingFailureNextRoomId = transition.roomId;
  questUi.showQuestView("failure");
  questUi.renderFailureMessage([
    "このままでは勝てない！",
    "キミは全速力で逃げ出した！",
    "逃げ出した先は",
    `${nextRoom.roomId}の部屋だった……。`
  ]);
}

function handleFailureNext() {
  if (pendingIsBossFailure) {
    pendingIsBossFailure = false;
    showQuestDefeatEnding();
    return;
  }
  const roomId = pendingFailureNextRoomId;
  pendingFailureNextRoomId = null;
  enterRoomAndBeginMission(roomId);
}

// ============================================================
// 冒険結果（ボス撃破エンディング／敗走エンディング／リタイア結果）
// ============================================================

function buildQuestSummaryData(heading, message, isVictory) {
  return {
    heading,
    message,
    isVictory,
    enemies: questState.encounteredEnemies,
    items: questState.acquiredItemsThisRun,
    correctCount: questState.totals.correctCount,
    incorrectCount: questState.totals.incorrectCount,
    hintUseCount: questState.totals.hintUseCount,
    clearedRoomCount: questState.roomResults.filter((r) => r.outcome === "success").length,
    unitDisplayName: UNIT_CONFIG[questState.unit].displayName,
    answerFormatName: TRAINING_ANSWER_FORMAT_NAMES[gameState.questAnswerFormat],
    earnedGold: questState.earnedGoldThisQuest,
    totalGold: getTotalGold(),
    titleName: getQuestTitle(getTotalGold()).title
  };
}

async function showQuestSummaryScreen(heading, message, isVictory = false) {
  questUi.showQuestView("summary");
  questUi.renderQuestSummary(buildQuestSummaryData(heading, message, isVictory));
}

async function showQuestClearEnding() {
  questState.status = "ending-success";
  await questEffects.playQuestClearEffect();
  await showQuestSummaryScreen(
    "イコール・ラビリンス攻略！",
    "キミは数々の試練を乗り越え、迷宮から生還した！",
    true
  );
}

async function showQuestDefeatEnding() {
  questState.status = "ending-failure";
  await showQuestSummaryScreen(
    "冒険の記録",
    "今回手に入れた財宝は、次の冒険にも引き継がれます。"
  );
}

function handleSummaryToTitle() {
  stopQuestSession();
  onBackToTitleRequest();
}

// ============================================================
// リタイア
// ============================================================

export function handleRetireRequest() {
  questUi.showRetireConfirm();
}

function handleRetireConfirmNo() {
  questUi.hideRetireConfirm();
}

async function handleRetireConfirmYes() {
  questUi.hideRetireConfirm();

  questTimer.stopRoomTimer();
  timer.stopQuestionTimer();
  audio.stopQuestEffectSounds();
  ui.hideAnswerReveal();
  ui.hideHintPanel();

  questState.status = "retired";

  ui.showScreen("quest");
  questUi.showQuestScreen();
  await questEffects.playRetreatEffect();
  await showQuestSummaryScreen("リタイアしました", "");
}

// ============================================================
// 初期化
// ============================================================

let onBackToTitleRequest = () => {};

/**
 * クエスト専用画面のイベントを一度だけ登録する（game.jsのinitGame()から呼び出す）。
 * @param {{onBackToTitle: Function}} callbacks
 */
export function initQuestModeUI(callbacks) {
  onBackToTitleRequest = callbacks.onBackToTitle || onBackToTitleRequest;

  questUi.initQuestUI({
    onFight: handleFight,
    onIntroRetire: handleRetireRequest,
    onIntroBack: handleIntroBack,
    onOpenChest: handleOpenChest,
    onItemGetNext: handleItemGetNext,
    onFailureNext: handleFailureNext,
    onSummaryToTitle: handleSummaryToTitle,
    onRetireConfirmYes: handleRetireConfirmYes,
    onRetireConfirmNo: handleRetireConfirmNo
  });
}

export { getQuestState };
