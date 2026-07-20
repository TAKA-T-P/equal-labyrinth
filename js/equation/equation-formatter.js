// 内部処理用の式（*, /, -, =を使った文字列）を
// 画面表示用の式（×または省略, ÷, −, ＝を使った文字列）へ変換するモジュール

import { tokenize, TokenType, EquationError } from "./tokenizer.js";

// ============================================================
// 上下型分数を含むDOM描画（正解表示・履歴・ヒント式パーツで共通利用）
// ============================================================

/**
 * トークン列のindexから「1つのまとまり（原子）」を読み取る。
 * 数値・変数トークン単体、または対応の取れた1組のかっこの中身をまとめて返す。
 * @returns {{innerTokens: Array, nextIndex: number}|null}
 */
function readAtomTokens(tokens, index) {
  const token = tokens[index];
  if (!token) return null;

  if (token.type === TokenType.LPAREN) {
    let depth = 1;
    let j = index + 1;
    while (j < tokens.length && depth > 0) {
      if (tokens[j].type === TokenType.LPAREN) depth += 1;
      else if (tokens[j].type === TokenType.RPAREN) depth -= 1;
      if (depth === 0) break;
      j += 1;
    }
    if (depth !== 0) return null;
    return { innerTokens: tokens.slice(index + 1, j), nextIndex: j + 1 };
  }

  if (token.type === TokenType.NUMBER || token.type === TokenType.VARIABLE) {
    return { innerTokens: [token], nextIndex: index + 1 };
  }

  return null;
}

function appendVariableToken(container, token) {
  const span = document.createElement("span");
  span.className = "var-x";
  span.textContent = token.name;
  container.appendChild(span);
}

/**
 * 分数ではない、通常のトークン1つをDOMへ追加する。
 */
function appendPlainToken(container, token) {
  switch (token.type) {
    case TokenType.NUMBER:
      container.appendChild(document.createTextNode(String(token.value)));
      break;
    case TokenType.VARIABLE:
      appendVariableToken(container, token);
      break;
    case TokenType.PLUS:
      container.appendChild(document.createTextNode("＋"));
      break;
    case TokenType.MINUS:
      container.appendChild(document.createTextNode("−"));
      break;
    case TokenType.TIMES:
      // 暗黙の乗法として省略する（3*x → 3x）
      break;
    case TokenType.DIVIDE:
      // 通常は分数として処理されるためここには来ないが、念のためのフォールバック
      container.appendChild(document.createTextNode("÷"));
      break;
    case TokenType.LPAREN:
      container.appendChild(document.createTextNode("("));
      break;
    case TokenType.RPAREN:
      container.appendChild(document.createTextNode(")"));
      break;
    case TokenType.EQUALS:
      container.appendChild(document.createTextNode("＝"));
      break;
    default:
      break;
  }
}

/**
 * 分数（分子÷分母）1つ分の上下型DOMを作る。
 */
function createFractionDisplayNode(numeratorTokens, denominatorTokens) {
  const wrapper = document.createElement("span");
  wrapper.className = "math-fraction";

  const numerator = document.createElement("span");
  numerator.className = "math-fraction__numerator";
  appendFormattedTokens(numerator, numeratorTokens);

  const bar = document.createElement("span");
  bar.className = "math-fraction__bar";

  const denominator = document.createElement("span");
  denominator.className = "math-fraction__denominator";
  appendFormattedTokens(denominator, denominatorTokens);

  wrapper.appendChild(numerator);
  wrapper.appendChild(bar);
  wrapper.appendChild(denominator);

  return wrapper;
}

/**
 * トークン列を先頭から走査し、「原子÷原子」のパターンを見つけたら上下型分数として、
 * それ以外は通常のトークンとしてDOMへ追加していく。
 */
function appendFormattedTokens(container, tokens) {
  let i = 0;
  while (i < tokens.length) {
    const atomA = readAtomTokens(tokens, i);
    if (atomA) {
      const afterA = tokens[atomA.nextIndex];
      if (afterA && afterA.type === TokenType.DIVIDE) {
        const atomB = readAtomTokens(tokens, atomA.nextIndex + 1);
        if (atomB) {
          container.appendChild(
            createFractionDisplayNode(atomA.innerTokens, atomB.innerTokens)
          );
          i = atomB.nextIndex;
          continue;
        }
      }
    }

    appendPlainToken(container, tokens[i]);
    i += 1;
  }
}

/**
 * 内部表現の数式文字列を、上下型分数を含むDOMとしてcontainerへ描画する
 * （containerの既存の中身はクリアする）。解析に失敗した場合は、
 * 元の文字列をそのままプレーンテキストとして表示する（未入力プレースホルダーなど）。
 * @param {HTMLElement} container
 * @param {string} equationString
 */
export function renderFormattedEquation(container, equationString) {
  container.innerHTML = "";

  let tokens;
  try {
    tokens = tokenize(equationString);
  } catch (error) {
    container.appendChild(document.createTextNode(equationString));
    return;
  }

  appendFormattedTokens(container, tokens);
}

const DISPLAY_SYMBOLS = {
  [TokenType.PLUS]: "＋",
  [TokenType.MINUS]: "−",
  [TokenType.DIVIDE]: "÷",
  [TokenType.LPAREN]: "(",
  [TokenType.RPAREN]: ")",
  [TokenType.EQUALS]: "＝"
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
        if (token.type === TokenType.VARIABLE) {
          return token.name || "x";
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
