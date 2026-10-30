# 萤星 · Web 版

萤星单词本（CET4 3000 词 + 雅思 2972 词）的网页版本，与 Android 版是同一套页面，
额外做了三件事：跳过设备激活闸门、挂上 PWA（可加到主屏、离线可用）、适配手机浏览器视口。

打开就能用，不需要注册、不联网也能跑（词库全内嵌在 `index.html` 里）。

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
| 激活闸门 | 设备码 + ECDSA 签名 | 直接放行（`WEB_FREE = true`） |
| 视口高度 | `100vh` | 追加 `100dvh`，地址栏收起时不留空档 |
| 离线 | 资源打包在 APK 里 | Service Worker 缓存首屏 |
| 安装 | 装 APK | 浏览器「添加到主屏幕」 |

Web 版跳过闸门的原因：浏览器里没有 `ANDROID_ID`，设备码退化成每个浏览器随机生成的
一串 id，闸门在这里等于自己给自己发码，没有意义。要恢复成需要激活的私发版本，
把 `web-tools/build_web.py` 里的 `const WEB_FREE = true;` 改成 `false` 重新生成即可。

## 发布到 GitHub Pages

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
