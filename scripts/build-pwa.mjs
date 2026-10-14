import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { deflateSync } from 'node:zlib';
import path from 'node:path';

// PNG icons generated locally, without an image service or external asset dependency.
const crc32 = bytes => {
  let crc = 0xffffffff;
  for (const byte of bytes) { crc ^= byte; for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0); }
  return (crc ^ 0xffffffff) >>> 0;
};
function chunk(type, data) {
  const name = Buffer.from(type); const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([len, name, data, crc]);
}
function icon(size) {
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const u = x / size * 192, v = y / size * 192;
    const ink = (u >= 48 && u < 67 && v >= 51 && v < 141) || (u >= 81 && u < 145 && v >= 51 && v < 70) || (u >= 103 && u < 122 && v >= 70 && v < 141);
    const offset = y * (size * 3 + 1) + 1 + x * 3;
    raw.set(ink ? [255, 230, 120] : [109, 67, 219], offset);
  }
  const header = Buffer.alloc(13); header.writeUInt32BE(size, 0); header.writeUInt32BE(size, 4); header[8] = 8; header[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
await mkdir('dist/icons', { recursive: true });
for (const size of [192, 512]) await writeFile(`dist/icons/icon-${size}.png`, icon(size));
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
  return nested.flat();
}
const files = (await walk('dist')).filter(file => !file.endsWith('sw.js')).sort();
const hash = createHash('sha256');
for (const file of files) hash.update(await readFile(file));
const version = hash.digest('hex').slice(0, 12);
const assets = files.map(file => './' + path.relative('dist', file).replaceAll('\\', '/'));
const sw = `// Generated from this build's complete local asset list.
const PREFIX = 'it-words-';
const SCOPE = self.registration.scope;
const CACHE = PREFIX + SCOPE + '${version}';
const ASSETS = ${JSON.stringify(assets)};
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS.map(asset => new URL(asset, SCOPE).href))));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(PREFIX + SCOPE) && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('message', event => { if (event.data?.type === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || !request.url.startsWith(SCOPE)) return;
  if (request.mode === 'navigate') {
    event.respondWith(caches.open(CACHE).then(cache => cache.match(new URL('./index.html', SCOPE).href)).then(cached => cached || fetch(request)));
    return;
  }
  // Static assets are identical regardless of Origin headers. Vite/hosts may
  // return Vary: Origin; module requests differ from install-time requests.
  event.respondWith(caches.open(CACHE).then(cache => cache.match(request, { ignoreVary: true })).then(cached => cached || fetch(request)));
});
`;
await writeFile('dist/sw.js', sw);
console.log(`PWA ${version}: precache ${assets.length} local files; icons generated.`);
