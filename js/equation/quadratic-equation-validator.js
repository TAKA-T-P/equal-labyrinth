// 中3「2次方程式」の正誤判定を担当するモジュール
//
// (x=12)のように、文章題の答えの値を1つ含むだけでは正解にしない。文章題は
// 「2次式が生まれる数量関係」を立式する練習であるため、入力された方程式を標準化し、
// 問題データに登録されたcanonicalEquation（模範関係）と「0でない定数倍」の関係に
// あるかどうかで判定する（詳細はREADMEの「2次方程式の正誤判定」を参照）。

import { tokenize, EquationError } from "./tokenizer.js";
import { parseExpression } from "./parser.js";
import { splitAtEquals } from "./equation-validator.js";
import {
  astToQuadraticExpression,
  subtractQuadraticExpressions,
  isLinearOrConstantQuadraticExpression
} from "./quadratic-expression.js";
import { APP_CONFIG } from "../config.js";

function buildResult(status, message, extra = {}) {
  return {
    status,
    message,
    standardForm: extra.standardForm || null,
    roots: extra.roots || null
  };
}

/**
 * 浮動小数の相対誤差も考慮した近似比較（値が大きいほど許容誤差も広げる）。
 */
function nearlyEqual(a, b, tolerance) {
  const scale = Math.max(1, Math.abs(a), Math.abs(b));
  return Math.abs(a - b) <= tolerance * scale;
}

/**
 * 1本の方程式文字列を、ax²+bx+c=0の標準形（{xSquaredCoefficient, xCoefficient, constant}）へ
 * 変換する。構文・非2次の乗除算などの問題は、そのままEquationErrorとして投げる。
 * @param {string} inputString
 */
export function parseEquationToQuadraticStandardForm(inputString) {
  const tokens = tokenize(inputString);

  const splitResult = splitAtEquals(tokens);
  if (splitResult.error) {
    throw new EquationError(splitResult.error);
  }

  const leftAst = parseExpression(splitResult.leftTokens);
  const rightAst = parseExpression(splitResult.rightTokens);

  const leftExpression = astToQuadraticExpression(leftAst);
  const rightExpression = astToQuadraticExpression(rightAst);

  return subtractQuadraticExpressions(leftExpression, rightExpression);
}

/**
 * 標準形の係数[a, b, c]が、模範式の係数[A, B, C]と「0でない定数倍」の関係にあるかを判定する。
 * 1. 模範式の係数のうち、絶対値が最も大きいものを基準にする
 * 2. 入力式との倍率を求める
 * 3. x²・x・定数項の3係数がすべて同じ倍率か、相対誤差も考慮して確認する
 * 4. 倍率が0の場合は不正解
 */
export function areProportionalQuadraticEquations(inputStandardForm, canonicalStandardForm, tolerance) {
  const canonicalComponents = [
    canonicalStandardForm.xSquaredCoefficient,
    canonicalStandardForm.xCoefficient,
    canonicalStandardForm.constant
  ];
  const inputComponents = [
    inputStandardForm.xSquaredCoefficient,
    inputStandardForm.xCoefficient,
    inputStandardForm.constant
  ];

  let refIndex = 0;
  for (let i = 1; i < 3; i += 1) {
    if (Math.abs(canonicalComponents[i]) > Math.abs(canonicalComponents[refIndex])) {
      refIndex = i;
    }
  }

  const canonicalRef = canonicalComponents[refIndex];
  if (Math.abs(canonicalRef) < tolerance) {
    return false;
  }

  const ratio = inputComponents[refIndex] / canonicalRef;
  if (Math.abs(ratio) < tolerance) {
    return false;
  }

  for (let i = 0; i < 3; i += 1) {
    if (!nearlyEqual(inputComponents[i], canonicalComponents[i] * ratio, tolerance)) {
      return false;
    }
  }

  return true;
}

/**
 * 標準形 ax²+bx+c=0 を実際に解く。
 * 判別式D<0（実数解なし）の場合はnullを返す。D≈0の重解は1回だけ返す。
 * @returns {number[]|null} 昇順に並んだ実数解の配列
 */
export function solveQuadraticStandardForm(standardForm, tolerance) {
  const a = standardForm.xSquaredCoefficient;
  const b = standardForm.xCoefficient;
  const c = standardForm.constant;

  if (Math.abs(a) < tolerance) {
    return null;
  }

  const discriminant = b * b - 4 * a * c;
  if (discriminant < -tolerance) {
    return null;
  }

  if (Math.abs(discriminant) <= tolerance) {
    return [-b / (2 * a)];
  }

  const sqrtD = Math.sqrt(Math.max(0, discriminant));
  const roots = [(-b - sqrtD) / (2 * a), (-b + sqrtD) / (2 * a)];
  roots.sort((x, y) => x - y);
  return roots;
}

/**
 * 入力された2次方程式（1本の文字列）を検証する。
 * @param {string} inputString
 * @param {{canonicalEquation: {internal: string}}} question
 * @returns {{status: "correct"|"incorrect"|"input-error", message: string,
 *   standardForm: object|null, roots: number[]|null}}
 */
export function validateQuadraticEquation(inputString, question) {
  const tolerance = APP_CONFIG.numericTolerance;

  if (!inputString || inputString.trim() === "") {
    return buildResult("input-error", "式を入力してください。");
  }

  let standardForm;
  try {
    standardForm = parseEquationToQuadraticStandardForm(inputString);
  } catch (error) {
    if (error instanceof EquationError) {
      return buildResult("input-error", error.message);
    }
    throw error;
  }

  // x²の係数が0（恒等式・解なしの定数式・1次式に退化した式を含む）は、
  // 2次方程式の問題では常に不正解にする
  if (isLinearOrConstantQuadraticExpression(standardForm)) {
    return buildResult(
      "incorrect",
      "その式は2次方程式になっていません。数量の関係を見直しましょう。",
      { standardForm }
    );
  }

  const canonicalStandardForm = parseEquationToQuadraticStandardForm(
    question.canonicalEquation.internal
  );

  if (!areProportionalQuadraticEquations(standardForm, canonicalStandardForm, tolerance)) {
    return buildResult("incorrect", "もう一度考えよう", { standardForm });
  }

  const roots = solveQuadraticStandardForm(standardForm, tolerance);
  if (!roots) {
    return buildResult(
      "incorrect",
      "この式は実数の解を持ちません。もう一度考えましょう。",
      { standardForm }
    );
  }

  return buildResult("correct", "正解です", { standardForm, roots });
}
