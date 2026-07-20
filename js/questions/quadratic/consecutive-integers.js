// カテゴリ：連続する整数の積（L3-01）
// 基本式：小さい方の数をxとして、2つの数の積が与えられた値になる

import {
  createUniqueId,
  randomInt,
  computeQuadraticRoots
} from "./categories.js";

const CATEGORY_ID = "L3-01";
const CATEGORY_NAME = "連続する整数の積";
const UNIT = "quadratic";
const KEYPAD_SYMBOLS = ["x", "x²", "square", "+", "×", "(", ")", "="];

export const consecutiveIntegersTemplates = [
  {
    templateId: "L3-01-consecutive",
    categoryId: CATEGORY_ID,

    generate() {
      const n = randomInt(3, 30);
      const product = n * (n + 1);
      const canonicalInternal = `x*(x+1)=${product}`;
      const roots = computeQuadraticRoots(canonicalInternal);

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        unit: UNIT,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "NORMAL",

        prompt: `連続する2つの正の整数の積が${product}です。小さい方の整数をxとして、2次方程式を立てなさい。`,
        variableDefinition: "小さい方の正の整数",

        canonicalEquation: {
          internal: canonicalInternal,
          display: `x(x＋1)＝${product}`,
          relationName: "連続する2整数の積"
        },
        expectedRoots: roots,
        validXValues: [n],
        solutionDisplay: `x＝${n}（2つの整数は${n}と${n + 1}）`,

        keypadNumbers: ["1", String(product)],
        keypadSymbols: KEYPAD_SYMBOLS,

        hint: "小さい方がxなら、大きい方はx＋1です。2つの整数の積を表しましょう。",
        hintKeypadParts: [{ display: "（x＋1）", value: "(x+1)", ariaLabel: "xたす1" }],
        explanation: "連続する2つの整数はx、x＋1と表せるので、積が与えられた値になる関係を式にします。",
        diagram: null
      };
    }
  },

  {
    templateId: "L3-01-consecutive-even",
    categoryId: CATEGORY_ID,

    generate() {
      const half = randomInt(2, 14);
      const n = half * 2;
      const product = n * (n + 2);
      const canonicalInternal = `x*(x+2)=${product}`;
      const roots = computeQuadraticRoots(canonicalInternal);

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        unit: UNIT,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "NORMAL",

        prompt: `連続する2つの正の偶数の積が${product}です。小さい方の偶数をxとして、2次方程式を立てなさい。`,
        variableDefinition: "小さい方の正の偶数",

        canonicalEquation: {
          internal: canonicalInternal,
          display: `x(x＋2)＝${product}`,
          relationName: "連続する2偶数の積"
        },
        expectedRoots: roots,
        validXValues: [n],
        solutionDisplay: `x＝${n}（2つの偶数は${n}と${n + 2}）`,

        keypadNumbers: ["2", String(product)],
        keypadSymbols: KEYPAD_SYMBOLS,

        hint: "連続する偶数は2ずつ大きくなります。小さい方がxなら、大きい方はx＋2です。",
        hintKeypadParts: [{ display: "（x＋2）", value: "(x+2)", ariaLabel: "xたす2" }],
        explanation: "連続する2つの偶数はx、x＋2と表せるので、積が与えられた値になる関係を式にします。",
        diagram: null
      };
    }
  },

  {
    templateId: "L3-01-consecutive-odd",
    categoryId: CATEGORY_ID,

    generate() {
      const n = randomInt(1, 14) * 2 + 1;
      const product = n * (n + 2);
      const canonicalInternal = `x*(x+2)=${product}`;
      const roots = computeQuadraticRoots(canonicalInternal);

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        unit: UNIT,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "NORMAL",

        prompt: `連続する2つの正の奇数の積が${product}です。小さい方の奇数をxとして、2次方程式を立てなさい。`,
        variableDefinition: "小さい方の正の奇数",

        canonicalEquation: {
          internal: canonicalInternal,
          display: `x(x＋2)＝${product}`,
          relationName: "連続する2奇数の積"
        },
        expectedRoots: roots,
        validXValues: [n],
        solutionDisplay: `x＝${n}（2つの奇数は${n}と${n + 2}）`,

        keypadNumbers: ["2", String(product)],
        keypadSymbols: KEYPAD_SYMBOLS,

        hint: "連続する奇数は2ずつ大きくなります。小さい方がxなら、大きい方はx＋2です。",
        hintKeypadParts: [{ display: "（x＋2）", value: "(x+2)", ariaLabel: "xたす2" }],
        explanation: "連続する2つの奇数はx、x＋2と表せるので、積が与えられた値になる関係を式にします。",
        diagram: null
      };
    }
  }
];
