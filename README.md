# vibe-starter

**English** | [한국어](README.ko.md)

![License: MIT](https://img.shields.io/badge/license-MIT-blue) ![Version 0.1](https://img.shields.io/badge/version-0.1-lightgrey) ![Dependencies: none](https://img.shields.io/badge/dependencies-none-brightgreen)

A [Claude Code](https://claude.com/claude-code) plugin for people who build web sites and apps with AI but are not developers.

**You decide what to build. Claude decides how, explains it in plain words, and asks you only about things that matter: money, things that cannot be undone, personal data, and the direction of your product.**

> Status: v0.1, an early version. The safety checks are covered by automated tests. The rest is instructions for Claude and has had little real-world use so far. [Feedback](../../issues) is welcome.

## Why

When you build with AI and you are not a developer, three things tend to go wrong:

1. **You say "make me an app" and the AI starts building at once.** It guesses what you meant, and you find out later that it guessed wrong.
2. **You say "it's broken, fix it" and the AI changes code based on a guess.** The fix breaks something else.
3. **Something that cannot be undone happens without you noticing.** A secret key is saved to a public place, or your work is overwritten.

vibe-starter makes Claude ask first in cases 1 and 2, and puts a fixed check in front of case 3.

## What it looks like

```
You:     Make me a budget app

Claude:  Happy to. A few quick questions first.
         Who will use it?
           1. Just me
           2. People I already know (recommended)
           3. Anyone on the internet
           4. Not sure, use your recommendation
You:     1

...      (a few more questions like this)

Claude:  Here is the plan.
         What:       A personal budget tracker
         Version 1:  Add an expense in under 5 seconds
         Done when:  I add an expense and it is still there after I reload
         Later:      Monthly charts, budget alerts
         I decided:  A web site that works on phones. No login. Cost: $0/month.
         Shall I start with this?
```

Claude replies in your language. The exact wording changes from case to case.

## Install

You need [Claude Code](https://claude.com/claude-code) and [Node.js](https://nodejs.org) 18 or newer.

Inside Claude Code, run these two commands once:

```
/plugin marketplace add applelog/vibe-starter
/plugin install vibe-starter@vibe-starter
```

Then open a new, empty folder, start Claude Code, and say what you want to make.

To try it from a downloaded copy without installing:

```
claude --plugin-dir /path/to/vibe-starter
```

## What you get

| Part | What it does | When it runs |
|---|---|---|
| Working rules | Plain-language explanations, clear limits on what Claude decides alone, basic security habits | Every session, automatically |
| Safety checks | Block or ask before 4 kinds of risky commands (see below) | Before every command, automatically |
| Start questions | Turns "make me an app" into a short plan by asking a few multiple-choice questions | New project, or a vague request |
| Fix questions | Turns "it's broken" into a precise fix: checks the project first, then asks what you did and what you saw | When you report a problem without details |
| Project journal | `DEVLOG.md`: decisions, things you must remember, open problems, history | Loaded every session, automatically |
| Security check | Looks for 12 common mistakes and reports them in plain words | After risky changes, before release, or on request |
| Design tools | Figma and Canva connections | When design work comes up |

There are no commands to remember. Just talk to Claude as usual.

## Who decides what

| Claude just does it | Claude asks you first | Only you do it |
|---|---|---|
| Choosing tools | Anything that costs money | Typing passwords |
| File layout | Anything that cannot be undone | Entering payment details |
| Simple, mechanical fixes | Collecting personal data | Accepting terms of service |
| | Signing up for an outside service | |
| | Changing what the product does | |

Claude is also told not to agree with you just to be agreeable. If it sees a better way than what you asked for, it proposes it with evidence and waits for your answer. It does not switch to its own idea first and tell you afterwards.

## The safety checks

These are fixed rules in a small script ([hooks/guard.mjs](hooks/guard.mjs), under 100 lines). No AI is involved in the decision, so they run the same way every time.

| Situation | What happens |
|---|---|
| A secret file (`.env`, private keys) or a known secret key format is about to be saved to git | Blocked |
| A package that does not exist in the official npm registry is about to be installed | Blocked |
| A GitHub repository is about to be created as public or switched to public | You are asked |
| A command that cannot be undone: force push, discarding unsaved changes, deleting folders outside the project, releasing to the live service | You are asked |

If the check itself breaks, you are asked instead of the command passing silently.

Messages are shown in English, or in Korean when your system language is Korean.

## The project journal

Claude forgets earlier sessions. `DEVLOG.md` is a plain file in your project that carries the important things forward:

- **Now**: where the work stands and what comes next
- **Pinned**: things that must never be lost, such as decisions, services you signed up for, and costs. Claude does not shorten this part on its own.
- **Open issues**: sorted into fix now, later, and can ignore
- **Log**: dated history. This is the only part that gets summarized when you move to a new major version.

## What this does not do

Please read this part.

- **It does not make your app secure.** It catches common mistakes. Passing the security check is not proof of safety. If you handle payments, health data, ID numbers, or children's data, get an expert review before release.
- **It only sees commands Claude runs.** Commands you type yourself in a terminal are not checked.
- **The safety checks read the command text.** They guard against accidents, not against someone trying to get around them. A risky command hidden inside a script file is not seen.
- **Secret detection knows common key formats only.** A key in an unusual format is not caught.
- **The package check covers npm, pnpm, yarn and bun.** Other package managers are not checked.
- **The scan script covers JavaScript and TypeScript, partly Python.** Other languages are reviewed by Claude reading the code, which is less reliable.
- **The working rules and the question skills are instructions, not code.** Claude follows them most of the time, and less reliably in very long sessions. Only the safety checks are code and always run.
- **Photoshop is not supported.** No official connection was found at the time of writing.

## Design tools

Figma and Canva connections are registered when you install the plugin. Nothing is sent to them until you log in, and Claude guides you through the login the first time a design task needs it. If you skip the login, Claude designs in code instead.

If you already have Figma or Canva connected to Claude, you may see them listed twice. Disable either copy with `/mcp`.

## What leaves your computer

- Package names you are about to install are looked up at `registry.npmjs.org` (the same place the install itself contacts).
- The security check runs `npm audit`, which sends your dependency list to the npm registry.
- Figma and Canva receive data only after you log in to them.

Nothing else. There is no telemetry.

## Making it stricter

The safety checks are one layer. Claude Code has its own permission rules and a sandbox mode that limit what any command can touch, and they work even when a pattern check misses something. See the Claude Code documentation on permissions and sandboxing.

## Turning it off

Use `/plugin` and disable or uninstall `vibe-starter`. Your `DEVLOG.md` files stay where they are.

## What is inside

```
router.md                 working rules, loaded every session (under 3,000 bytes)
hooks/guard.mjs           the safety checks
hooks/session-start.mjs   loads the rules and the top of DEVLOG.md
skills/start/             start questions and the plan
skills/fix/               fix questions
skills/journal/           DEVLOG.md format
skills/security-check/    the 12-item check and its scan script
.mcp.json                 Figma and Canva connections
```

No dependencies. Everything is plain Node.js and Markdown, so you can read all of it.

## Tests

```
node hooks/test.mjs
node skills/security-check/scan.test.mjs
```

Every rule has cases it must catch and normal work it must let through. The package test needs an internet connection.

## Contributing

Bug reports and ideas are welcome in [Issues](../../issues), in any language. The most useful reports are:

- a safe command that was blocked, or a risky one that was let through (include the command);
- a moment where Claude did not ask and should have, or asked too much;
- wording that was hard to understand for a non-developer.

For a change to a safety rule, please add a test case to `hooks/test.mjs`.

## License

[MIT](LICENSE). You may use, copy, change, and share this plugin, including in commercial work, as long as you keep the copyright and license notice. It comes with no warranty.

vibe-starter is an independent project. It is not made or endorsed by Anthropic, Figma, or Canva.
