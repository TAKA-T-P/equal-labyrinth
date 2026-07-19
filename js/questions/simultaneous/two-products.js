// カテゴリ：2種類の品物と代金（L2-01）
// 基本式：個数の合計＝全体の個数／単価×個数の合計＝代金の合計

import { createUniqueId, randomInt, randomChoice, buildKeypadNumbers } from "./categories.js";

const CATEGORY_ID = "L2-01";
const CATEGORY_NAME = "2種類の品物と代金";
const UNIT = "simultaneous";

const KEYPAD_SYMBOLS_SUM = ["x", "y", "+", "="];
const KEYPAD_SYMBOLS_DIFF = ["x", "y", "+", "-", "="];

export const twoProductsTemplates = [
  {
    templateId: "L2-01-bread",
    categoryId: CATEGORY_ID,

    generate() {
      const totalCount = randomInt(8, 20);
      const priceA = randomChoice([80, 100, 120, 150]);
      let priceB = randomChoice([80, 100, 120, 150, 180, 200]);
      while (priceB === priceA) {
        priceB = randomChoice([80, 100, 120, 150, 180, 200]);
      }
      const x = randomInt(2, totalCount - 2);
      const y = totalCount - x;
      const total = priceA * x + priceB * y;

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        unit: UNIT,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "NORMAL",

        prompt:
          `1個${priceA}円のパンと1個${priceB}円のパンを合わせて${totalCount}個買うと、` +
          `代金は${total}円でした。${priceA}円のパンをx個、${priceB}円のパンをy個として、` +
          `連立方程式を立てなさい。`,

        variableDefinitions: {
          x: `${priceA}円のパンの個数`,
          y: `${priceB}円のパンの個数`
        },

        expectedSolution: { x, y },

        canonicalEquations: [
          { internal: `x+y=${totalCount}`, display: `x＋y＝${totalCount}`, relationName: "個数の合計" },
          {
            internal: `${priceA}*x+${priceB}*y=${total}`,
            display: `${priceA}x＋${priceB}y＝${total}`,
            relationName: "代金の合計"
          }
        ],

        solutionDisplay: `x＝${x}、y＝${y}`,

        keypadNumbers: buildKeypadNumbers([priceA, priceB, totalCount, total]),
        keypadSymbols: KEYPAD_SYMBOLS_SUM,

        hint: "1本目は個数の合計、2本目は代金の合計を式にしましょう。",
        hintKeypadParts: [],

        explanation: "2種類のパンの個数の合計と、代金の合計から2本の式を作ります。"
      };
    }
  },

  {
    templateId: "L2-01-cake-cookie",
    categoryId: CATEGORY_ID,

    generate() {
      const cookieCount = randomInt(3, 15);
      const diff = randomInt(1, 6);
      const cakeCount = cookieCount + diff;
      const priceCookie = randomChoice([60, 80, 100]);
      let priceCake = randomChoice([150, 180, 200, 250]);
      const total = priceCookie * cookieCount + priceCake * cakeCount;

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        unit: UNIT,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "NORMAL",

        prompt:
          `1個${priceCake}円のケーキを、1個${priceCookie}円のクッキーより${diff}個多く買いました。` +
          `代金の合計は${total}円です。クッキーの個数をx個、ケーキの個数をy個として、` +
          `連立方程式を立てなさい。`,

        variableDefinitions: {
          x: "クッキーの個数",
          y: "ケーキの個数"
        },

        expectedSolution: { x: cookieCount, y: cakeCount },

        canonicalEquations: [
          { internal: `y=x+${diff}`, display: `y＝x＋${diff}`, relationName: "個数の関係" },
          {
            internal: `${priceCookie}*x+${priceCake}*y=${total}`,
            display: `${priceCookie}x＋${priceCake}y＝${total}`,
            relationName: "代金の合計"
          }
        ],

        solutionDisplay: `x＝${cookieCount}、y＝${cakeCount}`,

        keypadNumbers: buildKeypadNumbers([diff, priceCookie, priceCake, total]),
        keypadSymbols: KEYPAD_SYMBOLS_DIFF,

        hint: `ケーキの個数は「クッキーの個数＋${diff}」と表せます。`,
        hintKeypadParts: [
          { display: `x＋${diff}`, value: `x+${diff}`, ariaLabel: `xたす${diff}` }
        ],

        explanation: "個数の関係と、代金の合計から2本の式を作ります。"
      };
    }
  },

  {
    templateId: "L2-01-notebook-pencil",
    categoryId: CATEGORY_ID,

    generate() {
      const totalCount = randomInt(10, 25);
      const priceA = randomChoice([50, 70, 90]);
      let priceB = randomChoice([120, 130, 160, 180]);
      const x = randomInt(2, totalCount - 2);
      const y = totalCount - x;
      const total = priceA * x + priceB * y;

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        unit: UNIT,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "NORMAL",

        prompt:
          `1本${priceA}円のえんぴつと1冊${priceB}円のノートを合わせて${totalCount}個買うと、` +
          `代金は${total}円でした。えんぴつをx本、ノートをy冊として、連立方程式を立てなさい。`,

        variableDefinitions: {
          x: "えんぴつの本数",
          y: "ノートの冊数"
        },

        expectedSolution: { x, y },

        canonicalEquations: [
          { internal: `x+y=${totalCount}`, display: `x＋y＝${totalCount}`, relationName: "個数の合計" },
          {
            internal: `${priceA}*x+${priceB}*y=${total}`,
            display: `${priceA}x＋${priceB}y＝${total}`,
            relationName: "代金の合計"
          }
        ],

        solutionDisplay: `x＝${x}、y＝${y}`,

        keypadNumbers: buildKeypadNumbers([priceA, priceB, totalCount, total]),
        keypadSymbols: KEYPAD_SYMBOLS_SUM,

        hint: "1本目は個数の合計、2本目は代金の合計を式にしましょう。",
        hintKeypadParts: [],

        explanation: "えんぴつとノートの個数の合計と、代金の合計から2本の式を作ります。"
      };
    }
  }
];
