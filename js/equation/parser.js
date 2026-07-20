// トークン列を構文解析してAST（構文木）を生成するモジュール
// eval()やFunction()は使用しない再帰下降パーサー。
//
// 優先順位（高い順）：
//   1. 括弧
//   2. 単項マイナス
//   3. 乗法・除法
//   4. 加法・減法

import { TokenType, EquationError } from "./tokenizer.js";

export const NodeType = {
  NUMBER: "NUMBER",
  VARIABLE: "VARIABLE",
  POWER: "POWER",
  BINARY_OP: "BINARY_OP",
  UNARY_MINUS: "UNARY_MINUS"
};

class ParserCursor {
  constructor(tokens) {
    this.tokens = tokens;
    this.position = 0;
  }

  peek() {
    return this.tokens[this.position] || null;
  }

  advance() {
    const token = this.peek();
    this.position += 1;
    return token;
  }

  isAtEnd() {
    return this.position >= this.tokens.length;
  }
}

function parseExpressionInternal(cursor) {
  let node = parseTerm(cursor);

  while (
    !cursor.isAtEnd() &&
    (cursor.peek().type === TokenType.PLUS ||
      cursor.peek().type === TokenType.MINUS)
  ) {
    const operatorToken = cursor.advance();
    const right = parseTerm(cursor);
    node = {
      type: NodeType.BINARY_OP,
      operator: operatorToken.type === TokenType.PLUS ? "+" : "-",
      left: node,
      right
    };
  }

  return node;
}

function parseTerm(cursor) {
  let node = parseFactor(cursor);

  while (
    !cursor.isAtEnd() &&
    (cursor.peek().type === TokenType.TIMES ||
      cursor.peek().type === TokenType.DIVIDE)
  ) {
    const operatorToken = cursor.advance();
    const right = parseFactor(cursor);
    node = {
      type: NodeType.BINARY_OP,
      operator: operatorToken.type === TokenType.TIMES ? "*" : "/",
      left: node,
      right
    };
  }

  return node;
}

function parseFactor(cursor) {
  if (!cursor.isAtEnd() && cursor.peek().type === TokenType.MINUS) {
    cursor.advance();
    const operand = parseFactor(cursor);
    return { type: NodeType.UNARY_MINUS, operand };
  }

  if (!cursor.isAtEnd() && cursor.peek().type === TokenType.PLUS) {
    throw new EquationError("式の形式が正しくありません。");
  }

  return parsePrimary(cursor);
}

function parsePrimary(cursor) {
  if (cursor.isAtEnd()) {
    throw new EquationError("式が不完全です。");
  }

  const token = cursor.advance();

  if (token.type === TokenType.NUMBER) {
    return { type: NodeType.NUMBER, value: token.value };
  }

  if (token.type === TokenType.VARIABLE) {
    return { type: NodeType.VARIABLE, name: token.name };
  }

  if (token.type === TokenType.POWER) {
    return {
      type: NodeType.POWER,
      base: { type: NodeType.VARIABLE, name: token.base },
      exponent: token.exponent
    };
  }

  if (token.type === TokenType.LPAREN) {
    const inner = parseExpressionInternal(cursor);
    if (cursor.isAtEnd() || cursor.peek().type !== TokenType.RPAREN) {
      throw new EquationError("かっこの対応が取れていません。");
    }
    cursor.advance();

    // "(...)²"（SQUAREトークン）は、かっこの中身をまとめて2乗するPOWERノードにする
    // （x²のPOWERノードと異なり、baseは変数1つではなく任意の式ASTになる）。
    if (!cursor.isAtEnd() && cursor.peek().type === TokenType.SQUARE) {
      cursor.advance();
      return { type: NodeType.POWER, base: inner, exponent: 2 };
    }

    return inner;
  }

  throw new EquationError("式の形式が正しくありません。");
}

/**
 * トークン列を式として解析し、ASTを返す。
 * @param {Array} tokens
 */
export function parseExpression(tokens) {
  if (!tokens || tokens.length === 0) {
    throw new EquationError("式が空です。");
  }

  const cursor = new ParserCursor(tokens);
  const node = parseExpressionInternal(cursor);

  if (!cursor.isAtEnd()) {
    throw new EquationError("式の形式が正しくありません。");
  }

  return node;
}
