// 数式文字列をトークン列へ分解するモジュール
// 将来、連立方程式(y)や2次方程式(x^2)のトークンを追加できるよう、
// トークン種別を増やすだけで拡張できる構成にしている。

export class EquationError extends Error {
  constructor(message) {
    super(message);
    this.name = "EquationError";
  }
}

export const TokenType = {
  NUMBER: "NUMBER",
  VARIABLE: "VARIABLE",
  PLUS: "PLUS",
  MINUS: "MINUS",
  TIMES: "TIMES",
  DIVIDE: "DIVIDE",
  LPAREN: "LPAREN",
  RPAREN: "RPAREN",
  EQUALS: "EQUALS"
};

const SINGLE_CHAR_TOKENS = {
  "+": TokenType.PLUS,
  "−": TokenType.MINUS, // −
  "-": TokenType.MINUS,
  "×": TokenType.TIMES, // ×
  "*": TokenType.TIMES,
  "÷": TokenType.DIVIDE, // ÷
  "/": TokenType.DIVIDE,
  "(": TokenType.LPAREN,
  ")": TokenType.RPAREN,
  "=": TokenType.EQUALS
};

function isDigit(char) {
  return char >= "0" && char <= "9";
}

function isWhitespace(char) {
  return char === " " || char === "\t" || char === "\n" || char === "\r";
}

// 変数として認識する文字（小文字・大文字とも同じ変数として扱う）
const VARIABLE_NAMES = {
  x: "x",
  X: "x",
  y: "y",
  Y: "y"
};

function isVariable(char) {
  return Object.prototype.hasOwnProperty.call(VARIABLE_NAMES, char);
}

/**
 * 文字列を素朴なトークン列へ分解する（暗黙の乗法は未挿入）。
 */
function scan(input) {
  const tokens = [];
  let i = 0;

  while (i < input.length) {
    const char = input[i];

    if (isWhitespace(char)) {
      i += 1;
      continue;
    }

    if (isDigit(char) || char === ".") {
      let numberString = "";
      let dotCount = 0;

      while (
        i < input.length &&
        (isDigit(input[i]) || input[i] === ".")
      ) {
        if (input[i] === ".") {
          dotCount += 1;
          if (dotCount > 1) {
            throw new EquationError("数値の形式が正しくありません。");
          }
        }
        numberString += input[i];
        i += 1;
      }

      if (numberString === "." || numberString === "") {
        throw new EquationError("数値の形式が正しくありません。");
      }

      const value = Number(numberString);
      if (!Number.isFinite(value)) {
        throw new EquationError("数値の形式が正しくありません。");
      }

      tokens.push({ type: TokenType.NUMBER, value });
      continue;
    }

    if (isVariable(char)) {
      tokens.push({ type: TokenType.VARIABLE, name: VARIABLE_NAMES[char] });
      i += 1;
      continue;
    }

    if (Object.prototype.hasOwnProperty.call(SINGLE_CHAR_TOKENS, char)) {
      tokens.push({ type: SINGLE_CHAR_TOKENS[char] });
      i += 1;
      continue;
    }

    throw new EquationError(`使用できない文字が含まれています：「${char}」`);
  }

  return tokens;
}

const IMPLICIT_MULTIPLY_LEFT = new Set([
  TokenType.NUMBER,
  TokenType.VARIABLE,
  TokenType.RPAREN
]);

const IMPLICIT_MULTIPLY_RIGHT = new Set([
  TokenType.VARIABLE,
  TokenType.LPAREN
]);

/**
 * 3x → 3*x のように、暗黙の乗法を表すTIMESトークンを挿入する。
 */
function insertImplicitMultiplication(tokens) {
  const result = [];

  for (let i = 0; i < tokens.length; i += 1) {
    const current = tokens[i];

    if (result.length > 0) {
      const previous = result[result.length - 1];

      if (
        previous.type === TokenType.NUMBER &&
        current.type === TokenType.NUMBER
      ) {
        throw new EquationError("数値が連続しています。");
      }

      const needsImplicitTimes =
        (IMPLICIT_MULTIPLY_LEFT.has(previous.type) &&
          IMPLICIT_MULTIPLY_RIGHT.has(current.type)) ||
        (previous.type === TokenType.RPAREN &&
          current.type === TokenType.NUMBER);

      if (needsImplicitTimes) {
        result.push({ type: TokenType.TIMES });
      }
    }

    result.push(current);
  }

  return result;
}

/**
 * 数式文字列を最終的なトークン列へ変換する。
 * @param {string} input
 * @returns {Array<{type: string, value?: number}>}
 */
export function tokenize(input) {
  if (typeof input !== "string") {
    throw new EquationError("入力が文字列ではありません。");
  }
  const rawTokens = scan(input);
  return insertImplicitMultiplication(rawTokens);
}
