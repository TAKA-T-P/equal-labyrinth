// カテゴリ：容積・ふたのない箱（L3-06）
// 基本式：正方形の厚紙の四隅から、1辺cの正方形を切り取って折り、ふたのない箱を作る
// 底面の1辺は「x−2c」、高さはc、容積は c×(x−2c)² となる（単位はcm³）

import {
  createUniqueId,
  randomInt,
  computeQuadraticRoots
} from "./categories.js";

const CATEGORY_ID = "L3-06";
const CATEGORY_NAME = "容積・ふたのない箱";
const UNIT = "quadratic";
const KEYPAD_SYMBOLS = ["x", "x²", "square", "-", "×", "(", ")", "="];
// 長方形パターンは「x＋widthDiff−2c」のように＋も使うため、専用の記号一覧を使う
const RECTANGULAR_KEYPAD_SYMBOLS = ["x", "x²", "square", "+", "-", "×", "(", ")", "="];

function buildOpenBoxQuestion({ templateId, scenario, cutSideValue }) {
  const doubledCut = cutSideValue * 2;
  const n = randomInt(doubledCut + 3, doubledCut + 20); // 底面の1辺が正になるように
  const baseSide = n - doubledCut;
  const volume = cutSideValue * baseSide * baseSide;
  const canonicalInternal = `${cutSideValue}*(x-${doubledCut})^2=${volume}`;
  const roots = computeQuadraticRoots(canonicalInternal);

  return {
    id: createUniqueId(templateId),
    templateId,
    unit: UNIT,
    categoryId: CATEGORY_ID,
    categoryName: CATEGORY_NAME,
    rankDifficulty: "NORMAL",

    prompt:
      `1辺の長さがxcmの正方形の${scenario}の四すみから、1辺${cutSideValue}cmの正方形を切り取り、` +
      `点線のところで折り曲げて、ふたのない箱を作ります。この箱の容積が${volume}cm³になるとき、` +
      `2次方程式を立てなさい。`,
    variableDefinition: `もとの正方形の${scenario}の1辺の長さ（cm）`,

    canonicalEquation: {
      internal: canonicalInternal,
      display: `${cutSideValue}(x−${doubledCut})²＝${volume}`,
      relationName: "箱の容積＝高さ×底面積"
    },
    expectedRoots: roots,
    validXValues: [n],
    solutionDisplay: `x＝${n}`,

    keypadNumbers: [String(cutSideValue), String(doubledCut), String(volume)],
    keypadSymbols: KEYPAD_SYMBOLS,

    hint:
      `箱の底面の1辺は、もとの1辺から${cutSideValue}cmを2か所分引いた「x−${doubledCut}」cmになります。` +
      "容積は「高さ×底面の1辺×底面の1辺」で求められます。",
    hintKeypadParts: [
      { display: `（x−${doubledCut}）`, value: `(x-${doubledCut})`, ariaLabel: `xひく${doubledCut}` }
    ],
    explanation: "箱の高さは切り取った正方形の1辺の長さと等しく、底面は正方形になります。",

    diagram: {
      type: "open-box-net",
      paperSideSymbol: "x",
      cutSideValue,
      ariaLabel:
        `1辺xセンチメートルの正方形の${scenario}の四すみから、1辺${cutSideValue}センチメートルの` +
        "正方形を切り取り、ふたのない箱を作る図"
    }
  };
}

// 長方形（正方形ではない）の紙の四すみから正方形を切り取るパターン。
// 縦をxとし、横は「縦よりwidthDiff cm長い」とする。
// 底面は「x−2c」「x+widthDiff−2c」の長方形になり、容積はc×(x−2c)×(x+widthDiff−2c)。
// widthDiff−2cの計算結果（simplifiedDiff）が正の小さな整数になるよう、
// widthDiff = doubledCut + simplifiedDiff で決める（負の数がかっこの中に出てこないようにするため）。
// 「c(x−2c)(x+widthDiff−2c)」「c(x−2c)(x+simplifiedDiff)」のどちらで立式しても正解になるよう、
// 両方の式に必要な数値（c・2c・widthDiff・simplifiedDiff・容積）をすべてキーパッドへ用意する。
function buildRectangularOpenBoxQuestion({ templateId, scenario, cutSideValue, simplifiedDiff }) {
  const doubledCut = cutSideValue * 2;
  const widthDiff = doubledCut + simplifiedDiff;
  const n = randomInt(doubledCut + 3, doubledCut + 14); // 縦の長さ（x）
  const baseHeight = n - doubledCut;
  // 底面の横は「(x+widthDiff)−2c」＝「x+widthDiff−2c」＝「x+simplifiedDiff」
  // （baseHeightに足すのではなく、xに直接simplifiedDiffを足す点に注意）
  const baseWidth = n + simplifiedDiff;
  const volume = cutSideValue * baseHeight * baseWidth;
  const canonicalInternal = `${cutSideValue}*(x-${doubledCut})*(x+${widthDiff}-${doubledCut})=${volume}`;
  const roots = computeQuadraticRoots(canonicalInternal);

  return {
    id: createUniqueId(templateId),
    templateId,
    unit: UNIT,
    categoryId: CATEGORY_ID,
    categoryName: CATEGORY_NAME,
    rankDifficulty: "NORMAL",

    prompt:
      `横の長さが縦の長さより${widthDiff}cm長い長方形の${scenario}の4すみから、` +
      `1辺${cutSideValue}cmの正方形を切り取って、ふたのない箱を作ると、容積が${volume}cm³になった。` +
      `縦の長さをxcmとして、2次方程式を立てなさい。`,
    variableDefinition: `もとの長方形の${scenario}の縦の長さ（cm）`,

    canonicalEquation: {
      internal: canonicalInternal,
      display: `${cutSideValue}(x−${doubledCut})(x＋${widthDiff}−${doubledCut})＝${volume}`,
      relationName: "箱の容積＝高さ×底面積"
    },
    expectedRoots: roots,
    validXValues: [n],
    solutionDisplay: `x＝${n}`,

    keypadNumbers: [
      String(cutSideValue),
      String(doubledCut),
      String(widthDiff),
      String(simplifiedDiff),
      String(volume)
    ],
    keypadSymbols: RECTANGULAR_KEYPAD_SYMBOLS,

    hint:
      `箱の底面は、縦が「x−${doubledCut}」cm、横が「x＋${widthDiff}−${doubledCut}」cm` +
      `（＝「x＋${simplifiedDiff}」cm）の長方形になります。` +
      "容積は「高さ×底面の縦×底面の横」で求められます。",
    hintKeypadParts: [
      { display: `（x−${doubledCut}）`, value: `(x-${doubledCut})`, ariaLabel: `xひく${doubledCut}` },
      {
        display: `（x＋${widthDiff}−${doubledCut}）`,
        value: `(x+${widthDiff}-${doubledCut})`,
        ariaLabel: `xたす${widthDiff}ひく${doubledCut}`
      }
    ],
    explanation:
      "箱の高さは切り取った正方形の1辺の長さと等しく、底面は縦・横それぞれ" +
      "切り取った分だけ短くなった長方形になります。",

    diagram: null
  };
}

export const openBoxTemplates = [
  {
    templateId: "L3-06-craft-paper",
    categoryId: CATEGORY_ID,

    generate() {
      return buildOpenBoxQuestion({
        templateId: this.templateId,
        scenario: "工作用紙",
        cutSideValue: randomInt(2, 4)
      });
    }
  },

  {
    templateId: "L3-06-gift-box",
    categoryId: CATEGORY_ID,

    generate() {
      return buildOpenBoxQuestion({
        templateId: this.templateId,
        scenario: "厚紙",
        cutSideValue: randomInt(3, 5)
      });
    }
  },

  {
    templateId: "L3-06-storage-box",
    categoryId: CATEGORY_ID,

    generate() {
      return buildOpenBoxQuestion({
        templateId: this.templateId,
        scenario: "段ボール紙",
        cutSideValue: randomInt(2, 6)
      });
    }
  },

  {
    templateId: "L3-06-rectangular-paper",
    categoryId: CATEGORY_ID,

    generate() {
      return buildRectangularOpenBoxQuestion({
        templateId: this.templateId,
        scenario: "紙",
        cutSideValue: randomInt(2, 3),
        simplifiedDiff: randomInt(1, 4)
      });
    }
  }
];
