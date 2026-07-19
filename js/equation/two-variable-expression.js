// 2変数1次式 { xCoefficient, yCoefficient, constant } の演算モジュール
// linear-expression.jsの2変数版。連立方程式（中2）専用に使用する。

import { NodeType } from "./parser.js";
import { EquationError } from "./tokenizer.js";

const ZERO_EPSILON = 1e-9;

/**
 * @param {number} xCoefficient
 * @param {number} yCoefficient
 * @param {number} constant
 */
export function createTwoVariableExpression(xCoefficient, yCoefficient, constant) {
  return { xCoefficient, yCoefficient, constant };
}

export function isConstantTwoVariableExpression(expression) {
  return (
    Math.abs(expression.xCoefficient) < ZERO_EPSILON &&
    Math.abs(expression.yCoefficient) < ZERO_EPSILON
  );
}

export function addTwoVariableExpressions(a, b) {
  return createTwoVariableExpression(
    a.xCoefficient + b.xCoefficient,
    a.yCoefficient + b.yCoefficient,
    a.constant + b.constant
  );
}

export function subtractTwoVariableExpressions(a, b) {
  return createTwoVariableExpression(
    a.xCoefficient - b.xCoefficient,
    a.yCoefficient - b.yCoefficient,
    a.constant - b.constant
  );
}

export function negateTwoVariableExpression(a) {
  return createTwoVariableExpression(-a.xCoefficient, -a.yCoefficient, -a.constant);
}

/**
 * 少なくとも片方が定数式（xもyも含まない）の場合のみ乗算を許可する。
 * xy、x(x+1)、(x+y)(x-y)のような非1次の乗算はエラーにする。
 */
export function multiplyTwoVariableExpressions(a, b) {
  const aIsConstant = isConstantTwoVariableExpression(a);
  const bIsConstant = isConstantTwoVariableExpression(b);

  if (!aIsConstant && !bIsConstant) {
    throw new EquationError("xやyを含む式同士のかけ算はできません。");
  }

  if (aIsConstant) {
    return createTwoVariableExpression(
      a.constant * b.xCoefficient,
      a.constant * b.yCoefficient,
      a.constant * b.constant
    );
  }

  return createTwoVariableExpression(
    b.constant * a.xCoefficient,
    b.constant * a.yCoefficient,
    b.constant * a.constant
  );
}

/**
 * 分母が0でない定数の場合のみ除算を許可する。
 */
export function divideTwoVariableExpression(a, divisor) {
  if (!isConstantTwoVariableExpression(divisor)) {
    throw new EquationError("xやyで割ることはできません。");
  }

  if (Math.abs(divisor.constant) < ZERO_EPSILON) {
    throw new EquationError("0で割ることはできません。");
  }

  return createTwoVariableExpression(
    a.xCoefficient / divisor.constant,
    a.yCoefficient / divisor.constant,
    a.constant / divisor.constant
  );
}

/**
 * ASTノードを2変数1次式 { xCoefficient, yCoefficient, constant } へ変換する。
 * 変数トークンは、parser.jsが保持するnameフィールド（"x"または"y"）で区別する。
 * @param {object} node parser.jsが生成するASTノード
 */
export function astToTwoVariableExpression(node) {
  switch (node.type) {
    case NodeType.NUMBER:
      return createTwoVariableExpression(0, 0, node.value);

    case NodeType.VARIABLE:
      if (node.name === "x") {
        return createTwoVariableExpression(1, 0, 0);
      }
      if (node.name === "y") {
        return createTwoVariableExpression(0, 1, 0);
      }
      throw new EquationError(`不明な変数です：${node.name}`);

    case NodeType.UNARY_MINUS:
      return negateTwoVariableExpression(astToTwoVariableExpression(node.operand));

    case NodeType.BINARY_OP: {
      const left = astToTwoVariableExpression(node.left);
      const right = astToTwoVariableExpression(node.right);

      switch (node.operator) {
        case "+":
          return addTwoVariableExpressions(left, right);
        case "-":
          return subtractTwoVariableExpressions(left, right);
        case "*":
          return multiplyTwoVariableExpressions(left, right);
        case "/":
          return divideTwoVariableExpression(left, right);
        default:
          throw new EquationError("不明な演算子です。");
      }
    }

    default:
      throw new EquationError("式を解析できませんでした。");
  }
}
