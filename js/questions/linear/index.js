// 中1「1次方程式」のすべての問題テンプレートを統合する
// 新しいカテゴリを追加するときは、
//   1. 新しいカテゴリファイルを作る
//   2. ここへimportと展開を追加する
// の2か所だけを変更すればよい構成にしている。

import { priceBasicTemplates } from "./price-basic.js";
import { distributionTemplates } from "./distribution.js";
import { catchUpTemplates } from "./catch-up.js";
import { twoProductsTemplates } from "./two-products.js";
import { admissionFeeTemplates } from "./admission-fees.js";

export const linearQuestionTemplates = [
  ...priceBasicTemplates,
  ...distributionTemplates,
  ...catchUpTemplates,
  ...twoProductsTemplates,
  ...admissionFeeTemplates
];
