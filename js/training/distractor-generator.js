// トレーニング「おてがる」（4択）の誤答候補を生成するモジュール
//
// 模範式（canonicalEquation(s)）を既存のトークナイザー・パーサーでAST（構文木）へ変換し、
// 「どのノードの、どの記号・数値を変えたか」が明確な1か所（または1組）の変形だけを加えて、
// 文章題が苦手な中学生が実際に作りそうな「ありがちな立式ミス」の式を作る。
// 文字列の単純置換は使わない（分数・負数・かっこ・x²を壊さないため）。
//
// ここでは候補を「多めに」作るだけで、本当に不正解か・表示できるかの検証は
// distractor-validator.js、3つの選び方はeasy-choice-builder.jsが担当する。

import { UNIT_IDS } from "../config.js";
import { tokenize } from "../equation/tokenizer.js";
import { parseExpression, NodeType } from "../equation/parser.js";
import { splitAtEquals } from "../equation/equation-validator.js";

// ============================================================
// 誤答パターンの種類
// group：3つの誤答を選ぶときに「同じ系統のミスばかりにならない」よう分散させる単位
// tier ：1＝自動生成の高品質候補、2＝テンプレート固有の候補、3＝その他の安全な共通変形
// ============================================================

export const DISTRACTOR_TYPES = {
  "sign-flip": { group: "sign", tier: 1, label: "＋と－の取り違え" },
  "paren-sign": { group: "sign", tier: 1, label: "かっこ内の＋と－の取り違え" },
  "both-direction": { group: "direction", tier: 1, label: "増減の向きの取り違え" },
  "reverse-subtraction": { group: "direction", tier: 1, label: "ひく順番の取り違え" },
  "plus-times": { group: "structure", tier: 1, label: "「より○大きい」と「○倍」の取り違え" },
  "quantity-swap": { group: "swap", tier: 1, label: "数量（係数）の対応の取り違え" },
  "denominator-swap": { group: "swap", tier: 1, label: "分母の取り違え" },
  "number-swap": { group: "swap", tier: 1, label: "数字の対応の取り違え" },
  "cross-swap": { group: "swap", tier: 1, label: "2つの式の数字の取り違え" },
  "variable-swap": { group: "swap", tier: 1, label: "xとyの取り違え" },
  "number-confuse": { group: "number", tier: 1, label: "割合の増減の取り違え" },
  transpose: { group: "structure", tier: 1, label: "移項の符号ミス" },
  "paren-drop": { group: "structure", tier: 1, label: "かっこのつけ忘れ（分配忘れ）" },
  "inverse-relation": { group: "structure", tier: 1, label: "もとにする量の取り違え" },
  "factor-drop": { group: "number", tier: 1, label: "係数のかけ忘れ（½・高さ・定価など）" },
  "rate-drop": { group: "number", tier: 1, label: "割合のかけ忘れ" },
  template: { group: "template", tier: 2, label: "テンプレート固有の誤答" },
  "coefficient-drop": { group: "number", tier: 3, label: "係数のかけ忘れ" },
  "term-drop": { group: "structure", tier: 4, label: "定数の足し忘れ" },
  "paren-add": { group: "structure", tier: 3, label: "かっこの範囲の取り違え" },
  "denominator-drop": { group: "number", tier: 3, label: "割り忘れ" }
};

// 数字を入れ替えるとき、桁が大きく違う数どうし（例：個数10と代金1080）を入れ替えた
// 「誰も選ばない変な式」を作らないための上限（大きいほう÷小さいほう）
const MAX_SWAP_RATIO = 10;

// 役割の違う数どうし（係数と定数、かっこの外と中の定数）を入れ替えるときは、
// 近い大きさの数（例：「4倍より5大きい」の4と5、年齢41と19）に限る
const MAX_CROSS_ROLE_SWAP_RATIO = 3;

// 辺の最上位の定数どうし（100x＋50＝450 の50と450など）の入れ替えは、
// 「送料と合計金額」のような意味の違う数を入れ替えないよう、さらに近い大きさに限る
const MAX_TOP_TERM_SWAP_RATIO = 5;

const EPSILON = 1e-9;

// ============================================================
// AST（構文木）の読み書き
// ============================================================

/**
 * 方程式の文字列を、左辺・右辺のASTへ変換する。解析できない場合はnullを返す。
 * @param {string} equationString
 * @returns {{left: object, right: object}|null}
 */
export function parseEquationAst(equationString) {
  try {
    const tokens = tokenize(equationString);
    const split = splitAtEquals(tokens);
    if (split.error) return null;
    return {
      left: parseExpression(split.leftTokens),
      right: parseExpression(split.rightTokens)
    };
  } catch (error) {
    return null;
  }
}

function precedenceOf(node) {
  if (node.type === NodeType.BINARY_OP) {
    return node.operator === "+" || node.operator === "-" ? 1 : 2;
  }
  if (node.type === NodeType.UNARY_MINUS) return 3;
  return 4;
}

function formatNumber(value) {
  return String(value);
}

function printBare(node) {
  switch (node.type) {
    case NodeType.NUMBER:
      return formatNumber(node.value);
    case NodeType.VARIABLE:
      return node.name;
    case NodeType.POWER:
      if (node.base.type === NodeType.VARIABLE) {
        return `${node.base.name}^2`;
      }
      return `(${printBare(node.base)})^2`;
    case NodeType.UNARY_MINUS: {
      const operand = node.operand;
      const needsParens =
        !operand.parenthesized && operand.type === NodeType.BINARY_OP;
      return needsParens ? `-(${printBare(operand)})` : `-${printNode(operand)}`;
    }
    case NodeType.BINARY_OP: {
      // x×x（かっこの分配忘れなどで生まれる形）は、画面で「xx」と見えないようx²として書く
      if (
        node.operator === "*" &&
        node.left.type === NodeType.VARIABLE &&
        node.right.type === NodeType.VARIABLE &&
        node.left.name === "x" &&
        node.right.name === "x" &&
        !node.left.parenthesized &&
        !node.right.parenthesized
      ) {
        return "x^2";
      }
      const left = printChild(node.left, node.operator, "left");
      const right = printChild(node.right, node.operator, "right");
      return `${left}${node.operator}${right}`;
    }
    default:
      return "";
  }
}

function printNode(node) {
  const text = printBare(node);
  return node.parenthesized ? `(${text})` : text;
}

function printChild(child, parentOperator, side) {
  if (child.parenthesized) return printNode(child);

  const parentPrecedence = parentOperator === "+" || parentOperator === "-" ? 1 : 2;
  const childPrecedence = precedenceOf(child);
  let needsParens =
    childPrecedence < parentPrecedence ||
    (side === "right" &&
      childPrecedence === parentPrecedence &&
      (parentOperator === "-" || parentOperator === "/"));

  if (child.type === NodeType.UNARY_MINUS && (side === "right" || parentPrecedence === 2)) {
    needsParens = true;
  }

  const text = printBare(child);
  return needsParens ? `(${text})` : text;
}

/**
 * 左辺・右辺のASTを、内部表記の方程式文字列（例："150*x+80*(10-x)=1080"）へ戻す。
 * 元の式にあったかっこ（parenthesized）は、そのまま保つ。
 */
export function printEquationAst(equation) {
  return `${printNode(equation.left)}=${printNode(equation.right)}`;
}

// ============================================================
// ASTの走査・部分置換（元のASTは書き換えず、必要な部分だけを複製する）
// ============================================================

function childKeysOf(node) {
  if (node.type === NodeType.BINARY_OP) return ["left", "right"];
  if (node.type === NodeType.UNARY_MINUS) return ["operand"];
  if (node.type === NodeType.POWER) return ["base"];
  return [];
}

/**
 * 方程式の全ノードを、根からの経路（path）・親・祖先つきで列挙する。
 * pathの先頭は"left"または"right"（どちらの辺か）。
 */
function collectEntries(equation) {
  const entries = [];

  function visit(node, path, parent, parentKey, ancestors) {
    entries.push({ node, path, parent, parentKey, ancestors });
    childKeysOf(node).forEach((key) => {
      visit(node[key], [...path, key], node, key, [...ancestors, node]);
    });
  }

  visit(equation.left, ["left"], null, null, []);
  visit(equation.right, ["right"], null, null, []);
  return entries;
}

function replaceAtPath(equation, path, replacement) {
  const result = { left: equation.left, right: equation.right };

  function rebuild(node, depth) {
    if (depth === path.length) return replacement;
    const key = path[depth];
    return { ...node, [key]: rebuild(node[key], depth + 1) };
  }

  const side = path[0];
  result[side] = rebuild(equation[side], 1);
  return result;
}

/**
 * 複数か所を同時に置き換える（例：両方のかっこの符号をまとめて変える）。
 */
function replaceAtPaths(equation, replacements) {
  return replacements.reduce(
    (current, { path, node }) => replaceAtPath(current, path, node),
    equation
  );
}

function isNumber(node) {
  return node && node.type === NodeType.NUMBER;
}

function isAdditive(node) {
  return node.type === NodeType.BINARY_OP && (node.operator === "+" || node.operator === "-");
}

/**
 * 「1/2」のように数値どうしの割り算（＝分数の定数）かどうか。
 * 分数の定数は1つの数として扱い、分子・分母を入れ替えたり変えたりしない。
 */
function isNumericFraction(node) {
  return (
    node &&
    node.type === NodeType.BINARY_OP &&
    node.operator === "/" &&
    isNumber(node.left) &&
    isNumber(node.right)
  );
}

function containsVariable(node) {
  if (node.type === NodeType.VARIABLE) return true;
  if (node.type === NodeType.POWER) return true;
  return childKeysOf(node).some((key) => containsVariable(node[key]));
}

function containsVariableName(node, name) {
  if (node.type === NodeType.VARIABLE) return node.name === name;
  if (node.type === NodeType.POWER) return containsVariableName(node.base, name);
  return childKeysOf(node).some((key) => containsVariableName(node[key], name));
}

/**
 * かっこの中・かけ算の中（＝数量を表す式パーツの内側）にあるかどうか。
 */
function isInsideFactor(entry) {
  if (entry.node.parenthesized) return true;
  return entry.ancestors.some(
    (ancestor) =>
      ancestor.parenthesized ||
      ancestor.type === NodeType.POWER ||
      (ancestor.type === NodeType.BINARY_OP &&
        (ancestor.operator === "*" || ancestor.operator === "/"))
  );
}

/**
 * 数値ノードの役割を分類する（同じ役割の数どうしだけを入れ替えるため）。
 * - "coef"：かけ算の係数（150x の150、0.15×260 の0.15など）
 * - "denom"：分母（x/8 の8）
 * - "term-top"：辺の最上位で足し引きされる定数（＝1080、＋150など）
 * - "term-nested"：かっこの中で足し引きされる定数（(10－x)の10など）
 * 分数の定数（1/2）の一部はnull（入れ替え・変更の対象外）。
 */
function classifyNumberRole(entry) {
  const { parent, parentKey } = entry;
  if (parent && isNumericFraction(parent)) return null;
  if (parent && parent.type === NodeType.BINARY_OP && parent.operator === "/") {
    return parentKey === "right" ? "denom" : null;
  }
  if (parent && parent.type === NodeType.BINARY_OP && parent.operator === "*") {
    // かっこの中の係数（(3x)の3、(64－3x)の3）は、辺の最上位の係数（4x＋5の4）と区別する
    const outerAncestors = entry.ancestors.slice(0, -1);
    const isNested =
      parent.parenthesized ||
      outerAncestors.some(
        (ancestor) => ancestor.parenthesized || !isAdditive(ancestor)
      );
    return isNested ? "coef-nested" : "coef";
  }
  return isInsideFactor(entry) ? "term-nested" : "term-top";
}

function swapRatioAcceptable(a, b, maxRatio = MAX_SWAP_RATIO) {
  const small = Math.min(Math.abs(a), Math.abs(b));
  const large = Math.max(Math.abs(a), Math.abs(b));
  if (small < EPSILON) return false;
  return large / small <= maxRatio;
}

/**
 * 「5」や「12x」のように、数や「数×文字」1つだけの項かどうか
 * （x²＝4x＋5 の4x、150x＋150 の150 など）。連立方程式では使わない
 * （「120x＋200y」→「120x－200y」のような不自然な候補を作らないため）。
 */
function isSimpleTerm(node, context) {
  if (node.parenthesized) return false;
  if (node.type === NodeType.NUMBER) return true;
  if (context.unit === UNIT_IDS.SIMULTANEOUS) return false;
  return (
    node.type === NodeType.BINARY_OP &&
    node.operator === "*" &&
    isNumber(node.left) &&
    node.right.type === NodeType.VARIABLE &&
    !node.right.parenthesized
  );
}

/**
 * 役割の違う数どうしの入れ替えを認める組み合わせ（連立方程式では使わない）。
 * - 係数⇔辺の最上位の定数（x²＝4x＋5 → x²＝5x＋4、100x＋50 → 50x＋100）
 * - 1次方程式の、かっこの外の定数⇔かっこの中の定数（41＋x＝2(19＋x) → 19＋x＝2(41＋x)）
 */
function isCrossRoleSwapAllowed(roleA, roleB, context) {
  if (context.unit === UNIT_IDS.SIMULTANEOUS) return false;
  const pair = [roleA, roleB].sort().join("+");
  if (pair === "coef+term-top") return true;
  return context.unit === UNIT_IDS.LINEAR && pair === "term-nested+term-top";
}

function flipOperator(node) {
  return { ...node, operator: node.operator === "+" ? "-" : "+" };
}

// ============================================================
// 1本の方程式に対する変形
// それぞれ [{equation: AST, type: 誤答パターン}] を返す。
// ============================================================

/**
 * ①③⑤⑧ ＋と－の取り違え（かっこの中なら"paren-sign"）。
 */
function mutateSigns(equation, entries, context) {
  const results = [];
  entries.forEach((entry) => {
    const { node } = entry;
    if (!isAdditive(node)) return;

    if (isInsideFactor(entry)) {
      results.push({
        equation: replaceAtPath(equation, entry.path, flipOperator(node)),
        type: "paren-sign"
      });
      return;
    }

    // 辺の最上位では、次の場合だけ変える（「120x＋200y」→「120x－200y」や
    // 「10y＋x」→「10y－x」のような不自然な候補を作らない）。
    // - 「＋5」「＋12x」のように数や「数×文字」を足し引きしている
    // - 「x＋y」「41＋x」のように、文字や数どうしを足し引きしている
    // - 「5x＋5y」「30x－30y」のように、同じ係数の文字どうし（出会い・追いつきの速さの和・差）
    const right = node.right;
    const left = node.left;
    const isBareAtom = (operand) =>
      !operand.parenthesized &&
      (operand.type === NodeType.VARIABLE ||
        operand.type === NodeType.POWER ||
        operand.type === NodeType.NUMBER);
    const isCoefficientTimesVariable = (operand) =>
      !operand.parenthesized &&
      operand.type === NodeType.BINARY_OP &&
      operand.operator === "*" &&
      isNumber(operand.left) &&
      operand.right.type === NodeType.VARIABLE;
    const isSameCoefficientPair =
      isCoefficientTimesVariable(left) &&
      isCoefficientTimesVariable(right) &&
      Math.abs(left.left.value - right.left.value) < EPSILON;
    if (
      isSimpleTerm(right, context) ||
      (isBareAtom(right) && right.type !== NodeType.NUMBER && isBareAtom(left)) ||
      isSameCoefficientPair
    ) {
      results.push({
        equation: replaceAtPath(equation, entry.path, flipOperator(node)),
        type: "sign-flip"
      });
    }
  });
  return results;
}

/**
 * 面積の増減方向など：かっこでくくられた数量（10－x など）が2つ以上あるとき、
 * すべての増減の向きをまとめて逆にする（(10－x)(16－x) → (10＋x)(16＋x)）。
 */
function mutateBothDirections(equation, entries) {
  const groupRoots = entries.filter(
    (entry) =>
      isAdditive(entry.node) &&
      (entry.node.parenthesized ||
        (entry.parent && entry.parent.type === NodeType.POWER)) &&
      (isNumber(entry.node.left) || isNumber(entry.node.right))
  );
  if (groupRoots.length < 2) return [];

  return [
    {
      equation: replaceAtPaths(
        equation,
        groupRoots.map((entry) => ({ path: entry.path, node: flipOperator(entry.node) }))
      ),
      type: "both-direction"
    }
  ];
}

function countNumbers(node) {
  if (isNumber(node)) return 1;
  return childKeysOf(node).reduce((sum, key) => sum + countNumbers(node[key]), 0);
}

/**
 * かっこの中の数が、そのかっこ（いちばん内側のかっこ）の中で唯一の数かどうか。
 */
function isSoleNumberInGroup(entry) {
  const group = [...entry.ancestors].reverse().find((ancestor) => ancestor.parenthesized);
  return !group || countNumbers(group) === 1;
}

const SWAP_TYPE_BY_ROLE = {
  coef: "quantity-swap",
  "coef-nested": "quantity-swap",
  denom: "denominator-swap",
  "term-top": "number-swap",
  "term-nested": "number-swap"
};

/**
 * ②④⑦ 同じ役割の2つの数を入れ替える
 * （150x＋80(10－x) → 80x＋150(10－x)、x/8＋y/6 → x/6＋y/8 など）。
 */
function mutateNumberSwaps(equation, entries, context) {
  // 「＝630」のように、辺全体が数1つ（合計の金額など）の場合は、その数を入れ替えない
  // （「80x＋630＝150」のように、合計と送料を入れ替えた不自然な式を作らないため）
  const numberEntries = entries
    .filter((entry) => isNumber(entry.node) && entry.parent !== null)
    .map((entry) => ({ entry, role: classifyNumberRole(entry) }))
    .filter((item) => item.role !== null);

  const results = [];
  for (let i = 0; i < numberEntries.length; i += 1) {
    for (let j = i + 1; j < numberEntries.length; j += 1) {
      const a = numberEntries[i];
      const b = numberEntries[j];
      const sameRole = a.role === b.role;
      if (!sameRole && !isCrossRoleSwapAllowed(a.role, b.role, context)) continue;
      const valueA = a.entry.node.value;
      const valueB = b.entry.node.value;
      if (Math.abs(valueA - valueB) < EPSILON) continue;
      let maxRatio = sameRole ? MAX_SWAP_RATIO : MAX_CROSS_ROLE_SWAP_RATIO;
      if (sameRole && a.role === "term-top") maxRatio = MAX_TOP_TERM_SWAP_RATIO;
      if (!swapRatioAcceptable(valueA, valueB, maxRatio)) continue;
      // 整数と小数（個数と割合など）は、意味の違う数なので入れ替えない
      if (Number.isInteger(valueA) !== Number.isInteger(valueB)) continue;
      // かっこの中の定数は、そのかっこの中の唯一の数どうしだけを入れ替える
      // （(10－x)(7＋x) → (7－x)(10＋x) は作るが、(x－4)(x＋5－4) → (x－5)(x＋4－4) は作らない）
      if (
        (a.role === "term-nested" && !isSoleNumberInGroup(a.entry)) ||
        (b.role === "term-nested" && !isSoleNumberInGroup(b.entry))
      ) {
        continue;
      }

      results.push({
        equation: replaceAtPaths(equation, [
          { path: a.entry.path, node: { ...a.entry.node, value: valueB } },
          { path: b.entry.path, node: { ...b.entry.node, value: valueA } }
        ]),
        type: sameRole ? SWAP_TYPE_BY_ROLE[a.role] : "number-swap"
      });
    }
  }
  return results;
}

function swapVariableNames(node) {
  if (node.type === NodeType.VARIABLE) {
    return { ...node, name: node.name === "x" ? "y" : "x" };
  }
  const copy = { ...node };
  childKeysOf(node).forEach((key) => {
    copy[key] = swapVariableNames(node[key]);
  });
  return copy;
}

/**
 * 連立方程式：1本の式の中でxとyを取り違える（x＝y＋2 → y＝x＋2 など）。
 */
function mutateVariableSwap(equation) {
  const hasX =
    containsVariableName(equation.left, "x") || containsVariableName(equation.right, "x");
  const hasY =
    containsVariableName(equation.left, "y") || containsVariableName(equation.right, "y");
  if (!hasX || !hasY) return [];
  return [
    {
      equation: { left: swapVariableNames(equation.left), right: swapVariableNames(equation.right) },
      type: "variable-swap"
    }
  ];
}

/**
 * 移項の符号ミス：辺の最上位で足し引きしている定数を、符号を変えずに反対の辺へ移す
 * （150x＋150＝1800 → 150x＝1800＋150、10y＋x＝10x＋y＋27 → 10y＋x＋27＝10x＋y）。
 */
function mutateTranspose(equation, context) {
  const results = [];
  ["left", "right"].forEach((side) => {
    const otherSide = side === "left" ? "right" : "left";
    const root = equation[side];
    if (root.parenthesized || !isAdditive(root) || !isSimpleTerm(root.right, context)) return;

    const moved = {
      type: NodeType.BINARY_OP,
      operator: root.operator,
      left: equation[otherSide],
      right: root.right
    };
    results.push({
      equation: { [side]: root.left, [otherSide]: moved },
      type: "transpose"
    });
  });
  return results;
}

/**
 * 定数の足し忘れ：辺の最上位で足し引きしている定数をなくす
 * （100x＋50＝450 → 100x＝450：送料などの固定の金額を忘れる）。
 */
function mutateTermDrop(equation) {
  const results = [];
  ["left", "right"].forEach((side) => {
    const root = equation[side];
    if (root.parenthesized || !isAdditive(root) || !isNumber(root.right)) return;
    if (!containsVariable(root.left)) return;
    results.push({
      equation: { ...equation, [side]: unparenthesize(root.left) },
      type: "term-drop"
    });
  });
  return results;
}

/**
 * かっこの範囲の取り違え：ax＋b を a(x＋b) にする（x²＝4x＋5 → x²＝4(x＋5)）。
 */
function mutateParenAdd(equation, context) {
  if (context.unit === UNIT_IDS.SIMULTANEOUS) return [];
  const results = [];
  ["left", "right"].forEach((side) => {
    const root = equation[side];
    if (root.parenthesized || !isAdditive(root) || !isNumber(root.right)) return;
    const product = root.left;
    if (!isSimpleTerm(product, context) || isNumber(product)) return;

    results.push({
      equation: {
        ...equation,
        [side]: {
          type: NodeType.BINARY_OP,
          operator: "*",
          left: product.left,
          right: {
            type: NodeType.BINARY_OP,
            operator: root.operator,
            left: product.right,
            right: root.right,
            parenthesized: true
          }
        }
      },
      type: "paren-add"
    });
  });
  return results;
}

/**
 * ひく順番の取り違え：かっこの中の (a－b) を (b－a) にする
 * （x(x－3) → x(3－x)、x(12－x) → x(x－12)、(10－x) → (x－10)）。
 */
function mutateReverseSubtraction(equation, entries) {
  const results = [];
  entries.forEach((entry) => {
    const { node } = entry;
    if (node.type !== NodeType.BINARY_OP || node.operator !== "-") return;
    const isGroupRoot =
      node.parenthesized || (entry.parent && entry.parent.type === NodeType.POWER);
    if (!isGroupRoot) return;
    const operands = [node.left, node.right];
    const hasNumber = operands.some(isNumber);
    // 「x」や「2x」のように、文字1つ（または数×文字）の項
    const hasVariable = operands.some(
      (operand) =>
        !operand.parenthesized &&
        (operand.type === NodeType.VARIABLE ||
          (operand.type === NodeType.BINARY_OP &&
            operand.operator === "*" &&
            isNumber(operand.left) &&
            operand.right.type === NodeType.VARIABLE))
    );
    if (!hasNumber || !hasVariable) return;

    results.push({
      equation: replaceAtPath(equation, entry.path, {
        ...node,
        left: node.right,
        right: node.left
      }),
      type: "reverse-subtraction"
    });
  });
  return results;
}

/**
 * 「より○大きい」と「○倍」の取り違え：(x＋4) を (4x) に、(2x) を (x＋2) にする
 * （縦より4cm長い → x(4x)、x＋(x＋2) → x＋2x）。
 * かっこの式が「文字×かっこ」または足し算の項として使われている場合だけ変える
 * （2(x＋12) や 126(x＋9) のように数をかけている場合は変えない）。
 */
function mutatePlusTimes(equation, entries) {
  const results = [];
  entries.forEach((entry) => {
    const { node, parent } = entry;
    if (!node.parenthesized || !parent) return;

    const parentIsAdditive = isAdditive(parent);
    // 相手が「x」や「½x」のように文字を含む単項のときだけ（(x＋6)(x＋4) などは変えない）
    const parentIsVariableProduct =
      parent.type === NodeType.BINARY_OP &&
      parent.operator === "*" &&
      [parent.left, parent.right].some(
        (operand) =>
          operand !== node &&
          !operand.parenthesized &&
          (operand.type === NodeType.VARIABLE ||
            (operand.type === NodeType.BINARY_OP &&
              operand.operator === "*" &&
              containsVariable(operand)))
      );
    if (!parentIsAdditive && !parentIsVariableProduct) return;

    let replacement = null;
    if (
      node.type === NodeType.BINARY_OP &&
      node.operator === "+" &&
      node.left.type === NodeType.VARIABLE &&
      isNumber(node.right) &&
      node.right.value !== 1
    ) {
      replacement = {
        type: NodeType.BINARY_OP,
        operator: "*",
        left: node.right,
        right: node.left
      };
    } else if (
      node.type === NodeType.BINARY_OP &&
      node.operator === "*" &&
      isNumber(node.left) &&
      node.right.type === NodeType.VARIABLE
    ) {
      replacement = {
        type: NodeType.BINARY_OP,
        operator: "+",
        left: node.right,
        right: node.left
      };
    }
    if (!replacement) return;

    // 「x(4x)」のようにかけ算の中ではかっこを残し、「x＋2x」のように足し算の項では外す
    if (parentIsVariableProduct || replacement.operator === "+") {
      replacement.parenthesized = true;
    }
    results.push({ equation: replaceAtPath(equation, entry.path, replacement), type: "plus-times" });
  });
  return results;
}

function unparenthesize(node) {
  if (!node.parenthesized) return node;
  const copy = { ...node };
  delete copy.parenthesized;
  return copy;
}

/**
 * ⑤ かっこのつけ忘れ（分配忘れ）：a(b±c) を ab±c にする
 * （2(x＋12) → 2x＋12、80(10－x) → 80×10－x、x(x＋1) → x²＋1）。
 * かけ算のかたまりが、さらに別のかけ算の中にある場合（3(x－6)(x＋2)など）は変形しない。
 */
function mutateParenDrop(equation, entries) {
  const results = [];
  entries.forEach((entry) => {
    const { node, parent } = entry;
    if (node.type !== NodeType.BINARY_OP || node.operator !== "*") return;
    if (
      parent &&
      (parent.type === NodeType.POWER ||
        (parent.type === NodeType.BINARY_OP && (parent.operator === "*" || parent.operator === "/")))
    ) {
      return;
    }

    const multiplier = node.left;
    const group = node.right;
    const multiplierIsSimple =
      !multiplier.parenthesized &&
      (multiplier.type === NodeType.NUMBER || multiplier.type === NodeType.VARIABLE);
    if (!multiplierIsSimple || !group.parenthesized || !isAdditive(group)) return;

    const distributedFirst = {
      type: NodeType.BINARY_OP,
      operator: "*",
      left: multiplier,
      right: group.left.parenthesized ? group.left : unparenthesize(group.left)
    };
    const dropped = {
      type: NodeType.BINARY_OP,
      operator: group.operator,
      left: distributedFirst,
      right: group.right
    };
    if (node.parenthesized) dropped.parenthesized = true;

    results.push({ equation: replaceAtPath(equation, entry.path, dropped), type: "paren-drop" });
  });
  return results;
}

/**
 * 係数のかけ忘れ：数×（文字を含む式）の数をなくす
 * （0.07x＋0.2y＝0.15×260 → 0.07x＋0.2y＝260、½x(9－x)＝10 → x(9－x)＝10）。
 */
function mutateCoefficientDrop(equation, entries, context) {
  const results = [];
  entries.forEach((entry) => {
    const { node } = entry;
    if (node.type !== NodeType.BINARY_OP || node.operator !== "*") return;

    [
      ["left", "right"],
      ["right", "left"]
    ].forEach(([coefficientKey, remainingKey]) => {
      const coefficient = node[coefficientKey];
      const remaining = node[remainingKey];
      const coefficientIsNumeric =
        (isNumber(coefficient) && Math.abs(coefficient.value - 1) > EPSILON) ||
        isNumericFraction(coefficient);
      if (!coefficientIsNumeric || coefficient.parenthesized) return;

      // 数×数（0.15×260）は、全体量だけを残す（260＝食塩水全体の重さ、のように
      // 「割合をかけ忘れた」形）。文字を含む場合は、その式パーツを残す。
      if (!containsVariable(remaining) && !isNumber(remaining)) return;
      if (isNumber(remaining) && !(isNumber(coefficient) && !Number.isInteger(coefficient.value))) {
        return;
      }
      // ½x(3x) → ½x·x のように、文字どうしが並んで「xx」と見える形は作らない
      const parent = entry.parent;
      if (
        remaining.type === NodeType.VARIABLE &&
        parent &&
        parent.type === NodeType.BINARY_OP &&
        parent.operator === "*"
      ) {
        const sibling = parent.left === node ? parent.right : parent.left;
        if (!sibling.parenthesized && containsVariable(sibling)) return;
      }

      let replacement = unparenthesize(remaining);
      const isSingleAtom =
        replacement.type === NodeType.NUMBER || replacement.type === NodeType.VARIABLE;
      if (node.parenthesized && !isSingleAtom) {
        replacement = { ...replacement, parenthesized: true };
      }

      // 種類の見分け：
      // - 割合×全体量（0.15×260）の割合を忘れる → "rate-drop"（食塩の重さ＝食塩水の重さ、の誤り）
      // - 2次方程式で、½・高さ・定価のような「式全体にかかる数」を忘れる → "factor-drop"
      // - それ以外（150x の150 を忘れるなど） → "coefficient-drop"（優先度は低い）
      let type = "coefficient-drop";
      if (isNumber(remaining)) {
        type = "rate-drop";
      } else if (context.unit === UNIT_IDS.QUADRATIC && !isInsideFactor(entry)) {
        type = "factor-drop";
      }
      results.push({
        equation: replaceAtPath(equation, entry.path, replacement),
        type
      });
    });
  });
  return results;
}

/**
 * 割り忘れ：x/10 のような「文字を含む式÷数」の割り算をなくす（4500(1＋x/10) → 4500(1＋x)）。
 * 同じ割り算（x/10）が複数あるときは、片方だけでなくすべてまとめてなくす
 * （「x割」をxのまま使う、という1つのミスとして表すため）。
 */
function mutateDenominatorDrop(equation, entries) {
  const divisions = entries.filter(
    ({ node }) =>
      node.type === NodeType.BINARY_OP &&
      node.operator === "/" &&
      isNumber(node.right) &&
      containsVariable(node.left)
  );

  const byText = new Map();
  divisions.forEach((entry) => {
    const key = printNode(unparenthesize(entry.node));
    if (!byText.has(key)) byText.set(key, []);
    byText.get(key).push(entry);
  });

  return [...byText.values()].map((group) => ({
    equation: replaceAtPaths(
      equation,
      group.map((entry) => ({ path: entry.path, node: unparenthesize(entry.node.left) }))
    ),
    type: "denominator-drop"
  }));
}

/**
 * ⑥ 割合の増減を逆にする：問題内に存在する別の小数（割合）と取り違える
 * （1.2x → 0.2x、0.6x → 0.4x、1.15x → 0.15x、0.95y → 0.05y など）。
 * 「足して1になる組」か「差が1の組」だけを使い、無関係な小数へは変えない。
 */
function mutateNumberConfuse(equation, entries, context) {
  const decimals = context.decimalPool;
  if (decimals.length === 0) return [];

  const results = [];
  entries.forEach((entry) => {
    const { node } = entry;
    if (!isNumber(node) || Number.isInteger(node.value)) return;
    if (classifyNumberRole(entry) === null) return;

    decimals.forEach((candidate) => {
      if (Math.abs(candidate - node.value) < EPSILON) return;
      const complementary = Math.abs(candidate + node.value - 1) < EPSILON;
      const shiftedByOne = Math.abs(Math.abs(candidate - node.value) - 1) < EPSILON;
      if (!complementary && !shiftedByOne) return;
      results.push({
        equation: replaceAtPath(equation, entry.path, { ...node, value: candidate }),
        type: "number-confuse"
      });
    });
  });
  return results;
}

/**
 * もとにする量の取り違え（1次方程式の割合）：0.6x＝858 → x＝0.6×858。
 */
function mutateInverseRelation(equation, context) {
  if (context.unit !== UNIT_IDS.LINEAR) return [];

  const results = [];
  ["left", "right"].forEach((side) => {
    const otherSide = side === "left" ? "right" : "left";
    const product = equation[side];
    const other = equation[otherSide];
    if (product.parenthesized || product.type !== NodeType.BINARY_OP || product.operator !== "*") {
      return;
    }
    if (!isNumber(other)) return;

    let coefficient = null;
    if (isNumber(product.left) && product.right.type === NodeType.VARIABLE) {
      coefficient = product.left;
    } else if (isNumber(product.right) && product.left.type === NodeType.VARIABLE) {
      coefficient = product.right;
    }
    if (!coefficient) return;

    results.push({
      equation: {
        [side]: { type: NodeType.VARIABLE, name: "x" },
        [otherSide]: { type: NodeType.BINARY_OP, operator: "*", left: coefficient, right: other }
      },
      type: "inverse-relation"
    });
  });
  return results;
}

/**
 * 1本の方程式（AST）に、すべての変形パターンを適用した候補を返す。
 */
function mutateSingleEquation(equation, context) {
  const entries = collectEntries(equation);
  return [
    ...mutateSigns(equation, entries, context),
    ...mutateBothDirections(equation, entries),
    ...mutateReverseSubtraction(equation, entries),
    ...mutateNumberSwaps(equation, entries, context),
    ...(context.unit === UNIT_IDS.SIMULTANEOUS ? mutateVariableSwap(equation) : []),
    ...mutateNumberConfuse(equation, entries, context),
    ...mutateTranspose(equation, context),
    ...mutateParenDrop(equation, entries),
    ...mutatePlusTimes(equation, entries),
    ...mutateInverseRelation(equation, context),
    ...mutateCoefficientDrop(equation, entries, context),
    ...mutateDenominatorDrop(equation, entries),
    ...mutateTermDrop(equation),
    ...mutateParenAdd(equation, context)
  ];
}

// ============================================================
// 連立方程式：2本の式にまたがる数の取り違え
// ============================================================

function collectSwappableNumbers(equation) {
  return collectEntries(equation)
    .filter((entry) => isNumber(entry.node))
    .map((entry) => ({ entry, role: classifyNumberRole(entry) }))
    .filter((item) => item.role !== null);
}

function replaceValueInRole(equation, items, fromValue, toValue, role) {
  const targets = items.filter(
    (item) => item.role === role && Math.abs(item.entry.node.value - fromValue) < EPSILON
  );
  return replaceAtPaths(
    equation,
    targets.map((item) => ({ path: item.entry.path, node: { ...item.entry.node, value: toValue } }))
  );
}

/**
 * 式①の数aと式②の数b（同じ役割）を入れ替える
 * （4x＋4y＝960・24x－24y＝960 → 24x＋24y＝960・4x－4y＝960、
 *  x＋1355＝65y・x＋2380＝106y → x＋1355＝106y・x＋2380＝65y）。
 */
function mutateCrossEquationSwaps(equations) {
  const [first, second] = equations;
  const firstItems = collectSwappableNumbers(first);
  const secondItems = collectSwappableNumbers(second);
  const firstValues = firstItems.map((item) => item.entry.node.value);
  const secondValues = secondItems.map((item) => item.entry.node.value);

  const results = [];
  const seen = new Set();
  firstItems.forEach((a) => {
    secondItems.forEach((b) => {
      if (a.role !== b.role) return;
      const valueA = a.entry.node.value;
      const valueB = b.entry.node.value;
      if (Math.abs(valueA - valueB) < EPSILON) return;
      if (!swapRatioAcceptable(valueA, valueB)) return;
      // 同じ数が両方の式に出てくる場合は、どれを入れ替えたか分かりにくくなるので使わない
      if (secondValues.some((v) => Math.abs(v - valueA) < EPSILON)) return;
      if (firstValues.some((v) => Math.abs(v - valueB) < EPSILON)) return;
      // 出てくる回数が同じ数どうしだけを入れ替える（4x＋4y と 24x－24y の4と24は入れ替えるが、
      // y＝2x と 10y＋x＝10x＋y＋18 の2と10のように、意味の違う数は入れ替えない）
      const countIn = (values, target) => values.filter((v) => Math.abs(v - target) < EPSILON).length;
      if (countIn(firstValues, valueA) !== countIn(secondValues, valueB)) return;

      const key = `${a.role}:${valueA}:${valueB}`;
      if (seen.has(key)) return;
      seen.add(key);

      results.push({
        equations: [
          replaceValueInRole(first, firstItems, valueA, valueB, a.role),
          replaceValueInRole(second, secondItems, valueB, valueA, b.role)
        ],
        type: "cross-swap"
      });
    });
  });
  return results;
}

// ============================================================
// 公開関数
// ============================================================

/**
 * 問題データから、正解として扱う模範式（内部表記の文字列）の配列を取り出す。
 * 1次方程式は文字列（またはinternalを持つオブジェクト）、2次方程式はinternal、
 * 連立方程式はcanonicalEquationsの2本。
 * @returns {string[]}
 */
export function getCanonicalEquationStrings(question, unit) {
  if (unit === UNIT_IDS.SIMULTANEOUS) {
    return question.canonicalEquations.map((equation) => equation.internal);
  }
  const canonical = question.canonicalEquation;
  return [typeof canonical === "string" ? canonical : canonical.internal];
}

/**
 * 問題に登場する数（模範式・別解・数値キー・ヒント式パーツ）を、重複なく取り出す。
 * 誤答に「問題と無関係な数」を使っていないかの確認にも使う。
 * @returns {number[]}
 */
export function collectQuestionNumbers(question, unit) {
  const texts = [...getCanonicalEquationStrings(question, unit)];
  if (Array.isArray(question.alternateEquations)) {
    question.alternateEquations.forEach((alternate) => {
      texts.push(typeof alternate === "string" ? alternate : alternate.internal);
    });
  }
  if (Array.isArray(question.keypadNumbers)) {
    texts.push(...question.keypadNumbers.map(String));
  }
  if (Array.isArray(question.hintKeypadParts)) {
    question.hintKeypadParts.forEach((part) => {
      if (part && typeof part.value === "string") texts.push(part.value);
    });
  }

  const values = texts.flatMap(extractEquationNumbers);
  return [...new Set(values)];
}

/**
 * 式の文字列に含まれる数を取り出す。x²を表す「^2」「²」の2は、数としては数えない。
 * @returns {number[]}
 */
export function extractEquationNumbers(text) {
  return (String(text).replace(/\^2|²/g, "").match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
}

/**
 * 模範式から、誤答候補を（3個だけでなく）多めに生成する。
 * 1次・2次方程式では equations: [式]、連立方程式では equations: [式①, 式②]。
 * 連立方程式では、原則として「片方の式は正しく、もう片方だけが少し違う」候補になる
 * （式をまたいだ数の取り違え"cross-swap"のみ、両方の式が変わる）。
 * @returns {Array<{equations: string[], distractorType: string}>}
 */
export function generateDistractorCandidates(question, unit) {
  const canonicalStrings = getCanonicalEquationStrings(question, unit);
  const canonicalAsts = canonicalStrings.map(parseEquationAst);
  if (canonicalAsts.some((ast) => ast === null)) return [];

  const context = {
    unit,
    decimalPool: collectQuestionNumbers(question, unit).filter((value) => !Number.isInteger(value))
  };

  const candidates = [];
  canonicalAsts.forEach((ast, index) => {
    mutateSingleEquation(ast, context).forEach(({ equation, type }) => {
      const equations = [...canonicalStrings];
      equations[index] = printEquationAst(equation);
      candidates.push({ equations, distractorType: type });
    });
  });

  if (unit === UNIT_IDS.SIMULTANEOUS && canonicalAsts.length === 2) {
    mutateCrossEquationSwaps(canonicalAsts).forEach(({ equations, type }) => {
      candidates.push({ equations: equations.map(printEquationAst), distractorType: type });
    });
  }

  return candidates;
}

/**
 * テンプレート側に任意で用意された誤答候補（easyDistractorCandidates）を、
 * 生成候補と同じ形へそろえる。1次・2次方程式は文字列、連立方程式は[式①, 式②]の配列。
 * @returns {Array<{equations: string[], distractorType: "template"}>}
 */
export function normalizeTemplateCandidates(rawCandidates, unit) {
  if (!Array.isArray(rawCandidates)) return [];
  return rawCandidates
    .map((candidate) => {
      if (unit === UNIT_IDS.SIMULTANEOUS) {
        return Array.isArray(candidate) && candidate.length === 2
          ? { equations: candidate.map(String), distractorType: "template" }
          : null;
      }
      if (typeof candidate === "string") {
        return { equations: [candidate], distractorType: "template" };
      }
      if (Array.isArray(candidate) && candidate.length === 1) {
        return { equations: [String(candidate[0])], distractorType: "template" };
      }
      return null;
    })
    .filter(Boolean);
}
