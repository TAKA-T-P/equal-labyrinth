// 中2「連立方程式」の全テンプレートを統合する
// 新しいカテゴリを追加するときは、
//   1. 新しいカテゴリファイルを作る
//   2. ここへimportと展開を追加する
// の2か所だけを変更すればよい構成にしている（linear/index.jsと同じ方針）。

import { twoProductsTemplates } from "./two-products.js";
import { admissionFeesTemplates } from "./admission-fees.js";
import { coinsTemplates } from "./coins.js";
import { twoDigitNumberTemplates } from "./two-digit-number.js";
import { agesTemplates } from "./ages.js";
import { speedDistanceTemplates } from "./speed-distance.js";
import { trainPassageTemplates } from "./train-passage.js";
import { circularTrackTemplates } from "./circular-track.js";
import { mixtureTemplates } from "./mixture.js";
import { populationChangeTemplates } from "./population-change.js";
import { priceDiscountTemplates } from "./price-discount.js";
import { averagesTemplates } from "./averages.js";

export const simultaneousQuestionTemplates = [
  ...twoProductsTemplates,
  ...admissionFeesTemplates,
  ...coinsTemplates,
  ...twoDigitNumberTemplates,
  ...agesTemplates,
  ...speedDistanceTemplates,
  ...trainPassageTemplates,
  ...circularTrackTemplates,
  ...mixtureTemplates,
  ...populationChangeTemplates,
  ...priceDiscountTemplates,
  ...averagesTemplates
];
