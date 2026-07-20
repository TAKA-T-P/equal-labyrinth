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

function createRootSvg(ariaLabel) {
  return createSvgElement("svg", {
    viewBox: VIEW_BOX,
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
  const fieldY = 30;
  const fieldW = 220;
  const fieldH = 160;
  const pathW = 40;

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
      x: fieldX + (fieldW - pathW) / 2,
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

  svg.appendChild(createSvgText(fieldX + fieldW / 2, fieldY + fieldH + 24, `横 ${widthValue}`));
  svg.appendChild(
    createSvgText(fieldX - 22, fieldY + fieldH / 2, `縦 ${heightValue}`, {
      transform: `rotate(-90 ${fieldX - 22} ${fieldY + fieldH / 2})`
    })
  );

  const pathLabelX = fieldX + fieldW / 2;
  svg.appendChild(createSvgText(pathLabelX, fieldY - 10, `幅 ${pathWidthSymbol}`));

  return svg;
}

// ============================================================
// 容積・ふたのない箱（L3-06）：正方形の厚紙の四隅を切り取る展開図
// ============================================================
function buildOpenBoxNetSvg(diagram) {
  const paperSideSymbol = requireNonEmptyString(diagram.paperSideSymbol, "paperSideSymbol");
  const cutSideValue = requireFiniteNumber(diagram.cutSideValue, "cutSideValue");
  const ariaLabel = requireNonEmptyString(diagram.ariaLabel, "ariaLabel");

  const svg = createRootSvg(ariaLabel);

  const paperX = 60;
  const paperY = 20;
  const paperSize = 200;
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

  svg.appendChild(createSvgText(paperX + paperSize / 2, paperY - 8, `1辺 ${paperSideSymbol}`));
  svg.appendChild(createSvgText(paperX + cutSize / 2, paperY + cutSize / 2 + 5, `${cutSideValue}`));

  return svg;
}

// ============================================================
// 動点（L3-07）：長方形ABCDの辺上を、点P・点Qが移動する図（静止画）
// ============================================================
function buildMovingPointsRectangleSvg(diagram) {
  const widthValue = requireFiniteNumber(diagram.widthValue, "widthValue");
  const heightValue = requireFiniteNumber(diagram.heightValue, "heightValue");
  const pointPLabel = requireNonEmptyString(diagram.pointPLabel, "pointPLabel");
  const pointQLabel = requireNonEmptyString(diagram.pointQLabel, "pointQLabel");
  const ariaLabel = requireNonEmptyString(diagram.ariaLabel, "ariaLabel");

  const svg = createRootSvg(ariaLabel);

  const rectX = 60;
  const rectY = 40;
  const rectW = 200;
  const rectH = 140;

  const corners = {
    A: [rectX, rectY],
    B: [rectX + rectW, rectY],
    C: [rectX + rectW, rectY + rectH],
    D: [rectX, rectY + rectH]
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
    A: [-10, -6],
    B: [10, -6],
    C: [10, 16],
    D: [-10, 16]
  };
  Object.entries(corners).forEach(([name, [x, y]]) => {
    const [dx, dy] = labelOffsets[name];
    svg.appendChild(createSvgText(x + dx, y + dy, name, { "font-weight": "bold" }));
  });

  svg.appendChild(createSvgText(rectX + rectW / 2, rectY + rectH + 24, `${widthValue}`));
  svg.appendChild(
    createSvgText(rectX - 18, rectY + rectH / 2, `${heightValue}`, {
      transform: `rotate(-90 ${rectX - 18} ${rectY + rectH / 2})`
    })
  );

  function appendMovingPoint(startCorner, towardCorner, label) {
    const [sx, sy] = corners[startCorner];
    const [tx, ty] = corners[towardCorner];
    const markerX = sx + (tx - sx) * 0.3;
    const markerY = sy + (ty - sy) * 0.3;

    svg.appendChild(
      createSvgElement("line", {
        x1: sx,
        y1: sy,
        x2: sx + (tx - sx) * 0.5,
        y2: sy + (ty - sy) * 0.5,
        stroke: "currentColor",
        "stroke-width": 2,
        "marker-end": "url(#quadratic-diagram-arrowhead)"
      })
    );
    svg.appendChild(
      createSvgElement("circle", { cx: markerX, cy: markerY, r: 4, fill: "currentColor" })
    );
    svg.appendChild(createSvgText(markerX, markerY - 10, label, { "font-weight": "bold" }));
  }

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

  if (diagram.pointPStart && diagram.pointPMovesTo) {
    appendMovingPoint(diagram.pointPStart, diagram.pointPMovesTo, pointPLabel);
  }
  if (diagram.pointQStart && diagram.pointQMovesTo) {
    appendMovingPoint(diagram.pointQStart, diagram.pointQMovesTo, pointQLabel);
  }

  return svg;
}

const DIAGRAM_BUILDERS = {
  "cross-road": buildCrossRoadSvg,
  "open-box-net": buildOpenBoxNetSvg,
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
