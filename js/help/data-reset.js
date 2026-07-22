// 全データ初期化：equalLabyrinth.で始まるlocalStorageキーだけを削除する。
// localStorage.clear()は使用しない（同じドメインの他アプリのデータまで消えるおそれがあるため）。
//
// 現在保存しているキー（README「保存データの一覧」を参照）は、すべて
// `${APP_CONFIG.storageKeyPrefix}.`（＝STORAGE_PREFIX）で始まる形式に統一されているため、
// 個別にキー名を列挙しなくても、接頭辞だけで漏れなく検出できる。

import { APP_CONFIG } from "../config.js";

export const STORAGE_PREFIX = `${APP_CONFIG.storageKeyPrefix}.`;

/**
 * 現在localStorageに保存されている、イコール・ラビリンス用のキーだけを列挙する。
 * localStorageへアクセスできない環境（プライベートブラウジング等）では空配列を返す。
 */
export function getEqualLabyrinthStorageKeys() {
  try {
    return Object.keys(window.localStorage).filter((key) => key.startsWith(STORAGE_PREFIX));
  } catch (error) {
    return [];
  }
}

let isResetInProgress = false;

/**
 * イコール・ラビリンスが保存した全データ（STORAGE_PREFIXで始まるキー）を削除する。
 * 他のアプリ・他のドメインのデータには一切触れない。
 * 呼び出し側（help-ui.js）が二重クリック防止のためボタンを無効化することを想定しつつ、
 * こちらでも簡易的な二重実行防止を行う。
 * @returns {{success: boolean, removedKeys: string[], errors: string[]}}
 */
export function resetAllEqualLabyrinthData() {
  if (isResetInProgress) {
    return { success: false, removedKeys: [], errors: [] };
  }
  isResetInProgress = true;

  const removedKeys = [];
  const errors = [];

  try {
    const targetKeys = getEqualLabyrinthStorageKeys();
    targetKeys.forEach((key) => {
      try {
        window.localStorage.removeItem(key);
        removedKeys.push(key);
      } catch (error) {
        errors.push(key);
        console.warn(`データの削除に失敗しました：${key}`, error);
      }
    });
  } catch (error) {
    console.warn("データ消去処理中にエラーが発生しました。", error);
    errors.push("(unknown)");
  } finally {
    isResetInProgress = false;
  }

  return { success: errors.length === 0, removedKeys, errors };
}
