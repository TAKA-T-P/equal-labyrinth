// 画面表示とDOM操作を担当するモジュール
// ゲームルールや正誤判定はここに書かない。すべて game.js から渡された値を表示するだけ。

import { LINEAR_CATEGORIES } from "./questions/linear/categories.js";
import { APP_CONFIG } from "./config.js";

const elements = {
  screens: {
    title: document.getElementById("screen-title"),
    countdown: document.getElementById("screen-countdown"),
    game: document.getElementById("screen-game"),
    result: document.getElementById("screen-result")
  },

  // タイトル画面
  questionCountSlider: document.getElementById("question-count-slider"),
  questionCountLabel: document.getElementById("question-count-label"),
  categoryList: document.getElementById("category-list"),
  categoryWarning: document.getElementById("category-warning"),
  categorySelectAllButton: document.getElementById("category-select-all"),
  categorySelectNoneButton: document.getElementById("category-select-none"),
  soundToggle: document.getElementById("sound-toggle"),
  startButton: document.getElementById("start-button"),

  // カウントダウン画面
  countdownDisplay: document.getElementById("countdown-display"),

  // ゲーム画面
  questionProgress: document.getElementById("question-progress"),
  retryButton: document.getElementById("retry-button"),
  backToTitleButton: document.getElementById("back-to-title-button"),
  questionPrompt: document.getElementById("question-prompt"),
  equationInputCard: document.querySelector(".equation-input-card"),
  equationInputScroll: document.getElementById("equation-input-scroll"),
  equationInputDisplay: document.getElementById("equation-input-display"),
  judgeMessage: document.getElementById("judge-message"),
  hintBackdrop: document.getElementById("hint-backdrop"),
  hintPanel: document.getElementById("hint-panel"),
  hintText: document.getElementById("hint-text"),
  answerRevealBackdrop: document.getElementById("answer-reveal-backdrop"),
  answerRevealPanel: document.getElementById("answer-reveal-panel"),
  answerRevealStatus: document.getElementById("answer-reveal-status"),
  modelEquationText: document.getElementById("model-equation-text"),
  solutionText: document.getElementById("solution-text"),
  hintButton: document.getElementById("hint-button"),
  passButton: document.getElementById("pass-button"),
  submitButton: document.getElementById("submit-button"),
  mathKeyboard: document.getElementById("math-keyboard"),
  keypadNumbers: document.getElementById("keypad-numbers"),
  keypadSymbols: document.getElementById("keypad-symbols"),

  // 結果画面
  statTotal: document.getElementById("stat-total"),
  statCorrect: document.getElementById("stat-correct"),
  statIncorrect: document.getElementById("stat-incorrect"),
  statPass: document.getElementById("stat-pass"),
  statAccuracy: document.getElementById("stat-accuracy"),
  statAverageTime: document.getElementById("stat-average-time"),
  historyList: document.getElementById("history-list"),
  replayButton: document.getElementById("replay-button"),
  resultToTitleButton: document.getElementById("result-to-title-button")
};

/**
 * "x" を斜体太字のTimes New Romanで表示するためのノードを作る。
 */
function createEquationCharacterNode(char) {
  if (char === "x") {
    const span = document.createElement("span");
    span.className = "var-x equation-token";
    span.textContent = "x";
    return span;
  }
  const span = document.createElement("span");
  span.className = "equation-token";
  span.textContent = char;
  return span;
}

/**
 * 問題文などの日本語文中にある "x" だけを、斜体太字のTimes New Romanで表示する。
 */
function renderTextWithStyledVariable(container, text) {
  container.innerHTML = "";
  const parts = text.split("x");

  parts.forEach((part, index) => {
    if (part) {
      container.appendChild(document.createTextNode(part));
    }
    if (index < parts.length - 1) {
      const span = document.createElement("span");
      span.className = "var-x";
      span.textContent = "x";
      container.appendChild(span);
    }
  });
}

// ============================================================
// 画面切り替え
// ============================================================

export function showScreen(screenName) {
  Object.entries(elements.screens).forEach(([name, element]) => {
    if (!element) return;
    element.hidden = name !== screenName;
  });

  if (screenName === "game" && elements.equationInputScroll) {
    elements.equationInputScroll.scrollLeft = 0;
  }
}

// ============================================================
// タイトル・設定画面
// ============================================================

export function renderQuestionCountLabel(totalQuestions) {
  elements.questionCountLabel.textContent = `問題数：${totalQuestions}問`;
  elements.questionCountSlider.value = String(totalQuestions);
}

export function renderCategoryCheckboxes(selectedCategoryIds, onToggle) {
  elements.categoryList.innerHTML = "";

  LINEAR_CATEGORIES.forEach((category) => {
    const item = document.createElement("label");
    item.className = "category-item";
    item.setAttribute("for", `category-${category.id}`);

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = `category-${category.id}`;
    checkbox.checked = selectedCategoryIds.includes(category.id);
    checkbox.addEventListener("change", () => {
      onToggle(category.id, checkbox.checked);
    });

    const textWrap = document.createElement("span");
    textWrap.className = "category-item-text";

    const nameEl = document.createElement("span");
    nameEl.className = "category-item-name";
    nameEl.textContent = category.name;

    textWrap.appendChild(nameEl);

    item.appendChild(checkbox);
    item.appendChild(textWrap);
    elements.categoryList.appendChild(item);
  });
}

export function setCategoryCheckboxState(categoryId, checked) {
  const checkbox = document.getElementById(`category-${categoryId}`);
  if (checkbox) {
    checkbox.checked = checked;
  }
}

export function setAllCategoryCheckboxes(checked) {
  LINEAR_CATEGORIES.forEach((category) => {
    setCategoryCheckboxState(category.id, checked);
  });
}

export function showCategoryWarning(show) {
  elements.categoryWarning.hidden = !show;
}

export function setStartButtonEnabled(enabled) {
  elements.startButton.disabled = !enabled;
}

export function setSoundToggleState(enabled) {
  elements.soundToggle.checked = enabled;
}

// ============================================================
// カウントダウン画面
// ============================================================

export function renderCountdownValue(value) {
  elements.countdownDisplay.textContent = value;
  // アニメーションを再生させるために、クラスを付け直す
  elements.countdownDisplay.classList.remove("countdown-number");
  void elements.countdownDisplay.offsetWidth;
  elements.countdownDisplay.classList.add("countdown-number");
}

// ============================================================
// ゲーム画面
// ============================================================

export function renderQuestionProgress(currentIndex, totalQuestions) {
  elements.questionProgress.textContent = `第${currentIndex}問 / ${totalQuestions}問`;
}

export function renderQuestionPrompt(prompt) {
  renderTextWithStyledVariable(elements.questionPrompt, prompt);
  elements.questionPrompt.parentElement.scrollTop = 0;
}

export function renderEquationInput(tokens, cursorPosition) {
  const container = elements.equationInputDisplay;
  container.innerHTML = "";

  if (tokens.length === 0) {
    const placeholder = document.createElement("span");
    placeholder.className = "equation-input-placeholder";
    placeholder.textContent = "ここに式を入力してください";
    container.appendChild(placeholder);
    return;
  }

  tokens.forEach((char, index) => {
    if (index === cursorPosition) {
      container.appendChild(createCursorNode());
    }
    container.appendChild(createEquationCharacterNode(char));
  });

  if (cursorPosition === tokens.length) {
    container.appendChild(createCursorNode());
  }

  elements.equationInputScroll.scrollLeft =
    elements.equationInputScroll.scrollWidth;
}

function createCursorNode() {
  const cursor = document.createElement("span");
  cursor.className = "equation-cursor";
  cursor.setAttribute("aria-hidden", "true");
  return cursor;
}

export function setSubmitButtonEnabled(enabled) {
  elements.submitButton.disabled = !enabled;
}

export function showHintButton(show) {
  elements.hintButton.hidden = !show;
}

export function showPassButton(show) {
  elements.passButton.hidden = !show;
}

export function showHintPanel(hintText) {
  renderTextWithStyledVariable(elements.hintText, hintText);
  elements.hintPanel.hidden = false;
  elements.hintBackdrop.hidden = false;
}

export function hideHintPanel() {
  elements.hintPanel.hidden = true;
  elements.hintBackdrop.hidden = true;
}

export function isHintPanelOpen() {
  return !elements.hintPanel.hidden;
}

const ANSWER_STATUS_CLASS = {
  correct: "is-correct",
  pass: "is-pass"
};

/**
 * 正解・パス時の判定文と模範式・解を、前面の不透明なカードで表示する。
 * @param {"correct"|"pass"} statusType
 * @param {string} statusText
 * @param {string} displayEquation
 * @param {string} solutionDisplay
 */
export function showAnswerReveal(statusType, statusText, displayEquation, solutionDisplay) {
  elements.answerRevealStatus.textContent = statusText;
  elements.answerRevealStatus.className = "answer-reveal-status";
  const statusClass = ANSWER_STATUS_CLASS[statusType];
  if (statusClass) {
    elements.answerRevealStatus.classList.add(statusClass);
  }

  renderTextWithStyledVariable(elements.modelEquationText, displayEquation);
  renderTextWithStyledVariable(elements.solutionText, solutionDisplay);
  elements.answerRevealPanel.hidden = false;
  elements.answerRevealBackdrop.hidden = false;
}

export function hideAnswerReveal() {
  elements.answerRevealPanel.hidden = true;
  elements.answerRevealBackdrop.hidden = true;
}

const JUDGE_CLASS_BY_STATUS = {
  correct: "is-correct",
  incorrect: "is-incorrect",
  "input-error": "is-input-error",
  pass: "is-pass"
};

export function showJudgeMessage(status, message) {
  const el = elements.judgeMessage;
  el.textContent = message;
  el.className = "judge-message";

  const statusClass = JUDGE_CLASS_BY_STATUS[status];
  if (statusClass) {
    void el.offsetWidth;
    el.classList.add(statusClass);
  }

  if (status === "incorrect") {
    const card = elements.equationInputCard;
    card.classList.remove("is-incorrect-flash");
    void card.offsetWidth;
    card.classList.add("is-incorrect-flash");
  }
}

export function clearJudgeMessage() {
  elements.judgeMessage.textContent = "";
  elements.judgeMessage.className = "judge-message";
}

// ============================================================
// 数式キーボード（問題ごとの数値・記号キー）
// ============================================================

// 記号キーの統一表示順（将来のy・x²も見据えた順序）
const SYMBOL_ORDER = ["x", "y", "x²", "+", "-", "×", "÷", "(", ")", "="];

// キーボード上の表示文字（内部の入力値は問題データの表記をそのまま使う）
const SYMBOL_DISPLAY = {
  x: "x",
  y: "y",
  "x²": "x²",
  "+": "+",
  "-": "−",
  "×": "×",
  "÷": "÷",
  "(": "(",
  ")": ")",
  "=": "="
};

function getUniqueKeypadNumbers(question) {
  return [...new Set(question.keypadNumbers)];
}

function getOrderedKeypadSymbols(question) {
  const requested = new Set(question.keypadSymbols);
  return SYMBOL_ORDER.filter((symbol) => requested.has(symbol));
}

function createKeypadButton(label, inputValue, extraClass) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `key-button ${extraClass}`;
  button.dataset.inputValue = inputValue;
  button.textContent = label;
  return button;
}

function renderNumberKeys(numbers) {
  elements.keypadNumbers.innerHTML = "";
  numbers.forEach((numberText) => {
    elements.keypadNumbers.appendChild(
      createKeypadButton(numberText, numberText, "key-button--number")
    );
  });
}

function renderSymbolKeys(symbols) {
  elements.keypadSymbols.innerHTML = "";
  symbols.forEach((symbol) => {
    const displayValue = SYMBOL_DISPLAY[symbol] || symbol;
    const variantClass =
      symbol === "x" || symbol === "y" || symbol === "x²"
        ? "key-button--symbol key-variable"
        : "key-button--symbol key-op";
    elements.keypadSymbols.appendChild(
      createKeypadButton(displayValue, displayValue, variantClass)
    );
  });
}

/**
 * 現在の問題データに合わせて、数値キーと記号キーを描画し直す。
 * 前の問題のキーが残らないよう、必ずコンテナの中身を入れ替える。
 */
export function renderEquationKeypad(question) {
  renderNumberKeys(getUniqueKeypadNumbers(question));
  renderSymbolKeys(getOrderedKeypadSymbols(question));
}

export function setKeyboardEnabled(enabled) {
  elements.mathKeyboard
    .querySelectorAll("button")
    .forEach((button) => {
      button.disabled = !enabled;
    });
}

export function resetGameScreenPanels() {
  hideHintPanel();
  hideAnswerReveal();
  clearJudgeMessage();
  showHintButton(false);
  showPassButton(false);
  setKeyboardEnabled(true);
}

// ============================================================
// 結果画面
// ============================================================

export function renderResultSummary(stats) {
  elements.statTotal.textContent = `${stats.totalQuestions}問`;
  elements.statCorrect.textContent = `${stats.correctCount}問`;
  elements.statIncorrect.textContent = `${stats.incorrectCount}回`;
  elements.statPass.textContent = `${stats.passCount}回`;
  elements.statAccuracy.textContent = `${stats.accuracyText}%`;
  elements.statAverageTime.textContent = stats.averageTimeText;
}

function createHistoryRow(label, valueText) {
  const row = document.createElement("p");
  row.className = "history-item-row";
  renderTextWithStyledVariable(row, `${label}：`);
  const value = document.createElement("span");
  value.className = "value";
  renderTextWithStyledVariable(value, valueText);
  row.appendChild(value);
  return row;
}

export function renderHistory(historyEntries) {
  elements.historyList.innerHTML = "";

  historyEntries.forEach((entry) => {
    const item = document.createElement("article");
    item.className = "history-item";

    const head = document.createElement("div");
    head.className = "history-item-head";

    const title = document.createElement("span");
    title.textContent = `第${entry.questionNumber}問　${entry.categoryName}`;

    const status = document.createElement("span");
    status.className = `history-item-status ${
      entry.result === "correct" ? "is-correct" : "is-pass"
    }`;
    status.textContent = entry.result === "correct" ? "正解" : "パス";

    head.appendChild(title);
    head.appendChild(status);
    item.appendChild(head);

    item.appendChild(createHistoryRow("問題文", entry.prompt));
    item.appendChild(createHistoryRow("xの意味", entry.variableDefinition));
    item.appendChild(
      createHistoryRow("入力した式", entry.lastInput || "（未入力）")
    );
    item.appendChild(createHistoryRow("模範式", entry.modelEquation));
    item.appendChild(createHistoryRow("解", entry.solutionDisplay));
    item.appendChild(
      createHistoryRow("解答時間", `${entry.elapsedTimeText}秒`)
    );
    item.appendChild(
      createHistoryRow("不正解回数", `${entry.incorrectCount}回`)
    );
    item.appendChild(
      createHistoryRow("ヒント使用", entry.hintUsed ? "あり" : "なし")
    );

    elements.historyList.appendChild(item);
  });
}

// ============================================================
// イベント登録
// ============================================================

/**
 * すべてのDOMイベントを登録する。実際の処理はcallbacksへ委譲する。
 */
export function initUI(callbacks) {
  elements.questionCountSlider.addEventListener("input", (event) => {
    const value = Number(event.target.value);
    callbacks.onQuestionCountChange(value);
  });

  elements.categorySelectAllButton.addEventListener("click", () => {
    callbacks.onSelectAllCategories();
  });

  elements.categorySelectNoneButton.addEventListener("click", () => {
    callbacks.onDeselectAllCategories();
  });

  elements.soundToggle.addEventListener("change", (event) => {
    callbacks.onSoundToggle(event.target.checked);
  });

  elements.startButton.addEventListener("click", () => {
    callbacks.onStart();
  });

  elements.retryButton.addEventListener("click", () => {
    callbacks.onRetry();
  });

  elements.backToTitleButton.addEventListener("click", () => {
    callbacks.onBackToTitle();
  });

  elements.hintButton.addEventListener("click", () => {
    callbacks.onHintRequest();
  });

  elements.passButton.addEventListener("click", () => {
    callbacks.onPass();
  });

  elements.submitButton.addEventListener("click", () => {
    callbacks.onSubmit();
  });

  elements.replayButton.addEventListener("click", () => {
    callbacks.onReplay();
  });

  elements.resultToTitleButton.addEventListener("click", () => {
    callbacks.onResultToTitle();
  });

  elements.mathKeyboard.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;

    if (button.dataset.inputValue !== undefined) {
      callbacks.onKeyPress(button.dataset.inputValue);
      return;
    }

    switch (button.dataset.action) {
      case "cursor-left":
        callbacks.onCursorLeft();
        break;
      case "cursor-right":
        callbacks.onCursorRight();
        break;
      case "backspace":
        callbacks.onBackspace();
        break;
      case "clear":
        callbacks.onClear();
        break;
      default:
        break;
    }
  });

  document.addEventListener("keydown", (event) => {
    if (elements.screens.game.hidden) {
      return;
    }
    callbacks.onPhysicalKeyDown(event);
  });

  // ヒントカード以外の場所をタップ・クリックすると、ヒントカードを閉じる
  elements.hintBackdrop.addEventListener("click", () => {
    hideHintPanel();
  });

  document.addEventListener("pointerdown", (event) => {
    if (elements.hintPanel.hidden) {
      return;
    }
    const clickedInsideHint = elements.hintPanel.contains(event.target);
    const clickedHintButton = elements.hintButton.contains(event.target);
    if (!clickedInsideHint && !clickedHintButton) {
      hideHintPanel();
    }
  });

  renderQuestionCountLabel(APP_CONFIG.defaultQuestions);
}
