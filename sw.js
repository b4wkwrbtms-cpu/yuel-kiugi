/* 유엘이키우기 오프라인 저장
   - 게임 화면(index.html): 새 버전을 먼저 찾아보고, 인터넷이 없으면 저장본으로 연다.
   - 성경 본문·아이콘·글꼴: 한 번 받으면 저장본을 쓴다(성경은 버전이 바뀌어도 지우지 않는다). */
const V = 'yuel-mz-y1', BIBLE = 'yuel-bible';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('yuel-') && k !== V && k !== BIBLE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const keep = (name, req, res) => { if (res && (res.ok || res.type === 'opaque')) { const cp = res.clone(); caches.open(name).then(c => c.put(req, cp)); } return res; };
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url), same = u.origin === location.origin;
  if (r.mode === 'navigate' || (same && /\/(index\.html)?$/.test(u.pathname))) {
    e.respondWith(fetch(r).then(res => keep(V, './index.html', res)).catch(() => caches.match('./index.html').then(x => x || caches.match('./'))));
    return;
  }
  if (same && (u.pathname.includes('/bible/') || u.pathname.includes('/fonts/'))) { e.respondWith(caches.open(BIBLE).then(c => c.match(r)).then(hit => hit || fetch(r).then(res => keep(BIBLE, r, res)))); return; }
  if (same || /(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) {
    e.respondWith(caches.match(r).then(hit => hit || fetch(r).then(res => keep(V, r, res))));
  }
});
