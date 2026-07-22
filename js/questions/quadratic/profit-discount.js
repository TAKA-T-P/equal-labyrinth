// カテゴリ：利益と割引（L3-09）
// 基本式：定価に対してx割増しにした後、x割引きすると、結果的に定価より安くなる関係
// 2400*(1+x/10)*(1-x/10)=2184 のように、上下型分数（x/10）を使う。
// このカテゴリだけは、「分数」ボタン→「10」の2打ではなく、「x/10」の完成した分数を
// 1回で入力できる専用の数字カードを用意する（keypadNumbersに"x/10"を含めると、
// ui.jsのcreateFractionNumberButton()が自動的にこのカードを描画する）。

import {
  createUniqueId,
  randomInt,
  computeQuadraticRoots
} from "./categories.js";

const CATEGORY_ID = "L3-09";
const CATEGORY_NAME = "利益と割引";
const UNIT = "quadratic";
const KEYPAD_SYMBOLS = ["x", "square", "+", "-", "(", ")", "="];

function buildProfitDiscountQuestion({ templateId, itemName, basePrice }) {
  const n = randomInt(1, 9); // x割（1〜9割）
  const decreaseAmount = Math.round((basePrice * n * n) / 100);
  const finalPrice = basePrice - decreaseAmount;
  const canonicalInternal = `${basePrice}*(1+x/10)*(1-x/10)=${finalPrice}`;
  const roots = computeQuadraticRoots(canonicalInternal);

  return {
    id: createUniqueId(templateId),
    templateId,
    unit: UNIT,
    categoryId: CATEGORY_ID,
    categoryName: CATEGORY_NAME,
    rankDifficulty: "HARD",

    prompt:
      `定価${basePrice}円の${itemName}があります。この定価をx割値上げしたあと、そこからさらにx割値引きして` +
      `売ったところ、売り値は${finalPrice}円になりました。xの値を求める2次方程式を立てなさい。`,
    variableDefinition: "値上げ・値引きした割合（割）",

    canonicalEquation: {
      internal: canonicalInternal,
      display: `${basePrice}(1＋x/10)(1−x/10)＝${finalPrice}`,
      relationName: "値上げ後に値引きした売り値"
    },
    expectedRoots: roots,
    validXValues: [n],
    solutionDisplay: `x＝${n}`,

    keypadNumbers: [String(basePrice), "1", "x/10", String(finalPrice)],
    keypadSymbols: KEYPAD_SYMBOLS,

    hint:
      "x割は10分のxと表せます。値上げ後の価格は「定価×(1＋x/10)」、" +
      "そこからさらに値引きした価格は、その「×(1−x/10)」で求められます。",
    hintKeypadParts: [],
    explanation: "値上げ後の価格に、値引きの割合をかけると、最終的な売り値になります。",
    diagram: null
  };
}

export const profitDiscountTemplates = [
  {
    templateId: "L3-09-clothing",
    categoryId: CATEGORY_ID,

    generate() {
      return buildProfitDiscountQuestion({
        templateId: this.templateId,
        itemName: "洋服",
        basePrice: randomInt(20, 60) * 100
      });
    }
  },

  {
    templateId: "L3-09-book",
    categoryId: CATEGORY_ID,

    generate() {
      return buildProfitDiscountQuestion({
        templateId: this.templateId,
        itemName: "本",
        basePrice: randomInt(10, 30) * 100
      });
    }
  },

  {
    templateId: "L3-09-electronics",
    categoryId: CATEGORY_ID,

    generate() {
      return buildProfitDiscountQuestion({
        templateId: this.templateId,
        itemName: "電化製品",
        basePrice: randomInt(50, 150) * 100
      });
    }
  }
];
