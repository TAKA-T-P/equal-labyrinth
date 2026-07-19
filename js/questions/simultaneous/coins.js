// カテゴリ：硬貨・紙幣（L2-03）
// 基本式：枚数の合計＝全体の枚数／単位金額×枚数の合計＝合計金額

import {
  createUniqueId,
  randomInt,
  buildKeypadNumbers,
  termInternal,
  termDisplay
} from "./categories.js";

const CATEGORY_ID = "L2-03";
const CATEGORY_NAME = "硬貨・紙幣";
const UNIT = "simultaneous";

const KEYPAD_SYMBOLS = ["x", "y", "+", "="];

function buildCoinNumbers(totalCountRange, unitA, unitB) {
  const totalCount = randomInt(totalCountRange[0], totalCountRange[1]);
  const x = randomInt(2, totalCount - 2);
  const y = totalCount - x;
  const total = unitA * x + unitB * y;
  return { totalCount, x, y, total };
}

export const coinsTemplates = [
  {
    templateId: "L2-03-50-100",
    categoryId: CATEGORY_ID,

    generate() {
      const unitA = 50;
      const unitB = 100;
      const { totalCount, x, y, total } = buildCoinNumbers([15, 40], unitA, unitB);

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        unit: UNIT,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "NORMAL",

        prompt:
          `${unitA}円硬貨と${unitB}円硬貨が合わせて${totalCount}枚あり、合計金額は${total}円です。` +
          `${unitA}円硬貨をx枚、${unitB}円硬貨をy枚として連立方程式を立てなさい。`,

        variableDefinitions: {
          x: `${unitA}円硬貨の枚数`,
          y: `${unitB}円硬貨の枚数`
        },

        expectedSolution: { x, y },

        canonicalEquations: [
          { internal: `x+y=${totalCount}`, display: `x＋y＝${totalCount}`, relationName: "枚数の合計" },
          {
            internal: `${unitA}*x+${unitB}*y=${total}`,
            display: `${unitA}x＋${unitB}y＝${total}`,
            relationName: "合計金額"
          }
        ],

        solutionDisplay: `x＝${x}、y＝${y}`,

        keypadNumbers: buildKeypadNumbers([totalCount, unitA, unitB, total]),
        keypadSymbols: KEYPAD_SYMBOLS,

        hint: "1本目は枚数の合計、2本目は合計金額を式にしましょう。",
        hintKeypadParts: [],

        explanation: "硬貨の枚数の合計と、合計金額から2本の式を作ります。"
      };
    }
  },

  {
    templateId: "L2-03-100-500",
    categoryId: CATEGORY_ID,

    generate() {
      const unitA = 100;
      const unitB = 500;
      const { totalCount, x, y, total } = buildCoinNumbers([10, 30], unitA, unitB);

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        unit: UNIT,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "NORMAL",

        prompt:
          `${unitA}円硬貨と${unitB}円硬貨が合わせて${totalCount}枚あり、合計金額は${total}円です。` +
          `${unitA}円硬貨をx枚、${unitB}円硬貨をy枚として連立方程式を立てなさい。`,

        variableDefinitions: {
          x: `${unitA}円硬貨の枚数`,
          y: `${unitB}円硬貨の枚数`
        },

        expectedSolution: { x, y },

        canonicalEquations: [
          { internal: `x+y=${totalCount}`, display: `x＋y＝${totalCount}`, relationName: "枚数の合計" },
          {
            internal: `${unitA}*x+${unitB}*y=${total}`,
            display: `${unitA}x＋${unitB}y＝${total}`,
            relationName: "合計金額"
          }
        ],

        solutionDisplay: `x＝${x}、y＝${y}`,

        keypadNumbers: buildKeypadNumbers([totalCount, unitA, unitB, total]),
        keypadSymbols: KEYPAD_SYMBOLS,

        hint: "1本目は枚数の合計、2本目は合計金額を式にしましょう。",
        hintKeypadParts: [],

        explanation: "硬貨の枚数の合計と、合計金額から2本の式を作ります。"
      };
    }
  },

  {
    templateId: "L2-03-bills-diff",
    categoryId: CATEGORY_ID,

    generate() {
      const unitA = 1000;
      const unitB = 5000;
      const x = randomInt(4, 15); // 千円札の枚数
      const diff = randomInt(1, 5);
      const y = Math.max(1, x - diff); // 五千円札の枚数（千円札より少ない）
      const total = unitA * x + unitB * y;

      const termInternalX = termInternal(1, "x");
      const termInternalY = termInternal(1, "y");

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        unit: UNIT,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "NORMAL",

        prompt:
          `財布の中に${unitA}円札と${unitB}円札が入っていて、${unitA}円札は${unitB}円札より` +
          `${x - y}枚多く、合計金額は${total}円です。${unitA}円札をx枚、${unitB}円札をy枚として` +
          `連立方程式を立てなさい。`,

        variableDefinitions: {
          x: `${unitA}円札の枚数`,
          y: `${unitB}円札の枚数`
        },

        expectedSolution: { x, y },

        canonicalEquations: [
          {
            internal: `${termInternalX}=${termInternalY}+${x - y}`,
            display: `${termDisplay(1, "x")}＝${termDisplay(1, "y")}＋${x - y}`,
            relationName: "枚数の関係"
          },
          {
            internal: `${unitA}*x+${unitB}*y=${total}`,
            display: `${unitA}x＋${unitB}y＝${total}`,
            relationName: "合計金額"
          }
        ],

        solutionDisplay: `x＝${x}、y＝${y}`,

        keypadNumbers: buildKeypadNumbers([x - y, unitA, unitB, total]),
        keypadSymbols: KEYPAD_SYMBOLS,

        hint: `${unitA}円札の枚数は「${unitB}円札の枚数＋${x - y}」と表せます。`,
        hintKeypadParts: [
          { display: `y＋${x - y}`, value: `y+${x - y}`, ariaLabel: `yたす${x - y}` }
        ],

        explanation: "枚数の関係と、合計金額から2本の式を作ります。"
      };
    }
  }
];
