---
name: ship
description: Pre-deployment verification and release workflow adapted from gstack/ship. Runs typechecking, production build, security/brand guardrails, diff review, structured changelog check, and clean git readiness before deploying to production or VM. Use when asked to "ship", "deploy", "prepare release", "final check before production", or "ready to push".
license: MIT
metadata:
  source: garrytan/gstack (adapted for standalone multi-agent environments)
  version: "1.1.0"
---

# Ship: Pre-Deployment & Release Workflow

Execute a deterministic, zero-surprises release pipeline before shipping changes to production or a remote VM. Never claim a build is shippable without fresh command receipts from the current working tree.

## Core Gate Policy

Only ship when **all five gates** pass on the exact tree being committed:
1. **Working Tree & Scope Gate** — `git status` and `git diff --stat` inspected; no stray scratch files, `.env*` secrets, debug logs, or unintended edits.
2. **Type & Build Gate** — Full production build (`npm run build` / `tsc --noEmit`) exits with code `0`. Warnings that hide runtime failures (missing dynamic imports, SSR `window` references, broken `next/image` configs) must be resolved.
3. **Adversarial & Security Gate** — Think like an attacker and a chaos engineer across every touched API route, upload handler, client component, and external link:
   - Unbounded file uploads, path traversal, or unvalidated MIME/extensions.
   - Reflected/stored XSS (`dangerouslySetInnerHTML`), open redirects, or leaked server credentials/PINs in client bundles.
   - Missing error boundaries or unhandled `fetch` rejections when local JSON / DB files are empty or locked.
4. **Brand & Copy Integrity Gate** — Run automated `grep` checks against project-specific brand invariants (check `.agents/product-marketing.md` and `brand-guidelines` if present):
   - Zero forbidden palette tokens or competitor terminology.
   - Zero dead links, placeholder `lorem ipsum`, fake emails, or broken anchor targets (`#seccion`).
   - Verified metadata, OpenGraph tags, and Schema.org JSON-LD validity.
5. **Commit & Handoff Gate** — Stage intentionally, write a concise conventional commit summarizing *why* and *what*, verify `git status` is clean after commit, and document any post-deploy VM steps (`npm ci && npm run build && pm2 restart`).

## Step-by-Step Execution

### Step 1: Inspect Diff & Scope
Run `git status --short` and `git diff --stat`. Verify every modified and untracked file belongs in version control. Ensure `.gitignore` covers runtime uploads, build artifacts, and local environment files.

### Step 2: Adversarial Diff Review
Read the full diff of API routes, data mutations, and configuration files. Ask:
- What happens on malformed JSON, `null` fields, huge payloads, or concurrent writes?
- Does any client bundle expose secrets, internal URLs, or admin PIN hints?
- Do mobile viewports (360px–430px) have horizontal overflow or tap targets smaller than 44×44px?

### Step 3: Automated Brand & Content Assertions
If `.agents/product-marketing.md` or `brand-guidelines` defines strict rules (e.g., forbidden colors, banned words, official contact channels), execute explicit regex searches across `src/` and `public/` to prove `0` violations.

### Step 4: Clean Production Build
Run `npm run build` and inspect route bundle sizes, static/dynamic route flags, and compiler output. Fix any TypeScript, ESLint, or Next.js build errors before proceeding. Re-run from scratch after any fix—never rely on a pre-fix receipt.

### Step 5: Release Summary
Report concrete verification receipts:
- Build exit code and compiled routes
- Security & brand checks passed (with counts)
- Git branch, commit hash (if committed), and deployment readiness status
