// 単元ごとの正誤判定モジュールへの振り分けを一箇所にまとめるモジュール。
// UIコード（game.js / rank-mode.js）にunitごとの分岐を散らばらせないためのもの。

import { UNIT_IDS } from "../config.js";
import { validateEquation } from "./equation-validator.js";
import { validateSystemEquations } from "./system-equation-validator.js";
import { validateQuadraticEquation } from "./quadratic-equation-validator.js";

function validateLinearEquation(input, question) {
  return validateEquation(input, question.expectedX);
}

/**
 * 現在の単元に応じた正誤判定モジュールへ処理を振り分ける。
 * @param {string} unit UNIT_IDSのいずれか
 * @param {string|string[]} input 単元がlinear/quadraticなら式1本の文字列、
 *   simultaneousなら式2本分の文字列配列
 * @param {object} question 現在の問題データ
 * @returns {{status: "correct"|"incorrect"|"input-error", message: string}}
 */
export function validateCurrentAnswer(unit, input, question) {
  switch (unit) {
    case UNIT_IDS.LINEAR:
      return validateLinearEquation(input, question);
    case UNIT_IDS.SIMULTANEOUS:
      return validateSystemEquations(input, question);
    case UNIT_IDS.QUADRATIC:
      return validateQuadraticEquation(input, question);
    default:
      return { status: "input-error", message: "未対応の単元です。" };
  }
}
