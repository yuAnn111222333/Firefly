# 萤星 · Web 版

萤星单词本（CET4 3000 词 + 雅思 2972 词）的网页版本，与 Android 版是同一套页面，
额外做了三件事：挂上 PWA（可加到主屏、离线可用）、适配手机浏览器视口、给 iPad 收窄排版。

**网页端也要激活**：打开先显示设备码，把设备码发给作者换一个激活码，激活后才能用。
设备码来自浏览器指纹，清缓存、重装 PWA 都不用重新申请；换浏览器或换设备才需要。

## 目录

| 文件 | 说明 |
| --- | --- |
| `index.html` | 整个应用（样式、脚本、两个词库全部内嵌），约 524 KB |
| `manifest.webmanifest` | PWA 清单：名称、图标、独立窗口、竖屏 |
| `sw.js` | Service Worker：页面网络优先、离线回缓存 |
| `icons/` | 192 / 512 / maskable / apple-touch 图标 |
| `404.html` | 找不到路径时的兜底页 |
| `.nojekyll` | 告诉 GitHub Pages 别走 Jekyll 构建 |

`index.html` 是**生成物**，不要手改。源页面在 `android/stable/assets/index.html`，
补丁脚本在 `web-tools/build_web.py`：

```bash
python web-tools/build_web.py      # 重新生成 web/index.html
python web-tools/build_web.py --check
```

脚本会断言每处补丁只命中一次，源页面结构变了会直接报错退出，不会悄悄生成半成品。

## 与 Android 版的差异

| 项 | Android | Web |
| --- | --- | --- |
| 激活闸门 | 设备码 + ECDSA 签名 | 同一套，设备码换成浏览器指纹 |
| 激活码格式 | 永久码 / 限期码 | 同左 |
| 视口高度 | `100vh` | 追加 `100dvh`，地址栏收起时不留空档 |
| 离线 | 资源打包在 APK 里 | Service Worker 缓存首屏 |
| 安装 | 装 APK | 浏览器「添加到主屏幕」 |

网页端的设备码**不能**用 localStorage 里存一个随机串：iOS 上 Safari 和「添加到主屏幕」
的 PWA 存储是隔离的，那样加一次主屏幕就要重新找作者要一次码。所以改成对浏览器指纹
（UA / 平台 / 语言 / 时区 / 屏幕尺寸 / CPU 核数 / 触点数）取 SHA-256 前 10 位。
刻意不含 `devicePixelRatio` —— 浏览器缩放会改它，按一次 Ctrl+加号设备码就变了。

APK 仍然优先用原生的 `ANDROID_ID`，指纹只是网页端的退路，所以已经发出去的激活码不受影响。

给网页端发码（限期码，到期自动退回激活面板）：

```bash
python android/tools/owner_issue.py issue 2E69A-1149F --days 365
```

不带 `--days` 就是永久码，和以前给 APK 发的一样。

## 发布到 GitHub Pages

> 日常更新**不要**单独跑这一节。两端共用一个源页面，改完应该跑工程根目录的
> `bash release.sh`：它会依次生成网页、构建 APK、校验、冒烟，最后才推送。
> 只跑这里等于「网页更新了、APK 还是旧的」。下面这些是它内部用的步骤，出问题时手动排查用。

```bash
GITHUB_TOKEN=<你的 token> bash web-tools/deploy.sh <github用户名> <仓库名>
```

脚本会建仓库（如果还没有）、推 `main`、开 Pages。token 只从环境变量读，不落盘。
首次构建 30~90 秒，之后地址是 `https://<用户名>.github.io/<仓库名>/`。

改完页面再发一版：

```bash
python web-tools/build_web.py && GITHUB_TOKEN=<token> bash web-tools/deploy.sh <用户名> <仓库名>
```

## 本地预览

```bash
cd web && python -m http.server 8787
# 打开 http://127.0.0.1:8787/
```

用 `file://` 直接双击打开也能跑（Service Worker 会跳过），但没有 PWA 和离线缓存。

## 已知取舍

- **发音**：正式版的 Java 壳里没有 TTS，Web 版也没接 `speechSynthesis`，两边一致（都没有）。
- **数据**：学习进度存在浏览器 `localStorage`，换浏览器/清缓存会重来；和 APK 版不互通。
- **截图**：无头浏览器不推进合成层动画，`#view.view-in` 的入场动画会停在半透明帧。
  `web-tools/_shot.html` 里对截图单独关掉了这个动画，页面本身没动。
