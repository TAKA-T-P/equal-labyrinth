// 問題ごとの経過時間を管理するモジュール
// setInterval()の回数ではなく、performance.now()との差で時間を計測する。

import { APP_CONFIG } from "./config.js";

const POLL_INTERVAL_MILLISECONDS = 200;

let questionStartTime = 0;
let intervalId = null;
let hintTriggered = false;
let passTriggered = false;
let onHintAvailableCallback = null;
let onPassAvailableCallback = null;
let onTickCallback = null;

function getElapsedSecondsInternal() {
  if (questionStartTime === 0) {
    return 0;
  }
  return (performance.now() - questionStartTime) / 1000;
}

function tick() {
  const elapsedSeconds = getElapsedSecondsInternal();

  if (typeof onTickCallback === "function") {
    onTickCallback(elapsedSeconds);
  }

  if (!hintTriggered && elapsedSeconds >= APP_CONFIG.hintDelaySeconds) {
    hintTriggered = true;
    if (typeof onHintAvailableCallback === "function") {
      onHintAvailableCallback();
    }
  }

  if (!passTriggered && elapsedSeconds >= APP_CONFIG.passDelaySeconds) {
    passTriggered = true;
    if (typeof onPassAvailableCallback === "function") {
      onPassAvailableCallback();
    }
  }
}

/**
 * 問題タイマーを開始する。既存のタイマーがあれば必ず停止してから開始する。
 * @param {{onHintAvailable?: Function, onPassAvailable?: Function, onTick?: Function}} callbacks
 */
export function startQuestionTimer(callbacks = {}) {
  stopQuestionTimer();

  questionStartTime = performance.now();
  hintTriggered = false;
  passTriggered = false;
  onHintAvailableCallback = callbacks.onHintAvailable || null;
  onPassAvailableCallback = callbacks.onPassAvailable || null;
  onTickCallback = callbacks.onTick || null;

  intervalId = setInterval(tick, POLL_INTERVAL_MILLISECONDS);
}

/**
 * 問題タイマーを停止する。停止時点の経過秒数を返す。
 */
export function stopQuestionTimer() {
  const elapsedSeconds = getElapsedSecondsInternal();

  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }

  questionStartTime = 0;
  onHintAvailableCallback = null;
  onPassAvailableCallback = null;
  onTickCallback = null;

  return elapsedSeconds;
}

/**
 * 現在の経過秒数を取得する（タイマーを停止しない）。
 */
export function getElapsedSeconds() {
  return getElapsedSecondsInternal();
}

export function isTimerRunning() {
  return intervalId !== null;
}
