import type { Dictionary } from "../core";

/** Arabic for settings (keys are the English text; see ../README.md). */
export const settings: Dictionary = {
  // ── settings-view ──
  Profile: "الملف الشخصي",
  "AI & runtime": "الذكاء الاصطناعي والتشغيل",
  Scoring: "احتساب الدرجات",
  "Demo tools": "أدوات العرض التجريبي",
  "Personalise your workspace, choose how the AI evaluates proposals, and tune the scoring.":
    "خصّص مساحة عملك، واختر طريقة تقييم الذكاء الاصطناعي للعروض، واضبط احتساب الدرجات.",
  "Settings sections": "أقسام الإعدادات",
  "Shown in the header, the greeting and the browser tab. No account needed.":
    "يظهر في الشريط العلوي وفي التحية وفي علامة تبويب المتصفح. لا حاجة إلى حساب.",
  "Profile saved.": "تم حفظ الملف الشخصي.",
  "Save profile": "حفظ الملف الشخصي",
  "Theme and layout preferences for this browser.": "تفضيلات السمة والتخطيط لهذا المتصفح.",
  "Screens in English or Arabic. New analyses are written in the same language.":
    "عرض الشاشات بالإنجليزية أو بالعربية. تُكتب التحليلات الجديدة باللغة نفسها.",
  Theme: "السمة",
  "System follows your OS light/dark setting.":
    "خيار «حسب النظام» يتبع إعداد الوضع الفاتح أو الداكن في نظام التشغيل لديك.",
  "Compact sidebar": "شريط جانبي مضغوط",
  "Show icons only. Shortcut: Ctrl + B.": "عرض الأيقونات فقط. الاختصار: Ctrl + B.",

  // ── settings-section ──
  "Phase {phase}": "المرحلة {phase}",
  "Saved ✓": "تم الحفظ ✓",

  // ── ai-section ──
  "Most thorough. Best for long, technical proposals and subtle partial-compliance calls.":
    "الأكثر تعمّقًا. الأنسب للعروض الفنية الطويلة وللحكم الدقيق في حالات الامتثال الجزئي.",
  "Faster, with slightly less depth on very long, complex proposals.":
    "أسرع، مع عمق أقل قليلًا في العروض الطويلة جدًا والمعقّدة.",
  "Fastest, for trying the pipeline end to end. Rougher calls on partial compliance and subtle conflicts.":
    "الأسرع، لتجربة مسار التحليل من البداية إلى النهاية. أحكامه أقل دقة في الامتثال الجزئي والتعارضات الدقيقة.",
  "Which Claude model evaluates proposals, and how. Changes apply to the next analysis run.":
    "نموذج Claude الذي يقيّم العروض وطريقة عمله. تُطبَّق التغييرات على التحليل التالي.",
  Model: "النموذج",
  Recommended: "موصى به",
  "Report language": "لغة التقرير",
  "Language of the AI's findings, summaries and reports. Switching the screens' language sets it too. Documents can be in any language.":
    "لغة نتائج الذكاء الاصطناعي وملخصاته وتقاريره. تغيير لغة الشاشات يغيّرها أيضًا. يمكن أن تكون المستندات بأي لغة.",
  "Parallel AI steps": "خطوات الذكاء الاصطناعي المتوازية",
  "Steps of the same phase run at once. Higher is faster but can hit API rate limits.":
    "تعمل خطوات المرحلة الواحدة في الوقت نفسه. القيمة الأعلى أسرع، لكنها قد تتجاوز حدود معدّل الطلبات في API.",
  "AI mode": "وضع الذكاء الاصطناعي",
  "Mock (fixtures, $0)": "تجريبي (بيانات جاهزة، بلا تكلفة)",
  "Live (Anthropic API)": "مباشر (Anthropic API)",
  "API key": "مفتاح API",
  "Configured on the server": "مُهيّأ على الخادم",
  // ‎ keeps the dot of ".env" before the name in right-to-left text.
  "Missing: add ANTHROPIC_API_KEY to .env": "غير موجود: أضف ANTHROPIC_API_KEY إلى ملف ‎.env",
  "Max upload size": "الحد الأقصى لحجم الرفع",
  "{n} MB per file": "{n} ميغابايت لكل ملف",
  "AI mode is set on the server ({setting} in {file}).":
    "يُضبط وضع الذكاء الاصطناعي على الخادم ({setting} في {file}).",

  // ── scoring-section ──
  "Must be met. Failing one also flags the vendor at the mandatory gate.":
    "يجب استيفاؤه. وعدم استيفاء أي متطلب إلزامي يُعلِّم المورّد عند بوابة المتطلبات الإلزامية.",
  "Strongly influences the score.": "يؤثر بقوة في الدرجة.",
  "Nice to have; small influence.": "يُستحسن توفره؛ تأثيره محدود.",
  "How a vendor's compliance % is calculated from its findings. {app} computes it; the AI never picks the number.":
    "كيف تُحتسب نسبة امتثال المورّد من نتائجه. يحسبها {app}، ولا يختار الذكاء الاصطناعي الرقم أبدًا.",
  "Reset to defaults": "استعادة القيم الافتراضية",
  "Weight per priority": "الوزن حسب الأولوية",
  "{priority} weight": "وزن «{priority}»",
  "Decrease {label}": "تقليل {label}",
  "Increase {label}": "زيادة {label}",
  "At least one weight must be above 0, otherwise every score is 0%.":
    "يجب أن يكون وزن واحد على الأقل أكبر من 0، وإلا فستكون كل الدرجات 0%.",
  "Credit for “partially compliant”": "النسبة المحتسبة لحالة «مطابق جزئيًا»",
  "{n} percent": "{n} بالمئة",
  "A requirement that is only partly met earns this share of its weight. Example: 27″ display requested at 2K, offered at HD → partial.":
    "المتطلب المستوفى جزئيًا يحصل على هذه النسبة من وزنه. مثال: طُلبت شاشة 27 بوصة بدقة 2K، وقُدّمت بدقة HD ← جزئي.",
  "Live example": "مثال مباشر",
  "A vendor with 10 findings. Change the settings above and watch the score.":
    "مورّد لديه 10 نتائج. غيّر الإعدادات أعلاه وتابع تغيّر الدرجة.",
  "Sample findings and points": "نتائج نموذجية ونقاطها",
  "Req.": "المتطلب",
  Finding: "النتيجة",
  Points: "النقاط",
  compliance: "الامتثال",
  "Example compliance score": "درجة الامتثال في المثال",
  "{n} mandatory failures: flagged at the gate": {
    one: "إخفاق إلزامي واحد: يُعلَّم المورّد عند البوابة",
    two: "إخفاقان إلزاميان: يُعلَّم المورّد عند البوابة",
    few: "{n} إخفاقات إلزامية: يُعلَّم المورّد عند البوابة",
    many: "{n} إخفاقًا إلزاميًا: يُعلَّم المورّد عند البوابة",
    other: "{n} إخفاق إلزامي: يُعلَّم المورّد عند البوابة",
  },

  // ── demo-section ──
  "Tools for trying {app} without real vendors. They change data, so each one asks first.":
    "أدوات لتجربة {app} دون موردين حقيقيين. تُغيّر هذه الأدوات البيانات، لذا يطلب كل منها التأكيد أولًا.",
  "Play a vendor: pick an open tender and submit a commercial and a technical proposal.":
    "أدِّ دور مورّد: اختر مناقصة مفتوحة وقدّم عرضًا تجاريًا وعرضًا فنيًا.",
  "Open simulator": "فتح المحاكي",
  "Sample data": "البيانات النموذجية",
  // ‎ keeps the slash of "test-inputs/" after the name in right-to-left text.
  "The sample files (test-inputs/) aren't available on this server.":
    "الملفات النموذجية (test-inputs/‎) غير متوفرة على هذا الخادم.",
  "Loaded: {projects} sample projects with {proposals} vendor proposals. Reloading replaces them; your own projects are never touched.":
    "تم التحميل: {projects} من المشاريع النموذجية و{proposals} من عروض الموردين. إعادة التحميل تستبدلها، ولا تُمسّ مشاريعك الخاصة أبدًا.",
  "Two sample tenders (cargo X-ray scanners with four vendor proposals, and a Port Community System), plus sample standards. Your own data is kept.":
    "مناقصتان نموذجيتان (أجهزة فحص الشحنات بالأشعة السينية مع أربعة عروض من الموردين، ونظام مجتمع الميناء)، إضافة إلى معايير نموذجية. تبقى بياناتك الخاصة كما هي.",
  "Reload sample data": "إعادة تحميل البيانات النموذجية",
  "Load sample data": "تحميل البيانات النموذجية",
  "Reset all data": "إعادة تعيين جميع البيانات",
  "Delete every project, standard, vendor, proposal and uploaded file. Your profile and settings are kept.":
    "حذف كل المشاريع والمعايير والموردين والعروض والملفات المرفوعة. يُحتفظ بملفك الشخصي وإعداداتك.",
  "Reload the sample data?": "إعادة تحميل البيانات النموذجية؟",
  "Load the sample data?": "تحميل البيانات النموذجية؟",
  "The sample projects are deleted and created again, with their proposals. Your own projects and standards are not changed.":
    "تُحذف المشاريع النموذجية وعروضها ثم تُنشأ من جديد. لا تتغير مشاريعك ومعاييرك الخاصة.",
  "Adds two sample tenders, four vendors with proposals and two sample standards. Standards you already have with the same code (e.g. CITS-2026) are reused, not changed.":
    "يضيف مناقصتين نموذجيتين، وأربعة موردين مع عروضهم، ومعيارين نموذجيين. المعايير الموجودة لديك بالرمز نفسه (مثل CITS-2026) يُعاد استخدامها دون تغيير.",
  Reload: "إعادة التحميل",
  "Sample data loaded": "تم تحميل البيانات النموذجية",
  "{projects} projects, {proposals} proposals.": "المشاريع: {projects}، العروض: {proposals}.",
  "Couldn't load the sample data.": "تعذّر تحميل البيانات النموذجية.",
  "Remove the sample data?": "إزالة البيانات النموذجية؟",
  "Sample projects and their proposals are deleted, with sample standards and vendors that nothing else uses. Your own data stays.":
    "تُحذف المشاريع النموذجية وعروضها، مع المعايير والموردين النموذجيين غير المستخدمين في أي مكان آخر. تبقى بياناتك الخاصة.",
  "Remove sample data": "إزالة البيانات النموذجية",
  "Removed {n} sample projects.": {
    zero: "لم يُزَل أي مشروع نموذجي.",
    one: "أُزيل مشروع نموذجي واحد.",
    two: "أُزيل مشروعان نموذجيان.",
    few: "أُزيلت {n} مشاريع نموذجية.",
    many: "أُزيل {n} مشروعًا نموذجيًا.",
    other: "أُزيل {n} مشروع نموذجي.",
  },
  "Reset all data?": "إعادة تعيين جميع البيانات؟",
  "Every project, standard, vendor, proposal and uploaded file is permanently deleted. This can't be undone.":
    "تُحذف كل المشاريع والمعايير والموردين والعروض والملفات المرفوعة نهائيًا. لا يمكن التراجع عن ذلك.",
  "All data deleted": "تم حذف جميع البيانات",
  "{projects} projects and {standards} standards removed.":
    "المشاريع المحذوفة: {projects}، والمعايير المحذوفة: {standards}.",
};
