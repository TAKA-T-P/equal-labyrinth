// クエストモード：敵・宝箱・アイテムの演出（アニメーション・効果音のタイミング制御）
// 実際のDOM要素の生成・文字列描画はquest-ui.js側の責務。ここでは、
// quest-ui.jsから渡された要素へCSSクラスを付け外ししながら、効果音（audio.js）と
// タイミングをまとめて管理する。すべての演出関数はPromiseを返し、
// quest-mode.js側がawaitして「演出が終わるまで次に進まない」を保証する。

import * as audio from "../audio.js";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function withTemporaryClass(element, className, durationMs) {
  if (!element) return sleep(durationMs);
  element.classList.remove(className);
  // 直前に同じクラスが付いていた場合でもアニメーションを再生させるため、
  // 一度リフローを挟んでから付け直す（既存コードのjudgeMessage等と同じ手法）。
  void element.offsetWidth;
  element.classList.add(className);
  return sleep(durationMs).then(() => {
    element.classList.remove(className);
  });
}

/**
 * 敵出現演出。絵文字要素をフェードイン＋わずかに拡大させる。
 * @param {HTMLElement} emojiElement
 * @param {{isBoss?: boolean}} options
 */
export async function playEnemyAppearEffect(emojiElement, options = {}) {
  if (options.isBoss) {
    audio.playQuestBossAppearSound();
  } else {
    audio.playQuestEnemyAppearSound();
  }

  const reduced = prefersReducedMotion();
  const className = reduced ? "quest-anim-fade-in" : "quest-anim-appear";
  const duration = reduced ? 200 : 400;
  await withTemporaryClass(emojiElement, className, duration);
}

/**
 * 敵撃破演出。何度か点滅させたのち、縮小・透明化して消える。
 * prefers-reduced-motionが有効な場合は、短いフェードだけにする。
 * @param {HTMLElement} emojiElement
 * @param {{isBoss?: boolean}} options
 */
export async function playEnemyDefeatEffect(emojiElement, options = {}) {
  audio.playQuestEnemyDefeatSound({ isBoss: Boolean(options.isBoss) });

  if (prefersReducedMotion()) {
    await withTemporaryClass(emojiElement, "quest-anim-fade-out", 300);
    return;
  }

  // ボス撃破音（約1.35秒）は通常の敵撃破音（約0.85秒）より長いため、
  // 点滅・消滅の演出も少しだけ引き延ばして同期させる。
  const blinkDuration = options.isBoss ? 700 : 600;
  const vanishDuration = options.isBoss ? 650 : 500;
  await withTemporaryClass(emojiElement, "quest-anim-blink", blinkDuration);
  await withTemporaryClass(emojiElement, "quest-anim-vanish", vanishDuration);
}

/**
 * 宝箱の開封演出。宝箱をわずかに揺らしてから光らせる。
 * @param {HTMLElement} chestElement
 */
export async function playTreasureOpenEffect(chestElement) {
  audio.playQuestTreasureOpenSound();

  const reduced = prefersReducedMotion();
  const className = reduced ? "quest-anim-fade-in" : "quest-anim-chest-open";
  const duration = reduced ? 200 : 500;
  await withTemporaryClass(chestElement, className, duration);
}

/**
 * 宝箱発見時（開封前）の演出。効果音のみ（宝箱は静止した状態で表示する）。
 */
export function playTreasureFoundEffect() {
  audio.playQuestTreasureFoundSound();
  return Promise.resolve();
}

/**
 * アイテム獲得演出。アイテムの絵文字を大きく表示しながら光の輪を広げる。
 * @param {HTMLElement} itemEmojiElement
 */
export async function playItemRevealEffect(itemEmojiElement) {
  audio.playQuestItemAcquiredSound();

  const reduced = prefersReducedMotion();
  const className = reduced ? "quest-anim-fade-in" : "quest-anim-item-reveal";
  const duration = reduced ? 250 : 600;
  await withTemporaryClass(itemEmojiElement, className, duration);
}

export function playRetreatEffect() {
  audio.playQuestRetreatSound();
  return Promise.resolve();
}

export function playQuestClearEffect() {
  audio.playQuestClearSound();
  return Promise.resolve();
}
