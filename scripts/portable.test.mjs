import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync, readdirSync} from 'node:fs';
import {resolve, relative, dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {Script} from 'node:vm';

const dist = resolve('dist');
const read = path => readFileSync(path, 'utf8');
function walk(dir) {
  return readdirSync(dir, {withFileTypes:true}).flatMap(entry =>
    entry.isDirectory() ? walk(resolve(dir, entry.name)) : [resolve(dir, entry.name)]);
}

test('the static build resolves its assets at a root and a GitHub Pages subdirectory', () => {
  for (const prefix of ['/', '/ai-machinery-atlas/']) {
    for (const file of walk(dist).filter(file => /\.(html|css)$/.test(file))) {
      const text = read(file);
      const refs = [...text.matchAll(/(?:src|href)="([^"]+)"/g), ...text.matchAll(/url\(["']?([^"')]+)["']?\)/g)];
      for (const [, ref] of refs) {
        if (/^(?:https?:|data:|#)/.test(ref)) continue;
        assert.ok(!ref.startsWith('/'), `root-bound asset: ${ref}`);
        const url = new URL(ref, 'https://example.test' + prefix + relative(dist, file));
        assert.ok(url.pathname.startsWith(prefix), `${ref} escapes ${prefix}`);
        const local = resolve(dist, '.' + url.pathname.slice(prefix.length - 1));
        const target = url.pathname.endsWith('/') ? resolve(local, 'index.html') : local;
        assert.ok(existsSync(target), `${relative(dist,file)} refers to missing ${ref}`);
      }
    }
  }
});

test('film runs from local resources and ships parseable authored JavaScript', () => {
  const html = read(resolve(dist, 'ascent.html'));
  assert.doesNotMatch(html, /srcdoc=|window\.openai|<script[^>]+src="https?:/);
  assert.match(html, /src="\.\/film\/narration.webm"/);
  assert.ok(readFileSync(resolve(dist, 'film/narration.webm')).byteLength > 100000);
  new Script(read(resolve(dist, 'film/ascent.js')), {filename:'ascent.js'});
  assert.doesNotMatch(read(resolve(dist, 'film/ascent.js')), /window\.openai|eval\(/);
});

test('the standalone app retains base-relative film navigation and portable metadata', () => {
  assert.match(read('src/Atlas.tsx'), /import\.meta\.env\.BASE_URL}ascent\.html/);
  assert.match(read('src/Atlas.tsx'), /window\.location\.hash/);
  assert.match(read('vite.config.ts'), /base:'\.\/'/);
  const packageJson = JSON.parse(read('package.json'));
  assert.equal(packageJson.license, 'MIT');
  assert.match(packageJson.version, /^\d+\.\d+\.\d+$/);
  assert.equal(JSON.parse(read('package-lock.json')).packages[''].version, packageJson.version);
  assert.ok(read('CITATION.cff').includes('version: ' + packageJson.version));
  for (const file of walk(dist).filter(file => /\.(html|css|js|json|md|txt)$/.test(file))) {
    assert.doesNotMatch(read(file), /appgprj_[a-z0-9]+|\/Users\/birtukan|git\.chatgpt-team\.site|siwc_bypass_bearer_token/);
  }
});

test('source and static distributions retain exact license texts', () => {
  assert.match(read('LICENSE'), /MIT License/);
  assert.equal(read('LICENSE'), read(resolve(dist, 'LICENSE.txt')));
  for (const item of JSON.parse(read('license-inventory.json'))) {
    const text = readFileSync(item.file);
    assert.equal(createHash('sha256').update(text).digest('hex'), item.sha256, item.file);
    assert.deepEqual(text, readFileSync(resolve(dist, item.file)), item.file);
  }
});
