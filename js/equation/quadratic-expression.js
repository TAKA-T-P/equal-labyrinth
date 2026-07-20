// 2次式 { xSquaredCoefficient, xCoefficient, constant } の演算モジュール
// linear-expression.js（1次式）の2次版。中3「2次方程式」専用に使用する。

import { NodeType } from "./parser.js";
import { EquationError } from "./tokenizer.js";

const ZERO_EPSILON = 1e-9;

/**
 * @param {number} xSquaredCoefficient
 * @param {number} xCoefficient
 * @param {number} constant
 */
export function createQuadraticExpression(xSquaredCoefficient, xCoefficient, constant) {
  return { xSquaredCoefficient, xCoefficient, constant };
}

export function isConstantQuadraticExpression(expression) {
  return (
    Math.abs(expression.xSquaredCoefficient) < ZERO_EPSILON &&
    Math.abs(expression.xCoefficient) < ZERO_EPSILON
  );
}

/**
 * x²の項を持たない（1次式または定数）かどうかを判定する。
 * 乗算・除算の次数制限（積が2次を超えないか）の判定に使う。
 */
export function isLinearOrConstantQuadraticExpression(expression) {
  return Math.abs(expression.xSquaredCoefficient) < ZERO_EPSILON;
}

export function addQuadraticExpressions(a, b) {
  return createQuadraticExpression(
    a.xSquaredCoefficient + b.xSquaredCoefficient,
    a.xCoefficient + b.xCoefficient,
    a.constant + b.constant
  );
}

export function subtractQuadraticExpressions(a, b) {
  return createQuadraticExpression(
    a.xSquaredCoefficient - b.xSquaredCoefficient,
    a.xCoefficient - b.xCoefficient,
    a.constant - b.constant
  );
}

export function negateQuadraticExpression(a) {
  return createQuadraticExpression(-a.xSquaredCoefficient, -a.xCoefficient, -a.constant);
}

/**
 * 積の次数が2以下になる場合のみ乗算を許可する。
 * 許可：定数×2次式以下、1次式×1次式（結果が2次式になる）
 * 入力エラー：2次式×1次式以上（結果が3次以上になる）
 */
export function multiplyQuadraticExpressions(a, b) {
  const aIsConstant = isConstantQuadraticExpression(a);
  const bIsConstant = isConstantQuadraticExpression(b);

  if (aIsConstant) {
    return createQuadraticExpression(
      a.constant * b.xSquaredCoefficient,
      a.constant * b.xCoefficient,
      a.constant * b.constant
    );
  }
  if (bIsConstant) {
    return createQuadraticExpression(
      b.constant * a.xSquaredCoefficient,
      b.constant * a.xCoefficient,
      b.constant * a.constant
    );
  }

  const aIsLinear = isLinearOrConstantQuadraticExpression(a);
  const bIsLinear = isLinearOrConstantQuadraticExpression(b);
  if (aIsLinear && bIsLinear) {
    // (a1*x+a0)*(b1*x+b0) = a1*b1*x² + (a1*b0+a0*b1)*x + a0*b0
    return createQuadraticExpression(
      a.xCoefficient * b.xCoefficient,
      a.xCoefficient * b.constant + a.constant * b.xCoefficient,
      a.constant * b.constant
    );
  }

  throw new EquationError("次数が2を超える式は入力できません。");
}

/**
 * 分母が0でない定数の場合のみ除算を許可する。
 */
export function divideQuadraticExpression(a, divisor) {
  if (!isConstantQuadraticExpression(divisor)) {
    throw new EquationError("xで割ることはできません。");
  }
  if (Math.abs(divisor.constant) < ZERO_EPSILON) {
    throw new EquationError("0で割ることはできません。");
  }
  return createQuadraticExpression(
    a.xSquaredCoefficient / divisor.constant,
    a.xCoefficient / divisor.constant,
    a.constant / divisor.constant
  );
}

/**
 * べき乗の底（今回はxのみ対応）を2乗した2次式を返す。
 * @param {string} baseName
 */
export function squareQuadraticBase(baseName) {
  if (baseName !== "x") {
    throw new EquationError(`この問題ではxのみを使用します（${baseName}は使用できません）。`);
  }
  return createQuadraticExpression(1, 0, 0);
}

/**
 * 任意の2次式以下の式を2乗する（"(x-8)²"のように、かっこの中身をまとめて2乗する入力に対応する）。
 * 底がすでに2次式（x²を含む）の場合、2乗すると4次式になってしまうため入力エラーにする。
 * @param {{xSquaredCoefficient: number, xCoefficient: number, constant: number}} baseExpression
 */
export function squareQuadraticExpression(baseExpression) {
  if (!isLinearOrConstantQuadraticExpression(baseExpression)) {
    throw new EquationError("次数が2を超える式は入力できません。");
  }
  return multiplyQuadraticExpressions(baseExpression, baseExpression);
}

/**
 * ASTノードを2次式 { xSquaredCoefficient, xCoefficient, constant } へ変換する。
 * @param {object} node parser.jsが生成するASTノード
 */
export function astToQuadraticExpression(node) {
  switch (node.type) {
    case NodeType.NUMBER:
      return createQuadraticExpression(0, 0, node.value);

    case NodeType.VARIABLE:
      if (node.name !== "x") {
        throw new EquationError(`この問題ではxのみを使用します（${node.name}は使用できません）。`);
      }
      return createQuadraticExpression(0, 1, 0);

    case NodeType.POWER: {
      if (node.exponent !== 2) {
        throw new EquationError("2乗以外のべき乗には対応していません。");
      }
      // node.baseは、単なる変数x（"x^2"）だけでなく、任意の式（"(x-8)^2"）にもなりうる。
      const baseExpression = astToQuadraticExpression(node.base);
      return squareQuadraticExpression(baseExpression);
    }

    case NodeType.UNARY_MINUS:
      return negateQuadraticExpression(astToQuadraticExpression(node.operand));

    case NodeType.BINARY_OP: {
      const left = astToQuadraticExpression(node.left);
      const right = astToQuadraticExpression(node.right);

      switch (node.operator) {
        case "+":
          return addQuadraticExpressions(left, right);
        case "-":
          return subtractQuadraticExpressions(left, right);
        case "*":
          return multiplyQuadraticExpressions(left, right);
        case "/":
          return divideQuadraticExpression(left, right);
        default:
          throw new EquationError("不明な演算子です。");
      }
    }

    default:
      throw new EquationError("式を解析できませんでした。");
  }
}
