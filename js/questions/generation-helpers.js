// 問題テンプレート生成で共通して使う小さなヘルパー関数群
// 中1「1次方程式」・中2「連立方程式」の両方から利用する。

/**
 * crypto.randomUUID()が使用できない環境向けの代替ID生成処理を含む、
 * 一意なテンプレートIDを生成する。
 * @param {string} prefix
 */
export function createUniqueId(prefix) {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  const randomPart =
    Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  return `${prefix}-${randomPart}`;
}

/**
 * min以上max以下の整数乱数を返す。
 */
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 配列からランダムに1つの要素を返す。
 */
export function randomChoice(list) {
  return list[randomInt(0, list.length - 1)];
}

/**
 * 係数付きの項を、内部処理用の文字列（例："3*x"）へ変換する。
 * 係数が1のときは、暗黙の係数として"x"のように省略する
 * （模範式が"1*x+4*y=4700"ではなく"x+4y=4700"と自然に書けるようにするため）。
 * @param {number} coefficient
 * @param {string} variable "x" | "y"
 */
export function termInternal(coefficient, variable) {
  return coefficient === 1 ? variable : `${coefficient}*${variable}`;
}

/**
 * 係数付きの項を、画面表示用の文字列（例："3x"）へ変換する。
 * @param {number} coefficient
 * @param {string} variable "x" | "y"
 */
export function termDisplay(coefficient, variable) {
  return coefficient === 1 ? variable : `${coefficient}${variable}`;
}

/**
 * 数値キーボードに表示する数値の並びを作る。
 * 問題文に登場する順の値を受け取り、文字列化したうえで
 * 最初に登場した順序を保ったまま重複を取り除く。
 * @param {Array<number|string>} values
 */
export function buildKeypadNumbers(values) {
  const seen = new Set();
  const result = [];
  values.forEach((value) => {
    const text = String(value);
    if (!seen.has(text)) {
      seen.add(text);
      result.push(text);
    }
  });
  return result;
}
