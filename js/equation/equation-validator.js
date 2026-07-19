// 入力された方程式の正誤を判定するモジュール

import { tokenize, TokenType, EquationError } from "./tokenizer.js";
import { parseExpression, NodeType } from "./parser.js";
import {
  astToLinearExpression,
  subtractExpressions,
  isConstantExpression
} from "./linear-expression.js";
import { APP_CONFIG } from "../config.js";

function buildResult(status, message, solvedX = null) {
  return { status, message, solvedX };
}

export function splitAtEquals(tokens) {
  const equalsIndexes = [];
  tokens.forEach((token, index) => {
    if (token.type === TokenType.EQUALS) {
      equalsIndexes.push(index);
    }
  });

  if (equalsIndexes.length !== 1) {
    return { error: "「＝」を1つだけ使ってください。" };
  }

  const index = equalsIndexes[0];
  const leftTokens = tokens.slice(0, index);
  const rightTokens = tokens.slice(index + 1);

  if (leftTokens.length === 0 || rightTokens.length === 0) {
    return { error: "「＝」の両側に式を入力してください。" };
  }

  return { leftTokens, rightTokens };
}

function isBareVariable(node) {
  return node.type === NodeType.VARIABLE;
}

function isBareNumber(node) {
  return node.type === NodeType.NUMBER;
}

/**
 * 入力文字列を方程式として検証し、判定結果を返す。
 * @param {string} inputString プレイヤーが入力した式
 * @param {number} expectedX 問題データの正解の値
 * @returns {{status: "correct"|"incorrect"|"input-error", message: string, solvedX: number|null}}
 */
export function validateEquation(inputString, expectedX) {
  let tokens;
  try {
    tokens = tokenize(inputString);
  } catch (error) {
    if (error instanceof EquationError) {
      return buildResult("input-error", error.message);
    }
    throw error;
  }

  const splitResult = splitAtEquals(tokens);
  if (splitResult.error) {
    return buildResult("input-error", splitResult.error);
  }

  const { leftTokens, rightTokens } = splitResult;

  let leftAst;
  let rightAst;
  try {
    leftAst = parseExpression(leftTokens);
    rightAst = parseExpression(rightTokens);
  } catch (error) {
    if (error instanceof EquationError) {
      return buildResult("input-error", error.message);
    }
    throw error;
  }

  if (
    (isBareVariable(leftAst) && isBareNumber(rightAst)) ||
    (isBareNumber(leftAst) && isBareVariable(rightAst))
  ) {
    return buildResult(
      "incorrect",
      "答えだけを入力するのではなく、数量の関係を式で表しましょう。"
    );
  }

  let leftExpression;
  let rightExpression;
  try {
    leftExpression = astToLinearExpression(leftAst);
    rightExpression = astToLinearExpression(rightAst);
  } catch (error) {
    if (error instanceof EquationError) {
      return buildResult("input-error", error.message);
    }
    throw error;
  }

  const diff = subtractExpressions(leftExpression, rightExpression);

  if (isConstantExpression(diff)) {
    if (Math.abs(diff.constant) < APP_CONFIG.numericTolerance) {
      return buildResult(
        "incorrect",
        "その式はxの値に関わらず常に成り立つ式です。数量の関係を表す式を考えましょう。"
      );
    }
    return buildResult(
      "incorrect",
      "その式では解が求まりません。数量の関係を見直しましょう。"
    );
  }

  const solvedX = -diff.constant / diff.xCoefficient;

  if (Math.abs(solvedX - expectedX) < APP_CONFIG.numericTolerance) {
    return buildResult("correct", "正解です！", solvedX);
  }

  return buildResult(
    "incorrect",
    "もう一度考えよう",
    solvedX
  );
}
