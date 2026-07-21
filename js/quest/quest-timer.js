// クエストモード：部屋単位の制限時間を管理するモジュール
// 問題ごとではなく部屋全体で残り時間を共有し、演出中は一時停止する。
// rank-mode.jsの全体タイマー（120秒）と同じ「performance.now()の差分＋
// 一時停止時間の補正」方式を、部屋タイマー専用に切り出したもの。

const POLL_INTERVAL_MS = 100;

let pollIntervalId = null;
let lastTickTime = 0;
let paused = false;
let running = false;

let remainingMs = null; // null＝制限時間なしの部屋
let onTickCallback = null;
let onExpiredCallback = null;

/**
 * 部屋タイマーを開始する。既存のタイマーがあれば必ず停止してから開始する。
 * timeLimitMs === null の場合は「制限時間なしの部屋」として、タイマーを起動しない
 * （onTick・onExpiredのどちらも呼ばれない）。
 * @param {number|null} timeLimitMs
 * @param {{onTick?: (remainingMs: number) => void, onExpired?: () => void}} callbacks
 */
export function startRoomTimer(timeLimitMs, callbacks = {}) {
  stopRoomTimer();

  if (timeLimitMs === null) {
    remainingMs = null;
    return;
  }

  remainingMs = timeLimitMs;
  onTickCallback = callbacks.onTick || null;
  onExpiredCallback = callbacks.onExpired || null;
  paused = false;
  running = true;
  lastTickTime = performance.now();
  pollIntervalId = setInterval(tick, POLL_INTERVAL_MS);
}

function tick() {
  if (!running || paused) {
    return;
  }

  const now = performance.now();
  const delta = now - lastTickTime;
  lastTickTime = now;

  remainingMs = Math.max(0, remainingMs - delta);
  if (onTickCallback) {
    onTickCallback(remainingMs);
  }

  if (remainingMs <= 0) {
    const expiredCallback = onExpiredCallback;
    stopRoomTimer();
    if (expiredCallback) {
      expiredCallback();
    }
  }
}

/**
 * 演出中など、生徒が入力できない間だけ部屋タイマーを一時停止する。
 * 制限時間なしの部屋（remainingMsがnull）では何もしない。
 */
export function pauseRoomTimer() {
  if (!running || remainingMs === null) return;
  paused = true;
}

/**
 * 一時停止していた部屋タイマーを再開する。停止していた時間分は減らさない
 * （lastTickTimeを現在時刻へ更新することで、停止時間を差分計算から除外する）。
 */
export function resumeRoomTimer() {
  if (!running || remainingMs === null) return;
  lastTickTime = performance.now();
  paused = false;
}

/**
 * 部屋タイマーを完全に停止する（部屋を退出する・部屋をクリアする・リタイアするなど）。
 */
export function stopRoomTimer() {
  if (pollIntervalId !== null) {
    clearInterval(pollIntervalId);
    pollIntervalId = null;
  }
  running = false;
  paused = false;
  onTickCallback = null;
  onExpiredCallback = null;
}

/**
 * 制限時間のある部屋で、現在タイマーが動作中かどうか。
 */
export function isRoomTimerActive() {
  return running && remainingMs !== null;
}

/**
 * 現在の残り時間（ミリ秒）。制限時間なしの部屋ではnullを返す。
 */
export function getRemainingMs() {
  return remainingMs;
}
