# vibe-starter

[한국어](README.ko.md)

A Claude Code plugin for people who build web sites and apps with AI but are not developers.

**You decide what to build. Claude decides how, explains it in plain words, and asks you only about things that matter: money, things that cannot be undone, personal data, and the direction of your product.**

Status: v0.1, early. Expect rough edges.

## What you get

| Part | What it does | When it runs |
|---|---|---|
| Working rules | Plain-language explanations, clear limits on what Claude decides alone, basic security habits | Every session, automatically |
| Safety checks | Block or ask before 4 kinds of risky commands (see below) | Before every command, automatically |
| Start questions | Turns "make me an app" into a short plan by asking a few multiple-choice questions | New project, or a vague request |
| Project journal | `DEVLOG.md`: decisions, things you must remember, open problems, history | Loaded every session, automatically |
| Security check | Looks for 12 common mistakes and reports them in plain words | After risky changes, before release, or on request |
| Design tools | Figma and Canva connections | When design work comes up |

## Install

Requires [Claude Code](https://claude.com/claude-code) and Node.js 18 or newer.

```
/plugin marketplace add OWNER/vibe-starter
/plugin install vibe-starter@vibe-starter
```

To try it from a local copy without installing:

```
claude --plugin-dir /path/to/vibe-starter
```

Then just say what you want to make.

## The safety checks

These are fixed rules in a small script ([hooks/guard.mjs](hooks/guard.mjs), under 100 lines). No AI is involved in the decision.

| Situation | What happens |
|---|---|
| A secret file (`.env`, private keys) or a known secret key format is about to be saved to git | Blocked |
| A package that does not exist in the official npm registry is about to be installed | Blocked |
| A GitHub repository is about to be created or switched to public | You are asked |
| A command that cannot be undone: force push, discarding unsaved changes, deleting folders outside the project, releasing to the live service | You are asked |

If the check itself breaks, you are asked instead of the command passing silently.

## What this does not do

Please read this part.

- **It does not make your app secure.** It catches common mistakes. Passing the security check is not proof of safety. If you handle payments, health data, ID numbers, or children's data, get an expert review before release.
- **It only sees commands Claude runs.** Commands you type yourself in a terminal are not checked.
- **Secret detection knows common key formats only.** A key in an unusual format is not caught.
- **The package check covers npm, pnpm, yarn and bun.** Other package managers are not checked.
- **The scan script covers JavaScript and TypeScript, partly Python.** Other languages are reviewed by Claude reading the code, which is less reliable.
- **The working rules are instructions, not code.** Claude follows them most of the time, and less reliably in very long sessions. The safety checks are code and always run.
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

## Tests

```
node hooks/test.mjs
node skills/security-check/scan.test.mjs
```

Every rule has cases it must catch and normal work it must let through. The package test needs an internet connection.

## License

MIT
