// Shared by the safety hook (guard.mjs) and the security scan (scan.mjs).
// These catch well-known secret formats only. A key in an unknown format is not caught.

// File names that normally hold secrets. Templates like .env.example are allowed.
export const SECRET_FILE = /(^|\/)(\.env(\.(?!example|sample|template)[\w.-]+)?|id_(rsa|ed25519)|[^/]+\.pem)$/;

// Secret values: OpenAI/Anthropic-style keys, Stripe live keys, GitHub tokens, AWS key ids,
// Google API keys, Slack tokens, private key blocks.
export const SECRET_TEXT = /sk-[A-Za-z0-9_-]{20,}|sk_live_[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{22,}|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{35}|xox[baprs]-[A-Za-z0-9-]{10,}|-----BEGIN [A-Z ]*PRIVATE KEY-----/;
