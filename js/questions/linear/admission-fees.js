// カテゴリ：人数と料金
// 大人をx人、子どもを「全体人数－x」と表す。

import {
  createUniqueId,
  randomInt,
  randomChoice,
  buildKeypadNumbers
} from "./categories.js";

const CATEGORY_ID = "L1-11";
const CATEGORY_NAME = "人数と料金";

// このカテゴリの式は「大人料金×x＋子ども料金×(全体－x)＝合計」で固定のため、
// 使用する記号も問題によらず一定になる。
const KEYPAD_SYMBOLS = ["x", "+", "-", "(", ")", "="];

function buildAdmissionNumbers(adultChoices, childChoices) {
  const totalPeople = randomInt(8, 20);
  const adultFee = randomChoice(adultChoices);
  let childFee = randomChoice(childChoices);
  while (childFee === adultFee) {
    childFee = randomChoice(childChoices);
  }
  const expectedX = randomInt(2, totalPeople - 2);
  const totalFee = adultFee * expectedX + childFee * (totalPeople - expectedX);

  return { totalPeople, adultFee, childFee, expectedX, totalFee };
}

export const admissionFeeTemplates = [
  {
    templateId: "L1-11-aquarium",
    categoryId: CATEGORY_ID,

    generate() {
      const { totalPeople, adultFee, childFee, expectedX, totalFee } =
        buildAdmissionNumbers([1200, 1500, 1800], [600, 700, 800]);

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "NORMAL",

        prompt:
          `水族館の入館料は、大人1人${adultFee}円、子ども1人${childFee}円です。` +
          `大人と子どもを合わせて${totalPeople}人が入館し、入館料の合計が` +
          `${totalFee}円になりました。大人の人数をx人として方程式を立てなさい。`,

        variableDefinition: "大人の人数",

        expectedX,

        canonicalEquation: `${adultFee}*x+${childFee}*(${totalPeople}-x)=${totalFee}`,
        displayEquation: `${adultFee}x＋${childFee}(${totalPeople}−x)＝${totalFee}`,
        solutionDisplay: `x＝${expectedX}`,

        keypadNumbers: buildKeypadNumbers([
          adultFee,
          childFee,
          totalPeople,
          totalFee
        ]),
        keypadSymbols: KEYPAD_SYMBOLS,

        // 「全体からxを引く」という1つの数量表現だけを補助する
        hintKeypadParts: [
          {
            display: `（${totalPeople}−x）`,
            value: `(${totalPeople}-x)`,
            ariaLabel: `${totalPeople}ひくx`
          }
        ],

        hint:
          `大人がx人なら、子どもは${totalPeople}－x人と表せます。`,

        explanation:
          "大人の入館料と子どもの入館料の合計が、入館料の合計になります。"
      };
    }
  },

  {
    templateId: "L1-11-zoo",
    categoryId: CATEGORY_ID,

    generate() {
      const { totalPeople, adultFee, childFee, expectedX, totalFee } =
        buildAdmissionNumbers([900, 1000, 1100], [400, 450, 500]);

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "NORMAL",

        prompt:
          `動物園の入園料は、大人1人${adultFee}円、子ども1人${childFee}円です。` +
          `大人と子どもを合わせて${totalPeople}人が入園し、入園料の合計が` +
          `${totalFee}円になりました。大人の人数をx人として方程式を立てなさい。`,

        variableDefinition: "大人の人数",

        expectedX,

        canonicalEquation: `${adultFee}*x+${childFee}*(${totalPeople}-x)=${totalFee}`,
        displayEquation: `${adultFee}x＋${childFee}(${totalPeople}−x)＝${totalFee}`,
        solutionDisplay: `x＝${expectedX}`,

        keypadNumbers: buildKeypadNumbers([
          adultFee,
          childFee,
          totalPeople,
          totalFee
        ]),
        keypadSymbols: KEYPAD_SYMBOLS,

        // 「全体からxを引く」という1つの数量表現だけを補助する
        hintKeypadParts: [
          {
            display: `（${totalPeople}−x）`,
            value: `(${totalPeople}-x)`,
            ariaLabel: `${totalPeople}ひくx`
          }
        ],

        hint:
          `大人がx人なら、子どもは${totalPeople}－x人と表せます。`,

        explanation:
          "大人の入園料と子どもの入園料の合計が、入園料の合計になります。"
      };
    }
  },

  {
    templateId: "L1-11-amusement-park",
    categoryId: CATEGORY_ID,

    generate() {
      const { totalPeople, adultFee, childFee, expectedX, totalFee } =
        buildAdmissionNumbers([2500, 2800, 3000], [1200, 1400, 1600]);

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "NORMAL",

        prompt:
          `遊園地の入園料は、大人1人${adultFee}円、子ども1人${childFee}円です。` +
          `大人と子どもを合わせて${totalPeople}人が入園し、入園料の合計が` +
          `${totalFee}円になりました。大人の人数をx人として方程式を立てなさい。`,

        variableDefinition: "大人の人数",

        expectedX,

        canonicalEquation: `${adultFee}*x+${childFee}*(${totalPeople}-x)=${totalFee}`,
        displayEquation: `${adultFee}x＋${childFee}(${totalPeople}−x)＝${totalFee}`,
        solutionDisplay: `x＝${expectedX}`,

        keypadNumbers: buildKeypadNumbers([
          adultFee,
          childFee,
          totalPeople,
          totalFee
        ]),
        keypadSymbols: KEYPAD_SYMBOLS,

        // 「全体からxを引く」という1つの数量表現だけを補助する
        hintKeypadParts: [
          {
            display: `（${totalPeople}−x）`,
            value: `(${totalPeople}-x)`,
            ariaLabel: `${totalPeople}ひくx`
          }
        ],

        hint:
          `大人がx人なら、子どもは${totalPeople}－x人と表せます。`,

        explanation:
          "大人の入園料と子どもの入園料の合計が、入園料の合計になります。"
      };
    }
  }
];
