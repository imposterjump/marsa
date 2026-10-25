import type { Dictionary } from "../core";

/** Arabic for the app frame: sidebar, top bar, profile, page titles (see ../README.md). */
export const shell: Dictionary = {
  // ── nav ──
  "Tenders, RFPs and proposals": "المناقصات وطلبات العروض والعروض",
  "Your evaluation rules": "قواعد التقييم الخاصة بك",
  "Profile, appearance and AI": "الملف الشخصي والمظهر والذكاء الاصطناعي",
  "New project": "مشروع جديد",
  "AI analysis": "التحليل بالذكاء الاصطناعي",
  "Vendor simulator": "محاكي الموردين",
  "UI kit": "عناصر الواجهة",

  // ── sidebar ──
  Sidebar: "الشريط الجانبي",
  "Expand sidebar": "توسيع الشريط الجانبي",
  "Collapse sidebar": "طي الشريط الجانبي",
  "{app}: projects": "{app}: المشاريع",
  "PoC — Demo environment": "نموذج تجريبي — بيئة العرض",
  "Main navigation": "التنقل الرئيسي",
  Workspace: "مساحة العمل",
  "Demo AI": "ذكاء اصطناعي تجريبي",
  "Mock mode": "الوضع التجريبي",
  "Live · Anthropic API": "مباشر · Anthropic API",
  "API key missing": "مفتاح API غير موجود",
  "Add ANTHROPIC_API_KEY to .env": "أضف ANTHROPIC_API_KEY إلى ملف ‎.env",

  // ── topbar, app-shell ──
  "Open navigation": "فتح قائمة التنقل",
  Breadcrumb: "مسار التنقل",
  "Skip to content": "الانتقال إلى المحتوى",
  Navigation: "التنقل",
  "Switch to Arabic": "التبديل إلى العربية",
  "Switch to English": "التبديل إلى الإنجليزية",

  // ── theme-toggle ──
  Light: "فاتح",
  Dark: "داكن",
  System: "حسب النظام",
  "Theme: {theme}. Change theme": "السمة: {theme}. تغيير السمة",
  Appearance: "المظهر",

  // ── customer-chip, title-sync ──
  Guest: "ضيف",
  "Account: {name}": "الحساب: {name}",
  "Account: {name}, {organization}": "الحساب: {name}، {organization}",
  "No organization set": "لم تُحدَّد جهة",
  "Edit profile": "تعديل الملف الشخصي",

  // ── brand-mark ──
  "Emblem of Sharjah": "شعار الشارقة",

  // ── profile-dialog ──
  Hello: "مرحبًا",
  "Please enter your name.": "يُرجى إدخال اسمك.",
  "Keep it under {n} characters.": "يجب ألا يتجاوز {n} حرفًا.",
  "Welcome aboard, {name}.": "أهلًا وسهلًا، {name}.",
  "Profile updated.": "تم تحديث الملف الشخصي.",
  "Couldn't save. Try again.": "تعذّر الحفظ. حاول مرة أخرى.",
  "Welcome to {app}": "مرحبًا بك في {app}",
  "Evaluate vendor proposals against your RFP and standards, with evidence behind every finding.":
    "قيّم عروض الموردين مقابل طلب العروض والمعايير الخاصة بك، مع دليل يدعم كل نتيجة.",
  "Tell us who you are": "عرّفنا بنفسك",
  "No account needed. Your name and organization personalise the workspace and the tab title.":
    "لا حاجة إلى حساب. يُستخدم اسمك وجهتك لتخصيص مساحة العمل وعنوان علامة التبويب.",
  "Shown in the header, the greeting and the browser tab.":
    "يظهر في الشريط العلوي وفي التحية وفي علامة تبويب المتصفح.",
  "Your name": "اسمك",
  "e.g. Layla Mansour": "مثال: ليلى منصور",
  Organization: "الجهة",
  "{greeting}, {name}: that's how {app} will greet you.": "{greeting}، {name}: هكذا سيحيّيك {app}.",
  "e.g. Northern Gulf Ports Authority": "مثال: هيئة موانئ الخليج الشمالية",
  "Skip for now": "تخطٍّ الآن",
  "Enter workspace": "الدخول إلى مساحة العمل",

  // ── run-pill ──
  "View results": "عرض النتائج",
  "Analysis complete · {code}": "اكتمل التحليل · {code}",
  "Analysis finished with errors · {code}": "انتهى التحليل مع أخطاء · {code}",
  "Analysis failed · {code}": "فشل التحليل · {code}",
  "Analysis cancelled · {code}": "أُلغي التحليل · {code}",
  Analysing: "جارٍ التحليل",
  "steps finished for {code}": "خطوات منتهية لـ {code}",
};
