import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import vm from 'node:vm';

test('built service worker precaches every local dependency and serves navigation/assets offline', async () => {
  const source = await readFile(new URL('../dist/sw.js', import.meta.url), 'utf8');
  const handlers = {}, stores = new Map(); let online = true, fetches = 0, claimed = false;
  const scope = 'https://example.test/it-words/';
  const keyOf = request => typeof request === 'string' ? request : request.url;
  const caches = {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name);
      return { async addAll(urls) {
        for (const url of urls) {
          const relative = new URL(url).pathname.replace('/it-words/', '');
          await access(new URL(`../dist/${relative}`, import.meta.url));
          store.set(url, { ok: true, url, text: await readFile(new URL(`../dist/${relative}`, import.meta.url), 'utf8') });
        }
      }, async match(request) { return store.get(keyOf(request)); } };
    }, async keys() { return [...stores.keys()]; }, async delete(key) { return stores.delete(key); },
  };
  stores.set('another-app-cache', new Map()); stores.set('it-words-' + scope + 'old', new Map());
  const context = { URL, caches, self: { registration: { scope }, clients: { async claim() { claimed = true; } }, addEventListener(name, cb) { handlers[name] = cb; }, skipWaiting() {} }, async fetch() { fetches++; if (!online) throw new Error('offline'); return { ok: true }; } };
  vm.runInNewContext(source, context);
  const waitEvent = async name => { let work; handlers[name]({ waitUntil(p) { work = p; } }); await work; };
  await waitEvent('install'); await waitEvent('activate');
  assert.ok(claimed); assert.ok(stores.has('another-app-cache')); assert.ok(!stores.has('it-words-' + scope + 'old'));
  const store = [...stores.entries()].find(([name]) => name.startsWith('it-words-' + scope))[1];
  assert.ok(store.size >= 7);
  assert.ok([...store.keys()].some(k => k.endsWith('.js')));
  assert.ok([...store.keys()].some(k => k.endsWith('.css')));
  assert.ok([...store.keys()].some(k => k.endsWith('manifest.webmanifest')));
  online = false;
  async function request(url, mode = 'cors') { let result; handlers.fetch({ request: { method: 'GET', url, mode }, respondWith(p) { result = p; } }); return result; }
  const page = await request(scope, 'navigate'); assert.ok(page.text.includes('id="root"'));
  const cssUrl = [...store.keys()].find(url => url.endsWith('.css')); assert.ok((await request(cssUrl)).ok);
  const jsUrl = [...store.keys()].find(url => url.endsWith('.js')); assert.ok((await request(jsUrl)).ok);
  assert.equal(fetches, 0);
  assert.equal(await request('https://unrelated.test/x'), undefined);
});
