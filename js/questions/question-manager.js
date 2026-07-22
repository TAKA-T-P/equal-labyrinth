// 問題の選択と出題順を管理するモジュール
// 単元（linear／simultaneous）による分岐は、このファイルの中の
// getTemplatesForUnit() / getCategoriesForUnit() / createFallbackQuestion() の
// 数か所へ集中させている。

import { APP_CONFIG, UNIT_IDS } from "../config.js";
import { LINEAR_CATEGORIES } from "./linear/categories.js";
import { linearQuestionTemplates } from "./linear/index.js";
import { SIMULTANEOUS_CATEGORIES } from "./simultaneous/categories.js";
import { simultaneousQuestionTemplates } from "./simultaneous/index.js";
import { QUADRATIC_CATEGORIES } from "./quadratic/categories.js";
import { quadraticQuestionTemplates } from "./quadratic/index.js";
import { validateQuestion } from "./question-validator.js";

// テンプレート生成に失敗し続けた場合の固定問題（フォールバック）
const FALLBACK_QUESTIONS = {
  "L1-01": {
    templateId: "L1-01-fallback",
    categoryId: "L1-01",
    categoryName: "個数・代金",
    rankDifficulty: "NORMAL",
    prompt:
      "1個100円のりんごを何個か買い、箱代100円を別に払ったところ、" +
      "代金の合計が600円になりました。りんごの個数をx個として方程式を立てなさい。",
    variableDefinition: "りんごの個数",
    expectedX: 5,
    canonicalEquation: "100*x+100=600",
    displayEquation: "100x＋100＝600",
    solutionDisplay: "x＝5",
    keypadNumbers: ["100", "600"],
    keypadSymbols: ["x", "+", "="],
    hintKeypadParts: [],
    hint: "りんごの代金は「1個100円×個数」で表せます。そこに箱代100円を足すと合計になります。",
    explanation: "りんごの代金と箱代を合わせた金額が、代金の合計と等しくなります。"
  },
  "L1-02": {
    templateId: "L1-02-fallback",
    categoryId: "L1-02",
    categoryName: "所持金・過不足",
    rankDifficulty: "HARD",
    prompt:
      "持っているお金でノートを買おうとしました。1冊100円のノートを買うと100円" +
      "余り、1冊150円のノートを買うと50円足りません。買おうとした冊数をx冊として" +
      "方程式を立てなさい。",
    variableDefinition: "買おうとした冊数",
    expectedX: 3,
    canonicalEquation: "100*x+100=150*x-50",
    displayEquation: "100x＋100＝150x−50",
    solutionDisplay: "x＝3",
    keypadNumbers: ["100", "150", "50"],
    keypadSymbols: ["x", "+", "-", "="],
    hintKeypadParts: [
      { display: "100x＋100", value: "100x+100", ariaLabel: "100xたす100" }
    ],
    hint: "持っているお金は「1冊100円×冊数＋100円」でも、「1冊150円×冊数－50円」でも表せます。",
    explanation: "どちらの買い方でも、もとの所持金は変わらないことから方程式が立てられます。"
  },
  "L1-03": {
    templateId: "L1-03-fallback",
    categoryId: "L1-03",
    categoryName: "分配・過不足",
    rankDifficulty: "NORMAL",
    prompt:
      "あめを何人かの子どもに配ります。1人5個ずつ配ると3個余り、1人7個ずつ配ると" +
      "9個足りません。子どもの人数をx人として方程式を立てなさい。",
    variableDefinition: "子どもの人数",
    expectedX: 6,
    canonicalEquation: "5*x+3=7*x-9",
    displayEquation: "5x＋3＝7x−9",
    solutionDisplay: "x＝6",
    keypadNumbers: ["5", "3", "7", "9"],
    keypadSymbols: ["x", "+", "-", "="],
    hintKeypadParts: [
      { display: "5x＋3", value: "5x+3", ariaLabel: "5xたす3" }
    ],
    hint: "あめの個数は「1人5個×人数＋3個」でも、「1人7個×人数－9個」でも表せます。",
    explanation: "配り方が変わっても、あめの総数は変わらないことから方程式が立てられます。"
  },
  "L1-04": {
    templateId: "L1-04-fallback",
    categoryId: "L1-04",
    categoryName: "長いす・過不足",
    rankDifficulty: "HARD",
    prompt:
      "体育館で、生徒が長いすに座ります。1脚に5人ずつ座ると10人が座れず、" +
      "1脚に6人ずつ座ると、最後の1脚には2人だけ座りました。長いすの数をx脚として" +
      "方程式を立てなさい。",
    variableDefinition: "長いすの数",
    expectedX: 14,
    canonicalEquation: "5*x+10=6*(x-1)+2",
    displayEquation: "5x＋10＝6(x−1)＋2",
    solutionDisplay: "x＝14",
    keypadNumbers: ["5", "10", "6", "2"],
    keypadSymbols: ["x", "+", "-", "(", ")", "="],
    hintKeypadParts: [
      { display: "（x−1）", value: "(x-1)", ariaLabel: "xひく1" }
    ],
    hint: "1脚に6人ずつ座ったとき、最後の1脚をのぞいた長いすの数は「x－1」脚と表せます。",
    explanation: "座り方が変わっても、生徒の総数は変わらないことから方程式が立てられます。"
  },
  "L1-05": {
    templateId: "L1-05-fallback",
    categoryId: "L1-05",
    categoryName: "年齢",
    rankDifficulty: "NORMAL",
    prompt:
      "現在、父の年齢は息子の年齢の3倍です。6年後には、父の年齢が息子の年齢の" +
      "2倍になります。息子の現在の年齢をx歳として方程式を立てなさい。",
    variableDefinition: "息子の現在の年齢",
    expectedX: 6,
    canonicalEquation: "3*x+6=2*(x+6)",
    displayEquation: "3x＋6＝2(x＋6)",
    solutionDisplay: "x＝6",
    keypadNumbers: ["3", "6", "2"],
    keypadSymbols: ["x", "+", "(", ")", "="],
    hintKeypadParts: [
      { display: "（x＋6）", value: "(x+6)", ariaLabel: "xたす6" }
    ],
    hint: "6年後の息子の年齢は「x＋6」歳と表せます。父の年齢も同じように6を足して表しましょう。",
    explanation: "6年後の父の年齢と、息子の年齢の2倍が等しくなります。"
  },
  "L1-06": {
    templateId: "L1-06-fallback",
    categoryId: "L1-06",
    categoryName: "整数",
    rankDifficulty: "HARD",
    prompt: "連続する3つの整数の和が72です。最も小さい整数をxとして方程式を立てなさい。",
    variableDefinition: "最も小さい整数",
    expectedX: 23,
    canonicalEquation: "x+(x+1)+(x+2)=72",
    displayEquation: "x＋(x＋1)＋(x＋2)＝72",
    solutionDisplay: "x＝23",
    keypadNumbers: ["1", "2", "72"],
    keypadSymbols: ["x", "+", "(", ")", "="],
    hintKeypadParts: [
      { display: "（x＋1）", value: "(x+1)", ariaLabel: "xたす1" }
    ],
    hint: "連続する整数は、1ずつ大きくなります。真ん中の整数は「x＋1」と表せます。",
    explanation: "3つの整数を、すべてxを使って表してから足し合わせます。"
  },
  "L1-07": {
    templateId: "L1-07-fallback",
    categoryId: "L1-07",
    categoryName: "速さ・時間",
    rankDifficulty: "HARD",
    prompt:
      "家から図書館まで、毎分60mで歩くと、毎分80mで歩く場合より5分多くかかります。" +
      "毎分80mで歩くときにかかる時間をx分として方程式を立てなさい。",
    variableDefinition: "毎分80mで歩くときにかかる時間（分）",
    expectedX: 15,
    canonicalEquation: "60*(x+5)=80*x",
    displayEquation: "60(x＋5)＝80x",
    solutionDisplay: "x＝15",
    keypadNumbers: ["60", "80", "5"],
    keypadSymbols: ["x", "+", "(", ")", "="],
    hintKeypadParts: [
      { display: "（x＋5）", value: "(x+5)", ariaLabel: "xたす5" }
    ],
    hint: "毎分60mで歩くときにかかる時間は、毎分80mで歩くときの時間より5分長いので「x＋5」と表せます。",
    explanation: "どちらの速さで歩いても、進む道のりは変わらないことから方程式が立てられます。"
  },
  "L1-08": {
    templateId: "L1-08-fallback",
    categoryId: "L1-08",
    categoryName: "追いつき・出会い",
    rankDifficulty: "NORMAL",
    prompt:
      "弟が分速60mで家を出発しました。その3分後に、兄が分速96mで同じ道を" +
      "追いかけました。兄が出発してから追いつくまでの時間をx分として方程式を立てなさい。",
    variableDefinition: "兄が出発してから追いつくまでの時間（分）",
    expectedX: 5,
    canonicalEquation: "60*(x+3)=96*x",
    displayEquation: "60(x＋3)＝96x",
    solutionDisplay: "x＝5",
    keypadNumbers: ["60", "3", "96"],
    keypadSymbols: ["x", "+", "(", ")", "="],
    hintKeypadParts: [
      { display: "（x＋3）", value: "(x+3)", ariaLabel: "xたす3" }
    ],
    hint: "弟が進んだ時間は、兄が出発してからの時間に3分を足した時間になります。",
    explanation: "追いついたとき、2人が進んだ道のりは等しくなります。"
  },
  "L1-09": {
    templateId: "L1-09-fallback",
    categoryId: "L1-09",
    categoryName: "割合・増減",
    rankDifficulty: "HARD",
    prompt: "ある品物を定価の20％引きで買うと2400円でした。定価をx円として方程式を立てなさい。",
    variableDefinition: "定価",
    expectedX: 3000,
    canonicalEquation: "0.8*x=2400",
    displayEquation: "0.8x＝2400",
    solutionDisplay: "x＝3000",
    keypadNumbers: ["0.8", "2400"],
    keypadSymbols: ["x", "="],
    hintKeypadParts: [],
    hint: "定価の20％引きは、定価の80÷100倍、つまり定価×0.8で表せます。",
    explanation: "割引後の値段は、定価に割引後の割合（小数）をかけた金額になります。"
  },
  "L1-10": {
    templateId: "L1-10-fallback",
    categoryId: "L1-10",
    categoryName: "2種類の品物",
    rankDifficulty: "NORMAL",
    prompt:
      "1個150円のりんごと1個80円のみかんを合わせて10個買うと、代金の合計が" +
      "1080円になりました。りんごの個数をx個として方程式を立てなさい。",
    variableDefinition: "りんごの個数",
    expectedX: 4,
    canonicalEquation: "150*x+80*(10-x)=1080",
    displayEquation: "150x＋80(10−x)＝1080",
    solutionDisplay: "x＝4",
    keypadNumbers: ["150", "80", "10", "1080"],
    keypadSymbols: ["x", "+", "-", "(", ")", "="],
    hintKeypadParts: [
      { display: "（10−x）", value: "(10-x)", ariaLabel: "10ひくx" }
    ],
    hint: "りんごがx個なら、みかんは10－x個と表せます。",
    explanation: "りんごの代金とみかんの代金の合計が、全体の代金になります。"
  },
  "L1-11": {
    templateId: "L1-11-fallback",
    categoryId: "L1-11",
    categoryName: "人数と料金",
    rankDifficulty: "NORMAL",
    prompt:
      "水族館の入館料は、大人1人1500円、子ども1人700円です。大人と子どもを合わせて" +
      "10人が入館し、入館料の合計が10200円になりました。大人の人数をx人として方程式を立てなさい。",
    variableDefinition: "大人の人数",
    expectedX: 4,
    canonicalEquation: "1500*x+700*(10-x)=10200",
    displayEquation: "1500x＋700(10−x)＝10200",
    solutionDisplay: "x＝4",
    keypadNumbers: ["1500", "700", "10", "10200"],
    keypadSymbols: ["x", "+", "-", "(", ")", "="],
    hintKeypadParts: [
      { display: "（10−x）", value: "(10-x)", ariaLabel: "10ひくx" }
    ],
    hint: "大人がx人なら、子どもは10－x人と表せます。",
    explanation: "大人の入館料と子どもの入館料の合計が、入館料の合計になります。"
  }
};

// 中2「連立方程式」のテンプレート生成に失敗し続けた場合の固定問題（フォールバック）
const SIMULTANEOUS_FALLBACK_QUESTIONS = {
  "L2-01": {
    templateId: "L2-01-fallback",
    unit: UNIT_IDS.SIMULTANEOUS,
    categoryId: "L2-01",
    categoryName: "2種類の品物",
    rankDifficulty: "NORMAL",
    prompt:
      "1個120円のパンと1個150円のパンを合わせて10個買うと、代金は1320円でした。" +
      "120円のパンをx個、150円のパンをy個として、連立方程式を立てなさい。",
    variableDefinitions: { x: "120円のパンの個数", y: "150円のパンの個数" },
    expectedSolution: { x: 6, y: 4 },
    canonicalEquations: [
      { internal: "x+y=10", display: "x＋y＝10", relationName: "個数の合計" },
      { internal: "120*x+150*y=1320", display: "120x＋150y＝1320", relationName: "代金の合計" }
    ],
    solutionDisplay: "x＝6、y＝4",
    keypadNumbers: ["120", "150", "10", "1320"],
    keypadSymbols: ["x", "y", "+", "="],
    hint: "1本目は個数の合計、2本目は代金の合計を式にしましょう。",
    hintKeypadParts: [],
    explanation: "2種類のパンの個数の合計と、代金の合計から2本の式を作ります。"
  },
  "L2-02": {
    templateId: "L2-02-fallback",
    unit: UNIT_IDS.SIMULTANEOUS,
    categoryId: "L2-02",
    categoryName: "人数と料金",
    rankDifficulty: "NORMAL",
    prompt:
      "ある水族館の入館料は、おとな2人と中学生3人で5400円、おとな1人と中学生4人で4700円です。" +
      "おとな1人の料金をx円、中学生1人の料金をy円として連立方程式を立てなさい。",
    variableDefinitions: { x: "おとな1人の料金", y: "中学生1人の料金" },
    expectedSolution: { x: 1500, y: 800 },
    canonicalEquations: [
      { internal: "2*x+3*y=5400", display: "2x＋3y＝5400", relationName: "おとな2人・中学生3人の合計" },
      { internal: "x+4*y=4700", display: "x＋4y＝4700", relationName: "おとな1人・中学生4人の合計" }
    ],
    solutionDisplay: "x＝1500、y＝800",
    keypadNumbers: ["2", "3", "5400", "4", "4700"],
    keypadSymbols: ["x", "y", "+", "="],
    hint: "2つの人数の組み合わせを、それぞれx・yを使った式にしましょう。",
    hintKeypadParts: [],
    explanation: "2通りの人数の組み合わせから、料金を表す2本の式を作ります。"
  },
  "L2-03": {
    templateId: "L2-03-fallback",
    unit: UNIT_IDS.SIMULTANEOUS,
    categoryId: "L2-03",
    categoryName: "硬貨・紙幣",
    rankDifficulty: "NORMAL",
    prompt:
      "50円硬貨と100円硬貨が合わせて24枚あり、合計金額は1800円です。" +
      "50円硬貨をx枚、100円硬貨をy枚として連立方程式を立てなさい。",
    variableDefinitions: { x: "50円硬貨の枚数", y: "100円硬貨の枚数" },
    expectedSolution: { x: 12, y: 12 },
    canonicalEquations: [
      { internal: "x+y=24", display: "x＋y＝24", relationName: "枚数の合計" },
      { internal: "50*x+100*y=1800", display: "50x＋100y＝1800", relationName: "合計金額" }
    ],
    solutionDisplay: "x＝12、y＝12",
    keypadNumbers: ["24", "50", "100", "1800"],
    keypadSymbols: ["x", "y", "+", "="],
    hint: "1本目は枚数の合計、2本目は合計金額を式にしましょう。",
    hintKeypadParts: [],
    explanation: "硬貨の枚数の合計と、合計金額から2本の式を作ります。"
  },
  "L2-04": {
    templateId: "L2-04-fallback",
    unit: UNIT_IDS.SIMULTANEOUS,
    categoryId: "L2-04",
    categoryName: "2けたの自然数",
    rankDifficulty: "HARD",
    prompt:
      "2けたの自然数があります。各位の数字の和は11で、十の位と一の位を入れ替えると、" +
      "元の数より27大きくなります。十の位の数字をx、一の位の数字をyとして連立方程式を立てなさい。",
    variableDefinitions: { x: "十の位の数字", y: "一の位の数字" },
    expectedSolution: { x: 4, y: 7 },
    canonicalEquations: [
      { internal: "x+y=11", display: "x＋y＝11", relationName: "各位の数字の和" },
      { internal: "10*y+x=10*x+y+27", display: "10y＋x＝10x＋y＋27", relationName: "入れ替えた数との関係" }
    ],
    solutionDisplay: "x＝4、y＝7",
    keypadNumbers: ["11", "10", "27"],
    keypadSymbols: ["x", "y", "+", "="],
    hint: "十の位がx、一の位がyの数は「10x＋y」、入れ替えた数は「10y＋x」と表せます。",
    hintKeypadParts: [{ display: "10x＋y", value: "10x+y", ariaLabel: "10xたすy" }],
    explanation: "各位の数字の和と、入れ替えた数と元の数の関係から2本の式を作ります。"
  },
  "L2-05": {
    templateId: "L2-05-fallback",
    unit: UNIT_IDS.SIMULTANEOUS,
    categoryId: "L2-05",
    categoryName: "年齢",
    rankDifficulty: "NORMAL",
    prompt:
      "現在、母と子の年齢の和は50歳です。5年前、母の年齢は子どもの年齢の4倍でした。" +
      "現在の母の年齢をx歳、子どもの年齢をy歳として連立方程式を立てなさい。",
    variableDefinitions: { x: "母の現在の年齢", y: "子どもの現在の年齢" },
    expectedSolution: { x: 37, y: 13 },
    canonicalEquations: [
      { internal: "x+y=50", display: "x＋y＝50", relationName: "現在の年齢の和" },
      { internal: "x-5=4*(y-5)", display: "x−5＝4(y−5)", relationName: "5年前の年齢の関係" }
    ],
    solutionDisplay: "x＝37、y＝13",
    keypadNumbers: ["50", "5", "4"],
    keypadSymbols: ["x", "y", "+", "-", "(", ")", "="],
    hint: "5年前の年齢は「x−5」「y−5」と表せます。",
    hintKeypadParts: [{ display: "（y−5）", value: "(y-5)", ariaLabel: "yひく5" }],
    explanation: "現在の年齢の和と、過去の年齢の倍率の関係から2本の式を作ります。"
  },
  "L2-06": {
    templateId: "L2-06-fallback",
    unit: UNIT_IDS.SIMULTANEOUS,
    categoryId: "L2-06",
    categoryName: "速さ・道のり",
    rankDifficulty: "NORMAL",
    prompt:
      "A地点から11km離れたB地点へ行くのに、はじめは時速10kmで走り、途中から時速4kmで" +
      "歩いたところ、2時間かかりました。走った道のりをxkm、歩いた道のりをykmとして" +
      "連立方程式を立てなさい。",
    variableDefinitions: { x: "走った道のり（km）", y: "歩いた道のり（km）" },
    expectedSolution: { x: 5, y: 6 },
    canonicalEquations: [
      { internal: "x+y=11", display: "x＋y＝11", relationName: "道のりの合計" },
      { internal: "x/10+y/4=2", display: "x÷10＋y÷4＝2", relationName: "かかった時間の合計" }
    ],
    solutionDisplay: "x＝5、y＝6",
    keypadNumbers: ["11", "10", "4", "2"],
    keypadSymbols: ["x", "y", "+", "fraction", "="],
    hint: "時速10kmでxkm進むのにかかる時間は「x÷10」と表せます。",
    hintKeypadParts: [],
    explanation: "道のりの合計と、かかった時間の合計から2本の式を作ります。"
  },
  "L2-07": {
    templateId: "L2-07-fallback",
    unit: UNIT_IDS.SIMULTANEOUS,
    categoryId: "L2-07",
    categoryName: "電車の通過",
    rankDifficulty: "HARD",
    prompt:
      "ある電車が1400mの鉄橋を渡り始めてから渡り終わるまでに90秒かかりました。また、" +
      "2000mのトンネルに入り始めてから出るまでに120秒かかりました。電車の長さをxm、" +
      "電車の速さを毎秒ymとして連立方程式を立てなさい。",
    variableDefinitions: { x: "電車の長さ（m）", y: "電車の速さ（毎秒m）" },
    expectedSolution: { x: 400, y: 20 },
    canonicalEquations: [
      { internal: "x+1400=90*y", display: "x＋1400＝90y", relationName: "鉄橋を渡る関係" },
      { internal: "x+2000=120*y", display: "x＋2000＝120y", relationName: "トンネルを通る関係" }
    ],
    solutionDisplay: "x＝400、y＝20",
    keypadNumbers: ["1400", "90", "2000", "120"],
    keypadSymbols: ["x", "y", "+", "="],
    hint: "電車が渡り始めてから渡り終わるまでに進む道のりは「電車の長さ＋鉄橋の長さ」です。",
    hintKeypadParts: [{ display: "（x＋1400）", value: "(x+1400)", ariaLabel: "xたす1400" }],
    explanation: "鉄橋・トンネルそれぞれについて、進んだ道のりと速さ×時間の関係から2本の式を作ります。"
  },
  "L2-08": {
    templateId: "L2-08-fallback",
    unit: UNIT_IDS.SIMULTANEOUS,
    categoryId: "L2-08",
    categoryName: "池の周回",
    rankDifficulty: "HARD",
    prompt:
      "1周1500mの池のまわりを、AさんとB君が同じ地点から同時に出発しました。反対方向に" +
      "走ると5分後に初めて出会い、同じ方向に走ると30分後にAさんがB君に追いつきました。" +
      "Aさんの速さを毎分xm、B君の速さを毎分ymとして連立方程式を立てなさい。",
    variableDefinitions: { x: "Aさんの速さ（毎分m）", y: "B君の速さ（毎分m）" },
    expectedSolution: { x: 175, y: 125 },
    canonicalEquations: [
      { internal: "5*x+5*y=1500", display: "5x＋5y＝1500", relationName: "反対方向に進んで出会う関係" },
      { internal: "30*x-30*y=1500", display: "30x−30y＝1500", relationName: "同じ方向に進んで追いつく関係" }
    ],
    solutionDisplay: "x＝175、y＝125",
    keypadNumbers: ["5", "1500", "30"],
    keypadSymbols: ["x", "y", "+", "-", "="],
    hint: "反対方向では2人の道のりの和が1周分、同じ方向では2人の道のりの差が1周分になります。",
    hintKeypadParts: [],
    explanation: "出会う関係と追いつく関係から、2人の速さについての2本の式を作ります。"
  },
  "L2-09": {
    templateId: "L2-09-fallback",
    unit: UNIT_IDS.SIMULTANEOUS,
    categoryId: "L2-09",
    categoryName: "食塩水の混合",
    rankDifficulty: "NORMAL",
    prompt:
      "5％の食塩水と12％の食塩水を混ぜて、8％の食塩水を350g作ります。5％の食塩水をxg、" +
      "12％の食塩水をygとして連立方程式を立てなさい。",
    variableDefinitions: { x: "5％の食塩水の重さ（g）", y: "12％の食塩水の重さ（g）" },
    expectedSolution: { x: 200, y: 150 },
    canonicalEquations: [
      { internal: "x+y=350", display: "x＋y＝350", relationName: "食塩水の重さの合計" },
      {
        internal: "0.05*x+0.12*y=0.08*350",
        display: "0.05x＋0.12y＝0.08×350",
        relationName: "食塩の重さの合計"
      }
    ],
    solutionDisplay: "x＝200、y＝150",
    keypadNumbers: ["350", "0.05", "0.12", "0.08"],
    keypadSymbols: ["x", "y", "+", "×", "="],
    hint: "含まれる食塩の重さは「濃度×食塩水の重さ」で表せます。",
    hintKeypadParts: [],
    explanation: "食塩水の重さの合計と、含まれる食塩の重さの合計から2本の式を作ります。"
  },
  "L2-10": {
    templateId: "L2-10-fallback",
    unit: UNIT_IDS.SIMULTANEOUS,
    categoryId: "L2-10",
    categoryName: "割合の増減・人数",
    rankDifficulty: "HARD",
    prompt:
      "昨年、A組とB組の生徒は合わせて60人でした。今年はA組が10％増え、B組が5％減った" +
      "結果、合わせて63人になりました。昨年のA組の人数をx人、B組の人数をy人として" +
      "連立方程式を立てなさい。",
    variableDefinitions: { x: "昨年のA組の人数", y: "昨年のB組の人数" },
    expectedSolution: { x: 40, y: 20 },
    canonicalEquations: [
      { internal: "x+y=60", display: "x＋y＝60", relationName: "昨年の人数の合計" },
      { internal: "1.1*x+0.95*y=63", display: "1.1x＋0.95y＝63", relationName: "今年の人数の合計" }
    ],
    solutionDisplay: "x＝40、y＝20",
    keypadNumbers: ["60", "1.1", "0.95", "63"],
    keypadSymbols: ["x", "y", "+", "="],
    hint: "今年のA組の人数は「1.1×x」、B組の人数は「0.95×y」と表せます。",
    hintKeypadParts: [],
    explanation: "昨年の人数の合計と、今年の人数の合計から2本の式を作ります。"
  },
  "L2-11": {
    templateId: "L2-11-fallback",
    unit: UNIT_IDS.SIMULTANEOUS,
    categoryId: "L2-11",
    categoryName: "割合の増減・代金",
    rankDifficulty: "HARD",
    prompt:
      "定価の合計が5200円のシャツとズボンを、シャツは2割引き、ズボンは3割引きで購入した" +
      "ところ、代金は3840円でした。シャツの定価をx円、ズボンの定価をy円として" +
      "連立方程式を立てなさい。",
    variableDefinitions: { x: "シャツの定価", y: "ズボンの定価" },
    expectedSolution: { x: 2000, y: 3200 },
    canonicalEquations: [
      { internal: "x+y=5200", display: "x＋y＝5200", relationName: "定価の合計" },
      { internal: "0.8*x+0.7*y=3840", display: "0.8x＋0.7y＝3840", relationName: "割引後の代金の合計" }
    ],
    solutionDisplay: "x＝2000、y＝3200",
    keypadNumbers: ["5200", "0.8", "0.7", "3840"],
    keypadSymbols: ["x", "y", "+", "="],
    hint: "割引後のシャツの代金は「0.8×x」、ズボンの代金は「0.7×y」と表せます。",
    hintKeypadParts: [],
    explanation: "定価の合計と、割引後の代金の合計から2本の式を作ります。"
  },
  "L2-12": {
    templateId: "L2-12-fallback",
    unit: UNIT_IDS.SIMULTANEOUS,
    categoryId: "L2-12",
    categoryName: "平均",
    rankDifficulty: "HARD",
    prompt:
      "男子と女子を合わせて30人のテストの平均点は72点でした。男子の平均点は68点、" +
      "女子の平均点は78点です。男子の人数をx人、女子の人数をy人として連立方程式を立てなさい。",
    variableDefinitions: { x: "男子の人数", y: "女子の人数" },
    expectedSolution: { x: 18, y: 12 },
    canonicalEquations: [
      { internal: "x+y=30", display: "x＋y＝30", relationName: "人数の合計" },
      { internal: "68*x+78*y=72*30", display: "68x＋78y＝72×30", relationName: "合計点の関係" }
    ],
    solutionDisplay: "x＝18、y＝12",
    keypadNumbers: ["30", "68", "78", "72"],
    keypadSymbols: ["x", "y", "+", "×", "="],
    hint: "全体の合計点は「72×30」、男女それぞれの合計点の和と等しくなります。",
    hintKeypadParts: [],
    explanation: "人数の合計と、合計点の関係から2本の式を作ります。"
  }
};

// 中3「2次方程式」のテンプレート生成に失敗し続けた場合の固定問題（フォールバック）
const QUADRATIC_FALLBACK_QUESTIONS = {
  "L3-01": {
    templateId: "L3-01-fallback",
    unit: UNIT_IDS.QUADRATIC,
    categoryId: "L3-01",
    categoryName: "連続する整数の積",
    rankDifficulty: "NORMAL",
    prompt: "連続する2つの正の整数の積が156です。小さい方の整数をxとして、2次方程式を立てなさい。",
    variableDefinition: "小さい方の正の整数",
    canonicalEquation: {
      internal: "x*(x+1)=156",
      display: "x(x＋1)＝156",
      relationName: "連続する2整数の積"
    },
    expectedRoots: [-13, 12],
    validXValues: [12],
    solutionDisplay: "x＝12（2つの整数は12と13）",
    keypadNumbers: ["1", "156"],
    keypadSymbols: ["x", "square", "+", "(", ")", "="],
    hint: "小さい方がxなら、大きい方はx＋1です。2つの整数の積を表しましょう。",
    hintKeypadParts: [{ display: "（x＋1）", value: "(x+1)", ariaLabel: "xたす1" }],
    explanation: "連続する2つの整数はx、x＋1と表せるので、積が156になる関係を式にします。",
    diagram: null
  },
  "L3-02": {
    templateId: "L3-02-fallback",
    unit: UNIT_IDS.QUADRATIC,
    categoryId: "L3-02",
    categoryName: "数とその平方",
    rankDifficulty: "NORMAL",
    prompt:
      "ある正の整数を2乗すると、その数の5倍に24を加えた数に等しくなりました。" +
      "この正の整数をxとして、2次方程式を立てなさい。",
    variableDefinition: "ある正の整数",
    canonicalEquation: {
      internal: "x^2=5*x+24",
      display: "x²＝5x＋24",
      relationName: "2乗と1次式の関係"
    },
    expectedRoots: [-3, 8],
    validXValues: [8],
    solutionDisplay: "x＝8",
    keypadNumbers: ["5", "24"],
    keypadSymbols: ["x", "square", "+", "-", "(", ")", "="],
    hint: "「2乗した数」はx²、「その数の5倍に24を加えた数」は右辺で表せます。",
    hintKeypadParts: [],
    explanation: "ある数の2乗と、その数を使った1次式が等しくなる関係を式にします。",
    diagram: null
  },
  "L3-03": {
    templateId: "L3-03-fallback",
    unit: UNIT_IDS.QUADRATIC,
    categoryId: "L3-03",
    categoryName: "長方形の面積",
    rankDifficulty: "NORMAL",
    prompt:
      "横の長さが縦の長さより5cm長い長方形があります。この長方形の面積が84cm²のとき、" +
      "縦の長さをxcmとして、2次方程式を立てなさい。",
    variableDefinition: "長方形の縦の長さ（cm）",
    canonicalEquation: {
      internal: "x*(x+5)=84",
      display: "x(x＋5)＝84",
      relationName: "縦×横＝面積"
    },
    expectedRoots: [-12, 7],
    validXValues: [7],
    solutionDisplay: "x＝7（縦7cm、横12cm）",
    keypadNumbers: ["5", "84"],
    keypadSymbols: ["x", "square", "+", "-", "(", ")", "="],
    hint: "横の長さは、縦の長さより5cm長いので「x＋5」と表せます。",
    hintKeypadParts: [{ display: "（x＋5）", value: "(x+5)", ariaLabel: "xたす5" }],
    explanation: "縦の長さと横の長さの積が、長方形の面積になります。",
    diagram: null
  },
  "L3-04": {
    templateId: "L3-04-fallback",
    unit: UNIT_IDS.QUADRATIC,
    categoryId: "L3-04",
    categoryName: "面積の増減",
    rankDifficulty: "NORMAL",
    prompt:
      "縦10cm、横16cmの長方形の縦・横をそれぞれxcmずつ短くしたところ、" +
      "面積が112cm²になりました。xの値を求める2次方程式を立てなさい。",
    variableDefinition: "縦・横をそれぞれ短くする長さ（cm）",
    canonicalEquation: {
      internal: "(10-x)*(16-x)=112",
      display: "(10−x)(16−x)＝112",
      relationName: "短くした後の面積"
    },
    expectedRoots: [2, 24],
    validXValues: [2],
    solutionDisplay: "x＝2",
    keypadNumbers: ["10", "16", "112"],
    keypadSymbols: ["x", "square", "+", "-", "(", ")", "="],
    hint: "短くした後の縦は「10−x」、横は「16−x」と表せます。",
    hintKeypadParts: [{ display: "（10−x）", value: "(10-x)", ariaLabel: "10ひくx" }],
    explanation: "短くした後の縦と横の積が、変化後の面積になります。",
    diagram: null
  },
  "L3-05": {
    templateId: "L3-05-fallback",
    unit: UNIT_IDS.QUADRATIC,
    categoryId: "L3-05",
    categoryName: "面積・十字路",
    rankDifficulty: "NORMAL",
    prompt:
      "縦10m、横12mの畑に、幅xmの十字型の道を、縦・横それぞれ1本ずつ作ったところ、" +
      "道を除いた部分の面積が63m²になりました。xの値を求める2次方程式を立てなさい。",
    variableDefinition: "十字型の道の幅（m）",
    canonicalEquation: {
      internal: "(10-x)*(12-x)=63",
      display: "(10−x)(12−x)＝63",
      relationName: "十字路を除いた面積"
    },
    expectedRoots: [3, 19],
    validXValues: [3],
    solutionDisplay: "x＝3",
    keypadNumbers: ["10", "12", "63"],
    keypadSymbols: ["x", "square", "+", "-", "(", ")", "="],
    hint: "2本の道の面積を、道が重なる部分だけ調整して引くと、残りの面積は「（横−x）×（縦−x）」で表せます。",
    hintKeypadParts: [{ display: "（10−x）", value: "(10-x)", ariaLabel: "10ひくx" }],
    explanation: "十字型の道を除いた部分は、道の幅の分だけ縦・横を短くした長方形の面積と等しくなります。",
    diagram: {
      type: "cross-road",
      widthValue: 12,
      heightValue: 10,
      pathWidthSymbol: "x",
      ariaLabel: "縦10メートル、横12メートルの畑に、幅xメートルの十字型の道がある図"
    }
  },
  "L3-06": {
    templateId: "L3-06-fallback",
    unit: UNIT_IDS.QUADRATIC,
    categoryId: "L3-06",
    categoryName: "箱の容積",
    rankDifficulty: "NORMAL",
    prompt:
      "1辺の長さがxcmの正方形の工作用紙の四すみから、1辺2cmの正方形を切り取り、" +
      "点線のところで折り曲げて、ふたのない箱を作ります。この箱の容積が72cm³になるとき、" +
      "2次方程式を立てなさい。",
    variableDefinition: "もとの正方形の工作用紙の1辺の長さ（cm）",
    canonicalEquation: {
      internal: "2*(x-4)^2=72",
      display: "2(x−4)²＝72",
      relationName: "箱の容積＝高さ×底面積"
    },
    expectedRoots: [-2, 10],
    validXValues: [10],
    solutionDisplay: "x＝10",
    keypadNumbers: ["2", "4", "72"],
    keypadSymbols: ["x", "square", "-", "(", ")", "="],
    hint:
      "箱の底面の1辺は、もとの1辺から2cmを2か所分引いた「x−4」cmになります。" +
      "容積は「高さ×底面の1辺×底面の1辺」で求められます。",
    hintKeypadParts: [{ display: "（x−4）", value: "(x-4)", ariaLabel: "xひく4" }],
    explanation: "箱の高さは切り取った正方形の1辺の長さと等しく、底面は正方形になります。",
    diagram: {
      type: "open-box-net",
      paperSideSymbol: "x",
      cutSideValue: 2,
      ariaLabel: "1辺xセンチメートルの正方形の工作用紙の四すみから、1辺2センチメートルの正方形を切り取り、ふたのない箱を作る図"
    }
  },
  "L3-07": {
    templateId: "L3-07-fallback",
    unit: UNIT_IDS.QUADRATIC,
    categoryId: "L3-07",
    categoryName: "動点",
    rankDifficulty: "HARD",
    prompt:
      "1辺の長さが10cmの正方形ABCDがある。点Pは頂点Aから頂点Bに向かって毎秒1cmの速さで動く。" +
      "点Qは頂点Dから頂点Aに向かって毎秒1cmの速さで動く。2点が同時に出発してからx秒後の" +
      "三角形APQの面積が12cm²になるとき、xの値を求める2次方程式を立てなさい。",
    variableDefinition: "2点が出発してからの時間（秒）",
    canonicalEquation: {
      internal: "1/2*x*(10-x)=12",
      display: "1/2 x(10−x)＝12",
      relationName: "三角形の面積（底辺×高さ÷2）"
    },
    expectedRoots: [4, 6],
    validXValues: [4, 6],
    solutionDisplay: "x＝4、6",
    keypadNumbers: ["10", "12", "1/2"],
    keypadSymbols: ["x", "square", "×", "-", "(", ")", "="],
    hint: "APの長さはx、AQの長さは「10−x」と表せます。三角形の面積は「底辺×高さ÷2」で求められます。",
    hintKeypadParts: [{ display: "（10−x）", value: "(10-x)", ariaLabel: "10ひくx" }],
    explanation: "点P・点Qそれぞれの動いた距離を使って、直角三角形APQの面積（AP×AQ÷2）を式に表します。",
    diagram: {
      type: "moving-points-rectangle",
      widthValue: 10,
      heightValue: 10,
      pointQMovesToward: "A",
      pSpeedValue: 1,
      qSpeedValue: 1,
      ariaLabel: "1辺10センチメートルの正方形ABCDで、点PはAからBへ、点QはDからAへ、それぞれ辺の上を移動する図"
    }
  },
  "L3-08": {
    templateId: "L3-08-fallback",
    unit: UNIT_IDS.QUADRATIC,
    categoryId: "L3-08",
    categoryName: "価格と売上",
    rankDifficulty: "HARD",
    prompt:
      "ある商品は、1個500円のとき1日に100個売れます。この商品を10円値上げするごとに、" +
      "1日の販売個数が2個ずつ減ることがわかっています。10円の値上げをx回行ったときの" +
      "1日の売上金額が48000円になるとき、2次方程式を立てなさい。",
    variableDefinition: "10円の値上げを行った回数",
    canonicalEquation: {
      internal: "(500+10*x)*(100-2*x)=48000",
      display: "(500＋10x)(100−2x)＝48000",
      relationName: "売上金額＝価格×販売個数"
    },
    expectedRoots: [-10, 10],
    validXValues: [10],
    solutionDisplay: "x＝10",
    keypadNumbers: ["500", "10", "100", "2", "48000"],
    keypadSymbols: ["x", "square", "+", "-", "(", ")", "="],
    hint: "x回値上げした後の価格は「500＋10x」円、販売個数は「100−2x」個と表せます。",
    hintKeypadParts: [{ display: "（100−2x）", value: "(100-2*x)", ariaLabel: "100ひく2x" }],
    explanation: "値上げ後の価格と販売個数の積が、売上金額になります。",
    diagram: null
  },
  "L3-09": {
    templateId: "L3-09-fallback",
    unit: UNIT_IDS.QUADRATIC,
    categoryId: "L3-09",
    categoryName: "利益と割引",
    rankDifficulty: "HARD",
    prompt:
      "定価2400円の洋服があります。この定価をx割値上げしたあと、そこからさらにx割値引きして" +
      "売ったところ、売り値は2184円になりました。xの値を求める2次方程式を立てなさい。",
    variableDefinition: "値上げ・値引きした割合（割）",
    canonicalEquation: {
      internal: "2400*(1+x/10)*(1-x/10)=2184",
      display: "2400(1＋x/10)(1−x/10)＝2184",
      relationName: "値上げ後に値引きした売り値"
    },
    expectedRoots: [-3, 3],
    validXValues: [3],
    solutionDisplay: "x＝3",
    keypadNumbers: ["2400", "1", "x/10", "2184"],
    keypadSymbols: ["x", "square", "+", "-", "(", ")", "="],
    hint:
      "x割は10分のxと表せます。値上げ後の価格は「定価×(1＋x/10)」、" +
      "そこからさらに値引きした価格は、その「×(1−x/10)」で求められます。",
    hintKeypadParts: [],
    explanation: "値上げ後の価格に、値引きの割合をかけると、最終的な売り値になります。",
    diagram: null
  }
};

/**
 * 配列をシャッフルした新しい配列を返す（Fisher-Yates）。
 */
export function shuffleArray(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// ============================================================
// 単元（linear／simultaneous／quadratic）による分岐
// ============================================================

const TEMPLATES_BY_UNIT = {
  [UNIT_IDS.LINEAR]: linearQuestionTemplates,
  [UNIT_IDS.SIMULTANEOUS]: simultaneousQuestionTemplates,
  [UNIT_IDS.QUADRATIC]: quadraticQuestionTemplates
};

const CATEGORIES_BY_UNIT = {
  [UNIT_IDS.LINEAR]: LINEAR_CATEGORIES,
  [UNIT_IDS.SIMULTANEOUS]: SIMULTANEOUS_CATEGORIES,
  [UNIT_IDS.QUADRATIC]: QUADRATIC_CATEGORIES
};

const FALLBACK_QUESTIONS_BY_UNIT = {
  [UNIT_IDS.LINEAR]: FALLBACK_QUESTIONS,
  [UNIT_IDS.SIMULTANEOUS]: SIMULTANEOUS_FALLBACK_QUESTIONS,
  [UNIT_IDS.QUADRATIC]: QUADRATIC_FALLBACK_QUESTIONS
};

/**
 * 単元に対応する問題テンプレート一覧を返す。
 * @param {string} unit
 */
export function getTemplatesForUnit(unit) {
  return TEMPLATES_BY_UNIT[unit] || linearQuestionTemplates;
}

/**
 * 単元に対応するカテゴリ一覧を返す。
 * @param {string} unit
 */
export function getCategoriesForUnit(unit) {
  return CATEGORIES_BY_UNIT[unit] || LINEAR_CATEGORIES;
}

function getFallbackQuestionsForUnit(unit) {
  return FALLBACK_QUESTIONS_BY_UNIT[unit] || FALLBACK_QUESTIONS;
}

/**
 * 選択されたカテゴリが有効か検証する。
 * @param {string[]} selectedCategoryIds
 * @param {string} unit
 */
export function validateSelectedCategories(selectedCategoryIds, unit = UNIT_IDS.LINEAR) {
  if (!Array.isArray(selectedCategoryIds) || selectedCategoryIds.length === 0) {
    return { valid: false, reason: "出題するカテゴリを1つ以上選んでください。" };
  }

  const validIds = new Set(getCategoriesForUnit(unit).map((category) => category.id));
  const hasInvalidId = selectedCategoryIds.some((id) => !validIds.has(id));

  if (hasInvalidId) {
    return { valid: false, reason: "不明なカテゴリが含まれています。" };
  }

  return { valid: true };
}

function createFallbackQuestion(categoryId, unit) {
  const base = getFallbackQuestionsForUnit(unit)[categoryId];
  return {
    ...base,
    id: `${base.templateId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  };
}

/**
 * canonicalEquation（中1）またはcanonicalEquationsの各internal（中2）に
 * 含まれる数値を、重複なく抽出する。keypadNumbers未設定時のフォールバックとしてのみ使用する。
 */
function extractNumbersFromEquation(question) {
  let equationStrings;
  if (Array.isArray(question.canonicalEquations)) {
    equationStrings = question.canonicalEquations.map((equation) => equation.internal);
  } else if (question.canonicalEquation && typeof question.canonicalEquation === "object") {
    equationStrings = [question.canonicalEquation.internal];
  } else {
    equationStrings = [question.canonicalEquation];
  }

  const matches = equationStrings
    .join(" ")
    .match(/\d+(?:\.\d+)?/g) ?? [];
  return [...new Set(matches)];
}

/**
 * keypadNumbersが未設定の問題データに対し、canonicalEquation(s)から
 * 数値を自動抽出して補う。正式なテンプレートでは通常発生しない。
 */
function ensureKeypadNumbers(question) {
  if (Array.isArray(question.keypadNumbers) && question.keypadNumbers.length > 0) {
    return question;
  }

  console.warn(
    `問題 ${question.id} にkeypadNumbersが設定されていません。` +
      `canonicalEquationから数値を自動抽出しました。`
  );

  return {
    ...question,
    keypadNumbers: extractNumbersFromEquation(question)
  };
}

/**
 * hintKeypadPartsが未設定の問題データを、空配列（式パーツなし）として扱う。
 * 式パーツは学習内容に関わるため、自動生成は行わない。
 */
function ensureHintKeypadParts(question) {
  if (Array.isArray(question.hintKeypadParts)) {
    return question;
  }

  console.warn(
    `問題 ${question.id} にhintKeypadPartsが設定されていません。` +
      `式パーツなしのヒントとして処理します。`
  );

  return {
    ...question,
    hintKeypadParts: []
  };
}

/**
 * テンプレートから、検証を通過した問題データを1つ生成する。
 * 最大試行回数を超えた場合は、固定問題へフォールバックする。
 * @param {object} template
 * @param {string} unit フォールバック問題の選択に使用する
 */
export function generateQuestionFromTemplate(template, unit = UNIT_IDS.LINEAR) {
  for (let attempt = 0; attempt < APP_CONFIG.maxGenerationAttempts; attempt += 1) {
    let question;
    try {
      question = template.generate();
    } catch (error) {
      continue;
    }

    question = ensureKeypadNumbers(question);
    question = ensureHintKeypadParts(question);

    const result = validateQuestion(question);
    if (result.valid) {
      return question;
    }
  }

  return createFallbackQuestion(template.categoryId, unit);
}

/**
 * 出題対象のカテゴリ数をNとすると、直近N問の中で各カテゴリが必ず1回ずつ
 * 出題されるよう、「袋の中からカテゴリを引いて、空になったら詰め直す」方式
 * （バッグ方式）でカテゴリの偏りを防ぐ。
 * recentCategoryIdsを先頭から読み直すことで、現在の袋の残りを毎回導出する
 * （呼び出し側に袋の状態を持たせる必要をなくすための、あえての設計）。
 */
function pickNextCategoryFromBag(allCategoryIds, recentCategoryIds) {
  let remaining = new Set(allCategoryIds);

  recentCategoryIds.forEach((categoryId) => {
    if (!remaining.has(categoryId)) return;
    remaining.delete(categoryId);
    if (remaining.size === 0) {
      remaining = new Set(allCategoryIds);
    }
  });

  let pool = [...remaining];
  const lastCategoryId = recentCategoryIds[recentCategoryIds.length - 1];
  if (pool.length > 1) {
    const notSameCategory = pool.filter((id) => id !== lastCategoryId);
    if (notSameCategory.length > 0) {
      pool = notSameCategory;
    }
  }

  return pool[Math.floor(Math.random() * pool.length)];
}

function pickNextTemplate(candidateTemplates, recentTemplateIds, recentCategoryIds) {
  const allCategoryIds = [...new Set(candidateTemplates.map((t) => t.categoryId))];
  const categoryId = pickNextCategoryFromBag(allCategoryIds, recentCategoryIds);

  const templatesInCategory = candidateTemplates.filter(
    (template) => template.categoryId === categoryId
  );

  const lastTemplateId = recentTemplateIds[recentTemplateIds.length - 1];
  const notSameTemplate = templatesInCategory.filter(
    (template) => template.templateId !== lastTemplateId
  );
  const pool = notSameTemplate.length > 0 ? notSameTemplate : templatesInCategory;

  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

/**
 * 選択されたカテゴリから、出題する問題のキューを作成する（トレーニングモード用）。
 * @param {string} unit
 * @param {string[]} selectedCategoryIds
 * @param {number} totalQuestions
 */
export function buildTrainingQuestionQueue(unit, selectedCategoryIds, totalQuestions) {
  const candidateTemplates = getTemplatesForUnit(unit).filter((template) =>
    selectedCategoryIds.includes(template.categoryId)
  );

  if (candidateTemplates.length === 0) {
    throw new Error("選択されたカテゴリに問題テンプレートがありません。");
  }

  const queue = [];
  const recentTemplateIds = [];
  const recentCategoryIds = [];

  for (let i = 0; i < totalQuestions; i += 1) {
    const template = pickNextTemplate(
      candidateTemplates,
      recentTemplateIds,
      recentCategoryIds
    );

    const question = generateQuestionFromTemplate(template, unit);
    queue.push(question);

    recentTemplateIds.push(template.templateId);
    recentCategoryIds.push(template.categoryId);
  }

  return queue;
}

/**
 * キューから指定した番号の問題を取得する。
 */
export function getNextQuestion(queue, index) {
  if (!Array.isArray(queue) || index < 0 || index >= queue.length) {
    return null;
  }
  return queue[index];
}

/**
 * 指定した単元・難易度（NORMAL・HARD）のカテゴリだけからテンプレート候補を絞り込む。
 */
/**
 * 段位認定モードの出題テンプレートを、難易度から絞り込む。
 * NORMALは、そのカテゴリ難易度がNORMALのカテゴリのみを対象にする。
 * HARDは、NORMAL・HARD両方の全カテゴリを対象にする（HARD専用カテゴリだけでは
 * 出題の幅が狭いため、NORMAL問題も含めて全カテゴリから出題する）。
 */
function getTemplatesByDifficulty(unit, difficulty) {
  if (difficulty === "HARD") {
    return getTemplatesForUnit(unit);
  }

  const categoryIds = new Set(
    getCategoriesForUnit(unit)
      .filter((c) => c.difficulty === difficulty)
      .map((c) => c.id)
  );
  return getTemplatesForUnit(unit).filter((template) =>
    categoryIds.has(template.categoryId)
  );
}

/**
 * 段位認定モード用に、単元・難易度に応じた問題を1問生成する。
 * 問題数の上限を設けない終了条件（120秒経過）のため、キューを事前構築せず
 * 1問ずつ呼び出す設計にしている。
 * @param {string} unit
 * @param {"NORMAL"|"HARD"} difficulty
 * @param {string[]} recentTemplateIds 直近に出題したtemplateIdの履歴
 * @param {string[]} recentCategoryIds 直近に出題したcategoryIdの履歴
 * @returns {{question: object, template: object}}
 */
export function getNextRankQuestion(unit, difficulty, recentTemplateIds, recentCategoryIds) {
  const candidateTemplates = getTemplatesByDifficulty(unit, difficulty);

  if (candidateTemplates.length === 0) {
    throw new Error(`難易度「${difficulty}」に対応する問題テンプレートがありません。`);
  }

  const template = pickNextTemplate(
    candidateTemplates,
    recentTemplateIds,
    recentCategoryIds
  );
  const question = generateQuestionFromTemplate(template, unit);

  return { question, template };
}
