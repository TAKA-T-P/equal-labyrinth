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
    timerRunning: false
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

export function recordRoomResult(result) {
  questState.roomResults.push(result);
}

export function getQuestState() {
  return questState;
}
