import type { Dictionary } from "../core";

/** Arabic for prices (keys are the English text; see ../README.md). */
export const prices: Dictionary = {
  // ── The Prices tab of the analysis results (src/components/analysis/prices-tab.tsx) ──
  Prices: "الأسعار",
  "The bidders' bills of quantities are compared with the client's, line by line. {app} computes these numbers from the Excel files, not the AI.":
    "تُقارَن جداول الكميات المسعّرة لمقدّمي العطاءات بجدول كميات العميل بندًا بندًا. يحسب {app} هذه الأرقام من ملفات Excel، وليس الذكاء الاصطناعي.",
  "Client's bill of quantities: {name}": "جدول كميات العميل: {name}",
  "{n} lines to price": {
    zero: "لا بنود للتسعير",
    one: "بند واحد للتسعير",
    two: "بندان للتسعير",
    few: "{n} بنود للتسعير",
    many: "{n} بندًا للتسعير",
    other: "{n} بند للتسعير",
  },
  "{n} sheets": {
    zero: "لا أوراق",
    one: "ورقة واحدة",
    two: "ورقتان",
    few: "{n} أوراق",
    many: "{n} ورقة",
    other: "{n} ورقة",
  },
  "{n} bids": {
    zero: "لا عطاءات",
    one: "عطاء واحد",
    two: "عطاءان",
    few: "{n} عطاءات",
    many: "{n} عطاءً",
    other: "{n} عطاء",
  },
  "Client's cost estimate (internal)": "التكلفة التقديرية للعميل (داخلية)",
  "Not shared with the bidders": "لا تُعرض على مقدّمي العطاءات",
  "No cost estimate for this tender. Add the client's estimate to the project's details to compare every bid with it.":
    "لا توجد تكلفة تقديرية لهذه المناقصة. أضف التكلفة التقديرية للعميل في تفاصيل المشروع لمقارنة كل عطاء بها.",

  // Bid ranking
  "Bid ranking": "ترتيب العطاءات",
  "Cheapest first, by the total each bidder signed for (before VAT)":
    "الأقل سعرًا أولًا، حسب الإجمالي الذي وقّع عليه كل مقدّم عطاء (قبل ضريبة القيمة المضافة)",
  "Client's cost estimate": "التكلفة التقديرية للعميل",
  "Lowest bid": "أدنى عطاء",
  "before VAT": "قبل ضريبة القيمة المضافة",
  "sum of its lines, before VAT": "مجموع بنوده، قبل ضريبة القيمة المضافة",
  "VAT {amount}": "ضريبة القيمة المضافة {amount}",
  "{amount} with VAT": "{amount} شاملًا ضريبة القيمة المضافة",
  "No Excel bill of quantities in this bid": "لا يتضمن هذا العطاء جدول كميات بصيغة Excel",
  "Its lines add up to {total}: {diff} more than its stated total":
    "مجموع بنوده {total}، أي أكثر من الإجمالي المعلن بمقدار {diff}",
  "Its lines add up to {total}: {diff} less than its stated total":
    "مجموع بنوده {total}، أي أقل من الإجمالي المعلن بمقدار {diff}",
  "In line with the estimate": "مطابق للتكلفة التقديرية",
  "{pct}% below the estimate": "أقل من التكلفة التقديرية بنسبة {pct}%",
  "{pct}% above the estimate": "أعلى من التكلفة التقديرية بنسبة {pct}%",
  "{n} unpriced lines": {
    zero: "لا بنود غير مسعّرة",
    one: "بند واحد غير مسعّر",
    two: "بندان غير مسعّرين",
    few: "{n} بنود غير مسعّرة",
    many: "{n} بندًا غير مسعّر",
    other: "{n} بند غير مسعّر",
  },
  "Lines to price that the bidder left without a price":
    "بنود مطلوب تسعيرها تركها مقدّم العطاء دون سعر",
  "{n} lines left out": {
    zero: "لا بنود محذوفة",
    one: "بند واحد محذوف",
    two: "بندان محذوفان",
    few: "{n} بنود محذوفة",
    many: "{n} بندًا محذوفًا",
    other: "{n} بند محذوف",
  },
  "Lines of the client's bill of quantities missing from the bidder's copy":
    "بنود من جدول كميات العميل غير موجودة في نسخة مقدّم العطاء",
  "{n} added lines ({amount})": {
    zero: "لا بنود مضافة ({amount})",
    one: "بند واحد مضاف ({amount})",
    two: "بندان مضافان ({amount})",
    few: "{n} بنود مضافة ({amount})",
    many: "{n} بندًا مضافًا ({amount})",
    other: "{n} بند مضاف ({amount})",
  },
  "Priced lines the bidder added that are not in the client's bill of quantities":
    "بنود مسعّرة أضافها مقدّم العطاء وليست في جدول كميات العميل",
  "{n} arithmetic errors": {
    zero: "لا أخطاء حسابية",
    one: "خطأ حسابي واحد",
    two: "خطآن حسابيان",
    few: "{n} أخطاء حسابية",
    many: "{n} خطأً حسابيًا",
    other: "{n} خطأ حسابي",
  },
  "Quantity × rate ≠ amount": "الكمية × سعر الوحدة ≠ المبلغ",
  "{n} changed quantities": {
    zero: "لا كميات معدّلة",
    one: "كمية واحدة معدّلة",
    two: "كميتان معدّلتان",
    few: "{n} كميات معدّلة",
    many: "{n} كمية معدّلة",
    other: "{n} كمية معدّلة",
  },
  "Lines the bidder priced for another quantity than the client's":
    "بنود سعّرها مقدّم العطاء بكمية مختلفة عن كمية العميل",
  "{n} rates far above the others": {
    zero: "لا أسعار أعلى بكثير من العطاءات الأخرى",
    one: "سعر واحد أعلى بكثير من العطاءات الأخرى",
    two: "سعران أعلى بكثير من العطاءات الأخرى",
    few: "{n} أسعار أعلى بكثير من العطاءات الأخرى",
    many: "{n} سعرًا أعلى بكثير من العطاءات الأخرى",
    other: "{n} سعر أعلى بكثير من العطاءات الأخرى",
  },
  "Rates more than {x} times the bidders' median":
    "أسعار تزيد على {x} أضعاف الوسيط لأسعار مقدّمي العطاءات",
  "{n} rates far below the others": {
    zero: "لا أسعار أدنى بكثير من العطاءات الأخرى",
    one: "سعر واحد أدنى بكثير من العطاءات الأخرى",
    two: "سعران أدنى بكثير من العطاءات الأخرى",
    few: "{n} أسعار أدنى بكثير من العطاءات الأخرى",
    many: "{n} سعرًا أدنى بكثير من العطاءات الأخرى",
    other: "{n} سعر أدنى بكثير من العطاءات الأخرى",
  },
  "Rates under the bidders' median divided by {x}":
    "أسعار تقل عن الوسيط لأسعار مقدّمي العطاءات مقسومًا على {x}",
  "Issues in the bid of {vendor}": "الملاحظات على عطاء {vendor}",
  "Lowest rate on {n} lines": {
    zero: "ليس الأدنى سعرًا في أي بند",
    one: "السعر الأدنى في بند واحد",
    two: "السعر الأدنى في بندين",
    few: "السعر الأدنى في {n} بنود",
    many: "السعر الأدنى في {n} بندًا",
    other: "السعر الأدنى في {n} بند",
  },

  // Line by line
  "Line by line": "بندًا بندًا",
  "Each bidder's unit rate, with the amount underneath, against the client's lines":
    "سعر الوحدة لكل مقدّم عطاء والمبلغ تحته، مقابل بنود العميل",
  "No bid has a readable Excel bill of quantities, so there is nothing to compare line by line.":
    "لا يتضمن أي عطاء جدول كميات بصيغة Excel قابلًا للقراءة، فلا يوجد ما يُقارَن بندًا بندًا.",
  Sheet: "الورقة",
  "All sheets": "كل الأوراق",
  "Only lines with issues": "البنود ذات الملاحظات فقط",
  "Show every line": "عرض كل البنود",
  "{n} lines shown": {
    zero: "لا بنود معروضة",
    one: "بند واحد معروض",
    two: "بندان معروضان",
    few: "{n} بنود معروضة",
    many: "{n} بندًا معروضًا",
    other: "{n} بند معروض",
  },
  "Bills of quantities, line by line": "جداول الكميات بندًا بندًا",
  Item: "البند",
  Quantity: "الكمية",
  "Median rate": "السعر الوسيط",
  "No line matches these filters.": "لا يوجد بند يطابق عوامل التصفية هذه.",
  "Sum of the lines shown": "مجموع البنود المعروضة",
  "Left out of this bid": "محذوف من هذا العطاء",
  "Not priced": "غير مسعّر",
  "Priced with the lines above it as one lump sum": "مسعّر مع البنود التي فوقه بمبلغ مقطوع واحد",
  "Included above": "مشمول أعلاه",
  "Rate far above the other bids": "سعر أعلى بكثير من العطاءات الأخرى",
  "Rate far below the other bids": "سعر أدنى بكثير من العطاءات الأخرى",
  "Lowest rate on the line": "السعر الأدنى في البند",
  "The bidder priced a quantity of {qty} instead of the client's {client}":
    "سعّر مقدّم العطاء كمية {qty} بدلًا من كمية العميل {client}",
  "Quantity changed by the bidder": "كمية عدّلها مقدّم العطاء",
  "Qty {qty}": "الكمية {qty}",
  Legend: "دليل الألوان",
  "Rate more than {x} times the bidders' median":
    "سعر يزيد على {x} أضعاف الوسيط لأسعار مقدّمي العطاءات",
  "Rate under the bidders' median divided by {x}":
    "سعر يقل عن الوسيط لأسعار مقدّمي العطاءات مقسومًا على {x}",
  "Not priced, or left out of the bid": "غير مسعّر، أو محذوف من العطاء",
};
