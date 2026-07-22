// カテゴリ：2けたの自然数（L2-04）
// 十の位をx、一の位をyとして、位の入れ替えから式を立てる。
// 基本式：各位の数字の関係／入れ替えた数と元の数の差

import { createUniqueId, randomInt, buildKeypadNumbers } from "./categories.js";

const CATEGORY_ID = "L2-04";
const CATEGORY_NAME = "2けたの自然数";
const UNIT = "simultaneous";

const KEYPAD_SYMBOLS = ["x", "y", "+", "-", "="];

function buildSumIncreaseQuestion({ x, y }) {
  const digitSum = x + y;
  const diff = 9 * (y - x);

  return {
    id: createUniqueId("L2-04-sum-increase"),
    templateId: "L2-04-sum-increase",
    unit: UNIT,
    categoryId: CATEGORY_ID,
    categoryName: CATEGORY_NAME,
    rankDifficulty: "HARD",

    prompt:
      `2けたの自然数があります。各位の数字の和は${digitSum}で、十の位と一の位を` +
      `入れ替えると、元の数より${diff}大きくなります。十の位の数字をx、一の位の数字を` +
      `yとして連立方程式を立てなさい。`,

    variableDefinitions: {
      x: "十の位の数字",
      y: "一の位の数字"
    },

    expectedSolution: { x, y },

    canonicalEquations: [
      { internal: `x+y=${digitSum}`, display: `x＋y＝${digitSum}`, relationName: "各位の数字の和" },
      {
        internal: `10*y+x=10*x+y+${diff}`,
        display: `10y＋x＝10x＋y＋${diff}`,
        relationName: "入れ替えた数との関係"
      }
    ],

    solutionDisplay: `x＝${x}、y＝${y}`,

    keypadNumbers: buildKeypadNumbers([digitSum, 10, diff]),
    keypadSymbols: KEYPAD_SYMBOLS,

    hint: "十の位がx、一の位がyの数は「10x＋y」、入れ替えた数は「10y＋x」と表せます。",
    hintKeypadParts: [
      { display: "10x＋y", value: "10x+y", ariaLabel: "10xたすy" }
    ],

    explanation: "各位の数字の和と、入れ替えた数と元の数の関係から2本の式を作ります。"
  };
}

export const twoDigitNumberTemplates = [
  {
    templateId: "L2-04-sum-increase",
    categoryId: CATEGORY_ID,

    generate() {
      let x;
      let y;
      do {
        x = randomInt(1, 8);
        y = randomInt(x + 1, 9);
      } while (x === y);
      return buildSumIncreaseQuestion({ x, y });
    },

    // 例題確認（ヘルプメニュー）専用：固定値で毎回同じ代表例題を返す。
    generateExample() {
      return buildSumIncreaseQuestion({ x: 3, y: 5 });
    }
  },

  {
    templateId: "L2-04-sum-decrease",
    categoryId: CATEGORY_ID,

    generate() {
      let x;
      let y;
      do {
        x = randomInt(2, 9);
        y = randomInt(1, x - 1);
      } while (x === y);

      const digitSum = x + y;
      const diff = 9 * (x - y);

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        unit: UNIT,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "HARD",

        prompt:
          `2けたの自然数があります。各位の数字の和は${digitSum}で、十の位と一の位を` +
          `入れ替えると、元の数より${diff}小さくなります。十の位の数字をx、一の位の数字を` +
          `yとして連立方程式を立てなさい。`,

        variableDefinitions: {
          x: "十の位の数字",
          y: "一の位の数字"
        },

        expectedSolution: { x, y },

        canonicalEquations: [
          { internal: `x+y=${digitSum}`, display: `x＋y＝${digitSum}`, relationName: "各位の数字の和" },
          {
            internal: `10*x+y=10*y+x+${diff}`,
            display: `10x＋y＝10y＋x＋${diff}`,
            relationName: "入れ替えた数との関係"
          }
        ],

        solutionDisplay: `x＝${x}、y＝${y}`,

        keypadNumbers: buildKeypadNumbers([digitSum, 10, diff]),
        keypadSymbols: KEYPAD_SYMBOLS,

        hint: "十の位がx、一の位がyの数は「10x＋y」、入れ替えた数は「10y＋x」と表せます。",
        hintKeypadParts: [
          { display: "10x＋y", value: "10x+y", ariaLabel: "10xたすy" }
        ],

        explanation: "各位の数字の和と、入れ替えた数と元の数の関係から2本の式を作ります。"
      };
    }
  },

  {
    templateId: "L2-04-double-digit",
    categoryId: CATEGORY_ID,

    generate() {
      const x = randomInt(1, 4);
      const y = 2 * x;
      const diff = 9 * (y - x);

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        unit: UNIT,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "HARD",

        prompt:
          `2けたの自然数があります。一の位の数字は十の位の数字の2倍で、十の位と一の位を` +
          `入れ替えると、元の数より${diff}大きくなります。十の位の数字をx、一の位の数字を` +
          `yとして連立方程式を立てなさい。`,

        variableDefinitions: {
          x: "十の位の数字",
          y: "一の位の数字"
        },

        expectedSolution: { x, y },

        canonicalEquations: [
          { internal: `y=2*x`, display: `y＝2x`, relationName: "各位の数字の関係" },
          {
            internal: `10*y+x=10*x+y+${diff}`,
            display: `10y＋x＝10x＋y＋${diff}`,
            relationName: "入れ替えた数との関係"
          }
        ],

        solutionDisplay: `x＝${x}、y＝${y}`,

        keypadNumbers: buildKeypadNumbers([2, 10, diff]),
        keypadSymbols: KEYPAD_SYMBOLS,

        hint: "十の位がx、一の位がyの数は「10x＋y」、入れ替えた数は「10y＋x」と表せます。",
        hintKeypadParts: [
          { display: "10x＋y", value: "10x+y", ariaLabel: "10xたすy" }
        ],

        explanation: "各位の数字の関係と、入れ替えた数と元の数の関係から2本の式を作ります。"
      };
    }
  }
];
