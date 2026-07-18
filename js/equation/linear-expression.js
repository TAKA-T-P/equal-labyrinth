// 1次式 { xCoefficient, constant } の演算モジュール
// 将来、連立方程式や2次方程式向けに system-expression.js / quadratic-expression.js
// を追加する際も、この形式を参考にできるようにしている。

import { NodeType } from "./parser.js";
import { EquationError } from "./tokenizer.js";

const ZERO_EPSILON = 1e-9;

/**
 * @param {number} xCoefficient
 * @param {number} constant
 */
export function createExpression(xCoefficient, constant) {
  return { xCoefficient, constant };
}

export function isConstantExpression(expression) {
  return Math.abs(expression.xCoefficient) < ZERO_EPSILON;
}

export function addExpressions(a, b) {
  return createExpression(
    a.xCoefficient + b.xCoefficient,
    a.constant + b.constant
  );
}

export function subtractExpressions(a, b) {
  return createExpression(
    a.xCoefficient - b.xCoefficient,
    a.constant - b.constant
  );
}

export function negateExpression(a) {
  return createExpression(-a.xCoefficient, -a.constant);
}

/**
 * 少なくとも片方が定数式の場合のみ乗算を許可する。
 */
export function multiplyExpressions(a, b) {
  if (!isConstantExpression(a) && !isConstantExpression(b)) {
    throw new EquationError("xを含む式同士のかけ算はできません。");
  }

  if (isConstantExpression(a)) {
    return createExpression(
      a.constant * b.xCoefficient,
      a.constant * b.constant
    );
  }

  return createExpression(
    b.constant * a.xCoefficient,
    b.constant * a.constant
  );
}

/**
 * 分母が0でない定数の場合のみ除算を許可する。
 */
export function divideExpression(a, divisor) {
  if (!isConstantExpression(divisor)) {
    throw new EquationError("xで割ることはできません。");
  }

  if (Math.abs(divisor.constant) < ZERO_EPSILON) {
    throw new EquationError("0で割ることはできません。");
  }

  return createExpression(
    a.xCoefficient / divisor.constant,
    a.constant / divisor.constant
  );
}

/**
 * ASTノードを1次式 { xCoefficient, constant } へ変換する。
 * @param {object} node parser.jsが生成するASTノード
 */
export function astToLinearExpression(node) {
  switch (node.type) {
    case NodeType.NUMBER:
      return createExpression(0, node.value);

    case NodeType.VARIABLE:
      return createExpression(1, 0);

    case NodeType.UNARY_MINUS:
      return negateExpression(astToLinearExpression(node.operand));

    case NodeType.BINARY_OP: {
      const left = astToLinearExpression(node.left);
      const right = astToLinearExpression(node.right);

      switch (node.operator) {
        case "+":
          return addExpressions(left, right);
        case "-":
          return subtractExpressions(left, right);
        case "*":
          return multiplyExpressions(left, right);
        case "/":
          return divideExpression(left, right);
        default:
          throw new EquationError("不明な演算子です。");
      }
    }

    default:
      throw new EquationError("式を解析できませんでした。");
  }
}
