import { defineConfig } from 'vite';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  });
}
function credits() {
  return readFileSync('ASSETS.md','utf8')+'\n'+readFileSync('VENUE_ASSETS.md','utf8');
}

export default defineConfig({
  base: './',
  server: { port: 3000 },
  plugins: [{
    name: 'artist-credits',
    configureServer(server) {
      server.middlewares.use('/credits.txt',(_req,res)=>{
        res.setHeader('Content-Type','text/plain; charset=utf-8');res.end(credits());
      });
    }
  },{
    name:'offline-gig',
    apply:'build',
    closeBundle() {
      writeFileSync('dist/credits.txt',credits());
      const paths = files('dist').filter(p => !p.endsWith('sw.js'));
      const hash = createHash('sha256');
      for (const path of paths) hash.update(readFileSync(path));
      const id = 'tennis-ball-gig-' + hash.digest('hex').slice(0, 12);
      const urls = paths.map(p => './' + relative('dist', p).replaceAll('\\', '/'));
      writeFileSync('dist/sw.js', `
const CACHE = ${JSON.stringify(id)};
const FILES = ${JSON.stringify(urls)};
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('tennis-ball-gig-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    if (e.request.mode === 'navigate') {
      return await cache.match('./index.html') || fetch(e.request);
    }
    return await cache.match(e.request, {ignoreVary:true}) || fetch(e.request);
  }));
});`);
    }
  }]
});
