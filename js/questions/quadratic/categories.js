// 中3「2次方程式」のカテゴリ情報
// 設定画面のチェックボックスは、このデータから自動生成する。

// テンプレート生成用の共通ヘルパーは、中1・中2と共有するため、
// generation-helpers.jsを再エクスポートする（linear/simultaneousのcategories.jsと同じ構成）。
export {
  createUniqueId,
  randomInt,
  randomChoice,
  buildKeypadNumbers,
  termInternal,
  termDisplay
} from "../generation-helpers.js";

import {
  parseEquationToQuadraticStandardForm,
  solveQuadraticStandardForm
} from "../../equation/quadratic-equation-validator.js";
import { APP_CONFIG } from "../../config.js";

/**
 * 2次方程式のテンプレート専用ヘルパー：canonicalEquationの内部文字列から、
 * 実際の解を計算して返す（手計算による導出ミスを避けるため、テンプレート側では
 * 「いい整数の答え」だけを先に決め、実際の解はパーサー・ソルバーで求める）。
 * 実数解がない場合はErrorを投げる（generateQuestionFromTemplate側で再試行される）。
 * @param {string} canonicalInternal
 * @returns {number[]} 昇順の実数解
 */
export function computeQuadraticRoots(canonicalInternal) {
  const standardForm = parseEquationToQuadraticStandardForm(canonicalInternal);
  const roots = solveQuadraticStandardForm(standardForm, APP_CONFIG.numericTolerance);
  if (!roots) {
    throw new Error(`canonicalEquationに実数解がありません：${canonicalInternal}`);
  }
  return roots;
}

// difficulty：段位認定モードでの出題難易度（トレーニングでは難易度を問わず全カテゴリを選択できる）
// 配列の並び順が、タイトル画面のカテゴリ一覧の表示順になる。
export const QUADRATIC_CATEGORIES = [
  {
    id: "L3-01",
    name: "連続する整数の積",
    difficulty: "NORMAL"
  },
  {
    id: "L3-02",
    name: "数とその平方",
    difficulty: "NORMAL"
  },
  {
    id: "L3-03",
    name: "長方形の面積",
    difficulty: "NORMAL"
  },
  {
    id: "L3-04",
    name: "面積の増減",
    difficulty: "NORMAL"
  },
  {
    id: "L3-05",
    name: "面積・十字路",
    difficulty: "NORMAL"
  },
  {
    id: "L3-06",
    name: "容積・ふたのない箱",
    difficulty: "NORMAL"
  },
  {
    id: "L3-07",
    name: "動点",
    difficulty: "HARD"
  },
  {
    id: "L3-08",
    name: "価格と売上",
    difficulty: "HARD"
  },
  {
    id: "L3-09",
    name: "割合の応用・利益と割引",
    difficulty: "HARD"
  }
];
