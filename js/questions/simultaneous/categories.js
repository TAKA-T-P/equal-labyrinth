// 中2「連立方程式」のカテゴリ情報
// 設定画面のチェックボックスは、このデータから自動生成する。

// テンプレート生成用の共通ヘルパーは、中1「1次方程式」と共有するため、
// generation-helpers.jsを再エクスポートする（linear/categories.jsと同じ構成）。
export {
  createUniqueId,
  randomInt,
  randomChoice,
  buildKeypadNumbers,
  termInternal,
  termDisplay
} from "../generation-helpers.js";

// difficulty：段位認定モードでの出題難易度（トレーニングでは難易度を問わず全カテゴリを選択できる）
// 配列の並び順が、タイトル画面のカテゴリ一覧の表示順になる。
export const SIMULTANEOUS_CATEGORIES = [
  {
    id: "L2-01",
    name: "2種類の品物と代金",
    difficulty: "NORMAL"
  },
  {
    id: "L2-02",
    name: "人数と料金",
    difficulty: "NORMAL"
  },
  {
    id: "L2-03",
    name: "硬貨・紙幣",
    difficulty: "NORMAL"
  },
  {
    id: "L2-04",
    name: "2けたの自然数",
    difficulty: "HARD"
  },
  {
    id: "L2-05",
    name: "年齢",
    difficulty: "NORMAL"
  },
  {
    id: "L2-06",
    name: "速さ・道のり",
    difficulty: "NORMAL"
  },
  {
    id: "L2-07",
    name: "電車の通過",
    difficulty: "HARD"
  },
  {
    id: "L2-08",
    name: "池・トラックの周回",
    difficulty: "HARD"
  },
  {
    id: "L2-09",
    name: "食塩水の混合",
    difficulty: "NORMAL"
  },
  {
    id: "L2-10",
    name: "割合の増減・人数",
    difficulty: "HARD"
  },
  {
    id: "L2-11",
    name: "割合の増減・代金",
    difficulty: "HARD"
  },
  {
    id: "L2-12",
    name: "平均",
    difficulty: "HARD"
  }
];
