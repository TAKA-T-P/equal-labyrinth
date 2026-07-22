// カテゴリ：所持金・過不足
// 基本式：単価A×個数＋余り ＝ 単価B×個数－不足（お金の過不足から個数を求める）

import { createUniqueId, randomInt, randomChoice, buildKeypadNumbers } from "./categories.js";

const CATEGORY_ID = "L1-02";
const CATEGORY_NAME = "所持金・過不足";

// このカテゴリの式は「単価A×個数＋余り＝単価B×個数－不足」で固定のため、
// 使用する記号も問題によらず一定になる。
const KEYPAD_SYMBOLS = ["x", "+", "-", "="];

/**
 * 余りと不足の組を、個数xに対して整数になるように生成する。
 */
function buildMoneyShortageNumbers() {
  const expectedX = randomInt(3, 10);
  const priceA = randomChoice([100, 120, 150, 180, 200]);
  const priceDiff = randomInt(20, 60);
  const priceB = priceA + priceDiff;

  const totalDiff = priceDiff * expectedX;
  const surplus = randomInt(20, totalDiff - 20);
  const shortage = totalDiff - surplus;

  return { expectedX, priceA, priceB, surplus, shortage };
}

function buildNotebookAllowanceQuestion({ expectedX, priceA, priceB, surplus, shortage }) {
  return {
    id: createUniqueId("L1-02-notebook-allowance"),
    templateId: "L1-02-notebook-allowance",
    categoryId: CATEGORY_ID,
    categoryName: CATEGORY_NAME,
    rankDifficulty: "HARD",

    prompt:
      `持っているお金でノートを買おうとしました。1冊${priceA}円のノートを` +
      `買うと${surplus}円余り、1冊${priceB}円のノートを買うと${shortage}円` +
      `足りません。買おうとした冊数をx冊として方程式を立てなさい。`,

    variableDefinition: "買おうとした冊数",

    expectedX,

    canonicalEquation: `${priceA}*x+${surplus}=${priceB}*x-${shortage}`,
    displayEquation: `${priceA}x＋${surplus}＝${priceB}x−${shortage}`,
    solutionDisplay: `x＝${expectedX}`,

    keypadNumbers: buildKeypadNumbers([priceA, surplus, priceB, shortage]),
    keypadSymbols: KEYPAD_SYMBOLS,

    hintKeypadParts: [
      {
        display: `${priceA}x＋${surplus}`,
        value: `${priceA}x+${surplus}`,
        ariaLabel: `${priceA}xたす${surplus}`
      }
    ],

    hint:
      `持っているお金は「1冊${priceA}円×冊数＋${surplus}円」でも、` +
      `「1冊${priceB}円×冊数－${shortage}円」でも表せます。`,

    explanation:
      "どちらの買い方でも、もとの所持金は変わらないことから方程式が立てられます。"
  };
}

export const moneyShortageTemplates = [
  {
    templateId: "L1-02-notebook-allowance",
    categoryId: CATEGORY_ID,

    generate() {
      return buildNotebookAllowanceQuestion(buildMoneyShortageNumbers());
    },

    // 例題確認（ヘルプメニュー）専用：固定値で毎回同じ代表例題を返す。
    generateExample() {
      return buildNotebookAllowanceQuestion({
        expectedX: 3,
        priceA: 100,
        priceB: 150,
        surplus: 100,
        shortage: 50
      });
    }
  },

  {
    templateId: "L1-02-sticker-otoshidama",
    categoryId: CATEGORY_ID,

    generate() {
      const { expectedX, priceA, priceB, surplus, shortage } =
        buildMoneyShortageNumbers();

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "HARD",

        prompt:
          `お年玉でシールを買おうとしました。1枚${priceA}円のシールを買うと` +
          `${surplus}円余り、1枚${priceB}円のシールを買うと${shortage}円` +
          `足りません。買おうとした枚数をx枚として方程式を立てなさい。`,

        variableDefinition: "買おうとした枚数",

        expectedX,

        canonicalEquation: `${priceA}*x+${surplus}=${priceB}*x-${shortage}`,
        displayEquation: `${priceA}x＋${surplus}＝${priceB}x−${shortage}`,
        solutionDisplay: `x＝${expectedX}`,

        keypadNumbers: buildKeypadNumbers([priceA, surplus, priceB, shortage]),
        keypadSymbols: KEYPAD_SYMBOLS,

        hintKeypadParts: [
          {
            display: `${priceA}x＋${surplus}`,
            value: `${priceA}x+${surplus}`,
            ariaLabel: `${priceA}xたす${surplus}`
          }
        ],

        hint:
          `お年玉の金額は「1枚${priceA}円×枚数＋${surplus}円」でも、` +
          `「1枚${priceB}円×枚数－${shortage}円」でも表せます。`,

        explanation:
          "どちらの買い方でも、もとのお年玉の金額は変わらないことから方程式が立てられます。"
      };
    }
  },

  {
    templateId: "L1-02-snack-pocket-money",
    categoryId: CATEGORY_ID,

    generate() {
      const { expectedX, priceA, priceB, surplus, shortage } =
        buildMoneyShortageNumbers();

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "HARD",

        prompt:
          `お小遣いでお菓子を買おうとしました。1個${priceA}円のお菓子を買うと` +
          `${surplus}円余り、1個${priceB}円のお菓子を買うと${shortage}円` +
          `足りません。買おうとした個数をx個として方程式を立てなさい。`,

        variableDefinition: "買おうとした個数",

        expectedX,

        canonicalEquation: `${priceA}*x+${surplus}=${priceB}*x-${shortage}`,
        displayEquation: `${priceA}x＋${surplus}＝${priceB}x−${shortage}`,
        solutionDisplay: `x＝${expectedX}`,

        keypadNumbers: buildKeypadNumbers([priceA, surplus, priceB, shortage]),
        keypadSymbols: KEYPAD_SYMBOLS,

        hintKeypadParts: [
          {
            display: `${priceA}x＋${surplus}`,
            value: `${priceA}x+${surplus}`,
            ariaLabel: `${priceA}xたす${surplus}`
          }
        ],

        hint:
          `お小遣いの金額は「1個${priceA}円×個数＋${surplus}円」でも、` +
          `「1個${priceB}円×個数－${shortage}円」でも表せます。`,

        explanation:
          "どちらの買い方でも、もとのお小遣いの金額は変わらないことから方程式が立てられます。"
      };
    }
  }
];
