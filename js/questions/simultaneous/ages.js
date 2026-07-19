// カテゴリ：年齢（L2-05）
// 基本式：現在の年齢の和／過去・未来の年齢の関係

import { createUniqueId, randomInt, buildKeypadNumbers } from "./categories.js";

const CATEGORY_ID = "L2-05";
const CATEGORY_NAME = "年齢";
const UNIT = "simultaneous";

const KEYPAD_SYMBOLS_MULT = ["x", "y", "+", "-", "(", ")", "="];
const KEYPAD_SYMBOLS_SUM = ["x", "y", "+", "-", "="];

export const agesTemplates = [
  {
    templateId: "L2-05-mother-child-past",
    categoryId: CATEGORY_ID,

    generate() {
      const childPastAge = randomInt(2, 15);
      const multiplier = randomInt(2, 5);
      const motherPastAge = multiplier * childPastAge;
      const yearsAgo = randomInt(3, 10);

      const y = childPastAge + yearsAgo; // 子の現在の年齢
      const x = motherPastAge + yearsAgo; // 母の現在の年齢
      const sum = x + y;

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        unit: UNIT,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "NORMAL",

        prompt:
          `現在、母と子の年齢の和は${sum}歳です。${yearsAgo}年前、母の年齢は子どもの年齢の` +
          `${multiplier}倍でした。現在の母の年齢をx歳、子どもの年齢をy歳として連立方程式を` +
          `立てなさい。`,

        variableDefinitions: {
          x: "母の現在の年齢",
          y: "子どもの現在の年齢"
        },

        expectedSolution: { x, y },

        canonicalEquations: [
          { internal: `x+y=${sum}`, display: `x＋y＝${sum}`, relationName: "現在の年齢の和" },
          {
            internal: `x-${yearsAgo}=${multiplier}*(y-${yearsAgo})`,
            display: `x−${yearsAgo}＝${multiplier}(y−${yearsAgo})`,
            relationName: `${yearsAgo}年前の年齢の関係`
          }
        ],

        solutionDisplay: `x＝${x}、y＝${y}`,

        keypadNumbers: buildKeypadNumbers([sum, yearsAgo, multiplier]),
        keypadSymbols: KEYPAD_SYMBOLS_MULT,

        hint: `${yearsAgo}年前の年齢は「x−${yearsAgo}」「y−${yearsAgo}」と表せます。`,
        hintKeypadParts: [
          { display: `（y−${yearsAgo}）`, value: `(y-${yearsAgo})`, ariaLabel: `yひく${yearsAgo}` }
        ],

        explanation: "現在の年齢の和と、過去の年齢の倍率の関係から2本の式を作ります。"
      };
    }
  },

  {
    templateId: "L2-05-father-daughter-future",
    categoryId: CATEGORY_ID,

    generate() {
      const daughterFutureAge = randomInt(10, 20);
      const multiplier = randomInt(2, 3);
      const fatherFutureAge = multiplier * daughterFutureAge;
      const yearsLater = randomInt(3, 10);

      const y = daughterFutureAge - yearsLater; // 娘の現在の年齢
      const x = fatherFutureAge - yearsLater; // 父の現在の年齢
      const sum = x + y;

      if (y <= 0 || x <= 0) {
        return this.generate();
      }

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        unit: UNIT,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "NORMAL",

        prompt:
          `現在、父と娘の年齢の和は${sum}歳です。${yearsLater}年後、父の年齢は娘の年齢の` +
          `${multiplier}倍になります。現在の父の年齢をx歳、娘の年齢をy歳として連立方程式を` +
          `立てなさい。`,

        variableDefinitions: {
          x: "父の現在の年齢",
          y: "娘の現在の年齢"
        },

        expectedSolution: { x, y },

        canonicalEquations: [
          { internal: `x+y=${sum}`, display: `x＋y＝${sum}`, relationName: "現在の年齢の和" },
          {
            internal: `x+${yearsLater}=${multiplier}*(y+${yearsLater})`,
            display: `x＋${yearsLater}＝${multiplier}(y＋${yearsLater})`,
            relationName: `${yearsLater}年後の年齢の関係`
          }
        ],

        solutionDisplay: `x＝${x}、y＝${y}`,

        keypadNumbers: buildKeypadNumbers([sum, yearsLater, multiplier]),
        keypadSymbols: KEYPAD_SYMBOLS_MULT,

        hint: `${yearsLater}年後の年齢は「x＋${yearsLater}」「y＋${yearsLater}」と表せます。`,
        hintKeypadParts: [
          { display: `（y＋${yearsLater}）`, value: `(y+${yearsLater})`, ariaLabel: `yたす${yearsLater}` }
        ],

        explanation: "現在の年齢の和と、未来の年齢の倍率の関係から2本の式を作ります。"
      };
    }
  },

  {
    templateId: "L2-05-siblings-diff",
    categoryId: CATEGORY_ID,

    generate() {
      const y = randomInt(5, 20); // 弟の年齢
      const diff = randomInt(2, 8);
      const x = y + diff; // 兄の年齢
      const sum = x + y;

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        unit: UNIT,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "NORMAL",

        prompt:
          `現在、兄と弟の年齢の和は${sum}歳で、年齢の差は${diff}歳です。兄の年齢をx歳、` +
          `弟の年齢をy歳として連立方程式を立てなさい。`,

        variableDefinitions: {
          x: "兄の現在の年齢",
          y: "弟の現在の年齢"
        },

        expectedSolution: { x, y },

        canonicalEquations: [
          { internal: `x+y=${sum}`, display: `x＋y＝${sum}`, relationName: "年齢の和" },
          { internal: `x-y=${diff}`, display: `x−y＝${diff}`, relationName: "年齢の差" }
        ],

        solutionDisplay: `x＝${x}、y＝${y}`,

        keypadNumbers: buildKeypadNumbers([sum, diff]),
        keypadSymbols: KEYPAD_SYMBOLS_SUM,

        hint: "年齢の和と、年齢の差をそれぞれ式にしましょう。",
        hintKeypadParts: [],

        explanation: "年齢の和と年齢の差から2本の式を作ります。"
      };
    }
  }
];
