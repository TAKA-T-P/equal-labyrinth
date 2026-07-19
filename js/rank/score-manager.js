// スコアの計算・表示用フォーマットだけを担当するモジュール
// DOM操作・タイマーはここでは扱わない（rank-mode.js / ui.jsの責務）

export const CORRECT_BASE_POINTS = 1000;
export const CORRECT_COMBO_BONUS = 100;
export const INCORRECT_PENALTY = -500;

/**
 * 正解時の加算点を計算する。
 * @param {number} comboAfterCorrect 正解によって更新された後のコンボ数
 */
export function calculateCorrectPoints(comboAfterCorrect) {
  return CORRECT_BASE_POINTS + CORRECT_COMBO_BONUS * comboAfterCorrect;
}

/**
 * 不正解時の減点を計算する（入力エラーには適用しない）。
 */
export function calculateIncorrectPoints() {
  return INCORRECT_PENALTY;
}

/**
 * スコアをカンマ区切りの表示文字列にする（負のスコアにも対応）。
 * 例：1300 → "1,300点"／-500 → "−500点"
 */
export function formatScore(score) {
  const sign = score < 0 ? "−" : "";
  return `${sign}${Math.abs(score).toLocaleString("ja-JP")}点`;
}

/**
 * スコア増減の演出用テキストを作る。
 * 例：+1300 → "＋1,300"／-500 → "−500"
 */
export function formatScoreDelta(delta) {
  const sign = delta >= 0 ? "＋" : "−";
  return `${sign}${Math.abs(delta).toLocaleString("ja-JP")}`;
}
