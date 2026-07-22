// カテゴリ：動点（L3-07）
// 長方形（正方形を含む）ABCD（A左上・B左下・C右下・D右上）の辺上を、
// 点Pは常にA→B（毎秒1cm）、点Qは辺AD上をD→AまたはA→Dへ動く。
// 2点が出発してからx秒後の三角形APQの面積についての関係を立式する
// （直角を挟む2辺の積÷2＝1/2×AP×AQ）。
// 動きはアニメーションではなく、静止画の図で方向だけを示す（§38）。

import {
  createUniqueId,
  randomInt,
  randomChoice,
  buildKeypadNumbers,
  computeQuadraticRoots
} from "./categories.js";

const CATEGORY_ID = "L3-07";
const CATEGORY_NAME = "動点";
const UNIT = "quadratic";
const KEYPAD_SYMBOLS = ["x", "square", "×", "-", "(", ")", "="];
const ROOT_EPSILON = 1e-9;

/**
 * 点Qが「D→A」（Aに近づく向き）に動くパターン。
 * AP＝x、AQ＝L−qSpeed・x（Lは辺ADの長さ）で、面積は (1/2)x(L−qSpeed・x)。
 * 正方形（heightValue＝widthValue）では、この関係だけで解の範囲（0＜x＜L／qSpeed）が
 * 決まるため、テンプレート①もこの関数を共用する。
 */
function buildQTowardAQuestion({ templateId, isSquare, heightValue, widthValue, qSpeed }) {
  const lengthAD = widthValue;
  const maxX = Math.min(heightValue - 1, Math.floor((lengthAD - 1) / qSpeed));
  const x = randomInt(1, maxX);
  const raw = x * (lengthAD - qSpeed * x); // 面積の2倍
  if (raw % 2 !== 0) {
    throw new Error("動点（Qが辺の途中でAに近づく形）の面積が整数になりません。");
  }
  const target = raw / 2;

  const qSpeedInternalTerm = qSpeed === 1 ? "x" : `${qSpeed}*x`;
  const qSpeedDisplayTerm = qSpeed === 1 ? "x" : `${qSpeed}x`;
  const canonicalInternal = `(1/2)*x*(${lengthAD}-${qSpeedInternalTerm})=${target}`;
  const roots = computeQuadraticRoots(canonicalInternal);

  const maxXExclusive = Math.min(heightValue, lengthAD / qSpeed);
  const validXValues = roots.filter((root) => root > ROOT_EPSILON && root < maxXExclusive - ROOT_EPSILON);

  const shapePrompt = isSquare
    ? `1辺の長さが${heightValue}cmの正方形ABCDがある。`
    : `AB＝${heightValue}cm、AD＝${widthValue}cmの長方形ABCDがある。`;

  return {
    id: createUniqueId(templateId),
    templateId,
    unit: UNIT,
    categoryId: CATEGORY_ID,
    categoryName: CATEGORY_NAME,
    rankDifficulty: "HARD",

    prompt:
      `${shapePrompt}点Pは頂点Aから頂点Bに向かって毎秒1cmの速さで動く。` +
      `点Qは頂点Dから頂点Aに向かって毎秒${qSpeed}cmの速さで動く。2点が同時に出発してからx秒後の` +
      `三角形APQの面積が${target}cm²になるとき、xの値を求める2次方程式を立てなさい。`,
    variableDefinition: "2点が出発してからの時間（秒）",

    canonicalEquation: {
      internal: canonicalInternal,
      display: `1/2 x(${lengthAD}−${qSpeedDisplayTerm})＝${target}`,
      relationName: "三角形の面積（底辺×高さ÷2）"
    },
    expectedRoots: roots,
    validXValues,
    solutionDisplay: `x＝${validXValues.join("、")}`,

    keypadNumbers: buildKeypadNumbers(
      isSquare
        ? [heightValue, target, "1/2", ...(qSpeed === 1 ? [] : [qSpeed])]
        : [heightValue, widthValue, target, "1/2", qSpeed]
    ),
    keypadSymbols: KEYPAD_SYMBOLS,

    hint:
      `APの長さはx、AQの長さは「${lengthAD}−${qSpeedDisplayTerm}」と表せます。` +
      "三角形の面積は「底辺×高さ÷2」で求められます。",
    hintKeypadParts: [
      { display: `（${lengthAD}−${qSpeedDisplayTerm}）`, value: `(${lengthAD}-${qSpeedInternalTerm})`, ariaLabel: `${lengthAD}ひく${qSpeedDisplayTerm}` }
    ],
    explanation:
      "点P・点Qそれぞれの動いた距離を使って、直角三角形APQの面積（AP×AQ÷2）を式に表します。",

    diagram: {
      type: "moving-points-rectangle",
      widthValue,
      heightValue,
      pointQMovesToward: "A",
      ariaLabel:
        `${isSquare ? `1辺${heightValue}センチメートルの正方形` : `AB＝${heightValue}センチメートル、AD＝${widthValue}センチメートルの長方形`}` +
        "ABCDで、点PはAからBへ、点QはDからAへ、それぞれ辺の上を移動する図"
    }
  };
}

/**
 * 点Qが「A→D」（Aから遠ざかる向き）に動くパターン。
 * AP＝x、AQ＝qSpeed・xで、面積は (1/2)x(qSpeed・x)＝(qSpeed/2)x²。
 */
function buildQTowardDQuestion({ templateId, heightValue, widthValue, qSpeed }) {
  const maxX = Math.min(heightValue, Math.floor(widthValue / qSpeed)) - 1;
  const x = randomInt(1, maxX);
  const raw = qSpeed * x * x; // 面積の2倍
  if (raw % 2 !== 0) {
    throw new Error("動点（Qが辺の途中でAから遠ざかる形）の面積が整数になりません。");
  }
  const target = raw / 2;

  const canonicalInternal = `(1/2)*x*(${qSpeed}*x)=${target}`;
  const roots = computeQuadraticRoots(canonicalInternal);
  const validXValues = roots.filter((root) => root > ROOT_EPSILON);

  return {
    id: createUniqueId(templateId),
    templateId,
    unit: UNIT,
    categoryId: CATEGORY_ID,
    categoryName: CATEGORY_NAME,
    rankDifficulty: "HARD",

    prompt:
      `AB＝${heightValue}cm、AD＝${widthValue}cmの長方形ABCDがある。点Pは頂点Aから頂点Bに向かって` +
      `毎秒1cmの速さで動く。点Qは頂点Aから頂点Dに向かって毎秒${qSpeed}cmの速さで動く。` +
      `2点が同時に出発してからx秒後の三角形APQの面積が${target}cm²になるとき、xの値を求める2次方程式を立てなさい。`,
    variableDefinition: "2点が出発してからの時間（秒）",

    canonicalEquation: {
      internal: canonicalInternal,
      display: `1/2×x×${qSpeed}x＝${target}`,
      relationName: "三角形の面積（底辺×高さ÷2）"
    },
    expectedRoots: roots,
    validXValues,
    solutionDisplay: `x＝${validXValues.join("、")}`,

    keypadNumbers: buildKeypadNumbers([heightValue, widthValue, target, "1/2", qSpeed]),
    keypadSymbols: KEYPAD_SYMBOLS,

    hint:
      `APの長さはx、AQの長さは「${qSpeed}x」と表せます。` +
      "三角形の面積は「底辺×高さ÷2」で求められます。",
    hintKeypadParts: [{ display: `${qSpeed}x`, value: `${qSpeed}*x`, ariaLabel: `${qSpeed}かけるx` }],
    explanation:
      "点P・点Qそれぞれの動いた距離を使って、直角三角形APQの面積（AP×AQ÷2）を式に表します。",

    diagram: {
      type: "moving-points-rectangle",
      widthValue,
      heightValue,
      pointQMovesToward: "D",
      ariaLabel:
        `AB＝${heightValue}センチメートル、AD＝${widthValue}センチメートルの長方形ABCDで、` +
        "点PはAからBへ、点QはAからDへ、それぞれ辺の上を移動する図"
    }
  };
}

export const movingPointsTemplates = [
  {
    templateId: "L3-07-square-corner",
    categoryId: CATEGORY_ID,

    generate() {
      const side = randomInt(8, 16);
      return buildQTowardAQuestion({
        templateId: this.templateId,
        isSquare: true,
        heightValue: side,
        widthValue: side,
        qSpeed: randomChoice([1, 2])
      });
    }
  },

  {
    templateId: "L3-07-rectangle-q-toward-a",
    categoryId: CATEGORY_ID,

    generate() {
      const heightValue = randomInt(6, 12);
      const widthValue = heightValue + randomInt(2, 10);
      return buildQTowardAQuestion({
        templateId: this.templateId,
        isSquare: false,
        heightValue,
        widthValue,
        qSpeed: 2
      });
    }
  },

  {
    templateId: "L3-07-rectangle-q-toward-d",
    categoryId: CATEGORY_ID,

    generate() {
      const heightValue = randomInt(6, 12);
      const widthValue = heightValue + randomInt(2, 10);
      return buildQTowardDQuestion({
        templateId: this.templateId,
        heightValue,
        widthValue,
        qSpeed: randomChoice([2, 3])
      });
    }
  }
];
