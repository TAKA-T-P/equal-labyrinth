// 中1「1次方程式」のすべての問題テンプレートを統合する
// 新しいカテゴリを追加するときは、
//   1. 新しいカテゴリファイルを作る
//   2. ここへimportと展開を追加する
// の2か所だけを変更すればよい構成にしている。

import { priceBasicTemplates } from "./price-basic.js";
import { moneyShortageTemplates } from "./money-shortage.js";
import { distributionTemplates } from "./distribution.js";
import { benchesTemplates } from "./benches.js";
import { agesTemplates } from "./ages.js";
import { integersTemplates } from "./integers.js";
import { speedDistanceTemplates } from "./speed-distance.js";
import { catchUpTemplates } from "./catch-up.js";
import { percentageTemplates } from "./percentage.js";
import { twoProductsTemplates } from "./two-products.js";
import { admissionFeeTemplates } from "./admission-fees.js";

export const linearQuestionTemplates = [
  ...priceBasicTemplates,
  ...moneyShortageTemplates,
  ...distributionTemplates,
  ...benchesTemplates,
  ...agesTemplates,
  ...integersTemplates,
  ...speedDistanceTemplates,
  ...catchUpTemplates,
  ...percentageTemplates,
  ...twoProductsTemplates,
  ...admissionFeeTemplates
];
