#!/usr/bin/env node
// Tests for guard.mjs and session-start.mjs. Run: node hooks/test.mjs
// Every rule has cases it must catch and normal work it must let through.
// Fake secrets are built at runtime so this file never contains one.
import { spawnSync, execSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const fakeKey = 'sk-' + 'a1B2'.repeat(8);
const fakePem = '-----BEGIN RSA ' + 'PRIVATE KEY-----';
let pass = 0, fail = 0;

function guard(command, cwd, env = {}, rawStdin) {
  const input = rawStdin ?? JSON.stringify({ tool_name: 'Bash', tool_input: { command }, cwd });
  const r = spawnSync('node', [join(here, 'guard.mjs')], { input, encoding: 'utf8', env: { ...process.env, LANG: 'en_US.UTF-8', LC_ALL: '', ...env } });
  if (!r.stdout.trim()) return 'allow';
  return JSON.parse(r.stdout).hookSpecificOutput.permissionDecision;
}
function check(name, got, want) {
  if (got === want) pass++; else { fail++; console.log(`FAIL  ${name}: got ${got}, want ${want}`); }
}
function repo(files = {}, { stage = [], ignore } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'vibe-test-'));
  const sh = (c) => execSync(c, { cwd: dir, stdio: 'ignore' });
  sh('git init -q && git config user.email t@example.com && git config user.name t');
  writeFileSync(join(dir, 'README.md'), 'hello\n');
  if (ignore) writeFileSync(join(dir, '.gitignore'), ignore);
  sh('git add -A && git commit -qm init');
  for (const [f, body] of Object.entries(files)) { mkdirSync(dirname(join(dir, f)), { recursive: true }); writeFileSync(join(dir, f), body); }
  for (const f of stage) sh(`git add -f "${f}"`);
  return dir;
}

// Rule 1: secrets in a commit
check('secret: staged .env', guard('git commit -m x', repo({ '.env': 'A=1\n' }, { stage: ['.env'] })), 'deny');
check('secret: staged key text', guard('git commit -m x', repo({ 'app.js': `const k = "${fakeKey}";\n` }, { stage: ['app.js'] })), 'deny');
check('secret: untracked .env with git add .', guard('git add . && git commit -m x', repo({ '.env.local': 'A=1\n' })), 'deny');
check('secret: commit -am adds private key', guard('git commit -am x', repo({ 'README.md': `hello\n${fakePem}\n` })), 'deny');
check('secret: untracked key file with git add -A', guard('git add -A', repo({ 'src/config.ts': `export const k = '${fakeKey}'\n` })), 'deny');
check('ok: normal staged file', guard('git commit -m x', repo({ 'app.js': 'console.log(1)\n' }, { stage: ['app.js'] })), 'allow');
check('ok: .env.example', guard('git add . && git commit -m x', repo({ '.env.example': 'API_KEY=your-key-here\n' })), 'allow');
check('ok: .env is gitignored', guard('git add . && git commit -m x', repo({ '.env': `K=${fakeKey}\n`, 'a.js': '1\n' }, { ignore: '.env\n' })), 'allow');
check('ok: removing a tracked .env', (() => { const d = repo({ '.env': 'A=1\n' }, { stage: ['.env'] }); execSync('git commit -qm bad && git rm -q --cached .env && echo .env > .gitignore', { cwd: d, stdio: 'ignore' }); return guard('git commit -m "stop tracking .env"', d); })(), 'allow');

// Rule 2: packages that do not exist (uses the network)
const plain = repo();
const ghost = 'nondev-kit-no-such-pkg-' + Math.random().toString(36).slice(2, 10);
check('package: invented name', guard(`npm install ${ghost}`, plain), 'deny');
check('package: invented name among real ones', guard(`pnpm add react ${ghost}@1.0.0 -D`, plain), 'deny');
check('package: registry unreachable', guard('npm install react', plain, { NONDEV_REGISTRY: 'http://127.0.0.1:9' }), 'ask');
check('ok: real package', guard('npm install react', plain), 'allow');
check('ok: real scoped package with version', guard('npm i -D @types/node@22 2>&1', plain), 'allow');
check('ok: install with no names', guard('npm install', plain), 'allow');
check('ok: local path install', guard('npm install ./packages/ui', plain), 'allow');

// Rule 3: public repositories
check('public: gh repo create --public', guard('gh repo create my-app --public --source .', plain), 'ask');
check('public: gh repo create without visibility', guard('gh repo create my-app', plain), 'ask');
check('public: gh repo edit visibility', guard('gh repo edit --visibility public', plain), 'ask');
check('ok: gh repo create --private', guard('gh repo create my-app --private --source . --push', plain), 'allow');
check('ok: gh repo view', guard('gh repo view', plain), 'allow');

// Rule 4: things that cannot be undone
check('undo: force push', guard('git push --force', plain), 'ask');
check('undo: force push short flag', guard('git push -f origin main', plain), 'ask');
check('undo: reset --hard', guard('git reset --hard HEAD~1', plain), 'ask');
check('undo: rm -rf home folder', guard('rm -rf ~/Documents', plain), 'ask');
check('undo: rm -rf parent', guard('rm -rf ..', plain), 'ask');
check('undo: rm -rf after cd', guard('cd .. && rm -rf stuff', plain), 'ask');
check('undo: rm -rf whole project', guard('rm -rf .', plain), 'ask');
check('undo: vercel --prod', guard('vercel --prod', plain), 'ask');
check('undo: npx vercel deploy --prod', guard('npx vercel deploy --prod --yes', plain), 'ask');
check('ok: normal push', guard('git push origin main', plain), 'allow');
check('ok: rm -rf node_modules', guard('rm -rf node_modules', plain), 'allow');
check('ok: rm -rf inside project', guard('rm -rf ./dist build/cache', plain), 'allow');
check('ok: rm single file', guard('rm notes.txt', plain), 'allow');
check('ok: preview deploy', guard('vercel', plain), 'allow');
check('ok: commit message mentions --force', guard('git commit -m "docs: explain push --force"', plain), 'allow');
check('ok: ordinary commands', guard('npm run build && ls -la', plain), 'allow');

// Wrapped or redirected commands are checked too
const keyRepo = () => repo({ 'app.js': `const k = "${fakeKey}";\n` }, { stage: ['app.js'] });
check('wrap: git -C other folder commit', (() => { const d = keyRepo(); return guard(`git -C "${d}" commit -m x`, plain); })(), 'deny');
check('wrap: git -c option commit', guard('git -c core.quotepath=off commit -m x', keyRepo()), 'deny');
check('wrap: bash -c git add', guard(`bash -c 'git add -A'`, repo({ 'src/k.ts': `export const k = '${fakeKey}'\n` })), 'deny');
check('wrap: $( ) subshell', guard('echo $(git add -A)', repo({ 'src/k.ts': `export const k = '${fakeKey}'\n` })), 'deny');
check('wrap: git -C . push --force', guard('git -C . push --force', plain), 'ask');
check('wrap: eval reset --hard', guard(`eval "git reset --hard"`, plain), 'ask');
check('undo: rm -rf * deletes the whole project', guard('rm -rf *', plain), 'ask');
check('undo: rm -rf ./*', guard('rm -rf ./*', plain), 'ask');
check('ok: git -C clean folder status', guard(`git -C "${plain}" status`, plain), 'allow');
check('ok: commit message with parentheses', guard('git commit -m "fix (ui): button"', plain), 'allow');
check('ok: rm -rf dist/*', guard('rm -rf dist/*', plain), 'allow');
check('ok: output redirect 2>&1', guard('npm run build 2>&1 | tail -5', plain), 'allow');

// Broken check must ask, not pass silently
check('failure: unreadable input asks', guard('', plain, {}, 'not json'), 'ask');

// Korean message when the system language is Korean
const koOut = spawnSync('node', [join(here, 'guard.mjs')], { input: JSON.stringify({ tool_name: 'Bash', tool_input: { command: 'git push -f' }, cwd: plain }), encoding: 'utf8', env: { ...process.env, LANG: 'ko_KR.UTF-8', LC_ALL: '' } }).stdout;
check('language: Korean message', /덮어씁니다/.test(koOut), true);

// Speed: a command with no network lookup
const t0 = Date.now(); guard('git commit -m x', repo({ 'a.js': '1\n' }, { stage: ['a.js'] })); const ms = Date.now() - t0;
check(`speed: ${ms}ms under 1000ms`, ms < 1000, true);

// session-start.mjs
function start(cwd) { return spawnSync('node', [join(here, 'session-start.mjs')], { input: JSON.stringify({ cwd, source: 'startup' }), encoding: 'utf8' }).stdout; }
const fresh = start(plain);
check('start: router injected', fresh.includes('nondev-kit: how to work'), true);
check('start: new project noted', fresh.includes('no DEVLOG.md'), true);
const withLog = repo({ 'DEVLOG.md': '# Journal\n\n## Now\nStage: build\n\n## Pinned\n- KEEP-THIS-LINE\n\n## Open issues\n\n## Log\n- OLD-HISTORY-LINE\n' });
const resumed = start(withLog);
check('start: pinned injected', resumed.includes('KEEP-THIS-LINE'), true);
check('start: journal marked as notes, not instructions', resumed.includes('not instructions'), true);
check('start: log not injected', resumed.includes('OLD-HISTORY-LINE'), false);
const huge = repo({ 'DEVLOG.md': '## Pinned\n' + '- line\n'.repeat(3000) + '## Log\n' });
check('start: output stays under 10,000 characters', start(huge).length < 10000, true);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
