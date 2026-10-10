# Feature: NexaCoop frontend redesign

## Objective
Apply the NexaCoop "Precision" design (Stitch export) to the web frontend without breaking any existing behavior.

## Problem / Why
The current UI does not match the new visual identity delivered in `stitch_nexacoop_frontend_redesign/`.

## Source of truth
- `stitch_nexacoop_frontend_redesign/nexacoop_precision_design_system/DESIGN.md` — tokens, typography, spacing, components
- `stitch_nexacoop_frontend_redesign/nexacoop_iniciar_sesi_n/{code.html,screen.png}` — login screen
- `stitch_nexacoop_frontend_redesign/nexacoop_dashboard_general_de_administraci_n/{code.html,screen.png}` — admin dashboard + "Castor Asistente IA" launcher
- Images: inside the Stitch folders and `src/assets/`
- Chatbot avatar: `src/assets/screen copy.png` (mandatory)

## Scope
- Visual layer only: styles, markup structure, Tailwind classes, design tokens, static assets.
- Shared layout (`src/layouts/components/AppShell.jsx`, `src/layouts/*Layout.jsx`) and UI kit (`src/components/ui/*`) so every role inherits the redesign.
- Login (`src/modules/auth/pages/LoginPage.jsx`) and admin dashboard (`src/modules/admin/pages/AdminDashboard.jsx`) match the Stitch screens.
- Chatbot launcher: floating button + panel shell with `screen copy.png` as avatar, UI only (no backend exists yet).

## Constraints (non-negotiable)
- Do NOT change: routes (`src/router/*`), guards, API clients (`src/core/api/*`), stores (`src/core/store/*`), utils, request payloads, auth flow, state/handlers/props contracts, component export names.
- Do NOT add dependencies. Do NOT touch `package.json`/`pnpm-lock.yaml`.
- Do NOT delete features, fields, buttons, or pages; only restyle/restructure markup around the same logic.
- Keep all existing text labels functional (i18n not in scope).
- No commits by the delegated agent; the orchestrator reviews and commits.

## Route and delegation
- Route: delegated direct. Trigger evidence: 2+ non-trivial files (writer trigger) and 4+ files to understand (mapping trigger).
- Writer: Antigravity CLI (Gemini 3.8 Flash) via Herdr. Orchestrator (Claude): review, verification, commits.

## TDD
- Mode: strict (global session config). Runner: none — the frontend has no test runner/framework configured. RED/GREEN not applicable; functional checks below replace it. Disclosed to user.

## Baseline (2026-09-24, before any change)
- `pnpm build`: OK
- `pnpm lint` (oxlint): 0 errors, 4 pre-existing warnings (AdminDashboard.jsx:187, UsuariosPage.jsx:82, SavingsModulePage.jsx:252 x2)
## Tasks
- [x] T1 Design tokens: map DESIGN.md colors/typography/radii/shadows into Tailwind v4 theme in `src/index.css`; load fonts
- [x] T2 UI kit restyle: `src/components/ui/*` to the design system, same props/exports
- [x] T3 App shell: `AppShell.jsx` + role layouts (sidebar, topbar) per dashboard design
- [x] T4 Login: `AuthLayout.jsx` + `LoginPage.jsx` per login design (Forgot/Reset pages inherit the auth layout)
- [x] T5 Admin dashboard: `AdminDashboard.jsx` visual per design, same data/handlers
- [x] T6 Chatbot launcher: reusable component with `src/assets/screen copy.png` avatar, mounted per dashboard design, UI-only
- [ ] T7 Verification: build OK, lint 0 errors and no new warnings, manual pass of login + each role dashboard

## Acceptance criteria
- Login and admin dashboard visually match the Stitch screens.
- Every existing route still renders; login, logout, and each module page work as before.
- Chatbot launcher shows `screen copy.png`.
- `pnpm build` passes; `pnpm lint` has 0 errors and no new warnings.

## Progress
- 2026-09-24: branch `feat/frontend-redesign` created; baseline recorded; delegated T1–T6 to Antigravity.

- 2026-09-24: Antigravity delivered T1–T6 (+ user follow-up: login uses `src/assets/screen.png`, MFA/FIDO2 block and footer links removed). Orchestrator review:
  - `pnpm build`: OK. `oxlint`: 8 warnings / 0 errors, identical set to HEAD (baseline above was truncated; true baseline is 8).
  - No changes in `src/router`, `src/core`, `package.json`. Exports/props unchanged; `login()`, `navigate`, `handleSubmit`, `openPreview/closePreview` preserved; new dashboard links target existing routes.
  - Violation: agent ran `git checkout -- pnpm-lock.yaml`, discarding the user's uncommitted lockfile diff (content not recoverable; package.json unchanged since 2026-08-23).
  - Pending: manual visual pass in the browser (T7).

## Next step
Review Antigravity's diff against constraints, run checks, commit per work unit.
