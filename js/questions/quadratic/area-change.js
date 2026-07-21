// カテゴリ：面積の増減（L3-04）
// 基本式：長方形の縦・横をxcmずつ変化させたときの面積の関係

import {
  createUniqueId,
  randomInt,
  computeQuadraticRoots
} from "./categories.js";

const CATEGORY_ID = "L3-04";
const CATEGORY_NAME = "面積の増減";
const UNIT = "quadratic";
const KEYPAD_SYMBOLS = ["x", "square", "+", "-", "(", ")", "="];

export const areaChangeTemplates = [
  {
    templateId: "L3-04-both-shorter",
    categoryId: CATEGORY_ID,

    generate() {
      const shortSide = randomInt(8, 14);
      const longSide = shortSide + randomInt(2, 10);
      const n = randomInt(1, shortSide - 1); // 両辺が正のまま残るように
      const newArea = (shortSide - n) * (longSide - n);
      const canonicalInternal = `(${shortSide}-x)*(${longSide}-x)=${newArea}`;
      const roots = computeQuadraticRoots(canonicalInternal);

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        unit: UNIT,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "NORMAL",

        prompt:
          `縦${shortSide}cm、横${longSide}cmの長方形の縦・横をそれぞれxcmずつ短くしたところ、` +
          `面積が${newArea}cm²になりました。xの値を求める2次方程式を立てなさい。`,
        variableDefinition: "縦・横をそれぞれ短くする長さ（cm）",

        canonicalEquation: {
          internal: canonicalInternal,
          display: `(${shortSide}−x)(${longSide}−x)＝${newArea}`,
          relationName: "短くした後の面積"
        },
        expectedRoots: roots,
        validXValues: [n],
        solutionDisplay: `x＝${n}`,

        keypadNumbers: [String(shortSide), String(longSide), String(newArea)],
        keypadSymbols: KEYPAD_SYMBOLS,

        hint: `短くした後の縦は「${shortSide}−x」、横は「${longSide}−x」と表せます。`,
        hintKeypadParts: [{ display: `（${shortSide}−x）`, value: `(${shortSide}-x)`, ariaLabel: `${shortSide}ひくx` }],
        explanation: "短くした後の縦と横の積が、変化後の面積になります。",
        diagram: null
      };
    }
  },

  {
    templateId: "L3-04-both-longer",
    categoryId: CATEGORY_ID,

    generate() {
      const sideA = randomInt(5, 12);
      const sideB = sideA + randomInt(1, 8);
      const n = randomInt(1, 15);
      const newArea = (sideA + n) * (sideB + n);
      const canonicalInternal = `(${sideA}+x)*(${sideB}+x)=${newArea}`;
      const roots = computeQuadraticRoots(canonicalInternal);

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        unit: UNIT,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "NORMAL",

        prompt:
          `縦${sideA}cm、横${sideB}cmの長方形の縦・横をそれぞれxcmずつ長くしたところ、` +
          `面積が${newArea}cm²になりました。xの値を求める2次方程式を立てなさい。`,
        variableDefinition: "縦・横をそれぞれ長くする長さ（cm）",

        canonicalEquation: {
          internal: canonicalInternal,
          display: `(${sideA}＋x)(${sideB}＋x)＝${newArea}`,
          relationName: "長くした後の面積"
        },
        expectedRoots: roots,
        validXValues: [n],
        solutionDisplay: `x＝${n}`,

        keypadNumbers: [String(sideA), String(sideB), String(newArea)],
        keypadSymbols: KEYPAD_SYMBOLS,

        hint: `長くした後の縦は「${sideA}＋x」、横は「${sideB}＋x」と表せます。`,
        hintKeypadParts: [{ display: `（${sideA}＋x）`, value: `(${sideA}+x)`, ariaLabel: `${sideA}たすx` }],
        explanation: "長くした後の縦と横の積が、変化後の面積になります。",
        diagram: null
      };
    }
  },

  {
    templateId: "L3-04-one-longer-one-shorter",
    categoryId: CATEGORY_ID,

    generate() {
      const shortSide = randomInt(8, 16); // こちらを短くする辺
      const otherSide = randomInt(4, shortSide - 2); // こちらを長くする辺（xより後も正）
      const n = randomInt(1, otherSide + shortSide - 2);
      // 縦(shortSide)をxcm短く、横(otherSide)をxcm長くする。ただし縦は0より大きいまま。
      const boundedN = Math.min(n, shortSide - 1);
      const newArea = (shortSide - boundedN) * (otherSide + boundedN);
      const canonicalInternal = `(${shortSide}-x)*(${otherSide}+x)=${newArea}`;
      const roots = computeQuadraticRoots(canonicalInternal);

      // このパターンは、縦の辺の上限（0＜x＜shortSide）しか物理的な制約がないため、
      // まれに2つの解がどちらもこの範囲に収まってしまう（答えが一意に定まらない）。
      // その場合は不採用とし、呼び出し側（question-manager.js）に再生成させる。
      const physicallyValidRoots = roots.filter((root) => root > 0 && root < shortSide);
      if (physicallyValidRoots.length !== 1) {
        throw new Error("面積の増減（縦を短く・横を長くする）の解が一意に定まりません。");
      }

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        unit: UNIT,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "NORMAL",

        prompt:
          `縦${shortSide}cm、横${otherSide}cmの長方形の縦をxcm短くし、横をxcm長くしたところ、` +
          `面積が${newArea}cm²になりました。xの値を求める2次方程式を立てなさい。`,
        variableDefinition: "縦を短くし、横を長くする長さ（cm）",

        canonicalEquation: {
          internal: canonicalInternal,
          display: `(${shortSide}−x)(${otherSide}＋x)＝${newArea}`,
          relationName: "縦を短く・横を長くした後の面積"
        },
        expectedRoots: roots,
        validXValues: [boundedN],
        solutionDisplay: `x＝${boundedN}`,

        keypadNumbers: [String(shortSide), String(otherSide), String(newArea)],
        keypadSymbols: KEYPAD_SYMBOLS,

        hint: `変化後の縦は「${shortSide}−x」、横は「${otherSide}＋x」と表せます。`,
        hintKeypadParts: [{ display: `（${otherSide}＋x）`, value: `(${otherSide}+x)`, ariaLabel: `${otherSide}たすx` }],
        explanation: "縦を短く、横を長くした後の縦と横の積が、変化後の面積になります。",
        diagram: null
      };
    }
  }
];
