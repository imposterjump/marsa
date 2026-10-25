import type { Dictionary } from "../core";

/** Arabic for projects (keys are the English text; see ../README.md). */
export const projects: Dictionary = {
  // ── projects-home ──
  "Your projects": "مشاريعك",
  "Search projects": "البحث في المشاريع",
  "Search by name or reference": "ابحث بالاسم أو الرقم المرجعي",
  "Filter projects by status": "تصفية المشاريع حسب الحالة",
  Layout: "طريقة العرض",
  "Grid view": "عرض شبكي",
  "List view": "عرض قائمة",
  "Couldn't load projects.": "تعذّر تحميل المشاريع.",
  "No projects yet": "لا توجد مشاريع بعد",
  "A project holds one tender: its RFP documents, the standards that apply, the vendors' proposals and {app}'s evaluation. Start by publishing your first RFP.":
    "يضم كل مشروع مناقصة واحدة: مستندات طلب العروض، والمعايير المطبّقة، وعروض الموردين، وتقييم {app}. ابدأ بنشر أول طلب عروض.",
  "Create your first project": "إنشاء أول مشروع",
  "No projects match": "لا توجد مشاريع مطابقة",
  "No projects with this status.": "لا توجد مشاريع بهذه الحالة.",

  // ── projects-welcome ──
  Welcome: "ترحيب",
  "{greeting}, {name}.": "{greeting}، {name}.",
  "Weigh every vendor bid against your RFP and your standards. {app} checks each requirement, scores compliance and risk, and backs every point with evidence.":
    "قيّم كل عطاء يقدمه الموردون في ضوء طلب العروض ومعاييرك. يتحقق {app} من كل متطلب، ويمنح درجات للامتثال والمخاطر، ويدعم كل نقطة بالدليل.",
  "Manage standards": "إدارة المعايير",
  "How it works, with your totals": "آلية العمل مع إجمالياتك",
  "Publish the RFP": "نشر طلب العروض",
  tenders: { one: "مناقصة", two: "مناقصة", few: "مناقصات", many: "مناقصة", other: "مناقصة" },
  "{n} open for proposals": "{n} مفتوحة لتلقي العروض",
  "{n} drafts": {
    one: "مسودة واحدة",
    two: "مسودتان",
    few: "{n} مسودات",
    many: "{n} مسودة",
    other: "{n} مسودة",
  },
  "Apply standards": "تطبيق المعايير",
  standards: { one: "معيار", two: "معيار", few: "معايير", many: "معيارًا", other: "معيار" },
  "Collect vendor bids": "تلقي عطاءات الموردين",
  proposals: { one: "عرض", two: "عرض", few: "عروض", many: "عرضًا", other: "عرض" },
  "from {n} vendors": {
    zero: "من {n} مورد",
    one: "من مورد واحد",
    two: "من موردَين",
    few: "من {n} موردين",
    many: "من {n} موردًا",
    other: "من {n} مورد",
  },
  evaluated: "مُقيَّمة",
  "{n} running now": "{n} قيد التشغيل الآن",
  "Compliance, risks and a recommendation": "الامتثال والمخاطر والتوصية",

  // ── project-card ──
  "No deadline": "بلا موعد نهائي",
  "{n} RFP documents": {
    zero: "لا توجد مستندات لطلب العروض",
    one: "مستند واحد لطلب العروض",
    two: "مستندان لطلب العروض",
    few: "{n} مستندات لطلب العروض",
    many: "{n} مستندًا لطلب العروض",
    other: "{n} مستند لطلب العروض",
  },
  "{n} RFP": {
    one: "طلب عروض واحد",
    two: "طلبا عروض",
    few: "{n} طلبات عروض",
    many: "{n} طلب عروض",
    other: "{n} طلب عروض",
  },
  "{n} standards": {
    zero: "لا معايير",
    one: "معيار واحد",
    two: "معياران",
    few: "{n} معايير",
    many: "{n} معيارًا",
    other: "{n} معيار",
  },
  "{n} std": {
    one: "معيار واحد",
    two: "معياران",
    few: "{n} معايير",
    many: "{n} معيارًا",
    other: "{n} معيار",
  },
  "{n} proposals": {
    zero: "لا عروض",
    one: "عرض واحد",
    two: "عرضان",
    few: "{n} عروض",
    many: "{n} عرضًا",
    other: "{n} عرض",
  },

  // ── project-shell ──
  "Project not found": "المشروع غير موجود",
  "Couldn't load this project": "تعذّر تحميل هذا المشروع",
  "Check your connection and try again.": "تحقق من اتصالك وحاول مرة أخرى.",
  "Back to projects": "العودة إلى المشاريع",
  "No submission deadline": "بلا موعد نهائي لتقديم العروض",
  "Project sections": "أقسام المشروع",
  "Continue the setup": "متابعة الإعداد",
  "This project is still being set up. {link}": "لا يزال إعداد هذا المشروع جاريًا. {link}",
  "This project is still being set up. {link} (it needs at least one RFP document).":
    "لا يزال إعداد هذا المشروع جاريًا. {link} (يلزم مستند واحد على الأقل لطلب العروض).",
  "This project is {archived} and read-only. Restore it to make changes.":
    "هذا المشروع {archived} ومتاح للقراءة فقط. استعده لإجراء أي تغييرات.",
  archived: "مؤرشف",
  "AI analysis running": "التحليل بالذكاء الاصطناعي قيد التشغيل",
  "Run AI analysis": "تشغيل التحليل بالذكاء الاصطناعي",
  "Add at least one vendor in the Proposals tab": "أضف موردًا واحدًا على الأقل من تبويب العروض",
  "Open AI analysis": "فتح التحليل بالذكاء الاصطناعي",
  "Couldn't change the status.": "تعذّر تغيير الحالة.",
  "Continue setup": "متابعة الإعداد",
  "{code} restored as open.": "تمت استعادة {code} وهو مفتوح لتلقي العروض.",
  "{code} restored as a draft.": "تمت استعادة {code} كمسودة.",
  "{code} moved back to draft.": "أُعيد {code} إلى مسودة.",
  "Move back to draft": "إعادة إلى مسودة",
  "Archive project": "أرشفة المشروع",
  "Delete project": "حذف المشروع",
  "Archive {code}?": "أرشفة {code}؟",
  "The project becomes read-only and leaves the active list. Its documents, proposals and results are kept, and you can restore it at any time.":
    "يصبح المشروع للقراءة فقط ويُزال من قائمة المشاريع النشطة. تُحفظ مستنداته وعروضه ونتائجه، ويمكنك استعادته في أي وقت.",
  "{code} archived.": "تمت أرشفة {code}.",
  "This permanently deletes {name}, its {docs} RFP document(s), {proposals} proposal(s) and any evaluation results. This can't be undone.":
    "سيؤدي هذا إلى حذف {name} نهائيًا، مع مستندات طلب العروض ({docs}) والعروض ({proposals}) وأي نتائج تقييم. لا يمكن التراجع عن هذا الإجراء.",

  // ── project-overview ──
  "Key requirements / notes": "المتطلبات الرئيسية / ملاحظات",
  "{n} pages": {
    zero: "لا صفحات",
    one: "صفحة واحدة",
    two: "صفحتان",
    few: "{n} صفحات",
    many: "{n} صفحة",
    other: "{n} صفحة",
  },
  "RFP documents ({n})": "مستندات طلب العروض ({n})",
  "What vendors respond to. The AI reads every file to build the requirement checklist.":
    "ما يستجيب له الموردون. يقرأ الذكاء الاصطناعي كل ملف لإعداد قائمة التحقق من المتطلبات.",
  "RFP documents": "مستندات طلب العروض",
  "Document removed.": "تمت إزالة المستند.",
  "Vendors can already see “{name}”. Removing it changes the tender for everyone.":
    "يطّلع الموردون على «{name}» بالفعل. إزالته تغيّر المناقصة للجميع.",
  "“{name}” will be removed from this project.": "ستتم إزالة «{name}» من هذا المشروع.",
  "No RFP documents.": "لا توجد مستندات لطلب العروض.",
  "Add an addendum or annex": "إضافة ملحق أو مرفق",
  "Upload the RFP": "رفع طلب العروض",
  Reference: "الرقم المرجعي",
  "Submission deadline": "الموعد النهائي لتقديم العروض",
  "Draft started": "بدء المسودة",
  "Last activity": "آخر نشاط",
  "Standards ({n})": "المعايير ({n})",
  "Rules checked alongside the RFP. Any standard can apply.":
    "قواعد يُتحقق منها إلى جانب طلب العروض. يمكن تطبيق أي معيار.",
  "Rules checked alongside the RFP. Only “{category}” and “General” standards can apply.":
    "قواعد يُتحقق منها إلى جانب طلب العروض. لا تنطبق إلا معايير الفئة «{category}» والفئة «عام».",
  "Edit standards": "تعديل المعايير",
  "None. Proposals will be checked against the RFP only.":
    "لا يوجد. ستُقيَّم العروض وفق طلب العروض فقط.",
  "Project created": "تم إنشاء المشروع",
  "Setup not finished": "لم يكتمل الإعداد",
  "Vendors added": "تمت إضافة الموردين",
  "{n} vendors": {
    zero: "لا موردين",
    one: "مورد واحد",
    two: "موردان",
    few: "{n} موردين",
    many: "{n} موردًا",
    other: "{n} مورد",
  },
  "Submission deadline {date}": "الموعد النهائي لتقديم العروض {date}",
  "Add them in the Proposals tab": "أضفهم من تبويب العروض",
  "AI analysis done": "اكتمل التحليل بالذكاء الاصطناعي",
  "Run it once vendors are added": "شغّله بعد إضافة الموردين",
  Progress: "التقدّم",
  "(done)": "(مكتملة)",
  "(current)": "(الخطوة الحالية)",

  // ── project-edit-dialog ──
  "Project updated.": "تم تحديث المشروع.",
  "{codes} no longer applied (category “{category}”).": "أُلغي تطبيق {codes} (الفئة «{category}»).",
  "Couldn't save the project.": "تعذّر حفظ المشروع.",
  "Edit project": "تعديل المشروع",
  "Vendors see these details once the tender is published.":
    "يرى الموردون هذه التفاصيل بعد نشر المناقصة.",
  "Vendors already see this tender. Changes apply to everyone right away.":
    "المناقصة ظاهرة للموردين بالفعل. تسري التغييرات على الجميع فورًا.",
  "Applied standards": "المعايير المطبّقة",
  "Every rule of the selected standards joins the RFP requirements in this project's evaluation checklist.":
    "تُضاف كل قاعدة من المعايير المحددة إلى متطلبات طلب العروض في قائمة التحقق الخاصة بتقييم هذا المشروع.",
  "Standards updated.": "تم تحديث المعايير.",
  "Couldn't save the standards.": "تعذّر حفظ المعايير.",
  "Save standards": "حفظ المعايير",

  // ── project-details-form ──
  "Give the project a name of at least 3 characters.": "أدخل اسمًا للمشروع لا يقل عن 3 أحرف.",
  "Keep it under 160 characters.": "يجب ألا يتجاوز 160 حرفًا.",
  "Keep the description under 4,000 characters.": "يجب ألا يتجاوز الوصف 4,000 حرف.",
  "Keep the notes under 8,000 characters.": "يجب ألا تتجاوز الملاحظات 8,000 حرف.",
  "Project name": "اسم المشروع",
  "Shown to vendors with the tender.": "يظهر للموردين مع المناقصة.",
  "e.g. High-Energy Cargo X-Ray Inspection Systems":
    "مثال: أنظمة فحص البضائع بالأشعة السينية عالية الطاقة",
  "What is being procured, where, and why": "ما الذي يُشترى، وأين، ولماذا",
  "General: every standard can apply.": "عام: يمكن تطبيق أي معيار.",
  "Only “{category}” and “General” standards can apply.":
    "لا تنطبق إلا معايير الفئة «{category}» والفئة «عام».",
  "Last day vendors can submit.": "آخر يوم يمكن فيه للموردين تقديم عروضهم.",
  "Anything not in the RFP files that vendors and the AI should know. Leave empty to rely on the RFP alone.":
    "أي معلومات غير واردة في ملفات طلب العروض ينبغي أن يعرفها الموردون والذكاء الاصطناعي. اتركه فارغًا للاعتماد على طلب العروض وحده.",
  "Quantities, specifications, constraints…": "الكميات، المواصفات، القيود…",
  "Saving with “{category}” removes these applied standards: {codes}.": {
    one: "الحفظ بالفئة «{category}» يزيل هذا المعيار المطبّق: {codes}.",
    two: "الحفظ بالفئة «{category}» يزيل هذين المعيارين المطبّقين: {codes}.",
    other: "الحفظ بالفئة «{category}» يزيل هذه المعايير المطبّقة: {codes}.",
  },

  // ── standards-picker ──
  "No standards in your library": "لا توجد معايير في مكتبتك",
  "That's fine: {app} will evaluate proposals against the RFP only. You can add standards later.":
    "لا بأس: سيقيّم {app} العروض وفق طلب العروض فقط. يمكنك إضافة معايير لاحقًا.",
  "Open the Standards library": "فتح مكتبة المعايير",
  "{n} standards are hidden because they belong to other categories. To use them, set the project category to {general}.":
    {
      one: "تم إخفاء معيار واحد لأنه ينتمي إلى فئة أخرى. لاستخدامه، اضبط فئة المشروع على {general}.",
      two: "تم إخفاء معيارين لأنهما ينتميان إلى فئات أخرى. لاستخدامهما، اضبط فئة المشروع على {general}.",
      few: "تم إخفاء {n} معايير لأنها تنتمي إلى فئات أخرى. لاستخدامها، اضبط فئة المشروع على {general}.",
      many: "تم إخفاء {n} معيارًا لأنها تنتمي إلى فئات أخرى. لاستخدامها، اضبط فئة المشروع على {general}.",
      other:
        "تم إخفاء {n} معيار لأنها تنتمي إلى فئات أخرى. لاستخدامها، اضبط فئة المشروع على {general}.",
    },
  "No “{category}” standards yet": "لا توجد معايير في الفئة «{category}» بعد",
  "Proposals will be checked against the RFP only. Add standards in this category, or use the General category.":
    "ستُقيَّم العروض وفق طلب العروض فقط. أضف معايير في هذه الفئة، أو استخدم الفئة «عام».",
  "{n} of {total} selected": "تم تحديد {n} من {total}",
  "Active only": "النشطة فقط",
  "Active standards": "المعايير النشطة",
  "Inactive standards": "المعايير غير النشطة",
  "Inactive standards ({n})": "المعايير غير النشطة ({n})",
  "{n} selected": "تم تحديد {n}",

  // ── new-project-wizard ──
  "Title, category and the RFP": "العنوان والفئة وطلب العروض",
  "Rules every proposal must meet": "قواعد يجب أن يستوفيها كل عرض",
  "Proposals to evaluate": "العروض المطلوب تقييمها",
  "Add the project name in step 1 first (at least 3 characters).":
    "أدخل اسم المشروع في الخطوة 1 أولًا (3 أحرف على الأقل).",
  "Draft {code} saved": "تم حفظ المسودة {code}",
  "Fill in the project details.": "أكمل تفاصيل المشروع.",
  "Add at least one RFP document.": "أضف مستندًا واحدًا على الأقل لطلب العروض.",
  "{n} vendors ready for the AI analysis.": {
    one: "مورد واحد جاهز للتحليل بالذكاء الاصطناعي.",
    two: "موردان جاهزان للتحليل بالذكاء الاصطناعي.",
    few: "{n} موردين جاهزون للتحليل بالذكاء الاصطناعي.",
    many: "{n} موردًا جاهزون للتحليل بالذكاء الاصطناعي.",
    other: "{n} مورد جاهزون للتحليل بالذكاء الاصطناعي.",
  },
  "Add vendors from the project's Proposals tab when you have them.":
    "أضف الموردين من تبويب العروض في المشروع عند توفرهم.",
  "Couldn't create the project.": "تعذّر إنشاء المشروع.",
  "Draft saved": "تم حفظ المسودة",
  "Three short steps: the project and its RFP, the standards it must meet, and the vendors' proposals. Then run the AI analysis.":
    "ثلاث خطوات قصيرة: المشروع وطلب العروض الخاص به، والمعايير التي يجب أن يستوفيها، وعروض الموردين. ثم شغّل التحليل بالذكاء الاصطناعي.",
  Steps: "الخطوات",
  optional: "اختياري",
  "Step {step} of {total}": "الخطوة {step} من {total}",
  "The main RFP and any annexes or addenda, at least one file. The AI builds the evaluation checklist from them.":
    "طلب العروض الرئيسي وأي مرفقات أو ملاحق، ملف واحد على الأقل. يُعدّ الذكاء الاصطناعي منها قائمة التحقق الخاصة بالتقييم.",
  "Uploaded RFP documents": "مستندات طلب العروض المرفوعة",
  "Add more RFP documents": "إضافة مستندات أخرى لطلب العروض",
  "Drag and drop, or browse · PDF preferred": "اسحب الملفات وأفلتها، أو استعرضها · يُفضَّل PDF",
  "Saved as a draft until you create the project.": "محفوظ كمسودة حتى تُنشئ المشروع.",
  "Nothing is saved until you drop the RFP or create the project.":
    "لن يُحفظ شيء حتى ترفع طلب العروض أو تُنشئ المشروع.",
  "Pick the standards this project must comply with. {app} checks every proposal against each of their rules, separately from the RFP.":
    "اختر المعايير التي يجب أن يمتثل لها هذا المشروع. يتحقق {app} من كل عرض مقابل كل قاعدة من قواعدها، بمعزل عن طلب العروض.",
  "This is a General project, so every standard can apply.":
    "هذا مشروع من الفئة «عام»، لذا يمكن تطبيق أي معيار.",
  "Only “{category}” and “General” standards are shown.":
    "تُعرض فقط معايير الفئة «{category}» والفئة «عام».",
  "{code} is a “{category}” standard: it doesn't fit this project.":
    "{code} معيار من الفئة «{category}»: لا يناسب هذا المشروع.",
  "Add each vendor with its two proposals: the commercial (financial) one and the technical one. You can skip this and add vendors later, even after an analysis, then run it again.":
    "أضف كل مورد مع عرضيه: العرض التجاري (المالي) والعرض الفني. يمكنك تخطي هذه الخطوة وإضافة الموردين لاحقًا، حتى بعد إجراء التحليل، ثم تشغيله مجددًا.",
  "Create project": "إنشاء المشروع",
  "Skip and create project": "التخطي وإنشاء المشروع",
  "Discard draft": "حذف المسودة",
  "Discard this draft?": "حذف هذه المسودة؟",
  "{code}, its RFP documents and any vendors added will be deleted.":
    "سيتم حذف {code} ومستندات طلب العروض الخاصة به وأي موردين أُضيفوا إليه.",
  "Draft discarded.": "تم حذف المسودة.",
};
