---
title: "التثبيت المحلي"
---

تُثبت المعاينة محليًا في Chrome المكتبي. لا تحتاج حساب Alcydeo أو برامج إضافية. لا توجد صفحة في Chrome Web Store بعد.

[تنزيل المعاينة](https://github.com/drslid/Alcydeo/releases/tag/v0.2.0) — v0.2.0

1. نزّل ملف ZIP الخاص بـChrome من GitHub Releases وفكّه في مجلد ستحتفظ به.
2. افتح chrome://extensions وفعّل وضع المطور ثم اختر تحميل إضافة غير مضغوطة. اختر المجلد الذي يحتوي على manifest.json.
3. ثبّت Alcydeo في شريط الأدوات وحدّث صفحة الفيديو. ابدأ التشغيل وافتح الإضافة واختر جودة متاحة.

### GitHub / MIT

Node 24.22.2 · pnpm 12.5.1

```sh
git clone https://github.com/drslid/Alcydeo.git
cd Alcydeo
pnpm install --frozen-lockfile
pnpm build:chrome
```

`apps/extension/.output/chrome-mv3`

بعد التحديث أعد تحميل Alcydeo وصفحات الفيديو المفتوحة سابقًا. يوقف الإصدار 0.1.39 مراقبي الصفحات القدامى عند اختفاء مراسلة Chrome، ويصلح خطأ sendMessage أو السياق غير الصالح. يمكن مسح الأخطاء السابقة من لوحة أخطاء الإضافة.
