// クエストモード：セッション状態の一元管理
// state.js（gameState）と同じ方針で、専用関数を通してのみ変更する。
// 数式入力欄そのもの（currentInputTokensなど）はgameStateを引き続き使う
// （クエストモード専用の入力欄は持たない＝既存の入力処理をそのまま再利用するため）。

function createEmptyCurrentRoom() {
  return {
    roomId: null,

    categoryId: null,
    questionCategorySequence: [],
    currentQuestionIndex: 0,

    correctCount: 0,
    incorrectCount: 0,

    hintUseCount: 0,

    lastTemplateId: null,

    timeLimitMs: null,
    remainingTimeMs: null,
    timerRunning: false,

    // 宝箱の報酬（アイテム＋G）をこの部屋ですでに保存したか。1回の部屋クリアにつき
    // 報酬の保存は1回だけにする（ダブルクリック・演出の再実行による二重加算を防ぐ）
    rewardGranted: false
  };
}

export const questState = {
  unit: "linear",

  currentStage: 1,
  currentRoomId: null,

  visitedRoomIds: [],
  encounteredEnemies: [],
  acquiredItemsThisRun: [],

  roomResults: [],

  // 今回の冒険中に獲得したG（冒険結果の画面に表示するだけで、永続保存はしない）
  earnedGoldThisQuest: 0,

  currentRoom: createEmptyCurrentRoom(),

  totals: {
    correctCount: 0,
    incorrectCount: 0,
    hintUseCount: 0
  },

  status: "opening",

  // ステージ5で敗北した際も、「どのボスに挑んでいたか」を結果画面で示すために保持する
  finalRoomId: null
};

export function resetQuestState(unit) {
  questState.unit = unit;

  questState.currentStage = 1;
  questState.currentRoomId = null;

  questState.visitedRoomIds = [];
  questState.encounteredEnemies = [];
  questState.acquiredItemsThisRun = [];

  questState.roomResults = [];
  questState.earnedGoldThisQuest = 0;

  questState.currentRoom = createEmptyCurrentRoom();

  questState.totals = {
    correctCount: 0,
    incorrectCount: 0,
    hintUseCount: 0
  };

  questState.status = "opening";
  questState.finalRoomId = null;
}

/**
 * 新しい部屋へ入るときに、部屋固有の状態だけをリセットする
 * （visitedRoomIds・encounteredEnemies・acquiredItemsThisRunなどの冒険全体の記録は残す）。
 */
export function enterRoom(roomId) {
  questState.currentRoomId = roomId;
  questState.currentRoom = createEmptyCurrentRoom();
  questState.currentRoom.roomId = roomId;

  if (!questState.visitedRoomIds.includes(roomId)) {
    questState.visitedRoomIds.push(roomId);
  }
}

export function recordEnemyEncounter(enemy) {
  questState.encounteredEnemies.push({ ...enemy });
}

export function recordItemAcquired(reward) {
  questState.acquiredItemsThisRun.push({ ...reward });
}

/**
 * 現在の部屋の報酬を保存済みにする。すでに保存済みだった場合はfalseを返す
 * （呼び出し側は、falseのときは報酬の保存処理を行わない）。
 */
export function claimRoomReward() {
  if (questState.currentRoom.rewardGranted) return false;
  questState.currentRoom.rewardGranted = true;
  return true;
}

export function addEarnedGoldThisQuest(gold) {
  questState.earnedGoldThisQuest += gold;
}

export function recordRoomResult(result) {
  questState.roomResults.push(result);
}

export function getQuestState() {
  return questState;
}
