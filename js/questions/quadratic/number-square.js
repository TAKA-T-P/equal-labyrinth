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
const KEYPAD_SYMBOLS = ["x", "square", "+", "-", "(", ")", "="];

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
    templateId: "L3-02-consecutive-squares-sum",
    categoryId: CATEGORY_ID,

    generate() {
      const x = randomInt(2, 15); // 小さい方の正の整数
      const sum = x * x + (x + 1) * (x + 1);
      const canonicalInternal = `x^2+(x+1)^2=${sum}`;
      const roots = computeQuadraticRoots(canonicalInternal);

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        unit: UNIT,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "NORMAL",

        prompt:
          "連続する2つの正の整数があります。それぞれを2乗した数の和が" +
          `${sum}になるとき、小さい方の整数をxとして、2次方程式を立てなさい。`,
        variableDefinition: "小さい方の正の整数",

        canonicalEquation: {
          internal: canonicalInternal,
          display: `x²＋(x＋1)²＝${sum}`,
          relationName: "連続する2整数のそれぞれの2乗の和"
        },
        expectedRoots: roots,
        validXValues: [x],
        solutionDisplay: `x＝${x}`,

        keypadNumbers: [String(1), String(sum)],
        keypadSymbols: KEYPAD_SYMBOLS,

        hint: "小さい方がxなら、大きい方はx＋1です。それぞれを2乗した数の和を式に表しましょう。",
        hintKeypadParts: [{ display: "（x＋1）", value: "(x+1)", ariaLabel: "xたす1" }],
        explanation: "連続する2つの整数はx、x＋1と表せるので、それぞれの2乗の和が与えられた数に等しくなる関係を式にします。",
        diagram: null
      };
    }
  }
];
