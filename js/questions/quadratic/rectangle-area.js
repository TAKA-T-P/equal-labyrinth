// カテゴリ：長方形の面積（L3-03）
// 基本式：縦（または横）をxとして、もう一方の辺との関係から面積を表す

import {
  createUniqueId,
  randomInt,
  computeQuadraticRoots
} from "./categories.js";

const CATEGORY_ID = "L3-03";
const CATEGORY_NAME = "長方形の面積";
const UNIT = "quadratic";
const KEYPAD_SYMBOLS = ["x", "x²", "square", "+", "-", "×", "(", ")", "="];

export const rectangleAreaTemplates = [
  {
    templateId: "L3-03-longer-side",
    categoryId: CATEGORY_ID,

    generate() {
      const n = randomInt(3, 20);
      const d = randomInt(2, 8);
      const area = n * (n + d);
      const canonicalInternal = `x*(x+${d})=${area}`;
      const roots = computeQuadraticRoots(canonicalInternal);

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        unit: UNIT,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "NORMAL",

        prompt:
          `横の長さが縦の長さより${d}cm長い長方形があります。この長方形の面積が${area}cm²のとき、` +
          `縦の長さをxcmとして、2次方程式を立てなさい。`,
        variableDefinition: "長方形の縦の長さ（cm）",

        canonicalEquation: {
          internal: canonicalInternal,
          display: `x(x＋${d})＝${area}`,
          relationName: "縦×横＝面積"
        },
        expectedRoots: roots,
        validXValues: [n],
        solutionDisplay: `x＝${n}（縦${n}cm、横${n + d}cm）`,

        keypadNumbers: [String(d), String(area)],
        keypadSymbols: KEYPAD_SYMBOLS,

        hint: `横の長さは、縦の長さより${d}cm長いので「x＋${d}」と表せます。`,
        hintKeypadParts: [{ display: `（x＋${d}）`, value: `(x+${d})`, ariaLabel: `xたす${d}` }],
        explanation: "縦の長さと横の長さの積が、長方形の面積になります。",
        diagram: null
      };
    }
  },

  {
    templateId: "L3-03-shorter-side",
    categoryId: CATEGORY_ID,

    generate() {
      const d = randomInt(2, 8);
      const n = randomInt(d + 3, d + 20);
      const area = n * (n - d);
      const canonicalInternal = `x*(x-${d})=${area}`;
      const roots = computeQuadraticRoots(canonicalInternal);

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        unit: UNIT,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "NORMAL",

        prompt:
          `横の長さが縦の長さより${d}cm短い長方形があります。この長方形の面積が${area}cm²のとき、` +
          `縦の長さをxcmとして、2次方程式を立てなさい。`,
        variableDefinition: "長方形の縦の長さ（cm）",

        canonicalEquation: {
          internal: canonicalInternal,
          display: `x(x−${d})＝${area}`,
          relationName: "縦×横＝面積"
        },
        expectedRoots: roots,
        validXValues: [n],
        solutionDisplay: `x＝${n}（縦${n}cm、横${n - d}cm）`,

        keypadNumbers: [String(d), String(area)],
        keypadSymbols: KEYPAD_SYMBOLS,

        hint: `横の長さは、縦の長さより${d}cm短いので「x−${d}」と表せます。`,
        hintKeypadParts: [{ display: `（x−${d}）`, value: `(x-${d})`, ariaLabel: `xひく${d}` }],
        explanation: "縦の長さと横の長さの積が、長方形の面積になります。",
        diagram: null
      };
    }
  },

  {
    templateId: "L3-03-sum-fixed",
    categoryId: CATEGORY_ID,

    generate() {
      // 縦＋横＝sum（一定）の長方形。縦の方が横より短いものとする（一意にするため）。
      const p = randomInt(3, 14);
      const gap = randomInt(2, 10);
      const qVal = p + gap; // qVal > p
      const sum = p + qVal;
      const area = p * qVal;
      const canonicalInternal = `x*(${sum}-x)=${area}`;
      const roots = computeQuadraticRoots(canonicalInternal);

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        unit: UNIT,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "NORMAL",

        prompt:
          `縦の長さと横の長さの和が${sum}cmで、面積が${area}cm²の長方形があります。ただし、縦の長さは` +
          `横の長さより短いものとします。縦の長さをxcmとして、2次方程式を立てなさい。`,
        variableDefinition: "長方形の縦の長さ（cm、横より短い）",

        canonicalEquation: {
          internal: canonicalInternal,
          display: `x(${sum}−x)＝${area}`,
          relationName: "縦×横＝面積（縦＋横は一定）"
        },
        expectedRoots: roots,
        validXValues: [p],
        solutionDisplay: `x＝${p}（縦${p}cm、横${qVal}cm）`,

        keypadNumbers: [String(sum), String(area)],
        keypadSymbols: KEYPAD_SYMBOLS,

        hint: `縦と横の和が${sum}cmなので、横の長さは「${sum}−x」と表せます。`,
        hintKeypadParts: [{ display: `（${sum}−x）`, value: `(${sum}-x)`, ariaLabel: `${sum}ひくx` }],
        explanation: "縦の長さと、和から求めた横の長さの積が、長方形の面積になります。",
        diagram: null
      };
    }
  }
];
