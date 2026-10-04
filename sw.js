const CACHE_NAME = "community-ledger-v8";

const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/app/login.html",
  "/app/onboarding.html",
  "/app/dashboard.html",
  "/app/transactions.html",
  "/app/categories.html",
  "/app/reports.html",
  "/app/members.html",
  "/app/profile.html",
  "/css/app.css",
  "/css/landing.css",
  "/js/config.js",
  "/js/supabaseClient.js",
  "/js/auth.js",
  "/js/community.js",
  "/js/db.js",
  "/js/app.js",
  "/js/guard.js",
  "/js/pwa.js",
  "/manifest.json",
  "/assets/icons/icon-192.png",
  "/assets/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // ปล่อยผ่าน request ข้าม origin (Supabase, CDN) ให้ browser จัดการตามปกติ
  // ไม่แคชข้อมูลการเงิน/ข้อมูลจริงจาก Supabase เด็ดขาด
  if (url.origin !== self.location.origin) return;
  if (event.request.method !== "GET") return;

  const isPage = event.request.mode === "navigate" || url.pathname.endsWith(".html");

  if (isPage) {
    // network-first: พยายามเอาโค้ด/หน้าล่าสุดก่อนเสมอ ออฟไลน์ค่อย fallback ไปแคช
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // cache-first สำหรับไฟล์ static (css/js/icons) โหลดเร็วขึ้นและใช้ได้ตอนออฟไลน์
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
          return res;
        })
      );
    })
  );
});
