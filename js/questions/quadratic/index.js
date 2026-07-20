// 中3「2次方程式」の全テンプレートを統合する
// 新しいカテゴリを追加するときは、
//   1. 新しいカテゴリファイルを作る
//   2. ここへimportと展開を追加する
// の2か所だけを変更すればよい構成にしている（linear/simultaneousのindex.jsと同じ方針）。

import { consecutiveIntegersTemplates } from "./consecutive-integers.js";
import { numberSquareTemplates } from "./number-square.js";
import { rectangleAreaTemplates } from "./rectangle-area.js";
import { areaChangeTemplates } from "./area-change.js";
import { crossRoadTemplates } from "./cross-road.js";
import { openBoxTemplates } from "./open-box.js";
import { movingPointsTemplates } from "./moving-points.js";
import { priceSalesTemplates } from "./price-sales.js";
import { profitDiscountTemplates } from "./profit-discount.js";

export const quadraticQuestionTemplates = [
  ...consecutiveIntegersTemplates,
  ...numberSquareTemplates,
  ...rectangleAreaTemplates,
  ...areaChangeTemplates,
  ...crossRoadTemplates,
  ...openBoxTemplates,
  ...movingPointsTemplates,
  ...priceSalesTemplates,
  ...profitDiscountTemplates
];
