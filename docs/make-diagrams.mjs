// Draws the flow diagrams used in the READMEs. Run: node docs/make-diagrams.mjs
// Edit the text below, then run it again. No dependencies.
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

function flow(file, title, legend, steps) {
  const W = 920, H = 200, bw = 152, gap = 36, x0 = 24, top = 64, bh = 104;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR', sans-serif">
<rect width="${W}" height="${H}" rx="16" fill="#ffffff" stroke="#e3e3e8"/>
<text x="24" y="38" font-size="17" font-weight="700" fill="#1d1d1f">${esc(title)}</text>
<circle cx="${W - 255}" cy="33" r="5" fill="#0071e3"/><text x="${W - 245}" y="38" font-size="13" fill="#6e6e73">${esc(legend[0])}</text>
<circle cx="${W - 140}" cy="33" r="5" fill="#1a7f37"/><text x="${W - 130}" y="38" font-size="13" fill="#6e6e73">${esc(legend[1])}</text>
`;
  steps.forEach(([me, who, head, sub], i) => {
    const x = x0 + i * (bw + gap), c = me ? '#0071e3' : '#1a7f37', bg = me ? '#e8f1fd' : '#e8f6ec';
    s += `<rect x="${x}" y="${top}" width="${bw}" height="${bh}" rx="14" fill="${bg}"/>
<text x="${x + bw / 2}" y="${top + 26}" font-size="12" font-weight="700" fill="${c}" text-anchor="middle">${esc(who)}</text>
<text x="${x + bw / 2}" y="${top + 54}" font-size="16" font-weight="700" fill="#1d1d1f" text-anchor="middle">${esc(head)}</text>
`;
    sub.forEach((l, j) => (s += `<text x="${x + bw / 2}" y="${top + 76 + j * 17}" font-size="12.5" fill="#6e6e73" text-anchor="middle">${esc(l)}</text>\n`));
    if (i < steps.length - 1) {
      const ax = x + bw + 8, y = top + bh / 2;
      s += `<path d="M${ax} ${y} h${gap - 16}" stroke="#a1a1a6" stroke-width="2"/><path d="M${ax + gap - 16} ${y - 5} l6 5 l-6 5" fill="none" stroke="#a1a1a6" stroke-width="2"/>\n`;
    }
  });
  writeFileSync(join(here, file), s + '</svg>\n');
}

// English
const en = ['What you do', 'What Claude does'];
flow('flow-start.svg', 'Starting something new: "make me an app" is enough', en, [
  [true, 'You', 'Say it', ['"Make me an app"']],
  [false, 'Claude', 'Asks', ['Multiple choice,', 'up to 8 questions']],
  [true, 'You', 'Approve', ['Read the short plan,', 'say "go"']],
  [false, 'Claude', 'Builds', ['Explains each step', 'in plain words']],
  [false, 'Claude', 'Checks', ['Security check,', 'project journal']],
]);
flow('flow-fix.svg', 'When something breaks: "it\'s broken, fix it" is enough', en, [
  [false, 'Claude', 'Looks first', ['Recent changes,', 'error logs']],
  [true, 'You', 'Answer', ['Up to 4 questions,', 'multiple choice']],
  [false, 'Claude', 'Reproduces', ['Makes the problem', 'happen itself']],
  [false, 'Claude', 'Fixes', ['One cause,', 'one fix']],
  [true, 'You', 'Confirm', ['Try it the way', 'Claude shows you']],
]);

// Korean
const ko = ['내가 하는 일', 'Claude가 하는 일'];
flow('flow-start.ko.svg', '새로 만들 때: "앱 만들어줘"라고만 해도 됩니다', ko, [
  [true, '나', '말하기', ['"앱 만들어줘"']],
  [false, 'Claude', '질문하기', ['고르는 질문', '최대 8개']],
  [true, '나', '계획 확인', ['요약을 보고', '"좋아"']],
  [false, 'Claude', '만들기', ['쉬운 말로', '설명하며']],
  [false, 'Claude', '점검·기록', ['보안 점검', '개발일지']],
]);
flow('flow-fix.ko.svg', '문제가 생겼을 때: "안 돼, 고쳐줘"라고만 해도 됩니다', ko, [
  [false, 'Claude', '직접 확인', ['바뀐 코드,', '오류 기록']],
  [true, '나', '질문에 답하기', ['최대 4개,', '고르는 형식']],
  [false, 'Claude', '재현', ['같은 문제를', '직접 일으킴']],
  [false, 'Claude', '수정', ['원인 하나에', '수정 하나']],
  [true, '나', '확인', ['알려준 대로', '눌러 보기']],
]);
