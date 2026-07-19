// カテゴリ：割合の増減・人数（L2-10）
// 基本式：昨年の人数の合計／増減後の人数の合計（増減後の割合×人数＝増減後の人数）

import { createUniqueId, randomInt, randomChoice, buildKeypadNumbers } from "./categories.js";

const CATEGORY_ID = "L2-10";
const CATEGORY_NAME = "割合の増減・人数";
const UNIT = "simultaneous";

const KEYPAD_SYMBOLS = ["x", "y", "+", "="];
const PERCENT_CHOICES = [5, 10, 15, 20];

/**
 * x・yを20の倍数、増減率を5の倍数にすることで、
 * 増減後の人数が必ず整数になるようにする。
 */
function buildPopulationNumbers() {
  const x = randomInt(2, 10) * 20;
  const y = randomInt(2, 10) * 20;
  const increasePercent = randomChoice(PERCENT_CHOICES);
  const decreasePercent = randomChoice(PERCENT_CHOICES);

  const decimalIncrease = (100 + increasePercent) / 100;
  const decimalDecrease = (100 - decreasePercent) / 100;

  const lastYearTotal = x + y;
  const newTotal = decimalIncrease * x + decimalDecrease * y;

  return {
    x,
    y,
    increasePercent,
    decreasePercent,
    decimalIncrease,
    decimalDecrease,
    lastYearTotal,
    newTotal
  };
}

export const populationChangeTemplates = [
  {
    templateId: "L2-10-classes",
    categoryId: CATEGORY_ID,

    generate() {
      const {
        x,
        y,
        increasePercent,
        decreasePercent,
        decimalIncrease,
        decimalDecrease,
        lastYearTotal,
        newTotal
      } = buildPopulationNumbers();

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        unit: UNIT,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "HARD",

        prompt:
          `昨年、A組とB組の生徒は合わせて${lastYearTotal}人でした。今年はA組が${increasePercent}％増え、` +
          `B組が${decreasePercent}％減った結果、合わせて${newTotal}人になりました。昨年のA組の人数を` +
          `x人、B組の人数をy人として連立方程式を立てなさい。`,

        variableDefinitions: {
          x: "昨年のA組の人数",
          y: "昨年のB組の人数"
        },

        expectedSolution: { x, y },

        canonicalEquations: [
          { internal: `x+y=${lastYearTotal}`, display: `x＋y＝${lastYearTotal}`, relationName: "昨年の人数の合計" },
          {
            internal: `${decimalIncrease}*x+${decimalDecrease}*y=${newTotal}`,
            display: `${decimalIncrease}x＋${decimalDecrease}y＝${newTotal}`,
            relationName: "今年の人数の合計"
          }
        ],

        solutionDisplay: `x＝${x}、y＝${y}`,

        keypadNumbers: buildKeypadNumbers([lastYearTotal, decimalIncrease, decimalDecrease, newTotal]),
        keypadSymbols: KEYPAD_SYMBOLS,

        hint: `今年のA組の人数は「${decimalIncrease}×x」、B組の人数は「${decimalDecrease}×y」と表せます。`,
        hintKeypadParts: [],

        explanation: "昨年の人数の合計と、今年の人数の合計から2本の式を作ります。"
      };
    }
  },

  {
    templateId: "L2-10-club",
    categoryId: CATEGORY_ID,

    generate() {
      const {
        x,
        y,
        increasePercent,
        decreasePercent,
        decimalIncrease,
        decimalDecrease,
        lastYearTotal,
        newTotal
      } = buildPopulationNumbers();

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        unit: UNIT,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "HARD",

        prompt:
          `昨年、サッカー部と野球部の部員は合わせて${lastYearTotal}人でした。今年はサッカー部が` +
          `${increasePercent}％増え、野球部が${decreasePercent}％減った結果、合わせて${newTotal}人に` +
          `なりました。昨年のサッカー部の人数をx人、野球部の人数をy人として連立方程式を立てなさい。`,

        variableDefinitions: {
          x: "昨年のサッカー部の人数",
          y: "昨年の野球部の人数"
        },

        expectedSolution: { x, y },

        canonicalEquations: [
          { internal: `x+y=${lastYearTotal}`, display: `x＋y＝${lastYearTotal}`, relationName: "昨年の人数の合計" },
          {
            internal: `${decimalIncrease}*x+${decimalDecrease}*y=${newTotal}`,
            display: `${decimalIncrease}x＋${decimalDecrease}y＝${newTotal}`,
            relationName: "今年の人数の合計"
          }
        ],

        solutionDisplay: `x＝${x}、y＝${y}`,

        keypadNumbers: buildKeypadNumbers([lastYearTotal, decimalIncrease, decimalDecrease, newTotal]),
        keypadSymbols: KEYPAD_SYMBOLS,

        hint: `今年のサッカー部の人数は「${decimalIncrease}×x」、野球部の人数は「${decimalDecrease}×y」と表せます。`,
        hintKeypadParts: [],

        explanation: "昨年の人数の合計と、今年の人数の合計から2本の式を作ります。"
      };
    }
  },

  {
    templateId: "L2-10-library",
    categoryId: CATEGORY_ID,

    generate() {
      const {
        x,
        y,
        increasePercent,
        decreasePercent,
        decimalIncrease,
        decimalDecrease,
        lastYearTotal,
        newTotal
      } = buildPopulationNumbers();

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        unit: UNIT,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "HARD",

        prompt:
          `先月、図書室の利用者は午前と午後合わせて${lastYearTotal}人でした。今月は午前の利用者が` +
          `${increasePercent}％増え、午後の利用者が${decreasePercent}％減った結果、合わせて${newTotal}人に` +
          `なりました。先月の午前の利用者数をx人、午後の利用者数をy人として連立方程式を立てなさい。`,

        variableDefinitions: {
          x: "先月の午前の利用者数",
          y: "先月の午後の利用者数"
        },

        expectedSolution: { x, y },

        canonicalEquations: [
          { internal: `x+y=${lastYearTotal}`, display: `x＋y＝${lastYearTotal}`, relationName: "先月の利用者数の合計" },
          {
            internal: `${decimalIncrease}*x+${decimalDecrease}*y=${newTotal}`,
            display: `${decimalIncrease}x＋${decimalDecrease}y＝${newTotal}`,
            relationName: "今月の利用者数の合計"
          }
        ],

        solutionDisplay: `x＝${x}、y＝${y}`,

        keypadNumbers: buildKeypadNumbers([lastYearTotal, decimalIncrease, decimalDecrease, newTotal]),
        keypadSymbols: KEYPAD_SYMBOLS,

        hint: `今月の午前の利用者数は「${decimalIncrease}×x」、午後の利用者数は「${decimalDecrease}×y」と表せます。`,
        hintKeypadParts: [],

        explanation: "先月の利用者数の合計と、今月の利用者数の合計から2本の式を作ります。"
      };
    }
  }
];
