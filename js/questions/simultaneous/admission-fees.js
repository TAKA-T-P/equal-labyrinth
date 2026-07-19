// カテゴリ：人数と料金（L2-02）
// 基本式：おとなの人数×x（おとな1人の料金）＋子どもの人数×y（子ども1人の料金）＝合計

import {
  createUniqueId,
  randomInt,
  randomChoice,
  buildKeypadNumbers,
  termInternal,
  termDisplay
} from "./categories.js";

const CATEGORY_ID = "L2-02";
const CATEGORY_NAME = "人数と料金";
const UNIT = "simultaneous";

const KEYPAD_SYMBOLS = ["x", "y", "+", "="];

/**
 * 2通りの人数の組み合わせから、おとな・子どもそれぞれの料金（x, y）を
 * 逆算できるように、先に料金を決めてから合計額を計算する。
 * 行列式（a1*b2 - a2*b1）が0にならないよう、2つの組み合わせが
 * 一次独立になるまで人数の組を引き直す。
 */
function buildTwoGroupNumbers(adultPriceChoices, childPriceChoices) {
  const adultPrice = randomChoice(adultPriceChoices);
  let childPrice = randomChoice(childPriceChoices);
  while (childPrice >= adultPrice) {
    childPrice = randomChoice(childPriceChoices);
  }

  let a1;
  let b1;
  let a2;
  let b2;
  do {
    a1 = randomInt(1, 4);
    b1 = randomInt(1, 4);
    a2 = randomInt(1, 4);
    b2 = randomInt(1, 4);
  } while (a1 * b2 - a2 * b1 === 0);

  const total1 = a1 * adultPrice + b1 * childPrice;
  const total2 = a2 * adultPrice + b2 * childPrice;

  return { adultPrice, childPrice, a1, b1, total1, a2, b2, total2 };
}

function buildEquations(a1, b1, total1, a2, b2, total2) {
  return [
    {
      internal: `${termInternal(a1, "x")}+${termInternal(b1, "y")}=${total1}`,
      display: `${termDisplay(a1, "x")}＋${termDisplay(b1, "y")}＝${total1}`
    },
    {
      internal: `${termInternal(a2, "x")}+${termInternal(b2, "y")}=${total2}`,
      display: `${termDisplay(a2, "x")}＋${termDisplay(b2, "y")}＝${total2}`
    }
  ];
}

export const admissionFeesTemplates = [
  {
    templateId: "L2-02-aquarium",
    categoryId: CATEGORY_ID,

    generate() {
      const { adultPrice, childPrice, a1, b1, total1, a2, b2, total2 } =
        buildTwoGroupNumbers([1200, 1500, 1800, 2000], [500, 600, 700, 800]);

      const [eq1, eq2] = buildEquations(a1, b1, total1, a2, b2, total2);

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        unit: UNIT,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "NORMAL",

        prompt:
          `ある水族館の入館料は、おとな${a1}人と中学生${b1}人で${total1}円、` +
          `おとな${a2}人と中学生${b2}人で${total2}円です。おとな1人の料金をx円、` +
          `中学生1人の料金をy円として連立方程式を立てなさい。`,

        variableDefinitions: {
          x: "おとな1人の料金",
          y: "中学生1人の料金"
        },

        expectedSolution: { x: adultPrice, y: childPrice },

        canonicalEquations: [
          { ...eq1, relationName: `おとな${a1}人・中学生${b1}人の合計` },
          { ...eq2, relationName: `おとな${a2}人・中学生${b2}人の合計` }
        ],

        solutionDisplay: `x＝${adultPrice}、y＝${childPrice}`,

        keypadNumbers: buildKeypadNumbers([a1, b1, total1, a2, b2, total2]),
        keypadSymbols: KEYPAD_SYMBOLS,

        hint: "2つの人数の組み合わせを、それぞれx・yを使った式にしましょう。",
        hintKeypadParts: [],

        explanation: "2通りの人数の組み合わせから、料金を表す2本の式を作ります。"
      };
    }
  },

  {
    templateId: "L2-02-cinema",
    categoryId: CATEGORY_ID,

    generate() {
      const { adultPrice, childPrice, a1, b1, total1, a2, b2, total2 } =
        buildTwoGroupNumbers([1400, 1600, 1800, 2000], [800, 900, 1000, 1100]);

      const [eq1, eq2] = buildEquations(a1, b1, total1, a2, b2, total2);

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        unit: UNIT,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "NORMAL",

        prompt:
          `映画館の料金は、おとな${a1}人と子ども${b1}人で${total1}円、` +
          `おとな${a2}人と子ども${b2}人で${total2}円です。おとな1人の料金をx円、` +
          `子ども1人の料金をy円として連立方程式を立てなさい。`,

        variableDefinitions: {
          x: "おとな1人の料金",
          y: "子ども1人の料金"
        },

        expectedSolution: { x: adultPrice, y: childPrice },

        canonicalEquations: [
          { ...eq1, relationName: `おとな${a1}人・子ども${b1}人の合計` },
          { ...eq2, relationName: `おとな${a2}人・子ども${b2}人の合計` }
        ],

        solutionDisplay: `x＝${adultPrice}、y＝${childPrice}`,

        keypadNumbers: buildKeypadNumbers([a1, b1, total1, a2, b2, total2]),
        keypadSymbols: KEYPAD_SYMBOLS,

        hint: "2つの人数の組み合わせを、それぞれx・yを使った式にしましょう。",
        hintKeypadParts: [],

        explanation: "2通りの人数の組み合わせから、料金を表す2本の式を作ります。"
      };
    }
  },

  {
    templateId: "L2-02-pool",
    categoryId: CATEGORY_ID,

    generate() {
      const { adultPrice, childPrice, a1, b1, total1, a2, b2, total2 } =
        buildTwoGroupNumbers([700, 800, 900, 1000], [300, 350, 400, 450]);

      const [eq1, eq2] = buildEquations(a1, b1, total1, a2, b2, total2);

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        unit: UNIT,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "NORMAL",

        prompt:
          `市民プールの利用料は、おとな${a1}人と子ども${b1}人で${total1}円、` +
          `おとな${a2}人と子ども${b2}人で${total2}円です。おとな1人の料金をx円、` +
          `子ども1人の料金をy円として連立方程式を立てなさい。`,

        variableDefinitions: {
          x: "おとな1人の料金",
          y: "子ども1人の料金"
        },

        expectedSolution: { x: adultPrice, y: childPrice },

        canonicalEquations: [
          { ...eq1, relationName: `おとな${a1}人・子ども${b1}人の合計` },
          { ...eq2, relationName: `おとな${a2}人・子ども${b2}人の合計` }
        ],

        solutionDisplay: `x＝${adultPrice}、y＝${childPrice}`,

        keypadNumbers: buildKeypadNumbers([a1, b1, total1, a2, b2, total2]),
        keypadSymbols: KEYPAD_SYMBOLS,

        hint: "2つの人数の組み合わせを、それぞれx・yを使った式にしましょう。",
        hintKeypadParts: [],

        explanation: "2通りの人数の組み合わせから、料金を表す2本の式を作ります。"
      };
    }
  }
];
