import type { Dictionary } from "../core";

/**
 * Arabic for text the server builds from English templates: analysis step labels (src/lib/plan.ts,
 * stored in the database) and API error messages (translated in src/server/api.ts with the
 * marsa-locale cookie). Matched by translateText; see ../README.md.
 */
export const server: Dictionary = {
  // ── Step labels (src/lib/plan.ts) ──
  "Checking {vendor} against the RFP": "مطابقة عرض {vendor} مع طلب العروض",
  "Checking {vendor} against the RFP: {n} requirements": {
    zero: "مطابقة عرض {vendor} مع طلب العروض: لا متطلبات",
    one: "مطابقة عرض {vendor} مع طلب العروض: متطلب واحد",
    two: "مطابقة عرض {vendor} مع طلب العروض: متطلبان",
    few: "مطابقة عرض {vendor} مع طلب العروض: {n} متطلبات",
    many: "مطابقة عرض {vendor} مع طلب العروض: {n} متطلبًا",
    other: "مطابقة عرض {vendor} مع طلب العروض: {n} متطلب",
  },
  "Checking {vendor} against the standards: {n} rule":
    "مطابقة عرض {vendor} مع المعايير: قاعدة واحدة",
  "Checking {vendor} against the standards: {n} rules": {
    zero: "مطابقة عرض {vendor} مع المعايير: لا قواعد",
    one: "مطابقة عرض {vendor} مع المعايير: قاعدة واحدة",
    two: "مطابقة عرض {vendor} مع المعايير: قاعدتان",
    few: "مطابقة عرض {vendor} مع المعايير: {n} قواعد",
    many: "مطابقة عرض {vendor} مع المعايير: {n} قاعدة",
    other: "مطابقة عرض {vendor} مع المعايير: {n} قاعدة",
  },
  "Building the RFP checklist": "إعداد قائمة التحقق لطلب العروض",
  "Building the RFP checklist and filing {rules} rules of {n} standard by proposal section":
    "إعداد قائمة التحقق لطلب العروض وتوزيع قواعد المعيار ({rules}) على أقسام العرض",
  "Building the RFP checklist and filing {rules} rules of {n} standards by proposal section":
    "إعداد قائمة التحقق لطلب العروض وتوزيع قواعد المعايير ({rules} قاعدة من {n} معايير) على أقسام العرض",
  "Assessing risks for {vendor}": "تقييم مخاطر {vendor}",
  "Scoring the vendors and writing the recommendation": "احتساب درجات الموردين وكتابة التوصية",
  "Writing the consultant report on {vendor}": "كتابة تقرير الاستشاري عن {vendor}",
  "The run stopped early.": "توقف التحليل قبل اكتماله.",

  // ── Quality labels and sources (src/server/runs/) ──
  Good: "جيد",
  Fair: "مقبول",
  "Customer's evaluation notes": "ملاحظات التقييم الخاصة بالعميل",

  // ── API errors (src/server/api.ts, services, route handlers) ──
  "{what} not found.": "تعذّر العثور على {what}.",
  "Analysis run": "التحليل",
  "Proposal in this analysis": "العرض في هذا التحليل",
  Rule: "القاعدة",
  "Request body must be valid JSON.": "يجب أن يكون محتوى الطلب بصيغة JSON صحيحة.",
  "Some fields are invalid.": "بعض الحقول غير صحيحة.",
  "This record already exists.": "هذا السجل موجود بالفعل.",
  "Something went wrong on our side. Please try again.":
    "حدث خطأ من جهتنا. يُرجى المحاولة مرة أخرى.",
  "Another analysis is running for this project.": "يجري تحليل آخر لهذا المشروع.",
  "An analysis is already running for this project.": "يجري تحليل لهذا المشروع بالفعل.",
  "This analysis is still running.": "لا يزال هذا التحليل قيد التشغيل.",
  "This analysis has no recommendation.": "لا يتضمن هذا التحليل توصية.",
  "Only a failed or cancelled step can be retried.":
    "لا يمكن إعادة محاولة إلا خطوة فاشلة أو ملغاة.",
  "Only an interrupted or cancelled analysis can be resumed.":
    "لا يمكن استئناف إلا تحليل متوقف أو ملغى.",
  "Reports can only be added to a finished analysis.":
    "لا يمكن إضافة التقارير إلا إلى تحليل مكتمل.",
  "Step not found.": "الخطوة غير موجودة.",
  "Document not found.": "المستند غير موجود.",
  "A {status} analysis can't be cancelled.": "لا يمكن إلغاء تحليل حالته «{status}».",
  "Live AI needs an Anthropic API key (ANTHROPIC_API_KEY in .env).":
    "يتطلب الذكاء الاصطناعي المباشر مفتاح Anthropic API (‏ANTHROPIC_API_KEY في ملف ‎.env).",
  "Expected multipart/form-data with 'file' and 'kind'.":
    "يُتوقع نموذج multipart/form-data يتضمن 'file' و'kind'.",
  "Expected multipart/form-data with 'file'.": "يُتوقع نموذج multipart/form-data يتضمن 'file'.",
  "Expected multipart/form-data with a 'file' field.":
    "يُتوقع نموذج multipart/form-data يتضمن الحقل 'file'.",
  "kind must be 'commercial' or 'technical'.":
    "يجب أن تكون قيمة kind إما 'commercial' أو 'technical'.",
  "No file was uploaded.": "لم يُرفع أي ملف.",
  "The file content doesn't match its .{ext} extension. Was it renamed?":
    "محتوى الملف لا يطابق امتداده ‎.{ext}. هل غُيّر اسمه؟",
  "One or more standards no longer exist.": "معيار واحد أو أكثر لم يعد موجودًا.",
  "{code} is a “{category}” standard; this project is “{project}”. Change the project category to General to apply it.":
    "المعيار {code} من فئة «{category}» وهذا المشروع من فئة «{project}». غيّر فئة المشروع إلى «عام» لتطبيقه.",
  "Pick today or a later date.": "اختر تاريخ اليوم أو تاريخًا لاحقًا.",
  "The submission deadline can't be in the past.":
    "لا يمكن أن يكون الموعد النهائي لتقديم العروض في الماضي.",
  "Restore the project before adding documents.": "استعد المشروع قبل إضافة المستندات.",
  "Restore the project before changing its RFP documents.":
    "استعد المشروع قبل تغيير مستندات طلب العروض.",
  "Restore the project before continuing its analysis.": "استعد المشروع قبل متابعة تحليله.",
  "Restore the project before analysing it.": "استعد المشروع قبل تحليله.",
  "The RFP was already evaluated; its documents can't be removed.":
    "سبق تقييم طلب العروض؛ لا يمكن إزالة مستنداته.",
  "A published tender needs at least one RFP document. Upload the replacement first.":
    "تحتاج المناقصة المنشورة إلى مستند واحد على الأقل لطلب العروض. ارفع البديل أولًا.",
  "Wait for the running analysis to finish.": "انتظر حتى ينتهي التحليل الجاري.",
  "Wait for the running analysis to finish before deleting.":
    "انتظر حتى ينتهي التحليل الجاري قبل الحذف.",
  "Wait for the running analysis to finish before removing proposals.":
    "انتظر حتى ينتهي التحليل الجاري قبل إزالة العروض.",
  "Wait for the running analysis to finish before archiving.":
    "انتظر حتى ينتهي التحليل الجاري قبل الأرشفة.",
  "No proposal has a readable document yet.": "لا يوجد بعدُ عرض يتضمن مستندًا قابلًا للقراءة.",
  "Publish the tender and collect proposals before analysing.":
    "انشر المناقصة واجمع العروض قبل التحليل.",
  "This project already has proposals, so it can't go back to draft.":
    "هذا المشروع لديه عروض بالفعل، لذا لا يمكن إعادته إلى مسودة.",
  "This project is archived.": "هذا المشروع مؤرشف.",
  "Upload at least one RFP document before publishing to vendors.":
    "ارفع مستندًا واحدًا على الأقل لطلب العروض قبل النشر للموردين.",
  "Upload at least one readable RFP document first.":
    "ارفع أولًا مستندًا واحدًا على الأقل قابلًا للقراءة لطلب العروض.",
  "A project that is {status} can't be published again.":
    "لا يمكن نشر مشروع حالته «{status}» مرة أخرى.",
  "A project that is {status} can't go back to draft.":
    "لا يمكن إعادة مشروع حالته «{status}» إلى مسودة.",
  "A rule with code {code} already exists in this standard.":
    "توجد بالفعل قاعدة بالرمز {code} في هذا المعيار.",
  "These codes already exist in this standard: {codes}.":
    "هذه الرموز موجودة بالفعل في هذا المعيار: {codes}.",
  "The order must list every rule of this standard exactly once.":
    "يجب أن يتضمن الترتيب كل قاعدة في هذا المعيار مرة واحدة فقط.",
  "A vendor named “{name}” already exists.": "يوجد بالفعل مورّد باسم «{name}».",
  "This vendor already exists. Pick it from the list instead.":
    "هذا المورّد موجود بالفعل. اختره من القائمة بدلًا من ذلك.",
  "Sample file missing: {file}": "ملف نموذجي مفقود: {file}",
  "Sample files are missing. Run `npx tsx scripts/test-inputs/build-phase-4.ts` (needs test-inputs/).":
    "الملفات النموذجية مفقودة. شغّل ‎`npx tsx scripts/test-inputs/build-phase-4.ts`‎ (يتطلب المجلد test-inputs/).",
  "Request failed ({status}).": "فشل الطلب ({status}).",

  // ── The Translator (2026-10-25) ──
  "Translating the results into Arabic": "ترجمة النتائج إلى العربية",
  "Translating the results into English": "ترجمة النتائج إلى الإنجليزية",
  "Only a finished analysis can be translated.": "لا يمكن ترجمة إلا تحليل مكتمل.",
  "Nothing to translate.": "لا يوجد ما يُترجم.",
  "{n} steps failed.": {
    one: "فشلت خطوة واحدة.",
    two: "فشلت خطوتان.",
    few: "فشلت {n} خطوات.",
    many: "فشلت {n} خطوة.",
    other: "فشلت {n} خطوة.",
  },
  "{n} step failed.": "فشلت خطوة واحدة.",

  // ── Tender import (2026-10-25) ──
  "This folder holds {n} tenders. Import them one at a time.": {
    two: "يحتوي هذا المجلد على مناقصتين. استورد كل مناقصة على حدة.",
    few: "يحتوي هذا المجلد على {n} مناقصات. استورد كل مناقصة على حدة.",
    many: "يحتوي هذا المجلد على {n} مناقصة. استورد كل مناقصة على حدة.",
    other: "يحتوي هذا المجلد على {n} مناقصة. استورد كل مناقصة على حدة.",
  },
  "This tender has no such round of bids.": "لا توجد في هذه المناقصة جولة العطاءات هذه.",
  "The folder has no tender documents.": "لا يحتوي المجلد على مستندات الطرح.",
  "No tender document could be read.": "تعذّرت قراءة جميع مستندات الطرح.",
  "Import not found.": "عملية الاستيراد غير موجودة.",
  "A file path is missing.": "مسار الملف مفقود.",
  "A file of the tender is larger than 300 MB.": "أحد ملفات المناقصة أكبر من 300 ميغابايت.",
  "The tender is larger than 2 GB.": "حجم المناقصة أكبر من 2 غيغابايت.",
};
