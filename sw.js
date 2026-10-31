/* 萤 Web 版 Service Worker
   整个应用就是一个 index.html（词库、样式、脚本全内嵌），所以缓存策略很简单：
   - 页面导航：先走网络拿新版，失败（离线）才用缓存 —— 保证更新能生效
   - 图标 / manifest / sw 自身：先给缓存，后台再更新
   改动缓存内容时把 VERSION 加一，旧的会在 activate 里清掉。 */
const VERSION = "v2";
const CACHE = "ying-" + VERSION;

const PRECACHE = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/apple-touch-icon.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE).catch(() => {}))   // 少一个文件也别整包失败
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;

  // 页面：网络优先，离线回缓存
  if (req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html")) {
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put("index.html", copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match("index.html").then(r => r || caches.match("./")))
    );
    return;
  }

  // 静态资源：缓存优先
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res && res.status === 200 && res.type === "basic") {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      }
      return res;
    }).catch(() => hit))
  );
});
