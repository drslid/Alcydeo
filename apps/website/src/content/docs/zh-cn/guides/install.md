---
title: "本地安装"
---

选择桌面 Chrome 或 Firefox 软件包。无需 Alcydeo 账号或其他软件。目前两个浏览器均无官方商店页面。

[下载 Alcydeo](https://github.com/drslid/Alcydeo/releases/tag/v1.0.0) — v1.0.0

1. 从 GitHub Releases 下载 Chrome ZIP，解压至您将长期保留的文件夹。
2. 打开 chrome://extensions，启用开发者模式并选择“加载已解压的扩展程序”。选择包含 manifest.json 的文件夹。
3. 固定 Alcydeo 并刷新视频页面。开始播放，打开扩展程序，选择可用画质。

### Firefox

Firefox 153+：通过 about:debugging → 此 Firefox → 临时载入附加组件，选择 Firefox ZIP。重启 Firefox 后安装失效；永久安装需要 Mozilla 签名。

Firefox 153+ 使用独立软件包，不包含 YouTube。Firefox 中不提供 Chrome 标签页录制、Google Cast 或 AirPlay。本地处理取决于浏览器支持的编解码器；Firefox 指南记录实际测试范围。

Chrome 开发 ZIP 包含实验性 YouTube 支持。独立的 Chrome 商店准备包和 Firefox 包均排除 YouTube。Firefox ZIP 仅供临时安装，不代表已签名 XPI 或商店审核通过。

全新安装或重置设置后：同时处理四个文件，兼容文件默认启用四连接分块下载。已有设置保留。两项上限均可调整，不保证所有来源都能提速。

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

更新后请重新加载 Alcydeo 和已打开的视频页面。0.1.39 在 Chrome 消息接口消失时停止旧页面观察器，修复 sendMessage/上下文失效错误。历史错误可在 Chrome 扩展程序的错误面板中清除。
