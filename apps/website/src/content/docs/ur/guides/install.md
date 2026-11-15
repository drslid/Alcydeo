---
title: "مقامی تنصیب"
---

ڈیسک ٹاپ Chrome یا Firefox پیکیج منتخب کریں۔ Alcydeo اکاؤنٹ یا اضافی سافٹ ویئر درکار نہیں۔ ابھی کسی کی باضابطہ Store فہرست نہیں ہے۔

[Alcydeo ڈاؤن لوڈ کریں](https://github.com/drslid/Alcydeo/releases/tag/v1.0.0) — v1.0.0

1. GitHub Releases سے Chrome ZIP ڈاؤن لوڈ کرکے مستقل رکھنے والے فولڈر میں نکالیں۔
2. chrome://extensions کھولیں، ڈیولپر موڈ فعال کریں اور ان پیک شدہ ایکسٹینشن لوڈ کریں منتخب کریں۔ manifest.json والا فولڈر چنیں۔
3. Alcydeo پن کریں اور ویڈیو کا صفحہ تازہ کریں۔ ویڈیو چلائیں، ایکسٹینشن کھولیں اور دستیاب معیار چنیں۔

### Firefox

Firefox 153+: about:debugging ← یہ Firefox ← عارضی ایڈ آن لوڈ کریں سے Firefox ZIP منتخب کریں۔ Firefox دوبارہ شروع کرنے پر تنصیب ختم ہوتی ہے؛ مستقل تنصیب کے لیے Mozilla کے دستخط درکار ہیں۔

Firefox 153+ کا الگ پیکیج YouTube کے بغیر ہے۔ Chrome ٹیب ریکارڈنگ، Google Cast اور AirPlay، Firefox میں دستیاب نہیں۔ مقامی پروسیسنگ اس کے کوڈیکس پر منحصر ہے؛ Firefox رہنما میں آزمودہ دائرہ درج ہے۔

Chrome ترقیاتی ZIP میں تجرباتی YouTube شامل ہے۔ الگ Chrome Store تیاری اور Firefox پیکیج میں YouTube شامل نہیں۔ Firefox ZIP کی تنصیب عارضی ہے؛ دستخط شدہ XPI یا Store منظوری کا دعویٰ نہیں۔

نئی تنصیب یا ترتیبات کی بحالی: چار بیک وقت فائلیں، موافق فائل کے لیے چار کنکشن والا ملٹی پارٹ فعال۔ موجودہ انتخاب محفوظ رہتے ہیں۔ دونوں حدیں قابل تبدیلی ہیں؛ ہر ماخذ پر رفتار بڑھنے کی ضمانت نہیں۔

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

اپ ڈیٹ کے بعد Alcydeo اور پہلے سے کھلے ویڈیو صفحات دوبارہ لوڈ کریں۔ 0.1.39 میں Chrome پیغام API غائب ہونے پر پرانے صفحہ نگران رک جاتے ہیں اور sendMessage/غلط سیاق کی خرابی درست ہوتی ہے۔ پرانے ریکارڈ Chrome کے ایکسٹینشن خرابی پینل میں صاف کر سکتے ہیں۔
