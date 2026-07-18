// 中1「1次方程式」のカテゴリ情報
// 設定画面のチェックボックスは、このデータから自動生成する。

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

export const LINEAR_CATEGORIES = [
  {
    id: "L1-01",
    name: "個数・代金",
    description: "単価×個数と追加料金から式を立てる"
  },
  {
    id: "L1-03",
    name: "分配・過不足",
    description: "配った個数と余り・不足から式を立てる"
  },
  {
    id: "L1-08",
    name: "追いつき・出会い",
    description: "2人が進んだ道のりから式を立てる"
  },
  {
    id: "L1-10",
    name: "2種類の品物と代金",
    description: "一方をx個、他方を全体−x個と表す"
  },
  {
    id: "L1-11",
    name: "大人・子どもの人数と料金",
    description: "一方をx人、他方を全体−x人と表す"
  }
];
