import type { Dictionary } from "../core";

/** Arabic for standards (keys are the English text; see ../README.md). */
export const standards: Dictionary = {
  // ── standards-list ──
  "Your organization's rules that every proposal must respect, such as IT security, safety and commercial terms. {app} checks each vendor against the active standards of a project, alongside its RFP.":
    "قواعد جهتكم التي يجب أن يلتزم بها كل عرض، مثل أمن تقنية المعلومات والسلامة والشروط التجارية. يتحقق {app} من التزام كل مورّد بالمعايير النشطة في المشروع، إلى جانب طلب العروض.",
  "Couldn't load standards.": "تعذّر تحميل المعايير.",
  "No standards yet": "لا توجد معايير بعد",
  "Create a standard for each rule set you apply to tenders (for example IT security, safety, commercial terms), then add its rules and upload the official document.":
    "أنشئ معيارًا لكل مجموعة قواعد تطبّقها على المناقصات (مثل أمن تقنية المعلومات والسلامة والشروط التجارية)، ثم أضف قواعده وارفع مستنده الرسمي.",
  "Create your first standard": "إنشاء المعيار الأول",
  "Standards library": "مكتبة المعايير",
  "Search standards": "البحث في المعايير",
  "Search by code, title or category": "ابحث بالرمز أو العنوان أو الفئة",
  "New standard": "معيار جديد",
  "Filter standards": "تصفية المعايير",
  Active: "نشط",
  Inactive: "غير نشط",
  "No standards match": "لا توجد معايير مطابقة",
  'Nothing matches "{query}".': "لا توجد نتائج مطابقة لـ «{query}».",
  "No standards in this filter.": "لا توجد معايير ضمن هذه التصفية.",
  "Clear filters": "مسح عوامل التصفية",
  "Actions for {code}": "إجراءات {code}",
  "Edit details": "تعديل التفاصيل",
  "Delete standard": "حذف المعيار",
  "No description": "لا يوجد وصف",
  "{n} rules": {
    zero: "لا قواعد",
    one: "قاعدة واحدة",
    two: "قاعدتان",
    few: "{n} قواعد",
    many: "{n} قاعدة",
    other: "{n} قاعدة",
  },
  "{n} mandatory": "{n} إلزامية",
  "{n} M": "{n} إلزامية",
  "{n} docs": {
    zero: "لا مستندات",
    one: "مستند واحد",
    two: "مستندان",
    few: "{n} مستندات",
    many: "{n} مستندًا",
    other: "{n} مستند",
  },
  "{code} activated.": "تم تفعيل {code}.",
  "{code} deactivated.": "تم إلغاء تفعيل {code}.",
  "{code} active": "{code} نشط",
  "Updated {date}": "آخر تحديث: {date}",
  "Delete {code}?": "حذف {code}؟",
  "This permanently deletes {title}, its {rules} rules and {docs} uploaded documents. Projects that used it keep their past evaluation results.":
    "سيُحذف {title} نهائيًا مع قواعده ({rules}) ومستنداته المرفوعة ({docs}). وتحتفظ المشاريع التي استخدمته بنتائج تقييمها السابقة.",
  "{code} deleted.": "تم حذف {code}.",

  // ── shared by several standards screens (and the project screens) ──
  "{code} created": "تم إنشاء {code}",
  Created: "تاريخ الإنشاء",
  "It may have been deleted.": "ربما حُذف.",
  "{name} uploaded": "تم رفع {name}",

  // ── standard-form-dialog ──
  "Code is required.": "الرمز مطلوب.",
  "Use letters, digits, - . _ and start with a letter.":
    "استخدم أحرفًا لاتينية وأرقامًا و- . _ على أن يبدأ الرمز بحرف.",
  "Keep the code under 24 characters.": "يجب ألا يتجاوز الرمز 24 حرفًا.",
  "Title must be at least 3 characters.": "يجب ألا يقل العنوان عن 3 أحرف.",
  "Keep the description under 2,000 characters.": "يجب ألا يتجاوز الوصف 2000 حرف.",
  "Standard updated.": "تم تحديث المعيار.",
  "Now add its rules or upload the standard document.": "أضف الآن قواعده أو ارفع مستند المعيار.",
  "{code} is already used by another standard.": "الرمز {code} مستخدم بالفعل لمعيار آخر.",
  "Couldn't save the standard.": "تعذّر حفظ المعيار.",
  "Edit standard": "تعديل المعيار",
  "A standard groups the rules every proposal must respect. Its rules and documents are sent to the AI for each project that applies it.":
    "يجمع المعيار القواعد التي يجب أن يلتزم بها كل عرض، وتُرسل قواعده ومستنداته إلى الذكاء الاصطناعي في كل مشروع يطبّقه.",
  "e.g. CITS-2026": "مثال: CITS-2026",
  "Scope and purpose of this standard": "نطاق هذا المعيار والغرض منه",
  "Active standards are pre-selected for new projects.":
    "تُحدَّد المعايير النشطة تلقائيًا للمشاريع الجديدة.",
  "Create standard": "إنشاء المعيار",

  // ── new-standard-dialog ──
  "Enter a short code, e.g. CTS-2026.": "أدخل رمزًا قصيرًا بأحرف لاتينية، مثل CTS-2026.",
  "Enter the standard's title.": "أدخل عنوان المعيار.",
  "Add the rules: drop a rules file or paste them.": "أضف القواعد: أفلت ملف القواعد أو الصقها.",
  "Rules read by AI": "تمت قراءة القواعد بالذكاء الاصطناعي",
  "Couldn't read the file.": "تعذّرت قراءة الملف.",
  "{code} created · {n} rules": {
    one: "تم إنشاء {code} · قاعدة واحدة",
    two: "تم إنشاء {code} · قاعدتان",
    few: "تم إنشاء {code} · {n} قواعد",
    many: "تم إنشاء {code} · {n} قاعدة",
    other: "تم إنشاء {code} · {n} قاعدة",
  },
  "Couldn't create the standard.": "تعذّر إنشاء المعيار.",
  "Drop the file with the standard's rules: an Excel or CSV table, a Word table or a text file with one rule per row (code, rule, priority). A PDF works too.":
    "أفلت ملف قواعد المعيار: جدول Excel أو CSV، أو جدول Word، أو ملف نصي فيه قاعدة واحدة في كل صف (الرمز، القاعدة، الأولوية). ويمكن أيضًا استخدام ملف PDF.",
  "Customs Transit Security Standard": "معيار أمن العبور الجمركي",
  "Rules file": "ملف القواعد",
  "Excel, CSV, Word, text or PDF": "Excel أو CSV أو Word أو ملف نصي أو PDF",
  "Reading with AI…": "جارٍ القراءة بالذكاء الاصطناعي…",
  "Reading…": "جارٍ القراءة…",
  "Remove the file": "إزالة الملف",
  "No rule table was found in this file's text. {app} can read the rules with AI: one small request to {model}.":
    "لم يُعثر على جدول قواعد في نص هذا الملف. يمكن لـ {app} قراءة القواعد بالذكاء الاصطناعي: طلب واحد صغير إلى {model}.",
  "No rule table was found in this file's text. {app} can read the rules with AI: the demo AI reads them.":
    "لم يُعثر على جدول قواعد في نص هذا الملف. يمكن لـ {app} قراءة القواعد بالذكاء الاصطناعي: يقرؤها الذكاء الاصطناعي التجريبي.",
  "Read the rules with AI": "قراءة القواعد بالذكاء الاصطناعي",
  "Paste the rules instead": "لصق القواعد بدلًا من ذلك",
  "Rules (one per line: CODE | rule | priority)":
    "القواعد (قاعدة في كل سطر: الرمز | القاعدة | الأولوية)",
  "Rules found": "القواعد التي عُثر عليها",
  "{n} rules found": {
    zero: "لم يُعثر على قواعد",
    one: "عُثر على قاعدة واحدة",
    two: "عُثر على قاعدتين",
    few: "عُثر على {n} قواعد",
    many: "عُثر على {n} قاعدة",
    other: "عُثر على {n} قاعدة",
  },
  auto: "تلقائي",

  // ── paste-rules-dialog ──
  "Code {code} already exists in this standard.": "الرمز {code} موجود بالفعل في هذا المعيار.",
  "{n} rules added to {code}.": {
    one: "أُضيفت قاعدة واحدة إلى {code}.",
    two: "أُضيفت قاعدتان إلى {code}.",
    few: "أُضيفت {n} قواعد إلى {code}.",
    many: "أُضيفت {n} قاعدة إلى {code}.",
    other: "أُضيفت {n} قاعدة إلى {code}.",
  },
  "Couldn't add the rules.": "تعذّرت إضافة القواعد.",
  "Paste rules": "لصق القواعد",
  "One rule per line: {format}. Priority is mandatory, important or desirable (or M / I / D). The code is optional and generated if empty. Rows copied from Excel or Word tables (tab-separated) work too.":
    "قاعدة واحدة في كل سطر: {format}. الأولوية: إلزامي أو مهم أو مرغوب (أو بالإنجليزية mandatory / important / desirable، أو M / I / D). الرمز اختياري ويُنشأ تلقائيًا إذا تُرك فارغًا. ويمكن أيضًا لصق صفوف منسوخة من جداول Excel أو Word (مفصولة بعلامات جدولة).",
  "CODE | rule text | priority": "الرمز | نص القاعدة | الأولوية",
  "Rules to paste": "القواعد المراد لصقها",
  "Lines with problems": "أسطر تحتاج إلى تصحيح",
  "Line {n}:": "السطر {n}:",
  "Preview of rules to add": "معاينة القواعد المراد إضافتها",
  "{n} ready": "جاهزة: {n}",
  "{n} to fix": "للتصحيح: {n}",
  "Add {n} rules": {
    one: "إضافة قاعدة واحدة",
    two: "إضافة قاعدتين",
    few: "إضافة {n} قواعد",
    many: "إضافة {n} قاعدة",
    other: "إضافة {n} قاعدة",
  },
  "Add rules": "إضافة القواعد",

  // ── src/lib/rules-parse.ts (parser messages, shown with t.auto in paste-rules-dialog) ──
  'Unknown priority "{value}" (use mandatory, important or desirable).':
    "أولوية غير معروفة «{value}» (استخدم إلزامي أو مهم أو مرغوب).",
  'Invalid code "{code}" (letters, digits, - . _ ; max 24 chars, start with a letter).':
    "رمز غير صالح «{code}» (أحرف لاتينية وأرقام و- . _ ؛ 24 حرفًا كحد أقصى، ويبدأ بحرف).",
  "Rule text is empty.": "نص القاعدة فارغ.",
  "Rule text is longer than {n} characters.": "نص القاعدة أطول من {n} حرف.",
  'Duplicate code "{code}" in the pasted text.': "الرمز «{code}» مكرر في النص الملصق.",

  // ── rule-sheet ──
  "Rule {code}": "القاعدة {code}",
  "This is the wording the analysis used. The standard has been deleted since.":
    "هذه هي الصياغة التي اعتمدها التحليل. وقد حُذف المعيار منذ ذلك الحين.",
  "This is the wording the analysis used. The rule has been removed from the standard since.":
    "هذه هي الصياغة التي اعتمدها التحليل. وقد أُزيلت القاعدة من المعيار منذ ذلك الحين.",
  "This is the wording the analysis used. The rule has been edited since; its current wording is in the list below.":
    "هذه هي الصياغة التي اعتمدها التحليل. وقد عُدّلت القاعدة منذ ذلك الحين، وصياغتها الحالية في القائمة أدناه.",
  "All rules in this standard": "جميع قواعد هذا المعيار",
  "Open full standard": "فتح المعيار كاملًا",

  // ── rules-editor ──
  "{n} important": "{n} مهمة",
  "{n} desirable": "{n} مرغوبة",
  "Rule {code} deleted": "تم حذف القاعدة {code}",
  "{code} restored.": "تمت استعادة {code}.",
  "Couldn't restore {code}.": "تعذّرت استعادة {code}.",
  "Couldn't delete the rule.": "تعذّر حذف القاعدة.",
  "Couldn't save the new order.": "تعذّر حفظ الترتيب الجديد.",
  "No rules yet": "لا توجد قواعد بعد",
  "Add the first rule": "أضف القاعدة الأولى",
  "Type a rule below, or paste many at once (one per line: CODE | text | priority).":
    "اكتب قاعدة أدناه، أو الصق عدة قواعد دفعة واحدة (قاعدة في كل سطر: الرمز | النص | الأولوية).",
  "Rules (drag the handle or use Alt + arrow keys to reorder)":
    "القواعد (اسحب المقبض أو استخدم Alt مع مفاتيح الأسهم لإعادة الترتيب)",
  "Rule {code}, {priority}: {text}. Enter to edit, Alt+arrows to move, Delete to remove.":
    "القاعدة {code}، {priority}: {text}. Enter للتعديل، وAlt مع الأسهم للنقل، وDelete للحذف.",
  "Priority of {code}": "أولوية {code}",
  "Actions for rule {code}": "إجراءات القاعدة {code}",
  "Move up": "نقل لأعلى",
  "Move down": "نقل لأسفل",
  "Code: letters, digits, - . _ (max 24), starting with a letter.":
    "الرمز: أحرف لاتينية وأرقام و- . _ (24 حرفًا كحد أقصى)، ويبدأ بحرف.",
  "Rule text is required.": "نص القاعدة مطلوب.",
  "Couldn't save the rule.": "تعذّر حفظ القاعدة.",
  "Rule code": "رمز القاعدة",
  "Rule text": "نص القاعدة",
  "Enter to save · Shift+Enter for a new line · Esc to cancel":
    "Enter للحفظ · Shift+Enter لسطر جديد · Esc للإلغاء",
  "Write the rule text first.": "اكتب نص القاعدة أولًا.",
  "Rule {code} added.": "تمت إضافة القاعدة {code}.",
  "Couldn't add the rule.": "تعذّرت إضافة القاعدة.",
  "New rule code (optional)": "رمز القاعدة الجديدة (اختياري)",
  "New rule text": "نص القاعدة الجديدة",
  "Write a rule the proposals must meet…": "اكتب قاعدة يجب أن تستوفيها العروض…",
  "New rule priority": "أولوية القاعدة الجديدة",
  "Add rule": "إضافة قاعدة",
  "Leave the code empty to use {code}. Press Enter to add.":
    "اترك الرمز فارغًا لاستخدام {code}. اضغط Enter للإضافة.",

  // ── standard-detail ──
  "Standard not found": "المعيار غير موجود",
  "Couldn't load this standard": "تعذّر تحميل هذا المعيار",
  "Back to standards": "العودة إلى المعايير",
  "Standard activated.": "تم تفعيل المعيار.",
  "Standard deactivated.": "تم إلغاء تفعيل المعيار.",
  "Standard active": "المعيار نشط",
  "This standard is inactive: it won't be pre-selected for new projects. Projects can still apply it manually.":
    "هذا المعيار غير نشط: لن يُحدَّد تلقائيًا للمشاريع الجديدة، ويظل بإمكان المشاريع تطبيقه يدويًا.",
  "How it's used": "كيفية الاستخدام",
  "When a project applies this standard, every rule above becomes part of the evaluation checklist. Each vendor is checked against it alongside the RFP, and the uploaded documents give the AI the full context.":
    "عندما يطبّق مشروعٌ هذا المعيار، تصبح كل قاعدة من قواعده جزءًا من قائمة التحقق في التقييم. ويُتحقق من التزام كل مورّد به إلى جانب طلب العروض، وتمنح المستندات المرفوعة الذكاءَ الاصطناعي السياق الكامل.",
  "Last updated": "آخر تحديث",
  "This permanently deletes {title}, its {rules} rules and {docs} documents.":
    "سيُحذف {title} نهائيًا مع قواعده ({rules}) ومستنداته ({docs}).",

  // ── standard-documents ──
  "The official text of the standard. Sent to the AI together with the rules.":
    "النص الرسمي للمعيار، ويُرسل إلى الذكاء الاصطناعي مع القواعد.",
  "Uploaded documents": "المستندات المرفوعة",
  "Document deleted.": "تم حذف المستند.",
  "“{name}” will be removed from this standard and from disk.":
    "سيُزال الملف «{name}» من هذا المعيار ومن القرص.",
  "Add documents": "إضافة مستندات",
  "Upload documents": "رفع المستندات",
  "PDF preferred · Word, Excel and images also accepted · up to {n} MB each":
    "يُفضّل PDF · يُقبل أيضًا Word وExcel والصور · حتى {n} ميغابايت للملف",
};
