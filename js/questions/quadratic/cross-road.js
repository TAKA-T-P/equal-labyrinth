// カテゴリ：面積・十字路（L3-05）
// 基本式：長方形の土地に、幅xの十字型の道を作ったときの残りの面積の関係
// （2本の道の面積を、重なり分だけ調整して引くと、(縦−x)(横−x)という形になる）

import {
  createUniqueId,
  randomInt,
  computeQuadraticRoots
} from "./categories.js";

const CATEGORY_ID = "L3-05";
const CATEGORY_NAME = "面積・十字路";
const UNIT = "quadratic";
const KEYPAD_SYMBOLS = ["x", "square", "+", "-", "(", ")", "="];

function buildCrossRoadQuestion({ templateId, scenario, widthValue, heightValue }) {
  const minSide = Math.min(widthValue, heightValue);
  // 道幅xは、縦・横に対して不自然に太くならないよう、1〜5mの範囲に収める
  // （道幅が土地の縦・横を超えない＝(縦−x)・(横−x)が正になる範囲も併せて満たす）。
  const n = randomInt(1, Math.min(5, minSide - 1));
  const remaining = (widthValue - n) * (heightValue - n);
  const canonicalInternal = `(${widthValue}-x)*(${heightValue}-x)=${remaining}`;
  const roots = computeQuadraticRoots(canonicalInternal);

  return {
    id: createUniqueId(templateId),
    templateId,
    unit: UNIT,
    categoryId: CATEGORY_ID,
    categoryName: CATEGORY_NAME,
    rankDifficulty: "NORMAL",

    prompt:
      `縦${heightValue}m、横${widthValue}mの${scenario}に、幅xmの十字型の道を、縦・横それぞれ1本ずつ` +
      `作ったところ、道を除いた部分の面積が${remaining}m²になりました。` +
      `xの値を求める2次方程式を立てなさい。`,
    variableDefinition: "十字型の道の幅（m）",

    canonicalEquation: {
      internal: canonicalInternal,
      display: `(${widthValue}−x)(${heightValue}−x)＝${remaining}`,
      relationName: "十字路を除いた面積"
    },
    expectedRoots: roots,
    validXValues: [n],
    solutionDisplay: `x＝${n}`,

    keypadNumbers: [String(widthValue), String(heightValue), String(remaining)],
    keypadSymbols: KEYPAD_SYMBOLS,

    hint:
      "2本の道の面積を、道が重なる部分だけ調整して引くと、残りの面積は" +
      "「（横−x）×（縦−x）」で表せます。",
    hintKeypadParts: [{ display: `（${widthValue}−x）`, value: `(${widthValue}-x)`, ariaLabel: `${widthValue}ひくx` }],
    explanation:
      "十字型の道を除いた部分は、道の幅の分だけ縦・横を短くした長方形の面積と等しくなります。",

    diagram: {
      type: "cross-road",
      widthValue,
      heightValue,
      pathWidthSymbol: "x",
      ariaLabel: `縦${heightValue}メートル、横${widthValue}メートルの${scenario}に、幅xメートルの十字型の道がある図`
    }
  };
}

export const crossRoadTemplates = [
  {
    templateId: "L3-05-school-garden",
    categoryId: CATEGORY_ID,

    generate() {
      // 縦＜横になるよう、縦を先に決めてから横を「縦＋α」で決める
      // （同じ値にならない・縦の方が長くならないようにするため）。
      const heightValue = randomInt(8, 14);
      const widthValue = heightValue + randomInt(2, 8);
      return buildCrossRoadQuestion({
        templateId: this.templateId,
        scenario: "花だん",
        widthValue,
        heightValue
      });
    }
  },

  {
    templateId: "L3-05-farm-field",
    categoryId: CATEGORY_ID,

    generate() {
      const heightValue = randomInt(10, 18);
      const widthValue = heightValue + randomInt(2, 10);
      return buildCrossRoadQuestion({
        templateId: this.templateId,
        scenario: "畑",
        widthValue,
        heightValue
      });
    }
  },

  {
    templateId: "L3-05-park-field",
    categoryId: CATEGORY_ID,

    generate() {
      const heightValue = randomInt(10, 20);
      const widthValue = heightValue + randomInt(2, 10);
      return buildCrossRoadQuestion({
        templateId: this.templateId,
        scenario: "広場",
        widthValue,
        heightValue
      });
    }
  }
];
