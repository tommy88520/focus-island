// 拆掉舊的 service worker：網站放在 Vercel 時是 PWA 版，瀏覽器裡裝了 service worker，會一直拿快取的舊版網頁出來。
// 瀏覽器檢查更新時會抓到這支：清掉所有快取、解除註冊，再把開著的分頁重新載入成最新版。現在的網站不用 service worker。
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.registration.unregister();
      const windows = await self.clients.matchAll({ type: 'window' });
      windows.forEach((client) => client.navigate(client.url));
    })(),
  );
});
