// 中3「2次方程式」の図形問題（十字路・ふたのない箱・動点）を
// 静的なSVGとして描画するモジュール。
//
// - question.diagram には生のHTML/SVG文字列を保存しない（データは数値・記号のみ）。
// - SVG要素はcreateElementNS()のみで組み立てる（innerHTMLへ問題データを流し込まない）。
// - 図の中に「答え」や完成した式を表示しない（未知数はxのまま、記号や矢印で示す）。
// - 図の描画に失敗しても、アプリ全体を止めない（コンソール警告のみ・図の領域を隠す）。

const SVG_NS = "http://www.w3.org/2000/svg";
const VIEW_BOX = "0 0 320 240";

function createSvgElement(tag, attributes = {}) {
  const element = document.createElementNS(SVG_NS, tag);
  Object.entries(attributes).forEach(([name, value]) => {
    element.setAttribute(name, value);
  });
  return element;
}

function createSvgText(x, y, text, attributes = {}) {
  const element = createSvgElement("text", {
    x,
    y,
    "text-anchor": "middle",
    "font-size": "16",
    fill: "currentColor",
    ...attributes
  });
  element.textContent = String(text);
  return element;
}

/**
 * 「幅 x」のように、末尾の文字変数（x）だけ数式用フォント（.var-x、既存の
 * 問題文・入力欄と同じTimes系イタリック体）で表示するラベルを作る。
 * @param {number} x
 * @param {number} y
 * @param {string} prefix 変数の前に付ける文字列（末尾の半角スペースを含める）
 * @param {string} variableSymbol 変数部分（通常は"x"）
 * @param {object} attributes text要素へ追加する属性（transformなど）
 */
function createSvgTextWithVariable(x, y, prefix, variableSymbol, attributes = {}, suffix = "") {
  const element = createSvgElement("text", {
    x,
    y,
    "text-anchor": "middle",
    "font-size": "16",
    fill: "currentColor",
    ...attributes
  });

  const prefixTspan = createSvgElement("tspan");
  prefixTspan.textContent = prefix;
  element.appendChild(prefixTspan);

  const variableTspan = createSvgElement("tspan", { class: "var-x" });
  variableTspan.textContent = variableSymbol;
  element.appendChild(variableTspan);

  if (suffix) {
    const suffixTspan = createSvgElement("tspan");
    suffixTspan.textContent = suffix;
    element.appendChild(suffixTspan);
  }

  return element;
}

/**
 * 「この数値はどこからどこまでの長さか」を示す、ひげ（引き出し線）を描く。
 * 2点(x1,y1)-(x2,y2)を、指定した向き・量だけ弧を描くように膨らませてつなぐ
 * 破線の曲線で、寸法線のように長さの範囲を視覚的に示す。
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @param {number} bulge 弧の膨らむ量（px）。垂直な区間では正で右・負で左、
 *   水平な区間では正で下・負で上へ膨らむ。
 */
function createLengthWhisker(x1, y1, x2, y2, bulge) {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const isVertical = x1 === x2;
  const controlX = isVertical ? midX + bulge : midX;
  const controlY = isVertical ? midY : midY + bulge;

  return createSvgElement("path", {
    d: `M ${x1} ${y1} Q ${controlX} ${controlY} ${x2} ${y2}`,
    fill: "none",
    stroke: "currentColor",
    "stroke-width": 1,
    "stroke-dasharray": "3 3",
    opacity: 0.55
  });
}

function createRootSvg(ariaLabel, viewBox = VIEW_BOX) {
  return createSvgElement("svg", {
    viewBox,
    width: "100%",
    role: "img",
    "aria-label": ariaLabel,
    class: "quadratic-diagram__svg"
  });
}

function requireFiniteNumber(value, fieldName) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`図データの${fieldName}が不正です。`);
  }
  return value;
}

function requireNonEmptyString(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`図データの${fieldName}が不正です。`);
  }
  return value;
}

// ============================================================
// 面積・十字路（L3-05）：長方形の土地に、幅xの十字型の道がある図
// ============================================================
function buildCrossRoadSvg(diagram) {
  const widthValue = requireFiniteNumber(diagram.widthValue, "widthValue");
  const heightValue = requireFiniteNumber(diagram.heightValue, "heightValue");
  const pathWidthSymbol = requireNonEmptyString(diagram.pathWidthSymbol, "pathWidthSymbol");
  const ariaLabel = requireNonEmptyString(diagram.ariaLabel, "ariaLabel");

  const svg = createRootSvg(ariaLabel);

  const fieldX = 50;
  const fieldY = 44;
  const fieldW = 220;
  const fieldH = 140;
  const pathW = 36;
  const roadLeftX = fieldX + (fieldW - pathW) / 2;
  const roadRightX = fieldX + (fieldW + pathW) / 2;

  svg.appendChild(
    createSvgElement("rect", {
      x: fieldX,
      y: fieldY,
      width: fieldW,
      height: fieldH,
      fill: "none",
      stroke: "currentColor",
      "stroke-width": 2
    })
  );

  // 縦の道
  svg.appendChild(
    createSvgElement("rect", {
      x: roadLeftX,
      y: fieldY,
      width: pathW,
      height: fieldH,
      fill: "currentColor",
      opacity: 0.15
    })
  );

  // 横の道
  svg.appendChild(
    createSvgElement("rect", {
      x: fieldX,
      y: fieldY + (fieldH - pathW) / 2,
      width: fieldW,
      height: pathW,
      fill: "currentColor",
      opacity: 0.15
    })
  );

  // 「20m」＝長方形の横幅全体であることを示すひげ（下辺の左端〜右端）
  svg.appendChild(createLengthWhisker(fieldX, fieldY + fieldH, fieldX + fieldW, fieldY + fieldH, 18));
  svg.appendChild(createSvgText(fieldX + fieldW / 2, fieldY + fieldH + 32, `横 ${widthValue}`));

  // 「10m」＝長方形の縦幅全体であることを示すひげ（左辺の上端〜下端）
  svg.appendChild(createLengthWhisker(fieldX, fieldY, fieldX, fieldY + fieldH, -18));
  svg.appendChild(
    createSvgText(fieldX - 34, fieldY + fieldH / 2, `縦 ${heightValue}`, {
      transform: `rotate(-90 ${fieldX - 34} ${fieldY + fieldH / 2})`
    })
  );

  // 「x m」＝縦の道の幅だけであることを示すひげ（上辺のうち道の部分だけ）
  svg.appendChild(createLengthWhisker(roadLeftX, fieldY, roadRightX, fieldY, -14));
  svg.appendChild(createSvgTextWithVariable(fieldX + fieldW / 2, fieldY - 22, "幅 ", pathWidthSymbol));

  return svg;
}

// ============================================================
// 箱の容積（L3-06）：正方形の厚紙の四隅を切り取る展開図
// ============================================================
function buildOpenBoxNetSvg(diagram) {
  const paperSideSymbol = requireNonEmptyString(diagram.paperSideSymbol, "paperSideSymbol");
  const cutSideValue = requireFiniteNumber(diagram.cutSideValue, "cutSideValue");
  const ariaLabel = requireNonEmptyString(diagram.ariaLabel, "ariaLabel");

  const svg = createRootSvg(ariaLabel);

  const paperX = 60;
  const paperY = 40;
  const paperSize = 184;
  const cutSize = 50;

  svg.appendChild(
    createSvgElement("rect", {
      x: paperX,
      y: paperY,
      width: paperSize,
      height: paperSize,
      fill: "none",
      stroke: "currentColor",
      "stroke-width": 2
    })
  );

  const corners = [
    [paperX, paperY],
    [paperX + paperSize - cutSize, paperY],
    [paperX, paperY + paperSize - cutSize],
    [paperX + paperSize - cutSize, paperY + paperSize - cutSize]
  ];
  corners.forEach(([cx, cy]) => {
    svg.appendChild(
      createSvgElement("rect", {
        x: cx,
        y: cy,
        width: cutSize,
        height: cutSize,
        fill: "currentColor",
        opacity: 0.15,
        stroke: "currentColor",
        "stroke-dasharray": "4 3"
      })
    );
  });

  // 折り線（点線）
  const foldLines = [
    [paperX + cutSize, paperY, paperX + cutSize, paperY + paperSize],
    [paperX + paperSize - cutSize, paperY, paperX + paperSize - cutSize, paperY + paperSize],
    [paperX, paperY + cutSize, paperX + paperSize, paperY + cutSize],
    [paperX, paperY + paperSize - cutSize, paperX + paperSize, paperY + paperSize - cutSize]
  ];
  foldLines.forEach(([x1, y1, x2, y2]) => {
    svg.appendChild(
      createSvgElement("line", {
        x1,
        y1,
        x2,
        y2,
        stroke: "currentColor",
        "stroke-width": 1,
        "stroke-dasharray": "3 3",
        opacity: 0.6
      })
    );
  });

  // 「x cm」＝厚紙の1辺全体であることを示すひげ（上辺の左端〜右端）
  svg.appendChild(createLengthWhisker(paperX, paperY, paperX + paperSize, paperY, -16));
  svg.appendChild(createSvgTextWithVariable(paperX + paperSize / 2, paperY - 24, "1辺 ", paperSideSymbol));

  // 「5cm」＝切り取る正方形の1辺だけであることを示すひげ（左上の隅の上端〜下端）
  svg.appendChild(createLengthWhisker(paperX, paperY, paperX, paperY + cutSize, -16));
  svg.appendChild(
    createSvgText(paperX - 30, paperY + cutSize / 2 + 5, `${cutSideValue}`)
  );

  return svg;
}

// ============================================================
// 箱の容積（L3-06）：長方形の紙の四隅を切り取る展開図
// （縦x・横「x＋widthDiff」の長方形パターン）
// ============================================================
function buildOpenBoxNetRectSvg(diagram) {
  const paperHeightSymbol = requireNonEmptyString(diagram.paperHeightSymbol, "paperHeightSymbol");
  const widthDiffValue = requireFiniteNumber(diagram.widthDiffValue, "widthDiffValue");
  const cutSideValue = requireFiniteNumber(diagram.cutSideValue, "cutSideValue");
  const ariaLabel = requireNonEmptyString(diagram.ariaLabel, "ariaLabel");

  const svg = createRootSvg(ariaLabel);

  const paperX = 40;
  const paperY = 54;
  const paperWidth = 220;
  const paperHeight = 130;
  const cutSize = 34;

  svg.appendChild(
    createSvgElement("rect", {
      x: paperX,
      y: paperY,
      width: paperWidth,
      height: paperHeight,
      fill: "none",
      stroke: "currentColor",
      "stroke-width": 2
    })
  );

  const corners = [
    [paperX, paperY],
    [paperX + paperWidth - cutSize, paperY],
    [paperX, paperY + paperHeight - cutSize],
    [paperX + paperWidth - cutSize, paperY + paperHeight - cutSize]
  ];
  corners.forEach(([cx, cy]) => {
    svg.appendChild(
      createSvgElement("rect", {
        x: cx,
        y: cy,
        width: cutSize,
        height: cutSize,
        fill: "currentColor",
        opacity: 0.15,
        stroke: "currentColor",
        "stroke-dasharray": "4 3"
      })
    );
  });

  // 折り線（点線）
  const foldLines = [
    [paperX + cutSize, paperY, paperX + cutSize, paperY + paperHeight],
    [paperX + paperWidth - cutSize, paperY, paperX + paperWidth - cutSize, paperY + paperHeight],
    [paperX, paperY + cutSize, paperX + paperWidth, paperY + cutSize],
    [paperX, paperY + paperHeight - cutSize, paperX + paperWidth, paperY + paperHeight - cutSize]
  ];
  foldLines.forEach(([x1, y1, x2, y2]) => {
    svg.appendChild(
      createSvgElement("line", {
        x1,
        y1,
        x2,
        y2,
        stroke: "currentColor",
        "stroke-width": 1,
        "stroke-dasharray": "3 3",
        opacity: 0.6
      })
    );
  });

  // 「縦 x」＝紙の縦全体であることを示すひげ（左辺の上端〜下端）
  svg.appendChild(createLengthWhisker(paperX, paperY, paperX, paperY + paperHeight, -16));
  svg.appendChild(
    createSvgTextWithVariable(paperX - 22, paperY + paperHeight / 2, "縦 ", paperHeightSymbol, {
      transform: `rotate(-90 ${paperX - 22} ${paperY + paperHeight / 2})`
    })
  );

  // 「横 x＋widthDiff」＝紙の横全体であることを示すひげ（上辺の左端〜右端）
  svg.appendChild(createLengthWhisker(paperX, paperY, paperX + paperWidth, paperY, -18));
  svg.appendChild(
    createSvgTextWithVariable(
      paperX + paperWidth / 2,
      paperY - 26,
      "横 ",
      paperHeightSymbol,
      {},
      `＋${widthDiffValue}`
    )
  );

  // 「cutSide」＝切り取る正方形の1辺だけであることを示すひげ
  // （縦・横の全体を示すひげと重ならないよう、右上の隅の右辺を使う）
  const rightEdgeX = paperX + paperWidth;
  svg.appendChild(createLengthWhisker(rightEdgeX, paperY, rightEdgeX, paperY + cutSize, 16));
  svg.appendChild(createSvgText(rightEdgeX + 30, paperY + cutSize / 2 + 5, `${cutSideValue}`));

  return svg;
}

// ============================================================
// 動点（L3-07）：長方形ABCDの辺上を、点P・点Qが移動する図（静止画）
// A（左上）を起点に、点Pは常にA→B（下向き）、点Qは辺AD上をA→DまたはD→Aの
// 向きへ動く。三角形APQをAの近くに小さく示し、矢印で移動の向きだけを表す
// （動きはアニメーションではなく静止画のため、実際の位置・比率とは対応しない）。
// ============================================================
function buildMovingPointsRectangleSvg(diagram) {
  const widthValue = requireFiniteNumber(diagram.widthValue, "widthValue");
  const heightValue = requireFiniteNumber(diagram.heightValue, "heightValue");
  const ariaLabel = requireNonEmptyString(diagram.ariaLabel, "ariaLabel");
  const pointQMovesToward = diagram.pointQMovesToward === "D" ? "D" : "A";

  // 実際の描画内容（点P・Qのラベル〜下辺のひげ・ラベルまで）は縦方向に
  // 大きな余白を必要としないため、共通のビューボックス（0 0 320 240）より
  // 縦を詰めた専用のビューボックスを使い、図の表示ウィンドウの上下幅を抑える。
  const svg = createRootSvg(ariaLabel, "0 20 320 205");

  // 正方形（縦＝横）のときは、見た目も正方形になるよう縦横同じ幅で描画する
  // （長方形固定の比率のままだと、実際には正方形の問題なのに縦長の長方形に
  // 見えてしまうため）。
  const isSquare = widthValue === heightValue;
  const rectY = isSquare ? 40 : 56;
  const rectW = isSquare ? 140 : 190;
  const rectH = isSquare ? 140 : 120;
  const rectX = isSquare ? 90 : 70;

  const corners = {
    A: [rectX, rectY],
    B: [rectX, rectY + rectH],
    C: [rectX + rectW, rectY + rectH],
    D: [rectX + rectW, rectY]
  };

  svg.appendChild(
    createSvgElement("rect", {
      x: rectX,
      y: rectY,
      width: rectW,
      height: rectH,
      fill: "none",
      stroke: "currentColor",
      "stroke-width": 2
    })
  );

  const labelOffsets = {
    A: [-13, -9],
    B: [-13, 18],
    C: [13, 18],
    D: [13, -9]
  };
  Object.entries(corners).forEach(([name, [x, y]]) => {
    const [dx, dy] = labelOffsets[name];
    svg.appendChild(createSvgText(x + dx, y + dy, name, { "font-weight": "bold" }));
  });

  // 「縦（AB）」＝右辺（DC）に沿ったひげ。左辺はP・矢印・ラベルが集中するため使わない。
  const rightEdgeX = rectX + rectW;
  svg.appendChild(createLengthWhisker(rightEdgeX, rectY, rightEdgeX, rectY + rectH, 18));
  svg.appendChild(
    createSvgText(rightEdgeX + 30, rectY + rectH / 2, `${heightValue}`, {
      transform: `rotate(-90 ${rightEdgeX + 30} ${rectY + rectH / 2})`
    })
  );

  // 「横（AD）」＝下辺（BC）に沿ったひげ。上辺はQ・矢印・ラベルが集中するため使わない。
  svg.appendChild(createLengthWhisker(rectX, rectY + rectH, rectX + rectW, rectY + rectH, 20));
  svg.appendChild(createSvgText(rectX + rectW / 2, rectY + rectH + 34, `${widthValue}`));

  const defs = createSvgElement("defs");
  const marker = createSvgElement("marker", {
    id: "quadratic-diagram-arrowhead",
    markerWidth: 8,
    markerHeight: 8,
    refX: 6,
    refY: 4,
    orient: "auto"
  });
  const arrowPath = createSvgElement("path", { d: "M0,0 L8,4 L0,8 Z", fill: "currentColor" });
  marker.appendChild(arrowPath);
  defs.appendChild(marker);
  svg.insertBefore(defs, svg.firstChild);

  // 三角形APQ（Aの近くだけの、比率を伴わない模式的な位置）
  const [ax, ay] = corners.A;
  const pointP = [ax, ay + rectH * 0.4];
  const pointQ = [ax + rectW * 0.35, ay];

  svg.appendChild(
    createSvgElement("path", {
      d: `M ${ax} ${ay} L ${pointP[0]} ${pointP[1]} L ${pointQ[0]} ${pointQ[1]} Z`,
      fill: "currentColor",
      opacity: 0.15
    })
  );

  // 点P：常にA→B（下向き）
  const pArrowEndY = pointP[1] + 26;
  svg.appendChild(
    createSvgElement("line", {
      x1: pointP[0],
      y1: pointP[1],
      x2: pointP[0],
      y2: pArrowEndY,
      stroke: "currentColor",
      "stroke-width": 2,
      "marker-end": "url(#quadratic-diagram-arrowhead)"
    })
  );
  svg.appendChild(createSvgElement("circle", { cx: pointP[0], cy: pointP[1], r: 4, fill: "currentColor" }));
  svg.appendChild(createSvgText(pointP[0] - 14, pointP[1] + 4, "P", { "font-weight": "bold" }));

  // 点Q：pointQMovesTowardに応じて左（A向き）または右（D向き）
  const qArrowEndX = pointQMovesToward === "A" ? pointQ[0] - 26 : pointQ[0] + 26;
  svg.appendChild(
    createSvgElement("line", {
      x1: pointQ[0],
      y1: pointQ[1],
      x2: qArrowEndX,
      y2: pointQ[1],
      stroke: "currentColor",
      "stroke-width": 2,
      "marker-end": "url(#quadratic-diagram-arrowhead)"
    })
  );
  svg.appendChild(createSvgElement("circle", { cx: pointQ[0], cy: pointQ[1], r: 4, fill: "currentColor" }));
  svg.appendChild(createSvgText(pointQ[0], pointQ[1] - 10, "Q", { "font-weight": "bold" }));

  return svg;
}

const DIAGRAM_BUILDERS = {
  "cross-road": buildCrossRoadSvg,
  "open-box-net": buildOpenBoxNetSvg,
  "open-box-net-rect": buildOpenBoxNetRectSvg,
  "moving-points-rectangle": buildMovingPointsRectangleSvg
};

/**
 * question.diagram のデータから、対応するSVG要素を組み立てる。
 * データが不正・未対応の種類の場合はErrorを投げる（呼び出し側で捕捉する）。
 */
function buildDiagramSvg(diagram) {
  const builder = DIAGRAM_BUILDERS[diagram.type];
  if (!builder) {
    throw new Error(`未対応の図の種類です：${diagram.type}`);
  }
  return builder(diagram);
}

/**
 * 図の領域（container）へ、問題の図を描画する。
 * diagramがnull・不正な場合や描画中にエラーが起きた場合は、
 * コンソールに警告を出しつつ図の領域を隠すだけにとどめ、アプリを止めない。
 * @param {HTMLElement} container
 * @param {object|null} diagram question.diagram
 */
export function renderQuadraticDiagram(container, diagram) {
  container.textContent = "";

  if (!diagram) {
    container.hidden = true;
    return;
  }

  try {
    const svg = buildDiagramSvg(diagram);
    container.appendChild(svg);
    container.hidden = false;
  } catch (error) {
    console.warn("2次方程式の図の描画に失敗しました。", error);
    container.textContent = "";
    container.hidden = true;
  }
}
