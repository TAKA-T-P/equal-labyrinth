// クエストモードの進行を管理するモジュール
// 段位認定モード（rank-mode.js）と同じ方針：数式入力（キー入力・カーソル移動・
// ヒント表示・ヒント式パーツ・x²/□²入力）はモードに依存しない共通処理のため、
// game.js側の実装をそのまま利用する。このモジュールが担当するのは、
// 「A〜Zの部屋をどう巡るか」「部屋クリア後に何をするか」「演出をどう見せるか」
// という、クエストモードに固有の進行管理だけである。
//
// 数式の正誤判定・問題生成は、既存のanswer-validator.js／question-manager.jsを
// そのまま呼び出す（クエスト専用の判定ロジックは持たない）。

import { APP_CONFIG, UNIT_CONFIG, UNIT_IDS } from "../config.js";
import {
  gameState,
  resetQuestionState,
  getCurrentInputString,
  getCurrentSystemInputStrings
} from "../state.js";
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
  getQuestState
} from "../quest/quest-state.js";
import { recordItemObtained } from "../quest/quest-storage.js";

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

function buildRoomChoiceDisplay(room, categoryId) {
  const isHidden = isHiddenCategoryMission(room.mission.requiredCorrect);
  const categoryLabel = isHidden ? "？？？" : getCategoryNameById(questState.unit, categoryId);
  return {
    roomId: room.roomId,
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

  return [buildRoomChoiceDisplay(roomA, categoryIdA), buildRoomChoiceDisplay(roomB, categoryIdB)];
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
  questUi.hideQuestScreen();
  ui.showQuestHud(false);
}

// ============================================================
// 部屋選択・入室
// ============================================================

function handleRoomChoiceSelected(roomId) {
  const categoryId = pendingRoomCategoryAssignment[roomId] || null;
  enterRoomAndBeginMission(roomId, { preAssignedCategoryId: categoryId });
}

async function enterRoomAndBeginMission(roomId, options = {}) {
  const { preAssignedCategoryId = null } = options;
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

  showEnemyIntro(room, isHidden);
}

function showEnemyIntro(room, isHidden) {
  const categoryLabel = isHidden ? "？？？" : getCategoryNameById(questState.unit, questState.currentRoom.categoryId);
  const isBoss = isBossRoom(room);

  questState.status = "enemy-intro";
  questUi.showQuestView("enemy-intro");
  questUi.renderEnemyIntro({
    roomId: room.roomId,
    enemy: room.enemy,
    reward: room.reward,
    isBoss,
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

async function beginQuestQuestion() {
  questState.status = "playing";
  resetQuestionState();

  const room = getRoom(questState.currentRoomId);
  const categoryId = questState.currentRoom.questionCategorySequence[questState.currentRoom.currentQuestionIndex];
  const template = pickTemplateForCategory(questState.unit, categoryId, questState.currentRoom.lastTemplateId);
  const question = generateQuestionFromTemplate(template, questState.unit);
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

  if (questState.currentRoom.correctCount >= room.mission.requiredCorrect) {
    await sleep(APP_CONFIG.correctDisplayMilliseconds);
    ui.hideAnswerReveal();
    await handleMissionSuccess();
    return;
  }

  await sleep(APP_CONFIG.correctDisplayMilliseconds);
  ui.hideAnswerReveal();

  const remaining = room.mission.requiredCorrect - questState.currentRoom.correctCount;
  ui.showJudgeMessage("correct", `あと${remaining}問！`);
  await sleep(700);

  questState.currentRoom.currentQuestionIndex += 1;
  questState.currentRoom.categoryId =
    questState.currentRoom.questionCategorySequence[questState.currentRoom.currentQuestionIndex];

  await beginQuestQuestion();
  questTimer.resumeRoomTimer();
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

async function handleOpenChest() {
  const room = getRoom(questState.currentRoomId);

  questUi.markTreasureChestOpen();
  await questEffects.playTreasureOpenEffect(questUi.getTreasureChestElement());

  const updatedItem = recordItemObtained(room.reward);
  recordItemAcquired(room.reward);

  questUi.showQuestView("item-get");
  questUi.renderItemGet({ reward: room.reward, count: updatedItem.count });
  await questEffects.playItemRevealEffect(questUi.getItemGetEmojiElement());
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

function buildQuestSummaryData(heading, message) {
  return {
    heading,
    message,
    enemies: questState.encounteredEnemies,
    items: questState.acquiredItemsThisRun,
    correctCount: questState.totals.correctCount,
    incorrectCount: questState.totals.incorrectCount,
    hintUseCount: questState.totals.hintUseCount,
    clearedRoomCount: questState.roomResults.filter((r) => r.outcome === "success").length,
    unitDisplayName: UNIT_CONFIG[questState.unit].displayName
  };
}

async function showQuestSummaryScreen(heading, message) {
  questUi.showQuestView("summary");
  questUi.renderQuestSummary(buildQuestSummaryData(heading, message));
}

async function showQuestClearEnding() {
  questState.status = "ending-success";
  await questEffects.playQuestClearEffect();
  await showQuestSummaryScreen(
    "イコール・ラビリンス攻略！",
    "キミは数々の試練を乗り越え、迷宮から生還した！"
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
  await showQuestSummaryScreen(
    "リタイアしました",
    "今回手に入れた財宝は、次の冒険にも引き継がれます。"
  );
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
    onOpenChest: handleOpenChest,
    onItemGetNext: handleItemGetNext,
    onFailureNext: handleFailureNext,
    onSummaryToTitle: handleSummaryToTitle,
    onRetireConfirmYes: handleRetireConfirmYes,
    onRetireConfirmNo: handleRetireConfirmNo
  });
}

export { getQuestState };
