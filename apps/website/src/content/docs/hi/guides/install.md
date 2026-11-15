---
title: "स्थानीय स्थापना"
---

डेस्कटॉप Chrome या Firefox पैकेज चुनें। Alcydeo खाते या अतिरिक्त सॉफ़्टवेयर की ज़रूरत नहीं। अभी किसी का आधिकारिक Store पृष्ठ नहीं है।

[Alcydeo डाउनलोड करें](https://github.com/drslid/Alcydeo/releases/tag/v1.0.0) — v1.0.0

1. GitHub Releases से Chrome ZIP डाउनलोड करके ऐसे फ़ोल्डर में निकालें जिसे आप रखेंगे।
2. chrome://extensions खोलें, डेवलपर मोड चालू करें और अनपैक्ड एक्सटेंशन लोड करें चुनें। manifest.json वाला फ़ोल्डर चुनें।
3. Alcydeo को पिन करें और वीडियो पेज रीफ़्रेश करें। वीडियो चलाएँ, एक्सटेंशन खोलें और उपलब्ध गुणवत्ता चुनें।

### Firefox

Firefox 153+: about:debugging → यह Firefox → अस्थायी ऐड-ऑन लोड करें से Firefox ZIP चुनें। Firefox फिर शुरू करने पर स्थापना समाप्त हो जाती है; स्थायी स्थापना के लिए Mozilla का हस्ताक्षर चाहिए।

Firefox 153+ का अलग पैकेज YouTube के बिना है। Chrome टैब रिकॉर्डिंग, Google Cast और AirPlay Firefox में उपलब्ध नहीं हैं। स्थानीय प्रोसेसिंग उसके कोडेक पर निर्भर है; Firefox मार्गदर्शिका में परीक्षित दायरा है।

Chrome डेवलपमेंट ZIP में प्रयोगात्मक YouTube है। अलग Chrome Store तैयारी और Firefox पैकेज में YouTube नहीं है। Firefox ZIP स्थापना अस्थायी है; हस्ताक्षरित XPI या Store स्वीकृति का दावा नहीं।

नई स्थापना या सेटिंग रीसेट: चार एकसाथ फ़ाइलें, संगत फ़ाइल के लिए चार कनेक्शन वाला मल्टीपार्ट चालू। पहले की पसंद सुरक्षित रहती है। दोनों सीमाएँ बदली जा सकती हैं; हर स्रोत पर अधिक गति की गारंटी नहीं।

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

अपडेट के बाद Alcydeo और पहले से खुले वीडियो पृष्ठ फिर लोड करें। 0.1.39 में Chrome संदेश API हटने पर पुराने पृष्ठ पर्यवेक्षक रुकते हैं और sendMessage/अमान्य संदर्भ त्रुटि ठीक होती है। पुराने रिकॉर्ड Chrome के एक्सटेंशन त्रुटि पैनल में साफ कर सकते हैं।
