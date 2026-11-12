#!/usr/bin/env node
// nondev-kit security scan. Fixed pattern rules only, no AI.
// Usage: node scan.mjs [project-folder]
// Prints JSON: { stack, findings, notChecked, needsReview }. Never prints a secret value.
// Pattern rules are written for JavaScript/TypeScript projects, with partial Python support.
import { readFileSync, readdirSync, lstatSync, existsSync } from 'node:fs';
import { join, relative, extname, basename } from 'node:path';
import { execSync } from 'node:child_process';
import { SECRET_FILE, SECRET_TEXT } from '../../hooks/patterns.mjs';

const root = process.argv[2] || process.cwd();
const SKIP = new Set(['node_modules', '.git', '.next', 'dist', 'build', 'out', '.vercel', 'coverage', 'vendor', '.venv', 'venv', '__pycache__', '.expo']);
const CODE = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.vue', '.svelte', '.py', '.html']);
const OTHER_TEXT = new Set(['.json', '.yml', '.yaml', '.toml', '.md', '.sql', '.rules', '.txt', '.sh', '.env', '']);
const UNSUPPORTED = new Set(['.php', '.rb', '.go', '.java', '.kt', '.swift', '.dart', '.cs', '.rs']);
const findings = [], notChecked = [];
const add = (rule, severity, file, line, message) => findings.push({ rule, severity, file, line, message });
const git = (a) => { try { return execSync(`git ${a}`, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 5e7 }); } catch { return null; } };

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const p = join(dir, name), s = lstatSync(p);
    if (s.isSymbolicLink()) continue;
    if (s.isDirectory()) walk(p, files); else if (s.size < 1e6 && files.length < 5000) files.push(p);
  }
  return files;
}

const SQL = /\b(select\s.+\sfrom|insert\s+into|update\s+\w+\s+set|delete\s+from)\b/i;
const sqlUnsafe = (l) => SQL.test(l)
  && /\w*(query|execute|exec|prepare|raw)\w*\s*\(/i.test(l) // only where a database call is on the same line
  && (/`[^`]*\$\{/.test(l) || /["']\s*\+\s*[\w(]/.test(l) || /\bf["'].*\{/.test(l) || /["']\s*%\s*[\w(]/.test(l) || /\.format\(/.test(l))
  && !/(\bsql|\$queryRaw|\$executeRaw|Prisma\.sql)\s*`/.test(l); // tagged templates are parameterized
const LINE_RULES = [
  ['2-secret-in-browser', 'danger', /\b(NEXT_PUBLIC_|VITE_|EXPO_PUBLIC_|REACT_APP_)\w*(SECRET|PRIVATE|SERVICE_ROLE|PASSWORD)\w*/, 'A secret-looking setting uses a name prefix that sends it to every visitor\'s browser.'],
  ['6-unsafe-html', 'warning', /dangerouslySetInnerHTML|\.innerHTML\s*=|\bv-html=|document\.write\(|\beval\(|new Function\(/, 'Raw HTML or code is built from a value. If that value can come from a user, they can run their own script on other people\'s screens.'],
  ['10-error-leak', 'warning', /\b(json|send|end)\(\s*[^)]*\b(err|error|e)\.(stack|message)\b/, 'An internal error message is sent to the visitor. It can reveal how the server works.'],
  ['11-server-fetches-user-url', 'warning', /\b(fetch|axios(\.\w+)?|got(\.\w+)?)\(\s*(await\s+)?(\w*[sS]earchParams\.get\(|(req|request)\.(query|body|params)\b)/, 'The server opens an address supplied by the visitor. It could be pointed at private internal systems.'],
];
const USER_INPUT = /(req|request)\.(query|body|params)|[sS]earchParams\.get\(|formData\.get\(/;

const files = walk(root);
const rel = (p) => relative(root, p);
const unsupported = new Set();
let sqlText = '';
for (const p of files) {
  const ext = extname(p).toLowerCase(), name = rel(p);
  if (UNSUPPORTED.has(ext)) unsupported.add(ext);
  if (!CODE.has(ext) && !OTHER_TEXT.has(ext)) continue;
  let text; try { text = readFileSync(p, 'utf8'); } catch { continue; }
  if (ext === '.sql') sqlText += '\n' + text;
  if (/\.rules$/.test(name) && /allow\s+[\w,\s]+:\s*if\s+true\s*;/.test(text)) add('5-database-open', 'danger', name, 0, 'These access rules let anyone read or change the data.');
  const isSecretFile = SECRET_FILE.test(name); // real .env files are checked separately below
  const tainted = new Set(); // variables that hold an address taken from user input
  text.split('\n').forEach((l, i) => {
    if (!isSecretFile && SECRET_TEXT.test(l)) add('1-secret-in-code', 'danger', name, i + 1, 'A secret key is written directly in this file.');
    if (!CODE.has(ext)) return;
    for (const [rule, sev, re, msg] of LINE_RULES) if (re.test(l)) add(rule, sev, name, i + 1, msg);
    if (sqlUnsafe(l)) add('6-sql-built-from-text', 'danger', name, i + 1, 'A database command is glued together from text. A visitor could change what the command does.');
    const decl = l.match(/(?:const|let|var)\s+(\{[^}]+\}|\w+)\s*=/);
    if (decl && USER_INPUT.test(l)) for (const v of decl[1].replace(/[{}\s]/g, '').split(',')) if (/url|uri|link|href|endpoint|target|src/i.test(v)) tainted.add(v.split(':').pop());
    const call = l.match(/\b(?:fetch|axios(?:\.\w+)?|got(?:\.\w+)?)\(\s*(\w+)\b/);
    if (call && tainted.has(call[1])) add('11-server-fetches-user-url', 'warning', name, i + 1, LINE_RULES[3][3]);
  });
}

// Rule 1 continued: secret files and git
const tracked = git('ls-files');
if (tracked === null) notChecked.push({ rule: '1-secret-in-git', reason: 'This folder is not a git repository, so git checks were skipped.' });
else {
  for (const f of tracked.split('\n').filter((n) => SECRET_FILE.test(n))) add('1-secret-in-git', 'danger', f, 0, 'This file normally holds secret keys and is saved in git.');
  const past = (git('log --all --diff-filter=A --name-only --pretty=format:') || '').split('\n').filter((n) => SECRET_FILE.test(n));
  for (const f of new Set(past)) if (!tracked.split('\n').includes(f)) add('1-secret-in-git-history', 'danger', f, 0, 'This secret file was saved in git in the past. It is still in the history, so its keys must be replaced with new ones.');
  for (const p of files.filter((x) => SECRET_FILE.test(rel(x)))) if (git(`check-ignore -q "${rel(p)}"`) === null && !tracked.split('\n').includes(rel(p))) add('1-secret-not-ignored', 'danger', rel(p), 0, 'This secret file is not listed in .gitignore, so it can be saved to git by accident.');
}

// Rule 5: Supabase-style SQL without access rules
const pkgPath = join(root, 'package.json');
let deps = {};
if (existsSync(pkgPath)) try { const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')); deps = { ...pkg.dependencies, ...pkg.devDependencies }; } catch { notChecked.push({ rule: 'stack', reason: 'package.json could not be read.' }); }
const usesSupabase = Object.keys(deps).some((d) => d.includes('supabase')) || existsSync(join(root, 'supabase'));
if (usesSupabase) {
  const tables = [...sqlText.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?"?(\w+)"?/gi)].map((m) => m[1].toLowerCase());
  const guarded = new Set([...sqlText.matchAll(/alter\s+table\s+(?:if\s+exists\s+)?(?:only\s+)?(?:public\.)?"?(\w+)"?\s+enable\s+row\s+level\s+security/gi)].map((m) => m[1].toLowerCase()));
  for (const tb of new Set(tables)) if (!guarded.has(tb)) add('5-database-open', 'danger', `table "${tb}"`, 0, 'This table has no access rules (row level security) turned on in the SQL files. Anyone with the public key may be able to read or change it.');
  if (!tables.length) notChecked.push({ rule: '5-database-open', reason: 'No SQL files that create tables were found. Check access rules in the Supabase dashboard.' });
}

// Rule 9: libraries with known vulnerabilities
if (!existsSync(pkgPath)) notChecked.push({ rule: '9-vulnerable-libraries', reason: 'No package.json found.' });
else if (process.env.NONDEV_SCAN_OFFLINE) notChecked.push({ rule: '9-vulnerable-libraries', reason: 'Skipped (offline mode).' });
else if (!existsSync(join(root, 'package-lock.json'))) notChecked.push({ rule: '9-vulnerable-libraries', reason: 'Only npm lock files are supported. Run the audit command of your package manager.' });
else {
  let raw; try { raw = execSync('npm audit --json --omit=dev', { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 60000 }); } catch (e) { raw = e.stdout; }
  try {
    const v = JSON.parse(raw).metadata.vulnerabilities;
    if (v.critical + v.high > 0) add('9-vulnerable-libraries', 'danger', 'package-lock.json', 0, `${v.critical} critical and ${v.high} high known vulnerabilities in installed libraries. Run "npm audit" for the list.`);
    else if (v.moderate > 0) add('9-vulnerable-libraries', 'warning', 'package-lock.json', 0, `${v.moderate} moderate known vulnerabilities in installed libraries.`);
  } catch { notChecked.push({ rule: '9-vulnerable-libraries', reason: 'npm audit did not return a readable result.' }); }
}

if (unsupported.size) notChecked.push({ rule: 'language', reason: `Pattern rules do not cover these file types found in the project: ${[...unsupported].join(', ')}.` });
const has = (ext) => files.some((p) => extname(p) === ext);
console.log(JSON.stringify({
  stack: { javascript: has('.js') || has('.ts') || has('.tsx') || has('.jsx'), python: has('.py'), supabase: usesSupabase, libraries: Object.keys(deps).filter((d) => /^(next|react|vue|svelte|express|expo|firebase|prisma|stripe|@supabase\/supabase-js)$/.test(d)), filesScanned: files.length, project: basename(root) },
  findings,
  notChecked,
  needsReview: [
    '3-pages-open-without-login: read each route and page; which ones change or show private data without checking login?',
    '4-other-peoples-data: where a record is loaded by an id from the address or request, is the owner checked on the server?',
    '6-sql-built-from-text: this scan reads one line at a time, so database commands that span several lines must be read by hand.',
    '7-file-upload-limits: are file type and size limited on the server?',
    '8-unlimited-requests: can login attempts or paid API calls be repeated without limit?',
    '12-unneeded-personal-data: is any personal information collected or stored that the core feature does not need?',
  ],
}, null, 2));
