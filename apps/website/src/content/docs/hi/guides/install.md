---
title: "स्थानीय स्थापना"
---

प्रीव्यू डेस्कटॉप Chrome में स्थानीय रूप से स्थापित होता है। Alcydeo खाते या अतिरिक्त सॉफ़्टवेयर की ज़रूरत नहीं। अभी Chrome Web Store पेज उपलब्ध नहीं है।

[प्रीव्यू डाउनलोड करें](https://github.com/drslid/Alcydeo/releases/tag/v0.2.0) — v0.2.0

1. GitHub Releases से Chrome ZIP डाउनलोड करके ऐसे फ़ोल्डर में निकालें जिसे आप रखेंगे।
2. chrome://extensions खोलें, डेवलपर मोड चालू करें और अनपैक्ड एक्सटेंशन लोड करें चुनें। manifest.json वाला फ़ोल्डर चुनें।
3. Alcydeo को पिन करें और वीडियो पेज रीफ़्रेश करें। वीडियो चलाएँ, एक्सटेंशन खोलें और उपलब्ध गुणवत्ता चुनें।

### GitHub / MIT

Node 24.22.2 · pnpm 12.5.1

```sh
git clone https://github.com/drslid/Alcydeo.git
cd Alcydeo
pnpm install --frozen-lockfile
pnpm build:chrome
```

`apps/extension/.output/chrome-mv3`

अपडेट के बाद Alcydeo और पहले से खुले वीडियो पृष्ठ फिर लोड करें। 0.1.39 में Chrome संदेश API हटने पर पुराने पृष्ठ पर्यवेक्षक रुकते हैं और sendMessage/अमान्य संदर्भ त्रुटि ठीक होती है। पुराने रिकॉर्ड Chrome के एक्सटेंशन त्रुटि पैनल में साफ कर सकते हैं।
