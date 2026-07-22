// カテゴリ：2種類の品物
// 一方をx個、他方を「全体個数－x」と表す。

import {
  createUniqueId,
  randomInt,
  randomChoice,
  buildKeypadNumbers
} from "./categories.js";

const CATEGORY_ID = "L1-10";
const CATEGORY_NAME = "2種類の品物";

// このカテゴリの式は「A×x＋B×(全体－x)＝合計」で固定のため、
// 使用する記号も問題によらず一定になる。
const KEYPAD_SYMBOLS = ["x", "+", "-", "(", ")", "="];

function buildTwoProductNumbers(priceChoicesA, priceChoicesB) {
  const totalCount = randomInt(8, 15);
  const priceA = randomChoice(priceChoicesA);
  let priceB = randomChoice(priceChoicesB);
  while (priceB === priceA) {
    priceB = randomChoice(priceChoicesB);
  }
  const expectedX = randomInt(2, totalCount - 2);
  const totalPrice = priceA * expectedX + priceB * (totalCount - expectedX);

  return { totalCount, priceA, priceB, expectedX, totalPrice };
}

function buildFruitAppleOrangeQuestion({ totalCount, priceA, priceB, expectedX, totalPrice }) {
  return {
    id: createUniqueId("L1-10-fruit-apple-orange"),
    templateId: "L1-10-fruit-apple-orange",
    categoryId: CATEGORY_ID,
    categoryName: CATEGORY_NAME,
    rankDifficulty: "NORMAL",

    prompt:
      `1個${priceA}円のりんごと1個${priceB}円のみかんを合わせて` +
      `${totalCount}個買うと、代金の合計が${totalPrice}円になりました。` +
      `りんごの個数をx個として方程式を立てなさい。`,

    variableDefinition: "りんごの個数",

    expectedX,

    canonicalEquation: `${priceA}*x+${priceB}*(${totalCount}-x)=${totalPrice}`,
    displayEquation: `${priceA}x＋${priceB}(${totalCount}−x)＝${totalPrice}`,
    solutionDisplay: `x＝${expectedX}`,

    keypadNumbers: buildKeypadNumbers([
      priceA,
      priceB,
      totalCount,
      totalPrice
    ]),
    keypadSymbols: KEYPAD_SYMBOLS,

    // 「全体からxを引く」という1つの数量表現だけを補助する
    hintKeypadParts: [
      {
        display: `（${totalCount}−x）`,
        value: `(${totalCount}-x)`,
        ariaLabel: `${totalCount}ひくx`
      }
    ],

    hint:
      `りんごがx個なら、みかんは${totalCount}－x個と表せます。`,

    explanation:
      "りんごの代金とみかんの代金の合計が、全体の代金になります。"
  };
}

export const twoProductsTemplates = [
  {
    templateId: "L1-10-fruit-apple-orange",
    categoryId: CATEGORY_ID,

    generate() {
      return buildFruitAppleOrangeQuestion(
        buildTwoProductNumbers([120, 150, 180], [60, 80, 100])
      );
    },

    // 例題確認（ヘルプメニュー）専用：固定値で毎回同じ代表例題を返す。
    generateExample() {
      return buildFruitAppleOrangeQuestion({
        totalCount: 10,
        priceA: 150,
        priceB: 80,
        expectedX: 4,
        totalPrice: 1080
      });
    }
  },

  {
    templateId: "L1-10-bread-anpan-cream",
    categoryId: CATEGORY_ID,

    generate() {
      const { totalCount, priceA, priceB, expectedX, totalPrice } =
        buildTwoProductNumbers([130, 150, 170], [100, 110, 120]);

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "NORMAL",

        prompt:
          `1個${priceA}円のあんぱんと1個${priceB}円のクリームパンを合わせて` +
          `${totalCount}個買うと、代金の合計が${totalPrice}円になりました。` +
          `あんぱんの個数をx個として方程式を立てなさい。`,

        variableDefinition: "あんぱんの個数",

        expectedX,

        canonicalEquation: `${priceA}*x+${priceB}*(${totalCount}-x)=${totalPrice}`,
        displayEquation: `${priceA}x＋${priceB}(${totalCount}−x)＝${totalPrice}`,
        solutionDisplay: `x＝${expectedX}`,

        keypadNumbers: buildKeypadNumbers([
          priceA,
          priceB,
          totalCount,
          totalPrice
        ]),
        keypadSymbols: KEYPAD_SYMBOLS,

        // 「全体からxを引く」という1つの数量表現だけを補助する
        hintKeypadParts: [
          {
            display: `（${totalCount}−x）`,
            value: `(${totalCount}-x)`,
            ariaLabel: `${totalCount}ひくx`
          }
        ],

        hint:
          `あんぱんがx個なら、クリームパンは${totalCount}－x個と表せます。`,

        explanation:
          "あんぱんの代金とクリームパンの代金の合計が、全体の代金になります。"
      };
    }
  },

  {
    templateId: "L1-10-stationery-notebook-eraser",
    categoryId: CATEGORY_ID,

    generate() {
      const { totalCount, priceA, priceB, expectedX, totalPrice } =
        buildTwoProductNumbers([100, 120, 140], [50, 60, 70]);

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "NORMAL",

        prompt:
          `1冊${priceA}円のノートと1個${priceB}円の消しゴムを合わせて` +
          `${totalCount}個買うと、代金の合計が${totalPrice}円になりました。` +
          `ノートの冊数をx冊として方程式を立てなさい。`,

        variableDefinition: "ノートの冊数",

        expectedX,

        canonicalEquation: `${priceA}*x+${priceB}*(${totalCount}-x)=${totalPrice}`,
        displayEquation: `${priceA}x＋${priceB}(${totalCount}−x)＝${totalPrice}`,
        solutionDisplay: `x＝${expectedX}`,

        keypadNumbers: buildKeypadNumbers([
          priceA,
          priceB,
          totalCount,
          totalPrice
        ]),
        keypadSymbols: KEYPAD_SYMBOLS,

        // 「全体からxを引く」という1つの数量表現だけを補助する
        hintKeypadParts: [
          {
            display: `（${totalCount}−x）`,
            value: `(${totalCount}-x)`,
            ariaLabel: `${totalCount}ひくx`
          }
        ],

        hint:
          `ノートがx冊なら、消しゴムは${totalCount}－x個と表せます。`,

        explanation:
          "ノートの代金と消しゴムの代金の合計が、全体の代金になります。"
      };
    }
  }
];
