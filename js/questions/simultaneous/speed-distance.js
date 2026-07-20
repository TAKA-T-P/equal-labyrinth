// カテゴリ：速さ・道のり（L2-06）
// 基本式：道のりの合計／かかった時間の合計（x÷速さ＋y÷速さ＝時間）

import { createUniqueId, randomInt, buildKeypadNumbers } from "./categories.js";

const CATEGORY_ID = "L2-06";
const CATEGORY_NAME = "速さ・道のり";
const UNIT = "simultaneous";

const KEYPAD_SYMBOLS = ["x", "y", "+", "fraction", "="];

/**
 * x÷speedA＋y÷speedB＝時間 が必ずきれいな数になるよう、
 * 0.5時間刻みの時間から道のりを逆算する（speedA・speedBは偶数を使う前提）。
 */
function buildSpeedTimeNumbers(speedA, speedB) {
  const halfHoursA = randomInt(1, 6);
  let halfHoursB = randomInt(1, 6);
  if ((halfHoursA + halfHoursB) % 2 !== 0) {
    halfHoursB += 1;
  }

  const x = (speedA * halfHoursA) / 2;
  const y = (speedB * halfHoursB) / 2;
  const totalDistance = x + y;
  const totalTime = (halfHoursA + halfHoursB) / 2;

  return { x, y, totalDistance, totalTime };
}

export const speedDistanceTemplates = [
  {
    templateId: "L2-06-run-walk",
    categoryId: CATEGORY_ID,

    generate() {
      const speedA = 10;
      const speedB = 4;
      const { x, y, totalDistance, totalTime } = buildSpeedTimeNumbers(speedA, speedB);

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        unit: UNIT,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "NORMAL",

        prompt:
          `A地点から${totalDistance}km離れたB地点へ行くのに、はじめは時速${speedA}kmで走り、` +
          `途中から時速${speedB}kmで歩いたところ、${totalTime}時間かかりました。走った道のりを` +
          `xkm、歩いた道のりをykmとして連立方程式を立てなさい。`,

        variableDefinitions: {
          x: "走った道のり（km）",
          y: "歩いた道のり（km）"
        },

        expectedSolution: { x, y },

        canonicalEquations: [
          { internal: `x+y=${totalDistance}`, display: `x＋y＝${totalDistance}`, relationName: "道のりの合計" },
          {
            internal: `x/${speedA}+y/${speedB}=${totalTime}`,
            display: `x÷${speedA}＋y÷${speedB}＝${totalTime}`,
            relationName: "かかった時間の合計"
          }
        ],

        solutionDisplay: `x＝${x}、y＝${y}`,

        keypadNumbers: buildKeypadNumbers([totalDistance, speedA, speedB, totalTime]),
        keypadSymbols: KEYPAD_SYMBOLS,

        hint:
          "かかった時間は「道のり÷速さ」で表します。走った時間は、走った道のりを" +
          `速さ${speedA}で割って表します。`,
        hintKeypadParts: [
          {
            type: "fraction",
            display: `x/${speedA}`,
            value: `x/${speedA}`,
            numerator: "x",
            denominator: String(speedA),
            ariaLabel: `${speedA}分のx`
          }
        ],

        explanation: "道のりの合計と、かかった時間の合計から2本の式を作ります。"
      };
    }
  },

  {
    templateId: "L2-06-train-bus",
    categoryId: CATEGORY_ID,

    generate() {
      const speedA = 90;
      const speedB = 40;
      const { x, y, totalDistance, totalTime } = buildSpeedTimeNumbers(speedA, speedB);

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        unit: UNIT,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "NORMAL",

        prompt:
          `自宅から${totalDistance}km離れた祖父母の家へ行くのに、はじめは時速${speedA}kmの電車で移動し、` +
          `途中から時速${speedB}kmのバスに乗り換えたところ、${totalTime}時間かかりました。電車で移動した` +
          `道のりをxkm、バスで移動した道のりをykmとして連立方程式を立てなさい。`,

        variableDefinitions: {
          x: "電車で移動した道のり（km）",
          y: "バスで移動した道のり（km）"
        },

        expectedSolution: { x, y },

        canonicalEquations: [
          { internal: `x+y=${totalDistance}`, display: `x＋y＝${totalDistance}`, relationName: "道のりの合計" },
          {
            internal: `x/${speedA}+y/${speedB}=${totalTime}`,
            display: `x÷${speedA}＋y÷${speedB}＝${totalTime}`,
            relationName: "かかった時間の合計"
          }
        ],

        solutionDisplay: `x＝${x}、y＝${y}`,

        keypadNumbers: buildKeypadNumbers([totalDistance, speedA, speedB, totalTime]),
        keypadSymbols: KEYPAD_SYMBOLS,

        hint:
          "かかった時間は「道のり÷速さ」で表します。電車で移動した時間は、電車で移動した" +
          `道のりを速さ${speedA}で割って表します。`,
        hintKeypadParts: [
          {
            type: "fraction",
            display: `x/${speedA}`,
            value: `x/${speedA}`,
            numerator: "x",
            denominator: String(speedA),
            ariaLabel: `${speedA}分のx`
          }
        ],

        explanation: "道のりの合計と、かかった時間の合計から2本の式を作ります。"
      };
    }
  },

  {
    templateId: "L2-06-mountain-trail",
    categoryId: CATEGORY_ID,

    generate() {
      const speedA = 8;
      const speedB = 6;
      const { x, y, totalDistance, totalTime } = buildSpeedTimeNumbers(speedA, speedB);

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        unit: UNIT,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "NORMAL",

        prompt:
          `全長${totalDistance}kmのハイキングコースを歩きました。平らな道では時速${speedA}kmで、` +
          `山道では時速${speedB}kmで歩いたところ、${totalTime}時間かかりました。平らな道の道のりを` +
          `xkm、山道の道のりをykmとして連立方程式を立てなさい。`,

        variableDefinitions: {
          x: "平らな道の道のり（km）",
          y: "山道の道のり（km）"
        },

        expectedSolution: { x, y },

        canonicalEquations: [
          { internal: `x+y=${totalDistance}`, display: `x＋y＝${totalDistance}`, relationName: "道のりの合計" },
          {
            internal: `x/${speedA}+y/${speedB}=${totalTime}`,
            display: `x÷${speedA}＋y÷${speedB}＝${totalTime}`,
            relationName: "かかった時間の合計"
          }
        ],

        solutionDisplay: `x＝${x}、y＝${y}`,

        keypadNumbers: buildKeypadNumbers([totalDistance, speedA, speedB, totalTime]),
        keypadSymbols: KEYPAD_SYMBOLS,

        hint:
          "かかった時間は「道のり÷速さ」で表します。平らな道を歩いた時間は、平らな道の" +
          `道のりを速さ${speedA}で割って表します。`,
        hintKeypadParts: [
          {
            type: "fraction",
            display: `x/${speedA}`,
            value: `x/${speedA}`,
            numerator: "x",
            denominator: String(speedA),
            ariaLabel: `${speedA}分のx`
          }
        ],

        explanation: "道のりの合計と、かかった時間の合計から2本の式を作ります。"
      };
    }
  }
];
