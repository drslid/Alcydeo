---
title: "مقامی تنصیب"
---

پری ویو ڈیسک ٹاپ Chrome میں مقامی طور پر نصب ہوتا ہے۔ Alcydeo اکاؤنٹ یا اضافی سافٹ ویئر درکار نہیں۔ ابھی Chrome Web Store کا صفحہ موجود نہیں ہے۔

[پری ویو ڈاؤن لوڈ کریں](https://github.com/drslid/Alcydeo/releases/tag/v0.2.0) — v0.2.0

1. GitHub Releases سے Chrome ZIP ڈاؤن لوڈ کرکے مستقل رکھنے والے فولڈر میں نکالیں۔
2. chrome://extensions کھولیں، ڈیولپر موڈ فعال کریں اور ان پیک شدہ ایکسٹینشن لوڈ کریں منتخب کریں۔ manifest.json والا فولڈر چنیں۔
3. Alcydeo پن کریں اور ویڈیو کا صفحہ تازہ کریں۔ ویڈیو چلائیں، ایکسٹینشن کھولیں اور دستیاب معیار چنیں۔

### GitHub / MIT

Node 24.22.2 · pnpm 12.5.1

```sh
git clone https://github.com/drslid/Alcydeo.git
cd Alcydeo
pnpm install --frozen-lockfile
pnpm build:chrome
```

`apps/extension/.output/chrome-mv3`

اپ ڈیٹ کے بعد Alcydeo اور پہلے سے کھلے ویڈیو صفحات دوبارہ لوڈ کریں۔ 0.1.39 میں Chrome پیغام API غائب ہونے پر پرانے صفحہ نگران رک جاتے ہیں اور sendMessage/غلط سیاق کی خرابی درست ہوتی ہے۔ پرانے ریکارڈ Chrome کے ایکسٹینشن خرابی پینل میں صاف کر سکتے ہیں۔
