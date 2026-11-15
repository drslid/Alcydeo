---
title: "التثبيت المحلي"
---

اختر حزمة Chrome أو Firefox للحاسوب. لا حاجة إلى حساب Alcydeo أو برنامج إضافي. لا توجد صفحة رسمية في متجر أي منهما بعد.

[تنزيل Alcydeo](https://github.com/drslid/Alcydeo/releases/tag/v1.0.0) — v1.0.0

1. نزّل ملف ZIP الخاص بـChrome من GitHub Releases وفكّه في مجلد ستحتفظ به.
2. افتح chrome://extensions وفعّل وضع المطور ثم اختر تحميل إضافة غير مضغوطة. اختر المجلد الذي يحتوي على manifest.json.
3. ثبّت Alcydeo في شريط الأدوات وحدّث صفحة الفيديو. ابدأ التشغيل وافتح الإضافة واختر جودة متاحة.

### Firefox

Firefox 153+: حمّل ملف ZIP الخاص به عبر about:debugging ← هذا Firefox ← تحميل إضافة مؤقتة. ينتهي التثبيت عند إعادة تشغيل Firefox؛ التثبيت الدائم يتطلب توقيع Mozilla.

لـ Firefox 153+ حزمة مستقلة دون YouTube. تسجيل تبويب Chrome وGoogle Cast وAirPlay غير متاحة في Firefox. تعتمد المعالجة المحلية على ترميزاته؛ يوضح دليل Firefox النطاق المختبر.

تتضمن حزمة تطوير Chrome دعم YouTube التجريبي. تستبعد حزمة تجهيز متجر Chrome وحزمة Firefox موقع YouTube. تثبيت ZIP في Firefox مؤقت؛ لا يُدّعى وجود XPI موقّع أو موافقة متجر.

تثبيت جديد أو إعادة ضبط: أربعة ملفات متزامنة، والتنزيل متعدد الأجزاء مفعّل بأربعة اتصالات لكل ملف متوافق. تبقى الخيارات السابقة محفوظة. يمكن تعديل الحدين؛ لا ضمان لتسريع جميع المصادر.

### GitHub / MIT

Node 24.22.2 · pnpm 12.5.1

```sh
git clone https://github.com/drslid/Alcydeo.git
cd Alcydeo
pnpm install --frozen-lockfile
pnpm build:chrome
pnpm build:firefox
```

Chrome: `apps/extension/.output/chrome-mv3`

Firefox: `apps/extension/.output/firefox-mv3`

بعد التحديث أعد تحميل Alcydeo وصفحات الفيديو المفتوحة سابقًا. يوقف الإصدار 0.1.39 مراقبي الصفحات القدامى عند اختفاء مراسلة Chrome، ويصلح خطأ sendMessage أو السياق غير الصالح. يمكن مسح الأخطاء السابقة من لوحة أخطاء الإضافة.
