// カテゴリ：数とその平方（L3-02）
// 基本式：ある正の整数xの2乗と、xの1次式との関係

import {
  createUniqueId,
  randomInt,
  computeQuadraticRoots
} from "./categories.js";

const CATEGORY_ID = "L3-02";
const CATEGORY_NAME = "数とその平方";
const UNIT = "quadratic";
const KEYPAD_SYMBOLS = ["x", "x²", "square", "+", "-", "×", "(", ")", "="];

export const numberSquareTemplates = [
  {
    templateId: "L3-02-square-equals-linear",
    categoryId: CATEGORY_ID,

    generate() {
      const p = randomInt(5, 20);
      const q = -randomInt(1, p - 2); // p+q >= 2 になるよう調整（a＝1の不自然な文を避ける）
      const a = p + q;
      const b = -p * q;
      const canonicalInternal = `x^2=${a}*x+${b}`;
      const roots = computeQuadraticRoots(canonicalInternal);

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        unit: UNIT,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "NORMAL",

        prompt:
          `ある正の整数を2乗すると、その数の${a}倍に${b}を加えた数に等しくなりました。` +
          `この正の整数をxとして、2次方程式を立てなさい。`,
        variableDefinition: "ある正の整数",

        canonicalEquation: {
          internal: canonicalInternal,
          display: `x²＝${a}x＋${b}`,
          relationName: "2乗と1次式の関係"
        },
        expectedRoots: roots,
        validXValues: [p],
        solutionDisplay: `x＝${p}`,

        keypadNumbers: [String(a), String(b)],
        keypadSymbols: KEYPAD_SYMBOLS,

        hint: "「2乗した数」はx²、「その数のa倍にbを加えた数」は右辺で表せます。",
        hintKeypadParts: [],
        explanation: "ある数の2乗と、その数を使った1次式が等しくなる関係を式にします。",
        diagram: null
      };
    }
  },

  {
    templateId: "L3-02-square-plus-linear-equals",
    categoryId: CATEGORY_ID,

    generate() {
      const p = randomInt(3, 15);
      const q = -randomInt(p + 2, p + 20); // |q| > p にして a = -(p+q) > 0
      const a = -(p + q);
      const b = -p * q;
      const canonicalInternal = `x^2+${a}*x=${b}`;
      const roots = computeQuadraticRoots(canonicalInternal);

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        unit: UNIT,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "NORMAL",

        prompt:
          `ある正の整数を2乗した数に、その数の${a}倍を加えると${b}になりました。` +
          `この正の整数をxとして、2次方程式を立てなさい。`,
        variableDefinition: "ある正の整数",

        canonicalEquation: {
          internal: canonicalInternal,
          display: `x²＋${a}x＝${b}`,
          relationName: "2乗と1次式の和の関係"
        },
        expectedRoots: roots,
        validXValues: [p],
        solutionDisplay: `x＝${p}`,

        keypadNumbers: [String(a), String(b)],
        keypadSymbols: KEYPAD_SYMBOLS,

        hint: "「2乗した数」はx²、「その数のa倍」はax、それらの和が右辺と等しくなります。",
        hintKeypadParts: [],
        explanation: "ある数の2乗と、その数のa倍との和が、与えられた数に等しくなる関係を式にします。",
        diagram: null
      };
    }
  },

  {
    templateId: "L3-02-square-field-side",
    categoryId: CATEGORY_ID,

    generate() {
      const p = randomInt(4, 20);
      const q = -randomInt(1, p - 1);
      const a = p + q;
      const b = -p * q;
      const canonicalInternal = `x^2=${a}*x+${b}`;
      const roots = computeQuadraticRoots(canonicalInternal);

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        unit: UNIT,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "NORMAL",

        prompt:
          `1辺の長さがxcmの正方形があります。この正方形の面積は、1辺の長さの${a}倍に` +
          `${b}を加えた値に等しくなりました。xの値を求める2次方程式を立てなさい。`,
        variableDefinition: "正方形の1辺の長さ（cm）",

        canonicalEquation: {
          internal: canonicalInternal,
          display: `x²＝${a}x＋${b}`,
          relationName: "正方形の面積と1次式の関係"
        },
        expectedRoots: roots,
        validXValues: [p],
        solutionDisplay: `x＝${p}`,

        keypadNumbers: [String(a), String(b)],
        keypadSymbols: KEYPAD_SYMBOLS,

        hint: "正方形の面積は「1辺×1辺」、つまりx²で表せます。",
        hintKeypadParts: [],
        explanation: "正方形の面積（x²）と、1辺の長さを使った1次式が等しくなる関係を式にします。",
        diagram: null
      };
    }
  }
];
