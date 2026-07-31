// 例題確認（ヘルプメニュー）専用：単元・カテゴリ選択と、代表例題カードの表示を担当する。
// データの解決・検証はexample-catalog.jsに任せ、ここではDOM操作だけを行う。
// 例題確認は閲覧専用のため、gameState・タイマー・スコア・問題履歴・localStorageには
// 一切触れない（単元・カテゴリの選択状態は、このファイル内のローカル変数だけで管理する）。

import { UNIT_IDS } from "../config.js";
import { getCategoriesForUnit } from "../questions/question-manager.js";
import { appendStyledVariableParts, appendTextWithInlineFractions, showScreen } from "../ui.js";
import { renderFormattedEquation } from "../equation/equation-formatter.js";
import { renderQuadraticDiagram } from "../diagrams/quadratic-diagram-renderer.js";
import {
  getExampleQuestionForCategory,
  normalizeVariableDefinitions,
  validateAllCategoryExamples
} from "./example-catalog.js";

const elements = {
  backButton: document.getElementById("example-catalog-back-button"),
  backButtonTop: document.getElementById("example-catalog-back-button-top"),

  unitButtons: Array.from(document.querySelectorAll(".help-example-unit-button")),
  categorySelect: document.getElementById("example-category-select"),
  categoryList: document.getElementById("example-category-list"),

  card: document.getElementById("example-card"),
  categoryHeading: document.getElementById("example-category-heading"),
  promptText: document.getElementById("example-prompt"),
  variableBlock: document.getElementById("example-variable-block"),
  variableList: document.getElementById("example-variable-list"),
  placeholderText: document.getElementById("example-placeholder-text"),

  diagramOpenButton: document.getElementById("example-diagram-open-button"),
  hintToggleButton: document.getElementById("example-hint-toggle-button"),
  equationToggleButton: document.getElementById("example-equation-toggle-button"),

  hintBody: document.getElementById("example-hint-body"),
  hintText: document.getElementById("example-hint-text"),

  equationBody: document.getElementById("example-equation-body"),
  equationList: document.getElementById("example-equation-list"),
  alternateBlock: document.getElementById("example-alternate-block"),
  alternateList: document.getElementById("example-alternate-list"),

  diagramBackdrop: document.getElementById("example-diagram-backdrop"),
  diagramPanel: document.getElementById("example-diagram-panel"),
  diagramContainer: document.getElementById("example-diagram-container"),
  diagramNote: document.getElementById("example-diagram-note"),
  diagramCloseButton: document.getElementById("example-diagram-close-button")
};

const exampleViewState = {
  unit: UNIT_IDS.LINEAR,
  categoryId: null,
  question: null
};

// 「もどる」を押したときにどの画面へ戻るか。ヘルプメニューから開いた場合は"help-menu"、
// ゲーム画面のヒントウィンドウから開いた場合は"game"になる（open*系の関数が設定する）。
let returnScreenName = "help-menu";

let diagramFocusReturnElement = null;

function goBackToOrigin() {
  showScreen(returnScreenName);
}

/**
 * 「もどる」ボタンの表示・読み上げラベルを、実際の戻り先に合わせて切り替える
 * （ヘルプメニューから開いた場合と、ゲーム画面のヒントウィンドウから開いた場合とで、
 * 戻り先が異なるため）。
 */
function applyReturnLabels() {
  const destinationLabel = returnScreenName === "game" ? "問題にもどる" : "ヘルプメニューにもどる";
  if (elements.backButton) {
    elements.backButton.textContent = `← ${destinationLabel}`;
  }
  if (elements.backButtonTop) {
    elements.backButtonTop.setAttribute("aria-label", destinationLabel);
  }
}

function elementsReady() {
  return Boolean(
    elements.card &&
      elements.categorySelect &&
      elements.categoryList &&
      elements.diagramPanel &&
      elements.unitButtons.length > 0
  );
}

/**
 * 通常のプロンプト表示（ui.jsのrenderQuestionPrompt等）と同様に、
 * 文中のx・yだけを数学用の斜体フォントで表示する。
 */
function setStyledText(container, text) {
  container.innerHTML = "";
  appendStyledVariableParts(container, text);
}

// ============================================================
// 単元・カテゴリ選択
// ============================================================

function renderUnitTabs() {
  elements.unitButtons.forEach((button) => {
    const isSelected = button.dataset.unit === exampleViewState.unit;
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-selected", String(isSelected));
  });
}

function renderCategorySelectors() {
  const categories = getCategoriesForUnit(exampleViewState.unit);

  elements.categorySelect.innerHTML = "";
  elements.categoryList.innerHTML = "";

  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = category.name;
    elements.categorySelect.appendChild(option);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "help-example-category-button";
    button.dataset.categoryId = category.id;
    button.setAttribute("role", "option");
    button.textContent = category.name;
    elements.categoryList.appendChild(button);
  });

  elements.categorySelect.value = exampleViewState.categoryId || "";
  updateCategoryListSelection();
}

function updateCategoryListSelection() {
  Array.from(elements.categoryList.children).forEach((button) => {
    const isSelected = button.dataset.categoryId === exampleViewState.categoryId;
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-selected", String(isSelected));
  });
}

function selectUnit(unit) {
  if (unit === exampleViewState.unit) return;
  exampleViewState.unit = unit;
  const categories = getCategoriesForUnit(unit);
  exampleViewState.categoryId = categories.length > 0 ? categories[0].id : null;

  renderUnitTabs();
  renderCategorySelectors();
  renderExampleCard();
}

function selectCategory(categoryId) {
  if (!categoryId || categoryId === exampleViewState.categoryId) return;
  exampleViewState.categoryId = categoryId;
  elements.categorySelect.value = categoryId;
  updateCategoryListSelection();
  renderExampleCard();
}

// ============================================================
// 模範式・別の立式例の描画（equation-formatter.jsを再利用し、上下型分数・
// x²の上付き表示などを、通常の問題画面とまったく同じ形式で表示する）
// ============================================================

function createEquationRow(label, relationName, internalString) {
  const row = document.createElement("div");
  row.className = "help-example-equation-row";

  if (label || relationName) {
    const labelEl = document.createElement("p");
    labelEl.className = "help-example-equation-label";
    labelEl.textContent = label && relationName ? `${label}　${relationName}` : label || relationName;
    row.appendChild(labelEl);
  }

  const valueEl = document.createElement("p");
  valueEl.className = "help-example-equation-value";
  renderFormattedEquation(valueEl, internalString);
  row.appendChild(valueEl);

  return row;
}

function renderEquationList(question) {
  elements.equationList.innerHTML = "";

  if (Array.isArray(question.canonicalEquations)) {
    question.canonicalEquations.forEach((equation, index) => {
      const label = `式${index === 0 ? "①" : "②"}`;
      elements.equationList.appendChild(createEquationRow(label, equation.relationName, equation.internal));
    });
    return;
  }

  const equation = question.canonicalEquation;
  const internal = typeof equation === "object" && equation !== null ? equation.internal : equation;
  const relationName = typeof equation === "object" && equation !== null ? equation.relationName : null;
  elements.equationList.appendChild(createEquationRow(null, relationName, internal));
}

function renderAlternateEquations(question) {
  if (!Array.isArray(question.alternateEquations) || question.alternateEquations.length === 0) {
    elements.alternateBlock.hidden = true;
    elements.alternateList.innerHTML = "";
    return;
  }

  elements.alternateBlock.hidden = false;
  elements.alternateList.innerHTML = "";
  question.alternateEquations.forEach((alternate) => {
    const label = alternate.index === 0 ? "式①" : "式②";
    elements.alternateList.appendChild(
      createEquationRow(label, alternate.relationName, alternate.internal)
    );
  });
}

// ============================================================
// ヒント・模範式の開閉（カテゴリを切り替えるたびに閉じた状態へ戻す）
// ============================================================

function closeExampleHint() {
  elements.hintBody.hidden = true;
  elements.hintToggleButton.textContent = "ヒントを見る";
  elements.hintToggleButton.setAttribute("aria-expanded", "false");
}

function openExampleHint() {
  elements.hintBody.hidden = false;
  elements.hintToggleButton.textContent = "ヒントを閉じる";
  elements.hintToggleButton.setAttribute("aria-expanded", "true");
}

function toggleExampleHint() {
  if (elements.hintBody.hidden) openExampleHint();
  else closeExampleHint();
}

function closeExampleEquation() {
  elements.equationBody.hidden = true;
  elements.equationToggleButton.textContent = "模範式を見る";
  elements.equationToggleButton.setAttribute("aria-expanded", "false");
}

function openExampleEquation() {
  elements.equationBody.hidden = false;
  elements.equationToggleButton.textContent = "模範式を閉じる";
  elements.equationToggleButton.setAttribute("aria-expanded", "true");
}

function toggleExampleEquation() {
  if (elements.equationBody.hidden) openExampleEquation();
  else closeExampleEquation();
}

// ============================================================
// 図（十字路・ふたのない箱・動点）：ゲーム画面用の図パネルとは独立した、
// 例題確認専用のダイアログを開閉する。出題直後の自動表示は行わず、
// 「図を見る」を押したときだけ開く。
// ============================================================

function closeExampleDiagram() {
  elements.diagramPanel.hidden = true;
  elements.diagramBackdrop.hidden = true;
  if (diagramFocusReturnElement && typeof diagramFocusReturnElement.focus === "function") {
    diagramFocusReturnElement.focus();
  }
  diagramFocusReturnElement = null;
}

function openExampleDiagram() {
  const diagram = exampleViewState.question && exampleViewState.question.diagram;
  if (!diagram) return;

  renderQuadraticDiagram(elements.diagramContainer, diagram);
  if (elements.diagramContainer.hidden) return; // 描画失敗時は開かない

  if (diagram.type === "moving-points-rectangle") {
    elements.diagramNote.textContent =
      `点P：秒速${diagram.pSpeedValue}cm、点Q：秒速${diagram.qSpeedValue}cm`;
    elements.diagramNote.hidden = false;
  } else {
    elements.diagramNote.textContent = "";
    elements.diagramNote.hidden = true;
  }

  diagramFocusReturnElement = document.activeElement;
  elements.diagramPanel.hidden = false;
  elements.diagramBackdrop.hidden = false;
}

function handleDiagramKeydown(event) {
  if (elements.diagramPanel.hidden) return;
  if (event.key === "Escape") {
    event.preventDefault();
    closeExampleDiagram();
  }
}

// ============================================================
// 例題カード全体の描画
// ============================================================

function renderExampleCard() {
  closeExampleHint();
  closeExampleEquation();
  closeExampleDiagram();

  const category = getCategoriesForUnit(exampleViewState.unit).find(
    (c) => c.id === exampleViewState.categoryId
  );
  const question = exampleViewState.categoryId
    ? getExampleQuestionForCategory(exampleViewState.unit, exampleViewState.categoryId)
    : null;
  exampleViewState.question = question;

  elements.categoryHeading.textContent = category ? category.name : "";

  if (!question || question.isPlaceholder) {
    elements.promptText.textContent = "";
    elements.variableBlock.hidden = true;
    elements.variableList.innerHTML = "";
    elements.placeholderText.hidden = false;
    elements.diagramOpenButton.hidden = true;
    elements.hintToggleButton.hidden = true;
    elements.equationToggleButton.hidden = true;
    return;
  }

  elements.placeholderText.hidden = true;
  elements.hintToggleButton.hidden = false;
  elements.equationToggleButton.hidden = false;

  setStyledText(elements.promptText, question.prompt);

  elements.variableBlock.hidden = false;
  elements.variableList.innerHTML = "";
  normalizeVariableDefinitions(question).forEach(({ symbol, description }) => {
    const li = document.createElement("li");
    setStyledText(li, `${symbol}：${description}`);
    elements.variableList.appendChild(li);
  });

  elements.diagramOpenButton.hidden = !question.diagram;

  elements.hintText.innerHTML = "";
  appendTextWithInlineFractions(elements.hintText, question.hint);

  renderEquationList(question);
  renderAlternateEquations(question);
}

// ============================================================
// 初期化・外部公開API
// ============================================================

function wireEvents() {
  elements.backButton?.addEventListener("click", goBackToOrigin);
  elements.backButtonTop?.addEventListener("click", goBackToOrigin);

  elements.unitButtons.forEach((button) => {
    button.addEventListener("click", () => selectUnit(button.dataset.unit));
  });

  elements.categorySelect.addEventListener("change", () => {
    selectCategory(elements.categorySelect.value);
  });

  elements.categoryList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category-id]");
    if (!button) return;
    selectCategory(button.dataset.categoryId);
  });

  elements.hintToggleButton.addEventListener("click", toggleExampleHint);
  elements.equationToggleButton.addEventListener("click", toggleExampleEquation);

  elements.diagramOpenButton.addEventListener("click", openExampleDiagram);
  elements.diagramCloseButton.addEventListener("click", closeExampleDiagram);
  elements.diagramBackdrop.addEventListener("click", closeExampleDiagram);
  document.addEventListener("keydown", handleDiagramKeydown);
}

/**
 * 例題確認画面を、指定した単元・先頭カテゴリの状態で描画する（内部ヘルパー）。
 */
function applyInitialSelection(unit) {
  exampleViewState.unit = unit;
  const categories = getCategoriesForUnit(unit);
  exampleViewState.categoryId = categories.length > 0 ? categories[0].id : null;

  renderUnitTabs();
  renderCategorySelectors();
  renderExampleCard();
}

/**
 * 例題確認画面を開いた直後の初期状態（1次方程式・先頭カテゴリ）へ戻す。
 * ヘルプメニューから例題確認を開くたびに、help-ui.jsから呼び出す想定。
 */
export function resetExampleCatalogView() {
  applyInitialSelection(UNIT_IDS.LINEAR);
}

/**
 * ヘルプメニューの「例題確認」から開く場合の入口。「もどる」を押すとヘルプメニューへ戻る。
 */
export function openExampleCatalogFromHelpMenu() {
  returnScreenName = "help-menu";
  applyReturnLabels();
  resetExampleCatalogView();
}

/**
 * ゲーム画面のヒントウィンドウの「例題確認」から開く場合の入口。現在出題されている
 * 単元・カテゴリの例題を表示した状態で開き、「もどる」を押すと問題画面へ戻る。
 * 対応するカテゴリが見つからない場合は、その単元の先頭カテゴリにフォールバックする。
 * @param {string} unit
 * @param {string} categoryId
 */
export function openExampleCatalogForQuestion(unit, categoryId) {
  returnScreenName = "game";
  applyReturnLabels();

  const categories = getCategoriesForUnit(unit);
  const hasCategory = categories.some((category) => category.id === categoryId);

  exampleViewState.unit = unit;
  exampleViewState.categoryId = hasCategory
    ? categoryId
    : (categories[0]?.id ?? null);

  renderUnitTabs();
  renderCategorySelectors();
  renderExampleCard();
}

export function initExampleUI() {
  if (!elementsReady()) return;

  validateAllCategoryExamples();
  wireEvents();
  resetExampleCatalogView();
}
