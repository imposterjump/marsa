import type { Dictionary } from "../core";

/** Arabic for shared UI pieces: dialogs, the upload box, tables (see ../README.md). */
export const ui: Dictionary = {
  // ── confirm-dialog ──
  "Type {word} to confirm": "اكتب {word} للتأكيد",

  // ── data-table ──
  "No rows": "لا توجد صفوف",

  // ── dropzone ──
  "Upload failed. Try again.": "فشل الرفع. حاول مرة أخرى.",
  "This file is already in the list.": "هذا الملف موجود في القائمة بالفعل.",
  "Limit reached: at most {n} files per upload.":
    "تم بلوغ الحد: {n} ملفًا كحد أقصى في كل عملية رفع.",
  "{added} added, {rejected} rejected.": "أُضيف {added}، ورُفض {rejected}.",
  "{n} files": {
    zero: "لا ملفات",
    one: "ملف واحد",
    two: "ملفان",
    few: "{n} ملفات",
    many: "{n} ملفًا",
    other: "{n} ملف",
  },
  "{n} files added.": {
    zero: "لم يُضف أي ملف.",
    one: "أُضيف ملف واحد.",
    two: "أُضيف ملفان.",
    few: "أُضيفت {n} ملفات.",
    many: "أُضيف {n} ملفًا.",
    other: "أُضيف {n} ملف.",
  },
  "{name} removed.": "أُزيل {name}.",
  "{n} / {max} files": "{n} / {max} ملفات",
  "Drop to add files": "أفلت الملفات لإضافتها",
  "Drag & drop files here": "اسحب الملفات وأفلتها هنا",
  "PDF, Word, Excel, images or any document · up to {mb} MB each · max {n} files":
    "PDF أو Word أو Excel أو صور أو أي مستند · حتى {mb} ميغابايت للملف · {n} ملفًا كحد أقصى",
  "Browse files": "استعراض الملفات",
  "{label}: selected files": "{label}: الملفات المحددة",
  "Remove {name}": "إزالة {name}",
  "Uploading {pct}%": "جارٍ الرفع {pct}%",
  "Upload failed": "فشل الرفع",
  "Not added": "لم يُضف",
  Ready: "جاهز",

  // ── src/lib/files.ts (checks in the browser and on the server) ──
  ".{ext} files are not allowed (executables and scripts are blocked).":
    "ملفات ‎.{ext} غير مسموح بها (الملفات التنفيذية والبرمجية محظورة).",
  "This file is empty (0 bytes).": "هذا الملف فارغ (0 بايت).",
  "{size} exceeds the {max} MB limit per file.":
    "حجم الملف {size} يتجاوز الحد البالغ {max} ميغابايت للملف.",
  "Legacy .{ext} format: it will be stored and downloadable, but it can't be previewed or read by the AI. Convert it to PDF, DOCX or XLSX for analysis.":
    "صيغة ‎.{ext} قديمة: سيُحفظ الملف ويمكن تنزيله، لكن لا يمكن معاينته ولا قراءته بالذكاء الاصطناعي. حوّله إلى PDF أو DOCX أو XLSX لتحليله.",
};
