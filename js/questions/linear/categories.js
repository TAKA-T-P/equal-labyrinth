// 中1「1次方程式」のカテゴリ情報
// 設定画面のチェックボックスは、このデータから自動生成する。

// テンプレート生成用の共通ヘルパーは、中2「連立方程式」とも共有するため
// generation-helpers.jsへ移動した。既存の各テンプレートファイルは
// 引き続き「./categories.js」からimportできるよう、ここで再エクスポートする。
export {
  createUniqueId,
  randomInt,
  randomChoice,
  buildKeypadNumbers
} from "../generation-helpers.js";

// difficulty：段位認定モードでの出題難易度（トレーニングでは難易度を問わず全カテゴリを選択できる）
// 配列の並び順が、タイトル画面のカテゴリ一覧の表示順になる。
export const LINEAR_CATEGORIES = [
  {
    id: "L1-01",
    name: "個数・代金",
    description: "単価×個数と追加料金から式を立てる",
    difficulty: "NORMAL",
    exampleTemplateId: "L1-01-apple-box"
  },
  {
    id: "L1-10",
    name: "2種類の品物",
    description: "一方をx個、他方を全体−x個と表す",
    difficulty: "NORMAL",
    exampleTemplateId: "L1-10-fruit-apple-orange"
  },
  {
    id: "L1-11",
    name: "人数と料金",
    description: "一方をx人、他方を全体−x人と表す",
    difficulty: "NORMAL",
    exampleTemplateId: "L1-11-aquarium"
  },
  {
    id: "L1-05",
    name: "年齢",
    description: "現在・数年後の年齢の関係から式を立てる",
    difficulty: "NORMAL",
    exampleTemplateId: "L1-05-father-son"
  },
  {
    id: "L1-06",
    name: "整数",
    description: "連続する整数の和などから式を立てる",
    difficulty: "HARD",
    exampleTemplateId: "L1-06-three-consecutive"
  },
  {
    id: "L1-03",
    name: "分配・過不足",
    description: "配った個数と余り・不足から式を立てる",
    difficulty: "NORMAL",
    exampleTemplateId: "L1-03-candy-children"
  },
  {
    id: "L1-04",
    name: "長いす・過不足",
    description: "座り方を変えたときの人数の違いから式を立てる",
    difficulty: "HARD",
    exampleTemplateId: "L1-04-gym-students"
  },
  {
    id: "L1-02",
    name: "所持金・過不足",
    description: "買える冊数・余り・不足から式を立てる",
    difficulty: "HARD",
    exampleTemplateId: "L1-02-notebook-allowance"
  },
  {
    id: "L1-08",
    name: "追いつき・出会い",
    description: "2人が進んだ道のりから式を立てる",
    difficulty: "NORMAL",
    exampleTemplateId: "L1-08-brother-chase"
  },
  {
    id: "L1-07",
    name: "速さ・時間",
    description: "速さと時間の関係から式を立てる",
    difficulty: "HARD",
    exampleTemplateId: "L1-07-library-walk-run"
  },
  {
    id: "L1-09",
    name: "割合・増減",
    description: "割引後・増加後の数量から式を立てる",
    difficulty: "HARD",
    exampleTemplateId: "L1-09-discount-price"
  }
];
