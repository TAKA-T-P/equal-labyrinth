// アプリ全体の起点
// DOM読み込み後の初期化・各モジュールの接続・AudioContext初期化のきっかけを担当する。
// ゲームの細かい処理はgame.jsへ任せる。

import { initGame } from "./game.js";
import { initializeAudio } from "./audio.js";

function setupAudioUnlock() {
  const unlock = () => {
    initializeAudio();
    document.removeEventListener("pointerdown", unlock);
    document.removeEventListener("keydown", unlock);
  };
  document.addEventListener("pointerdown", unlock, { once: true });
  document.addEventListener("keydown", unlock, { once: true });
}

function main() {
  setupAudioUnlock();
  initGame();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", main);
} else {
  main();
}
