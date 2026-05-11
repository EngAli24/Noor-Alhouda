const CACHE = "noor-cache-v7";

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE).then(cache =>
      cache.addAll([
        "/",
        "/index.html",
        "/html/login.html",
        "/html/profile.html",
        "/html/ramadan.html",
        "/html/azkar.html",
        "/html/challenge.html",
        "/html/wird.html",
        "/css/style.css",
        "/js/auth.js",
        "/js/script.js",
        "/js/wird.js",
        "/js/azkar.js",
        "/js/challenges.js",
        "/js/profile.js",
        "/js/ramadan.js",
        "/js/adhan.mp3"
      ])
    ).catch(err => console.error("Cache addAll failed:", err))
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request))
  );
});