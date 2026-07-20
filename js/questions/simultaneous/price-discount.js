// カテゴリ：割合の増減・代金（L2-11）
// 基本式：定価の合計／割引後の代金の合計（割引後の割合×定価＝割引後の代金）

import { createUniqueId, randomInt, randomChoice, buildKeypadNumbers } from "./categories.js";

const CATEGORY_ID = "L2-11";
const CATEGORY_NAME = "割合の増減・代金";
const UNIT = "simultaneous";

const KEYPAD_SYMBOLS = ["x", "y", "+", "-", "="];
const DISCOUNT_CHOICES = [10, 20, 30, 40];

/**
 * x・yを100の倍数、割引率を10の倍数にすることで、
 * 割引後の代金が必ず整数になるようにする。
 */
function buildDiscountNumbers() {
  const x = randomInt(10, 40) * 100;
  const y = randomInt(10, 40) * 100;
  const discountA = randomChoice(DISCOUNT_CHOICES);
  // 割引率が同じだと2本の式が比例してしまい（行列式が0）、解が定まらなくなるため、
  // 必ず異なる割引率になるまで引き直す。
  let discountB = randomChoice(DISCOUNT_CHOICES);
  while (discountB === discountA) {
    discountB = randomChoice(DISCOUNT_CHOICES);
  }

  const decimalA = (100 - discountA) / 100;
  const decimalB = (100 - discountB) / 100;
  const ratioA = discountA / 100;
  const ratioB = discountB / 100;

  const priceTotal = x + y;
  const discountedTotal = decimalA * x + decimalB * y;
  // 定価の合計から割引後の代金の合計を引いた「値引き額の合計」に着目した式も別解として認める
  // （ratioA*x＋ratioB*yは、それぞれの商品の値引き額の合計になる）
  const discountAmount = priceTotal - discountedTotal;

  return {
    x,
    y,
    discountA,
    discountB,
    decimalA,
    decimalB,
    ratioA,
    ratioB,
    priceTotal,
    discountedTotal,
    discountAmount
  };
}

export const priceDiscountTemplates = [
  {
    templateId: "L2-11-shirt-pants",
    categoryId: CATEGORY_ID,

    generate() {
      const {
        x,
        y,
        discountA,
        discountB,
        decimalA,
        decimalB,
        ratioA,
        ratioB,
        priceTotal,
        discountedTotal,
        discountAmount
      } = buildDiscountNumbers();

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        unit: UNIT,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "HARD",

        prompt:
          `定価の合計が${priceTotal}円のシャツとズボンを、シャツは${discountA}％引き、` +
          `ズボンは${discountB}％引きで購入したところ、代金は${discountedTotal}円でした。シャツの定価を` +
          `x円、ズボンの定価をy円として連立方程式を立てなさい。`,

        variableDefinitions: {
          x: "シャツの定価",
          y: "ズボンの定価"
        },

        expectedSolution: { x, y },

        canonicalEquations: [
          { internal: `x+y=${priceTotal}`, display: `x＋y＝${priceTotal}`, relationName: "定価の合計" },
          {
            internal: `${decimalA}*x+${decimalB}*y=${discountedTotal}`,
            display: `${decimalA}x＋${decimalB}y＝${discountedTotal}`,
            relationName: "割引後の代金の合計"
          }
        ],

        // 「割引後の代金の合計」ではなく「値引き額の合計」に着目した式も別解として認める
        alternateEquations: [
          {
            index: 1,
            internal: `${ratioA}*x+${ratioB}*y=${discountAmount}`,
            display: `${ratioA}x＋${ratioB}y＝${discountAmount}`,
            relationName: "値引き額の合計の関係"
          }
        ],

        solutionDisplay: `x＝${x}、y＝${y}`,

        keypadNumbers: buildKeypadNumbers([
          priceTotal,
          decimalA,
          decimalB,
          discountedTotal,
          ratioA,
          ratioB,
          discountAmount
        ]),
        keypadSymbols: KEYPAD_SYMBOLS,

        hint: `割引後のシャツの代金は「${decimalA}×x」、ズボンの代金は「${decimalB}×y」と表せます。`,
        hintKeypadParts: [],

        explanation: "定価の合計と、割引後の代金の合計から2本の式を作ります。"
      };
    }
  },

  {
    templateId: "L2-11-jacket-shoes",
    categoryId: CATEGORY_ID,

    generate() {
      const {
        x,
        y,
        discountA,
        discountB,
        decimalA,
        decimalB,
        ratioA,
        ratioB,
        priceTotal,
        discountedTotal,
        discountAmount
      } = buildDiscountNumbers();

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        unit: UNIT,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "HARD",

        prompt:
          `定価の合計が${priceTotal}円の上着とくつを、上着は${discountA}％引き、くつは${discountB}％引きで` +
          `購入したところ、代金は${discountedTotal}円でした。上着の定価をx円、くつの定価をy円として` +
          `連立方程式を立てなさい。`,

        variableDefinitions: {
          x: "上着の定価",
          y: "くつの定価"
        },

        expectedSolution: { x, y },

        canonicalEquations: [
          { internal: `x+y=${priceTotal}`, display: `x＋y＝${priceTotal}`, relationName: "定価の合計" },
          {
            internal: `${decimalA}*x+${decimalB}*y=${discountedTotal}`,
            display: `${decimalA}x＋${decimalB}y＝${discountedTotal}`,
            relationName: "割引後の代金の合計"
          }
        ],

        alternateEquations: [
          {
            index: 1,
            internal: `${ratioA}*x+${ratioB}*y=${discountAmount}`,
            display: `${ratioA}x＋${ratioB}y＝${discountAmount}`,
            relationName: "値引き額の合計の関係"
          }
        ],

        solutionDisplay: `x＝${x}、y＝${y}`,

        keypadNumbers: buildKeypadNumbers([
          priceTotal,
          decimalA,
          decimalB,
          discountedTotal,
          ratioA,
          ratioB,
          discountAmount
        ]),
        keypadSymbols: KEYPAD_SYMBOLS,

        hint: `割引後の上着の代金は「${decimalA}×x」、くつの代金は「${decimalB}×y」と表せます。`,
        hintKeypadParts: [],

        explanation: "定価の合計と、割引後の代金の合計から2本の式を作ります。"
      };
    }
  },

  {
    templateId: "L2-11-table-chair",
    categoryId: CATEGORY_ID,

    generate() {
      const {
        x,
        y,
        discountA,
        discountB,
        decimalA,
        decimalB,
        ratioA,
        ratioB,
        priceTotal,
        discountedTotal,
        discountAmount
      } = buildDiscountNumbers();

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        unit: UNIT,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "HARD",

        prompt:
          `定価の合計が${priceTotal}円のテーブルといすを、テーブルは${discountA}％引き、いすは` +
          `${discountB}％引きで購入したところ、代金は${discountedTotal}円でした。テーブルの定価をx円、` +
          `いすの定価をy円として連立方程式を立てなさい。`,

        variableDefinitions: {
          x: "テーブルの定価",
          y: "いすの定価"
        },

        expectedSolution: { x, y },

        canonicalEquations: [
          { internal: `x+y=${priceTotal}`, display: `x＋y＝${priceTotal}`, relationName: "定価の合計" },
          {
            internal: `${decimalA}*x+${decimalB}*y=${discountedTotal}`,
            display: `${decimalA}x＋${decimalB}y＝${discountedTotal}`,
            relationName: "割引後の代金の合計"
          }
        ],

        alternateEquations: [
          {
            index: 1,
            internal: `${ratioA}*x+${ratioB}*y=${discountAmount}`,
            display: `${ratioA}x＋${ratioB}y＝${discountAmount}`,
            relationName: "値引き額の合計の関係"
          }
        ],

        solutionDisplay: `x＝${x}、y＝${y}`,

        keypadNumbers: buildKeypadNumbers([
          priceTotal,
          decimalA,
          decimalB,
          discountedTotal,
          ratioA,
          ratioB,
          discountAmount
        ]),
        keypadSymbols: KEYPAD_SYMBOLS,

        hint: `割引後のテーブルの代金は「${decimalA}×x」、いすの代金は「${decimalB}×y」と表せます。`,
        hintKeypadParts: [],

        explanation: "定価の合計と、割引後の代金の合計から2本の式を作ります。"
      };
    }
  }
];
