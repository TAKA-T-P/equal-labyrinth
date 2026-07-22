// カテゴリ：価格と売上（L3-08）
// 基本式：値上げ（または値下げ）1回につき、価格が変わり、売れる個数も変わる関係

import {
  createUniqueId,
  randomInt,
  computeQuadraticRoots
} from "./categories.js";

const CATEGORY_ID = "L3-08";
const CATEGORY_NAME = "価格と売上";
const UNIT = "quadratic";
const KEYPAD_SYMBOLS = ["x", "square", "+", "-", "(", ")", "="];

function buildPriceUpQtyDownQuestion({ basePrice, baseQty, priceStep, qtyStep, n }) {
  const revenue = (basePrice + priceStep * n) * (baseQty - qtyStep * n);
  const canonicalInternal =
    `(${basePrice}+${priceStep}*x)*(${baseQty}-${qtyStep}*x)=${revenue}`;
  const roots = computeQuadraticRoots(canonicalInternal);

  const physicallyValidRoots = roots.filter(
    (root) => root > 0 && root < baseQty / qtyStep
  );
  if (physicallyValidRoots.length !== 1) {
    throw new Error("価格と売上（値上げ）の解が一意に定まりません。");
  }

  return {
    id: createUniqueId("L3-08-price-up-qty-down"),
    templateId: "L3-08-price-up-qty-down",
    unit: UNIT,
    categoryId: CATEGORY_ID,
    categoryName: CATEGORY_NAME,
    rankDifficulty: "HARD",

    prompt:
      `ある商品は、1個${basePrice}円のとき1日に${baseQty}個売れます。この商品を${priceStep}円` +
      `値上げするごとに、1日の販売個数が${qtyStep}個ずつ減ることがわかっています。` +
      `${priceStep}円の値上げをx回行ったときの1日の売上金額が${revenue}円になるとき、` +
      `2次方程式を立てなさい。`,
    variableDefinition: `${priceStep}円の値上げを行った回数`,

    canonicalEquation: {
      internal: canonicalInternal,
      display: `(${basePrice}＋${priceStep}x)(${baseQty}−${qtyStep}x)＝${revenue}`,
      relationName: "売上金額＝価格×販売個数"
    },
    expectedRoots: roots,
    validXValues: [n],
    solutionDisplay: `x＝${n}`,

    keypadNumbers: [String(basePrice), String(priceStep), String(baseQty), String(qtyStep), String(revenue)],
    keypadSymbols: KEYPAD_SYMBOLS,

    hint:
      `x回値上げした後の価格は「${basePrice}＋${priceStep}x」円、販売個数は` +
      `「${baseQty}−${qtyStep}x」個と表せます。`,
    hintKeypadParts: [
      { display: `（${baseQty}−${qtyStep}x）`, value: `(${baseQty}-${qtyStep}*x)`, ariaLabel: `${baseQty}ひく${qtyStep}x` }
    ],
    explanation: "値上げ後の価格と販売個数の積が、売上金額になります。",
    diagram: null
  };
}

export const priceSalesTemplates = [
  {
    templateId: "L3-08-price-up-qty-down",
    categoryId: CATEGORY_ID,

    generate() {
      const basePrice = randomInt(5, 20) * 10;
      const baseQty = randomInt(50, 120);
      const priceStep = randomInt(5, 15);
      const qtyStep = randomInt(1, 3);
      const n = randomInt(2, Math.floor((baseQty - 10) / qtyStep));
      return buildPriceUpQtyDownQuestion({ basePrice, baseQty, priceStep, qtyStep, n });
    },

    // 例題確認（ヘルプメニュー）専用：固定値で毎回同じ代表例題を返す。
    generateExample() {
      return buildPriceUpQtyDownQuestion({
        basePrice: 500,
        baseQty: 100,
        priceStep: 10,
        qtyStep: 2,
        n: 5
      });
    }
  },

  {
    templateId: "L3-08-price-down-qty-up",
    categoryId: CATEGORY_ID,

    generate() {
      const basePrice = randomInt(10, 30) * 10;
      const baseQty = randomInt(30, 80);
      const priceStep = randomInt(5, 15);
      const qtyStep = randomInt(2, 5);
      const maxSteps = Math.floor((basePrice - 20) / priceStep);
      const n = randomInt(2, Math.max(2, maxSteps));
      const revenue = (basePrice - priceStep * n) * (baseQty + qtyStep * n);
      const canonicalInternal =
        `(${basePrice}-${priceStep}*x)*(${baseQty}+${qtyStep}*x)=${revenue}`;
      const roots = computeQuadraticRoots(canonicalInternal);

      const physicallyValidRoots = roots.filter(
        (root) => root > 0 && root < basePrice / priceStep
      );
      if (physicallyValidRoots.length !== 1) {
        throw new Error("価格と売上（値下げ）の解が一意に定まりません。");
      }

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        unit: UNIT,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "HARD",

        prompt:
          `ある商品は、1個${basePrice}円のとき1日に${baseQty}個売れます。この商品を${priceStep}円` +
          `値下げするごとに、1日の販売個数が${qtyStep}個ずつ増えることがわかっています。` +
          `${priceStep}円の値下げをx回行ったときの1日の売上金額が${revenue}円になるとき、` +
          `2次方程式を立てなさい。`,
        variableDefinition: `${priceStep}円の値下げを行った回数`,

        canonicalEquation: {
          internal: canonicalInternal,
          display: `(${basePrice}−${priceStep}x)(${baseQty}＋${qtyStep}x)＝${revenue}`,
          relationName: "売上金額＝価格×販売個数"
        },
        expectedRoots: roots,
        validXValues: [n],
        solutionDisplay: `x＝${n}`,

        keypadNumbers: [String(basePrice), String(priceStep), String(baseQty), String(qtyStep), String(revenue)],
        keypadSymbols: KEYPAD_SYMBOLS,

        hint:
          `x回値下げした後の価格は「${basePrice}−${priceStep}x」円、販売個数は` +
          `「${baseQty}＋${qtyStep}x」個と表せます。`,
        hintKeypadParts: [
          { display: `（${baseQty}＋${qtyStep}x）`, value: `(${baseQty}+${qtyStep}*x)`, ariaLabel: `${baseQty}たす${qtyStep}x` }
        ],
        explanation: "値下げ後の価格と販売個数の積が、売上金額になります。",
        diagram: null
      };
    }
  },

  {
    templateId: "L3-08-ticket-price",
    categoryId: CATEGORY_ID,

    generate() {
      const basePrice = randomInt(8, 25) * 10;
      const baseQty = randomInt(60, 150);
      const priceStep = randomInt(5, 10);
      const qtyStep = randomInt(1, 3);
      const n = randomInt(2, Math.floor((baseQty - 10) / qtyStep));
      const revenue = (basePrice + priceStep * n) * (baseQty - qtyStep * n);
      const canonicalInternal =
        `(${basePrice}+${priceStep}*x)*(${baseQty}-${qtyStep}*x)=${revenue}`;
      const roots = computeQuadraticRoots(canonicalInternal);

      const physicallyValidRoots = roots.filter(
        (root) => root > 0 && root < baseQty / qtyStep
      );
      if (physicallyValidRoots.length !== 1) {
        throw new Error("価格と売上（チケット）の解が一意に定まりません。");
      }

      return {
        id: createUniqueId(this.templateId),
        templateId: this.templateId,
        unit: UNIT,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        rankDifficulty: "HARD",

        prompt:
          `あるイベントのチケットは、1枚${basePrice}円のとき1日に${baseQty}枚売れます。価格を${priceStep}円` +
          `値上げするごとに、1日の販売枚数が${qtyStep}枚ずつ減ることがわかっています。` +
          `${priceStep}円の値上げをx回行ったときの1日の売上金額が${revenue}円になるとき、` +
          `2次方程式を立てなさい。`,
        variableDefinition: `${priceStep}円の値上げを行った回数`,

        canonicalEquation: {
          internal: canonicalInternal,
          display: `(${basePrice}＋${priceStep}x)(${baseQty}−${qtyStep}x)＝${revenue}`,
          relationName: "売上金額＝価格×販売枚数"
        },
        expectedRoots: roots,
        validXValues: [n],
        solutionDisplay: `x＝${n}`,

        keypadNumbers: [String(basePrice), String(priceStep), String(baseQty), String(qtyStep), String(revenue)],
        keypadSymbols: KEYPAD_SYMBOLS,

        hint:
          `x回値上げした後の価格は「${basePrice}＋${priceStep}x」円、販売枚数は` +
          `「${baseQty}−${qtyStep}x」枚と表せます。`,
        hintKeypadParts: [
          { display: `（${baseQty}−${qtyStep}x）`, value: `(${baseQty}-${qtyStep}*x)`, ariaLabel: `${baseQty}ひく${qtyStep}x` }
        ],
        explanation: "値上げ後の価格と販売枚数の積が、売上金額になります。",
        diagram: null
      };
    }
  }
];
