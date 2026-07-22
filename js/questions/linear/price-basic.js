// カテゴリ：個数・代金
// 基本式：単価×個数＋追加料金＝合計金額

import {
  createUniqueId,
  randomInt,
  randomChoice,
  buildKeypadNumbers
} from "./categories.js";

const CATEGORY_ID = "L1-01";
const CATEGORY_NAME = "個数・代金";

// このカテゴリの式は「単価×個数＋追加料金＝合計金額」で固定のため、
// 使用する記号も問題によらず一定になる。
const KEYPAD_SYMBOLS = ["x", "+", "="];

function buildAppleBoxQuestion({ unitPrice, boxFee, expectedX }) {
  const total = unitPrice * expectedX + boxFee;

  return {
    id: createUniqueId("L1-01-apple-box"),
    templateId: "L1-01-apple-box",
    categoryId: CATEGORY_ID,
    categoryName: CATEGORY_NAME,
    rankDifficulty: "NORMAL",

    prompt:
      `1個${unitPrice}円のりんごを何個か買い、箱代${boxFee}円を` +
      `別に払ったところ、代金の合計が${total}円になりました。` +
      `りんごの個数をx個として方程式を立てなさい。`,

    variableDefinition: "りんごの個数",

    expectedX,

    canonicalEquation: `${unitPrice}*x+${boxFee}=${total}`,
    displayEquation: `${unitPrice}x＋${boxFee}＝${total}`,
    solutionDisplay: `x＝${expectedX}`,

    keypadNumbers: buildKeypadNumbers([unitPrice, boxFee, total]),
    keypadSymbols: KEYPAD_SYMBOLS,

    // xだけで表せる基本問題のため、式パーツは不要
    hintKeypadParts: [],

    hint:
      `りんごの代金は「1個${unitPrice}円×個数」で表せます。` +
      `そこに箱代${boxFee}円を足すと合計になります。`,

    explanation:
      "りんごの代金と箱代を合わせた金額が、代金の合計と等しくなります。"
  };
}

export const priceBasicTemplates = [
  {
    templateId: "L1-01-apple-box",
    categoryId: CATEGORY_ID,

    generate() {
      return buildAppleBoxQuestion({
        unitPrice: randomChoice([80, 100, 120, 150, 180]),
        boxFee: randomChoice([50, 80, 100, 150]),
        expectedX: randomInt(3, 12)
      });
    },

    // 例題確認（ヘルプメニュー）専用：固定値で毎回同じ代表例題を返す。
    generateExample() {
      return buildAppleBoxQuestion({ unitPrice: 150, boxFee: 100, expectedX: 4 });
    }
  },

  {
    templateId: "L1-01-notebook-shipping",
    categoryId: CATEGORY_ID,

    generate() {
      const unitPrice = randomChoice([90, 100, 110, 130, 160]);
      const shippingFee = randomChoice([150, 200, 250, 300]);
      const expectedX = randomInt(4, 15);
      const total = unitPrice * expectedX + shippingFee;

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "NORMAL",

        prompt:
          `1冊${unitPrice}円のノートを何冊か注文し、送料${shippingFee}円を` +
          `別に払ったところ、支払い金額の合計が${total}円になりました。` +
          `ノートの冊数をx冊として方程式を立てなさい。`,

        variableDefinition: "ノートの冊数",

        expectedX,

        canonicalEquation: `${unitPrice}*x+${shippingFee}=${total}`,
        displayEquation: `${unitPrice}x＋${shippingFee}＝${total}`,
        solutionDisplay: `x＝${expectedX}`,

        keypadNumbers: buildKeypadNumbers([unitPrice, shippingFee, total]),
        keypadSymbols: KEYPAD_SYMBOLS,

        // xだけで表せる基本問題のため、式パーツは不要
        hintKeypadParts: [],

        hint:
          `ノートの代金は「1冊${unitPrice}円×冊数」で表せます。` +
          `送料${shippingFee}円を足すと支払い金額の合計になります。`,

        explanation:
          "ノートの代金と送料を合わせた金額が、支払い金額の合計と等しくなります。"
      };
    }
  },

  {
    templateId: "L1-01-ticket-pamphlet",
    categoryId: CATEGORY_ID,

    generate() {
      const unitPrice = randomChoice([600, 700, 800, 900, 1000]);
      const pamphletFee = randomChoice([200, 300, 400]);
      const expectedX = randomInt(3, 8);
      const total = unitPrice * expectedX + pamphletFee;

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "NORMAL",

        prompt:
          `1枚${unitPrice}円の入場券を何枚か買い、パンフレット代${pamphletFee}円を` +
          `別に払ったところ、支払った金額の合計が${total}円になりました。` +
          `入場券の枚数をx枚として方程式を立てなさい。`,

        variableDefinition: "入場券の枚数",

        expectedX,

        canonicalEquation: `${unitPrice}*x+${pamphletFee}=${total}`,
        displayEquation: `${unitPrice}x＋${pamphletFee}＝${total}`,
        solutionDisplay: `x＝${expectedX}`,

        keypadNumbers: buildKeypadNumbers([unitPrice, pamphletFee, total]),
        keypadSymbols: KEYPAD_SYMBOLS,

        // xだけで表せる基本問題のため、式パーツは不要
        hintKeypadParts: [],

        hint:
          `入場券の代金は「1枚${unitPrice}円×枚数」で表せます。` +
          `パンフレット代${pamphletFee}円を足すと合計になります。`,

        explanation:
          "入場券の代金とパンフレット代を合わせた金額が、支払い金額の合計と等しくなります。"
      };
    }
  }
];
