// 内部処理用の式（*, /, -, =を使った文字列）を
// 画面表示用の式（×または省略, ÷, −, ＝を使った文字列）へ変換するモジュール

import { tokenize, TokenType, EquationError } from "./tokenizer.js";

const DISPLAY_SYMBOLS = {
  [TokenType.PLUS]: "＋",
  [TokenType.MINUS]: "−",
  [TokenType.DIVIDE]: "÷",
  [TokenType.LPAREN]: "(",
  [TokenType.RPAREN]: ")",
  [TokenType.EQUALS]: "＝",
  [TokenType.VARIABLE]: "x"
};

/**
 * 内部表記の式文字列を、画面表示用の文字列へ変換する。
 * 乗法記号は自然な表記のため省略する（例：3*x → 3x）。
 * 解析できない場合は、元の文字列をそのまま返す。
 * @param {string} equationString
 */
export function formatEquationForDisplay(equationString) {
  try {
    const tokens = tokenize(equationString);
    return tokens
      .map((token) => {
        if (token.type === TokenType.NUMBER) {
          return String(token.value);
        }
        if (token.type === TokenType.TIMES) {
          return "";
        }
        return DISPLAY_SYMBOLS[token.type] || "";
      })
      .join("");
  } catch (error) {
    if (error instanceof EquationError) {
      return equationString;
    }
    throw error;
  }
}
