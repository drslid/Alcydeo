---
title: "本地安装"
---

预览版通过桌面 Chrome 本地安装。无需 Alcydeo 账号或其他软件。目前尚无 Chrome 应用商店页面。

[下载预览版](https://github.com/drslid/Alcydeo/releases/tag/v0.2.0) — v0.2.0

1. 从 GitHub Releases 下载 Chrome ZIP，解压至您将长期保留的文件夹。
2. 打开 chrome://extensions，启用开发者模式并选择“加载已解压的扩展程序”。选择包含 manifest.json 的文件夹。
3. 固定 Alcydeo 并刷新视频页面。开始播放，打开扩展程序，选择可用画质。

### GitHub / MIT

Node 24.22.2 · pnpm 12.5.1

```sh
git clone https://github.com/drslid/Alcydeo.git
cd Alcydeo
pnpm install --frozen-lockfile
pnpm build:chrome
```

`apps/extension/.output/chrome-mv3`

更新后请重新加载 Alcydeo 和已打开的视频页面。0.1.39 在 Chrome 消息接口消失时停止旧页面观察器，修复 sendMessage/上下文失效错误。历史错误可在 Chrome 扩展程序的错误面板中清除。
