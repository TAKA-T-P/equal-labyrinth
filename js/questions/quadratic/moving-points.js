// カテゴリ：動点（L3-07）
// 基本式：正方形の辺上を、点Pが毎秒1、点Qが毎秒2で移動するとき、
// 三角形DPQの面積が最大（かつ一意）になる瞬間を求める（xは出発してからの秒数）
// 動きはアニメーションではなく、静止画の図で方向を示す（§38）。

import {
  createUniqueId,
  randomInt,
  computeQuadraticRoots
} from "./categories.js";

const CATEGORY_ID = "L3-07";
const CATEGORY_NAME = "動点";
const UNIT = "quadratic";
const KEYPAD_SYMBOLS = ["x", "square", "-", "(", ")", "="];

function buildMovingPointsQuestion({
  templateId,
  scenario,
  pointPLabel,
  pointQLabel,
  startLabel,
  pSpeedLabel,
  qSpeedLabel
}) {
  const half = randomInt(3, 12);
  const side = half * 2; // 二重解にするため、辺の長さは偶数にする
  const target = half * half;
  const canonicalInternal = `x*(${side}-x)=${target}`;
  const roots = computeQuadraticRoots(canonicalInternal);

  return {
    id: createUniqueId(templateId),
    templateId,
    unit: UNIT,
    categoryId: CATEGORY_ID,
    categoryName: CATEGORY_NAME,
    rankDifficulty: "HARD",

    prompt:
      `1辺${side}cmの正方形${scenario}があります。点${pointPLabel}は頂点から出発して、` +
      `${startLabel}に向かって毎秒${pSpeedLabel}cmで辺の上を動きます。点${pointQLabel}は${startLabel}を出発して、` +
      `隣の頂点に向かって毎秒${qSpeedLabel}cmで辺の上を動きます。2点が同時に出発してからx秒後の` +
      `三角形${startLabel}${pointPLabel}${pointQLabel}の面積が${target}cm²になるとき、xの値を求める2次方程式を立てなさい。`,
    variableDefinition: "2点が出発してからの時間（秒）",

    canonicalEquation: {
      internal: canonicalInternal,
      display: `x(${side}−x)＝${target}`,
      relationName: "三角形の面積（底辺×高さ÷2）"
    },
    expectedRoots: roots,
    validXValues: [half],
    solutionDisplay: `x＝${half}`,

    keypadNumbers: [String(side), String(target)],
    keypadSymbols: KEYPAD_SYMBOLS,

    hint:
      `${startLabel}${pointPLabel}の長さは「${side}−x」、${startLabel}${pointQLabel}の長さは「2x」と表せます。` +
      "三角形の面積は「底辺×高さ÷2」で求められます。",
    hintKeypadParts: [{ display: `（${side}−x）`, value: `(${side}-x)`, ariaLabel: `${side}ひくx` }],
    explanation:
      `点${pointPLabel}・点${pointQLabel}それぞれの動いた距離を使って、三角形${startLabel}${pointPLabel}${pointQLabel}の面積を式に表します。`,

    diagram: {
      type: "moving-points-rectangle",
      widthValue: side,
      heightValue: side,
      pointPLabel,
      pointQLabel,
      pointPStart: "C",
      pointPMovesTo: "D",
      pointQStart: "D",
      pointQMovesTo: "A",
      ariaLabel:
        `1辺${side}センチメートルの正方形ABCDで、点${pointPLabel}はCからDへ、` +
        `点${pointQLabel}はDからAへ、それぞれ辺の上を移動する図`
    }
  };
}

export const movingPointsTemplates = [
  {
    templateId: "L3-07-square-field",
    categoryId: CATEGORY_ID,

    generate() {
      return buildMovingPointsQuestion({
        templateId: this.templateId,
        scenario: "の花だんABCD",
        pointPLabel: "P",
        pointQLabel: "Q",
        startLabel: "D",
        pSpeedLabel: "1",
        qSpeedLabel: "2"
      });
    }
  },

  {
    templateId: "L3-07-square-ground",
    categoryId: CATEGORY_ID,

    generate() {
      return buildMovingPointsQuestion({
        templateId: this.templateId,
        scenario: "の土地ABCD",
        pointPLabel: "P",
        pointQLabel: "Q",
        startLabel: "D",
        pSpeedLabel: "1",
        qSpeedLabel: "2"
      });
    }
  },

  {
    templateId: "L3-07-square-board",
    categoryId: CATEGORY_ID,

    generate() {
      return buildMovingPointsQuestion({
        templateId: this.templateId,
        scenario: "のパネルABCD",
        pointPLabel: "P",
        pointQLabel: "Q",
        startLabel: "D",
        pSpeedLabel: "1",
        qSpeedLabel: "2"
      });
    }
  }
];
