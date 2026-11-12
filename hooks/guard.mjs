#!/usr/bin/env node
// nondev-kit safety hook. Runs before every shell command Claude wants to run.
// Fixed rules only, no AI. Prints "deny" (blocked) or "ask" (you must confirm). Silence = allowed.
// The only network call: asking the npm registry whether a package name exists.
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { homedir } from 'node:os';
import { SECRET_FILE, SECRET_TEXT } from './patterns.mjs';

const ko = (process.env.LC_ALL || process.env.LANG || '').startsWith('ko');
const t = (en, kr) => (ko ? kr : en);
const REGISTRY = process.env.VIBE_REGISTRY || 'https://registry.npmjs.org';
const NPM_NAME = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/i;
const DEPLOY = /^(vercel\b.*--prod\b|netlify\s+deploy\b.*--prod\b|firebase\s+deploy\b|wrangler\s+(pages\s+)?deploy\b|fly\s+deploy\b|supabase\s+db\s+(push|reset)\b|npm\s+publish\b)/;
const lines = (s) => s.split('\n').filter(Boolean);

// Rule 1: secrets must not go into a commit.
function secrets(seg, cwd) {
  if (!/^git\s+(commit|add)\b/.test(seg)) return;
  const git = (a) => { try { return execSync(`git ${a}`, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 5e7 }); } catch { return ''; } };
  const wide = /^git\s+add\b/.test(seg) || /\s-[a-zA-Z]*a/.test(seg); // "git add" or "commit -a" also picks up unstaged files
  const untracked = wide ? lines(git('ls-files --others --exclude-standard')) : [];
  const names = [...lines(git('diff --cached --name-only --diff-filter=d')), ...(wide ? lines(git('diff --name-only --diff-filter=d')) : []), ...untracked];
  const file = names.find((n) => SECRET_FILE.test(n));
  if (file) return ['deny', t(`"${file}" usually holds secret keys and must not be saved to git. Add it to .gitignore, then try again.`, `"${file}" 파일에는 보통 비밀키가 들어 있어서 git에 저장하면 안 됩니다. .gitignore에 추가한 뒤 다시 시도하세요.`)];
  const added = (d) => lines(d).filter((l) => l.startsWith('+') && !l.startsWith('+++')).join('\n');
  let text = added(git('diff --cached -U0')) + (wide ? added(git('diff -U0')) : '');
  for (const f of untracked.slice(0, 300)) try { const s = readFileSync(resolve(cwd, f), 'utf8'); if (s.length < 1e6) text += '\n' + s; } catch {}
  if (SECRET_TEXT.test(text)) return ['deny', t('A secret key is written in the files about to be saved to git. Move it to a .env file that git ignores, then try again. The security-check skill shows where it is.', 'git에 저장하려는 파일 안에 비밀키가 적혀 있습니다. git이 무시하는 .env 파일로 옮긴 뒤 다시 시도하세요. 위치는 security-check 스킬로 찾을 수 있습니다.')];
}

// Rule 2: do not install a package that does not exist in the official npm registry.
async function packages(seg) {
  const m = seg.match(/^(npm|pnpm|yarn|bun)\s+(install|i|add)\s+(.+)$/);
  if (!m) return;
  const names = m[3].split(/\s+/).map((x) => x.replace(/["']/g, '').replace(/(?!^)@.*$/, '')).filter((x) => !x.startsWith('-') && NPM_NAME.test(x));
  for (const n of names.slice(0, 8)) {
    try {
      const r = await fetch(`${REGISTRY}/${n.replace('/', '%2F')}`, { headers: { accept: 'application/vnd.npm.install-v1+json' }, signal: AbortSignal.timeout(4000) });
      r.body?.cancel();
      if (r.status === 404) return ['deny', t(`The package "${n}" does not exist in the official npm registry. The name may be invented or misspelled. Find the real package name first.`, `"${n}" 패키지는 공식 npm 등록소에 없습니다. 지어낸 이름이거나 오타일 수 있습니다. 실제 패키지 이름을 먼저 확인하세요.`)];
    } catch { return ['ask', t(`Could not check whether the package "${n}" really exists (no connection to the npm registry). Install it only if you are sure the name is right.`, `"${n}" 패키지가 실제로 있는지 확인하지 못했습니다(npm 등록소에 연결 실패). 이름이 확실할 때만 설치하세요.`)]; }
  }
}

// Rule 3: repositories stay private unless you say otherwise.
function publicRepo(seg) {
  const create = /^gh\s+repo\s+create\b/.test(seg) && !/--(private|internal)\b/.test(seg);
  if (create || /^gh\s+repo\s+edit\b.*--visibility[=\s]+public/.test(seg)) return ['ask', t('This makes your code visible to everyone on the internet, including its full history. Continue only if you want it public.', '이 명령은 코드와 과거 기록 전체를 인터넷의 누구나 볼 수 있게 만듭니다. 공개를 원할 때만 계속하세요.')];
}

// Rule 4: things that cannot be undone need your OK.
function irreversible(seg, cwd, moved) {
  if (/^git\s+push\b.*\s(-f|--force\S*)(\s|$)/.test(seg)) return ['ask', t('This overwrites the version stored on GitHub. Work that exists only there will be lost.', '이 명령은 GitHub에 저장된 버전을 덮어씁니다. 거기에만 있는 작업은 사라집니다.')];
  if (/^git\s+(reset\s+--hard|clean\s+-\w*f)/.test(seg)) return ['ask', t('This throws away changes that have not been saved to git. They cannot be recovered.', '이 명령은 git에 저장하지 않은 변경을 버립니다. 복구할 수 없습니다.')];
  if (DEPLOY.test(seg)) return ['ask', t('This changes the live service that real users see (or its database). Continue only if you are ready to release.', '이 명령은 실제 사용자가 보는 서비스(또는 그 데이터베이스)를 바꿉니다. 출시할 준비가 됐을 때만 계속하세요.')];
  const tok = seg.split(/\s+/).slice(1).map((x) => x.replace(/^["']|["']$/g, ''));
  if (/^rm\s/.test(seg) && tok.some((x) => /^-\w*[rR]|^--recursive/.test(x))) {
    const outside = (x) => { if (moved || /[$`]/.test(x)) return true; const p = resolve(cwd, x.replace(/^~/, homedir())); return p === cwd || !p.startsWith(cwd + sep); };
    if (tok.filter((x) => !x.startsWith('-')).some(outside)) return ['ask', t('This deletes a folder outside your project (or the whole project). Deleted files do not go to the trash.', '이 명령은 프로젝트 밖의 폴더(또는 프로젝트 전체)를 지웁니다. 지운 파일은 휴지통으로 가지 않습니다.')];
  }
}

function out(decision, reason) {
  console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: decision, permissionDecisionReason: `[nondev-kit] ${reason}` } }));
  process.exit(0);
}

try {
  const input = JSON.parse(readFileSync(0, 'utf8'));
  const cmd = input.tool_input?.command;
  if (input.tool_name !== 'Bash' || typeof cmd !== 'string') process.exit(0);
  const cwd = input.cwd || process.cwd();
  const hits = [];
  let moved = false; // after "cd", relative paths no longer point inside the project
  for (const raw of cmd.split(/&&|\|\||[;|\n]/)) {
    const seg = raw.trim().replace(/^(\w+=\S+\s+)+/, '').replace(/^sudo\s+/, '').replace(/^(npx|bunx|pnpm\s+dlx|yarn\s+dlx)\s+(-y\s+|--yes\s+)?/, '');
    hits.push(secrets(seg, cwd), await packages(seg), publicRepo(seg), irreversible(seg, cwd, moved));
    if (/^(cd|pushd)\s/.test(seg)) moved = true;
  }
  const found = hits.filter(Boolean);
  const hit = found.find((h) => h[0] === 'deny') || found[0];
  if (hit) out(...hit);
} catch (e) {
  // A broken check must not silently let everything through.
  out('ask', t(`The safety check itself failed (${e.message}), so this command was not checked. Read it carefully before allowing.`, `안전 검사 자체가 실패해서(${e.message}) 이 명령은 검사되지 않았습니다. 허용하기 전에 직접 확인하세요.`));
}
