// コンボとコンボ継続ゲージの計算を担当するモジュール
// setInterval()の回数ではなく、渡された時刻(performance.now())との差で計算する。
// 実際のポーリング（何ms間隔で tick() を呼ぶか）はrank-mode.js側が担当する。

const BASE_TIME_SECONDS = 12; // 1次方程式の基準時間 timeB
const BASE_GAUGE_DURATION_MS = BASE_TIME_SECONDS * 2 * 1000; // timeB×2

/**
 * 新しいコンボ状態を作る。
 * buildPending: true の間は、次に正解してもゲージを動かさず1コンボ目として扱う
 * （第1問・パス直後・ゲージ切れ直後に相当する）。
 */
export function createComboState() {
  return {
    combo: 0,
    maxCombo: 0,
    gaugeRunning: false,
    gaugeStartTime: 0,
    gaugeDurationMs: 0,
    pendingGaugeDurationMs: 0,
    buildPending: true,
    gaugeRatio: 1
  };
}

function gaugeDurationForCombo(combo) {
  const speedMultiplier = 1 + 0.1 * combo;
  return BASE_GAUGE_DURATION_MS / speedMultiplier;
}

/**
 * 経過時間に応じてゲージ残量を更新する。
 * ゲージがちょうど0になった場合は、コンボをリセットし gaugeExpired: true を返す。
 * @param {object} comboState
 * @param {number} nowMs performance.now()の値
 */
export function tick(comboState, nowMs) {
  if (!comboState.gaugeRunning) {
    return { gaugeExpired: false };
  }

  const elapsed = nowMs - comboState.gaugeStartTime;
  const ratio = Math.max(
    0,
    Math.min(1, 1 - elapsed / comboState.gaugeDurationMs)
  );
  comboState.gaugeRatio = ratio;

  if (ratio <= 0) {
    comboState.gaugeRunning = false;
    if (comboState.combo > 0) {
      comboState.combo = 0;
      comboState.buildPending = true;
      return { gaugeExpired: true };
    }
  }

  return { gaugeExpired: false };
}

/**
 * 正解時の処理。コンボを1増やし、最大コンボを更新する。
 * ゲージは即座には動かさず、次の問題が始まるときに startGaugeForNextQuestion() で動かす。
 * @returns {number} 更新後のコンボ数
 */
export function registerCorrect(comboState) {
  comboState.combo += 1;
  comboState.maxCombo = Math.max(comboState.maxCombo, comboState.combo);
  comboState.buildPending = false;
  comboState.pendingGaugeDurationMs = gaugeDurationForCombo(comboState.combo);
  comboState.gaugeRunning = false;
  comboState.gaugeRatio = 1;
  return comboState.combo;
}

/**
 * 不正解時の処理。コンボは即座にはリセットしない（ゲージは動き続ける）。
 */
export function registerIncorrect() {
  // 何もしない：ゲージの減少はtick()にまかせる
}

/**
 * パス時の処理。コンボとゲージをリセットする。
 */
export function registerPass(comboState) {
  comboState.combo = 0;
  comboState.gaugeRunning = false;
  comboState.gaugeRatio = 1;
  comboState.pendingGaugeDurationMs = 0;
  comboState.buildPending = true;
}

/**
 * 次の問題が始まるタイミングで呼び出し、ゲージを100%から動かし始める。
 * buildPending中（第1問・パス直後・ゲージ切れ直後）は、ゲージを動かさない。
 * @param {object} comboState
 * @param {number} nowMs
 */
export function startGaugeForNextQuestion(comboState, nowMs) {
  if (comboState.buildPending) {
    comboState.gaugeRunning = false;
    comboState.gaugeRatio = 1;
    return;
  }

  comboState.gaugeRunning = true;
  comboState.gaugeStartTime = nowMs;
  comboState.gaugeDurationMs =
    comboState.pendingGaugeDurationMs || gaugeDurationForCombo(comboState.combo);
  comboState.gaugeRatio = 1;
}

/**
 * ゲージ残量を0〜100のパーセントで返す（表示用）。
 */
export function getGaugePercent(comboState) {
  return Math.round(comboState.gaugeRatio * 100);
}
