import type { Dictionary } from "../core";

/** Arabic for imports (keys are the English text; see ../README.md). */
export const imports: Dictionary = {
  // ── projects-home ──
  "Import tender": "استيراد مناقصة",

  // ── import-tender-dialog: choosing the folder ──
  "Bring in a tender exported from the e-procurement portal. {app} creates the project with its tender documents and each company's bid.":
    "استورد مناقصة مُصدَّرة من بوابة المشتريات الإلكترونية. يُنشئ {app} المشروع بمستندات الطرح وعطاء كل شركة.",
  "Drop the tender folder or its .zip here": "أفلت مجلد المناقصة أو ملف ‎.zip الخاص بها هنا",
  "Drop to read the tender": "أفلت لقراءة المناقصة",
  "A tender as the e-procurement portal exports it: the tender documents and the companies' bids. Files are only read, never changed.":
    "مناقصة كما تُصدّرها بوابة المشتريات الإلكترونية: مستندات الطرح وعطاءات الشركات. تُقرأ الملفات فقط ولا تُعدَّل أبدًا.",
  "Choose folder": "اختيار مجلد",
  "Choose zip": "اختيار ملف ZIP",
  "Up to 300 MB per file and 2 GB per tender.": "حتى 300 ميغابايت للملف و2 غيغابايت للمناقصة.",
  "Choose a .zip file.": "اختر ملفًا بصيغة ‎.zip.",
  "There is nothing to import: the folder is empty.": "لا يوجد ما يُستورد: المجلد فارغ.",
  "Choose the tender's folder or its .zip file, not single documents.":
    "اختر مجلد المناقصة أو ملف ‎.zip الخاص بها، لا مستندات منفردة.",
  "“{name}” is larger than 300 MB, the most a tender file can be.":
    "حجم «{name}» يتجاوز 300 ميغابايت، وهو الحد الأقصى لملف المناقصة.",
  "Couldn't read the folder.": "تعذّرت قراءة المجلد.",
  "Couldn't read the tender.": "تعذّرت قراءة المناقصة.",

  // ── upload and reading ──
  "Keep this window open: closing it cancels the import.":
    "أبقِ هذه النافذة مفتوحة: إغلاقها يلغي الاستيراد.",
  "Reading the folder…": "جارٍ قراءة المجلد…",
  "Uploading the tender…": "جارٍ رفع المناقصة…",
  "{done} of {n} files": {
    one: "{done} من ملف واحد",
    two: "{done} من ملفين",
    few: "{done} من {n} ملفات",
    many: "{done} من {n} ملفًا",
    other: "{done} من {n} ملف",
  },
  "{sent} of {size}": "{sent} من {size}",
  "Upload progress": "تقدّم الرفع",
  "Cancel upload": "إلغاء الرفع",
  "Reading the tender…": "جارٍ قراءة المناقصة…",
  "Sorting the tender documents, the internal papers and each company's bid.":
    "يجري فرز مستندات الطرح والمستندات الداخلية وعطاء كل شركة.",
  "Upload failed ({status}).": "فشل الرفع ({status}).",
  "Network error: the upload was interrupted.": "خطأ في الشبكة: انقطع الرفع.",

  // ── preview ──
  "Check what {app} found in the folder, then import it.":
    "راجع ما وجده {app} في المجلد، ثم استورده.",
  "Imported tender": "مناقصة مستوردة",
  "Tender reference {ref}.": "الرقم المرجعي للمناقصة {ref}.",
  "Imported as a “{category}” project.": "يُستورد كمشروع من الفئة «{category}».",
  "Tender documents": "مستندات الطرح",
  "{n} tender documents": {
    zero: "لا توجد مستندات طرح",
    one: "مستند طرح واحد",
    two: "مستندا طرح",
    few: "{n} مستندات طرح",
    many: "{n} مستندًا للطرح",
    other: "{n} مستند طرح",
  },
  "They become the project's RFP documents.": "تصبح مستندات طلب العروض في المشروع.",
  "{n} internal papers are not imported.": {
    one: "لن يُستورد مستند داخلي واحد.",
    two: "لن يُستورد مستندان داخليان.",
    few: "لن تُستورد {n} مستندات داخلية.",
    many: "لن يُستورد {n} مستندًا داخليًا.",
    other: "لن يُستورد {n} مستند داخلي.",
  },
  "They stay with the client. Only the estimate is read from them.":
    "تبقى لدى الجهة، ولا يُقرأ منها سوى التكلفة التقديرية.",
  "{n} files are not part of the tender and are left out.": {
    one: "ملف واحد لا يتبع المناقصة ولن يُستورد.",
    two: "ملفان لا يتبعان المناقصة ولن يُستوردا.",
    few: "{n} ملفات لا تتبع المناقصة ولن تُستورد.",
    many: "{n} ملفًا لا تتبع المناقصة ولن تُستورد.",
    other: "{n} ملف لا تتبع المناقصة ولن تُستورد.",
  },
  "Read from “{source}”. Never shown to vendors.": "مقروءة من «{source}». لا تظهر للموردين أبدًا.",
  "Not found in the tender's papers: type it if you have it. Never shown to vendors.":
    "لم يُعثر عليها في مستندات المناقصة: أدخلها إن كانت لديك. لا تظهر للموردين أبدًا.",
  "Companies' bids": "عطاءات الشركات",
  "{n} companies": {
    zero: "لا شركات",
    one: "شركة واحدة",
    two: "شركتان",
    few: "{n} شركات",
    many: "{n} شركة",
    other: "{n} شركة",
  },
  "This tender has more than one round of bids. Choose the one to import.":
    "تتضمن هذه المناقصة أكثر من جولة عطاءات. اختر الجولة المراد استيرادها.",
  "Round of bids": "جولة العطاءات",
  "Bids at opening": "العطاءات في محضر الفتح",
  "Revised bids, negotiation round": "العطاءات المعدّلة في جولة التفاوض",
  Bids: "العطاءات",
  "Each company becomes a vendor with its commercial and technical proposal.":
    "تُضاف كل شركة موردًا مع عرضيها التجاري والفني.",
  "{files} ({commercial} commercial, {technical} technical)":
    "{files} ({commercial} تجاري، {technical} فني)",
  "{n} duplicate files left out": {
    one: "استُبعد ملف مكرر واحد",
    two: "استُبعد ملفان مكرران",
    few: "استُبعدت {n} ملفات مكررة",
    many: "استُبعد {n} ملفًا مكررًا",
    other: "استُبعد {n} ملف مكرر",
  },
  "No tender documents were found in this folder. The import needs them as the project's RFP.":
    "لم يُعثر على مستندات طرح في هذا المجلد، والاستيراد يحتاج إليها لتكون طلب العروض في المشروع.",
  "No company bids were found in this folder.": "لم يُعثر على عطاءات شركات في هذا المجلد.",
  "Keep at least one tender document: they become the project's RFP.":
    "أبقِ مستند طرح واحدًا على الأقل: مستندات الطرح تصبح طلب العروض في المشروع.",

  // ── files left out by default (light imports) ──
  "CAD drawing — the app can't read it": "مخطط CAD — لا يستطيع التطبيق قراءته",
  "Map or site plan": "خريطة أو مخطط موقع",
  "Permit / no-objection letter": "تصريح / رسالة عدم ممانعة",
  "Site visit report": "تقرير زيارة الموقع",
  "Bank account details": "بيانات الحساب المصرفي",
  "Left out by default": "مستبعد افتراضيًا",
  drawings: "المخططات",
  photos: "الصور",
  maps: "الخرائط",
  permits: "التصاريح",
  "site visit reports": "تقارير زيارة الموقع",
  "bank details": "البيانات المصرفية",
  "other files": "ملفات أخرى",
  "Left out ({n}): {reasons}": "مستبعد ({n}): {reasons}",
  "Tick a file to import it anyway.": "حدّد ملفًا لاستيراده رغم ذلك.",
  "{n} files are left out.": {
    one: "استُبعد ملف واحد.",
    two: "استُبعد ملفان.",
    few: "استُبعدت {n} ملفات.",
    many: "استُبعد {n} ملفًا.",
    other: "استُبعد {n} ملف.",
  },
  "{n} files left out": {
    one: "ملف واحد مستبعد",
    two: "ملفان مستبعدان",
    few: "{n} ملفات مستبعدة",
    many: "{n} ملفًا مستبعدًا",
    other: "{n} ملف مستبعد",
  },
  "To import: {files} · {size}": "للاستيراد: {files} · {size}",
  "Left out: {files} · {size}": "مستبعد: {files} · {size}",
  "Choose another folder": "اختيار مجلد آخر",
  "A large tender takes a minute or two.": "تستغرق المناقصة الكبيرة دقيقة أو دقيقتين.",
  "Couldn't import the tender.": "تعذّر استيراد المناقصة.",

  // ── done ──
  "Tender imported": "تم استيراد المناقصة",
  "{n} files could not be imported. The rest of the tender is in the project.": {
    one: "تعذّر استيراد ملف واحد. بقية المناقصة موجودة في المشروع.",
    two: "تعذّر استيراد ملفين. بقية المناقصة موجودة في المشروع.",
    few: "تعذّر استيراد {n} ملفات. بقية المناقصة موجودة في المشروع.",
    many: "تعذّر استيراد {n} ملفًا. بقية المناقصة موجودة في المشروع.",
    other: "تعذّر استيراد {n} ملف. بقية المناقصة موجودة في المشروع.",
  },
  "Open the project": "فتح المشروع",
  "“{name}” imported": "تم استيراد «{name}»",
  "{n} documents": {
    zero: "لا مستندات",
    one: "مستند واحد",
    two: "مستندان",
    few: "{n} مستندات",
    many: "{n} مستندًا",
    other: "{n} مستند",
  },
  "{n} files skipped": {
    zero: "لم يُتخطَّ أي ملف",
    one: "تم تخطي ملف واحد",
    two: "تم تخطي ملفين",
    few: "تم تخطي {n} ملفات",
    many: "تم تخطي {n} ملفًا",
    other: "تم تخطي {n} ملف",
  },

  // ── project-details-form: the cost estimate (building works) ──
  "Cost estimate (internal)": "التكلفة التقديرية (داخلية)",
  Currency: "العملة",
  "Bids are compared with it in the price comparison. Never shown to vendors.":
    "تُقارن بها العطاءات في مقارنة الأسعار. لا تظهر للموردين أبدًا.",
  "Enter an estimate under 1,000,000,000,000.": "أدخل تكلفة تقديرية أقل من 1,000,000,000,000.",
};
