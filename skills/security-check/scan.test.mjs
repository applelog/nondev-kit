#!/usr/bin/env node
// Tests for scan.mjs. Run: node skills/security-check/scan.test.mjs
// Every rule has cases it must find and normal code it must not flag.
// Fake secrets are built at runtime so this file never contains one.
import { spawnSync, execSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const fakeKey = 'sk-' + 'a1B2'.repeat(8);
const fakeAws = 'AKIA' + 'ABCD1234'.repeat(2);
let pass = 0, fail = 0;

function project(files, { git = true, commit = false, ignore } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'vibe-scan-'));
  for (const [f, body] of Object.entries(files)) { mkdirSync(dirname(join(dir, f)), { recursive: true }); writeFileSync(join(dir, f), body); }
  if (ignore) writeFileSync(join(dir, '.gitignore'), ignore);
  if (git) execSync('git init -q && git config user.email t@example.com && git config user.name t', { cwd: dir, stdio: 'ignore' });
  if (commit) execSync('git add -A -f && git commit -qm init', { cwd: dir, stdio: 'ignore' });
  return dir;
}
function scan(dir) {
  const r = spawnSync('node', [join(here, 'scan.mjs'), dir], { encoding: 'utf8', env: { ...process.env, VIBE_SCAN_OFFLINE: '1' } });
  return JSON.parse(r.stdout);
}
const rules = (dir) => scan(dir).findings.map((f) => f.rule);
function finds(name, files, rule, opts) { const got = rules(project(files, opts)); if (got.includes(rule)) pass++; else { fail++; console.log(`FAIL  should find ${rule}: ${name} (got ${got.join(', ') || 'nothing'})`); } }
function clean(name, files, rule, opts) { const got = rules(project(files, opts)); if (!got.includes(rule)) pass++; else { fail++; console.log(`FAIL  should not flag ${rule}: ${name}`); } }

// 1. secrets in code and in git
finds('key in source', { 'src/api.ts': `const key = "${fakeKey}";\n` }, '1-secret-in-code');
finds('cloud key in config', { 'config.json': `{"id": "${fakeAws}"}\n` }, '1-secret-in-code');
clean('key read from environment', { 'src/api.ts': 'const key = process.env.OPENAI_API_KEY;\n' }, '1-secret-in-code');
clean('placeholder in example file', { '.env.example': 'OPENAI_API_KEY=sk-your-key-here\n' }, '1-secret-in-code');
finds('.env saved in git', { '.env': 'A=1\n' }, '1-secret-in-git', { commit: true });
finds('.env.production saved in git', { '.env.production': 'A=1\n' }, '1-secret-in-git', { commit: true });
clean('.env.example saved in git', { '.env.example': 'A=\n' }, '1-secret-in-git', { commit: true });
finds('.env not ignored', { '.env': `K=${fakeKey}\n` }, '1-secret-not-ignored');
finds('.env.local not ignored', { '.env.local': 'A=1\n' }, '1-secret-not-ignored');
clean('.env ignored', { '.env': `K=${fakeKey}\n` }, '1-secret-not-ignored', { ignore: '.env\n' });
clean('.env ignored is not reported as key in code', { '.env': `K=${fakeKey}\n` }, '1-secret-in-code', { ignore: '.env\n' });
{ // secret file removed from git but still in history
  const d = project({ '.env': 'A=1\n', 'a.js': '1\n' }, { commit: true });
  execSync('git rm -q --cached .env && echo .env > .gitignore && git add .gitignore && git commit -qm untrack', { cwd: d, stdio: 'ignore' });
  if (rules(d).includes('1-secret-in-git-history')) pass++; else { fail++; console.log('FAIL  should find 1-secret-in-git-history'); }
}
clean('no secret file ever committed', { 'a.js': '1\n' }, '1-secret-in-git-history', { commit: true });

// 2. secrets sent to the browser
finds('service role key with public prefix', { 'lib/db.ts': 'const k = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;\n' }, '2-secret-in-browser');
finds('secret with vite prefix', { 'src/pay.js': 'const s = import.meta.env.VITE_STRIPE_SECRET_KEY;\n' }, '2-secret-in-browser');
clean('public anon key', { 'lib/db.ts': 'const k = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;\n' }, '2-secret-in-browser');
clean('server-only secret', { 'lib/pay.ts': 'const s = process.env.STRIPE_SECRET_KEY;\n' }, '2-secret-in-browser');

// 5. database open to everyone
finds('table without access rules', { 'package.json': '{"dependencies":{"@supabase/supabase-js":"2"}}', 'supabase/migrations/1.sql': 'create table public.notes (id int);\n' }, '5-database-open');
finds('firebase rules allow all', { 'firestore.rules': 'match /{document=**} { allow read, write: if true; }\n' }, '5-database-open');
clean('table with access rules', { 'package.json': '{"dependencies":{"@supabase/supabase-js":"2"}}', 'supabase/migrations/1.sql': 'create table public.notes (id int);\nalter table public.notes enable row level security;\n' }, '5-database-open');
clean('firebase rules check login', { 'firestore.rules': 'match /notes/{id} { allow read, write: if request.auth != null; }\n' }, '5-database-open');

// 6. database commands built from text
finds('template string in query', { 'api/user.js': 'db.query(`SELECT * FROM users WHERE id = ${req.query.id}`);\n' }, '6-sql-built-from-text');
finds('string concatenation in query', { 'api/user.js': 'db.query("DELETE FROM posts WHERE id = " + id);\n' }, '6-sql-built-from-text');
finds('python f-string in query', { 'app.py': 'cur.execute(f"SELECT * FROM users WHERE name = \'{name}\'")\n' }, '6-sql-built-from-text');
clean('parameterized query', { 'api/user.js': 'db.query("SELECT * FROM users WHERE id = $1", [id]);\n' }, '6-sql-built-from-text');
clean('tagged template (parameterized by the library)', { 'api/user.js': 'const rows = await sql`SELECT * FROM users WHERE id = ${id}`;\n' }, '6-sql-built-from-text');
clean('ordinary sentence with the word select', { 'ui/text.js': 'const label = `Select ${count} items from the list`;\n' }, '6-sql-built-from-text');

// 6. raw HTML
finds('dangerouslySetInnerHTML', { 'ui/Post.jsx': 'return <div dangerouslySetInnerHTML={{ __html: post.body }} />;\n' }, '6-unsafe-html');
finds('innerHTML assignment', { 'ui/x.js': 'el.innerHTML = comment;\n' }, '6-unsafe-html');
clean('text rendered normally', { 'ui/Post.jsx': 'return <div>{post.body}</div>;\n' }, '6-unsafe-html');
clean('textContent assignment', { 'ui/x.js': 'el.textContent = comment;\n' }, '6-unsafe-html');

// 10. error details shown to visitors
finds('stack sent in response', { 'api/a.js': 'res.status(500).json({ error: err.stack });\n' }, '10-error-leak');
finds('message sent in response', { 'api/a.js': 'return Response.json({ error: e.message }, { status: 500 });\n' }, '10-error-leak');
clean('generic message, detail only logged', { 'api/a.js': 'console.error(err.stack);\nres.status(500).json({ error: "Something went wrong" });\n' }, '10-error-leak');
clean('logging only', { 'api/a.js': 'logger.error(error.message);\n' }, '10-error-leak');

// 11. server opens an address supplied by the visitor
finds('fetch of query value', { 'api/proxy.js': 'const r = await fetch(req.query.url);\n' }, '11-server-fetches-user-url');
finds('fetch of variable taken from the request', { 'app/api/preview/route.ts': 'const target = searchParams.get("url");\nconst r = await fetch(target);\n' }, '11-server-fetches-user-url');
clean('fetch of fixed address', { 'api/weather.js': 'const r = await fetch("https://api.example.com/weather");\n' }, '11-server-fetches-user-url');
clean('user value used only as a search word', { 'api/search.js': 'const q = searchParams.get("q");\nconst r = await fetch("https://api.example.com/search?q=" + encodeURIComponent(q));\n' }, '11-server-fetches-user-url');

// Things the scan cannot check must be reported, not hidden
{
  const r = scan(project({ 'main.go': 'package main\n' }, { git: false }));
  const reasons = r.notChecked.map((n) => n.rule);
  for (const want of ['1-secret-in-git', '9-vulnerable-libraries', 'language']) if (reasons.includes(want)) pass++; else { fail++; console.log(`FAIL  notChecked should include ${want}`); }
  if (r.needsReview.length >= 5) pass++; else { fail++; console.log('FAIL  needsReview should list the human-judgment rules'); }
}
{ // the scan must never print the secret value itself
  const out = spawnSync('node', [join(here, 'scan.mjs'), project({ 'a.js': `const k = "${fakeKey}";\n` })], { encoding: 'utf8', env: { ...process.env, VIBE_SCAN_OFFLINE: '1' } }).stdout;
  if (!out.includes(fakeKey)) pass++; else { fail++; console.log('FAIL  scan output contains the secret value'); }
}

// Practice app with 5 planted problems: at least 4 must be found
{
  const d = project({
    'package.json': '{"dependencies":{"next":"15","@supabase/supabase-js":"2"}}',
    'lib/openai.ts': `export const key = "${fakeKey}";\n`,                                             // 1
    'lib/admin.ts': 'export const admin = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;\n',       // 2
    'supabase/migrations/001.sql': 'create table public.bookings (id serial, email text);\n',          // 3
    'app/api/search/route.ts': 'const rows = await db.query(`SELECT * FROM bookings WHERE email = \'${email}\'`);\n', // 4
    'app/api/preview/route.ts': 'const url = searchParams.get("url");\nconst page = await fetch(url);\n',             // 5
    'app/page.tsx': 'export default function Page() { return <main>Hello</main>; }\n',
  });
  const got = new Set(rules(d));
  const planted = ['1-secret-in-code', '2-secret-in-browser', '5-database-open', '6-sql-built-from-text', '11-server-fetches-user-url'];
  const found = planted.filter((p) => got.has(p)).length;
  console.log(`practice app: found ${found} of ${planted.length} planted problems`);
  if (found >= 4) pass++; else { fail++; console.log('FAIL  practice app: fewer than 4 found'); }
  const clean = rules(project({ 'package.json': '{"dependencies":{"next":"15"}}', 'app/page.tsx': 'export default function Page() { return <main>Hello</main>; }\n', 'lib/api.ts': 'export const key = process.env.API_KEY;\n' }, { ignore: '.env\n' }));
  if (clean.length === 0) pass++; else { fail++; console.log(`FAIL  clean app should have no findings, got ${clean.join(', ')}`); }
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
