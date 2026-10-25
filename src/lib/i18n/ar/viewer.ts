import type { Dictionary } from "../core";

/** Arabic for viewer (keys are the English text; see ../README.md). */
export const viewer: Dictionary = {
  // ── document-reader: top bar ──
  Envelope: "المظروف",
  "Open the original in a new tab": "فتح الملف الأصلي في علامة تبويب جديدة",
  "Download {name}": "تنزيل {name}",
  "Exit full screen (F)": "الخروج من ملء الشاشة (F)",
  "Full screen (F)": "ملء الشاشة (F)",
  "Close reader (Esc)": "إغلاق القارئ (Esc)",

  // ── document-reader: stage ──
  // ‎ keeps the dot of ".pdf" before the extension in right-to-left text.
  "No in-app preview for .{ext}": "لا تتوفر معاينة داخل التطبيق لملفات ‎.{ext}",
  "No document": "لا يوجد مستند",
  "Download the file to open it locally. The AI still reads its text where possible.":
    "نزّل الملف لفتحه على جهازك. ويظل الذكاء الاصطناعي يقرأ نصه متى أمكن.",
  "This envelope has no files.": "لا يحتوي هذا المظروف على ملفات.",
  "Couldn't open this file": "تعذّر فتح هذا الملف",
  "Loading document": "جارٍ تحميل المستند",
  "{name}, page {n}": "{name}، الصفحة {n}",
  "Download ({size})": "تنزيل ({size})",

  // ── document-reader: toolbar, filmstrip, scrubber ──
  "Hide thumbnails": "إخفاء الصور المصغّرة",
  "Show thumbnails": "عرض الصور المصغّرة",
  // The arrows name the keyboard keys, which are the same in both languages.
  "Previous page (←)": "الصفحة السابقة (←)",
  "Next page (→)": "الصفحة التالية (→)",
  "1 page": "صفحة واحدة",
  "Zoom out (−)": "تصغير (−)",
  "Reset zoom (0)": "إعادة ضبط التكبير (0)",
  "Zoom {n}%. Reset zoom": "التكبير {n}%. إعادة ضبط التكبير",
  "Zoom in (+)": "تكبير (+)",
  "Fit to width": "ملاءمة العرض",
  "Fit whole page": "ملاءمة الصفحة كاملة",
  "Page {n} of {total}": "الصفحة {n} من {total}",
  "Page {n}": "الصفحة {n}",
  "Page number, 1 to {n}": "رقم الصفحة، من 1 إلى {n}",

  // ── document-reader: evidence quote banner ──
  "Quote not found in this document:": "لم يُعثر على الاقتباس في هذا المستند:",
  "Finding:": "جارٍ البحث:",
  "Evidence:": "الدليل:",
  "“{quote}”": "«{quote}»",

  // ── use-reader-source ──
  "This PDF couldn't be opened. It may be damaged or password-protected.":
    "تعذّر فتح ملف PDF هذا. قد يكون تالفًا أو محميًا بكلمة مرور.",
  "This image couldn't be loaded.": "تعذّر تحميل هذه الصورة.",
  "This Word document couldn't be displayed. Download it to open it locally.":
    "تعذّر عرض مستند Word هذا. نزّله لفتحه على جهازك.",
  "This file couldn't be previewed.": "تعذّرت معاينة هذا الملف.",
  "Sheet: {name}": "الورقة: {name}",
  "{n} rows": {
    zero: "لا توجد صفوف",
    one: "صف واحد",
    two: "صفان",
    few: "{n} صفوف",
    many: "{n} صفًا",
    other: "{n} صف",
  },
  "{n} rows · preview truncated": {
    zero: "لا توجد صفوف · معاينة مقتطعة",
    one: "صف واحد · معاينة مقتطعة",
    two: "صفان · معاينة مقتطعة",
    few: "{n} صفوف · معاينة مقتطعة",
    many: "{n} صفًا · معاينة مقتطعة",
    other: "{n} صف · معاينة مقتطعة",
  },

  // ── document-cover ──
  "First page of {name}": "الصفحة الأولى من {name}",
};
