---
name: quickupdate
description: Fast end-to-end mini pipeline for small updates — mini /ask, /tdd implementation with the full test suite at the end, manual HITL test steps, fix loop if needed, /ship, then /release-product with shorter content drafts. Use when the user says /quickupdate, "szybki update", "quick update", "szybka zmiana", "quick fix and release" or wants a small change implemented, tested and released in one go. If the scope grows beyond a small update, propose the full /brainstorm flow instead.
argument-hint: "[opis zmiany | #issue]"
---

# quickupdate

Mini pipeline for small updates: **mini-ask → /tdd → full test suite → HITL → (fix loop) → /ship → /release-product (short content)**.

One command, five phases. Never skip a phase, never reorder. Keep every phase lean — the whole point is speed.

## Golden rules

- Small updates only. The moment the scope grows (new architecture, multiple features, a new product area, a migration), STOP and propose the full /brainstorm — see Phase 1 escalation check.
- Content is NEVER published — drafts only (dev.to, substack.com, bsky.app, x.com; never LinkedIn).
- Commits and pushes always as the user (MrCrystal2). No Co-Authored-By lines, no bot identities.
- Ship only after the user confirms HITL passed (or explicitly decides to ship anyway).
- Never edit `.env` or any file containing secrets/API keys.
- At most ONE AskUserQuestion per gate: Phase 1 questions, HITL verdict, /ship's commit confirmation, release-product's release confirmation. Batch, don't drip.

## Phase 1 — Mini /ask

A compressed /ask: understand the change, nothing more.

1. Issue number given (`/quickupdate #123`)? Fetch it with `gh issue view` — the acceptance criteria are the scope. Ask only about genuine ambiguities (often zero questions).
2. Otherwise ask UP TO 3 questions in ONE batched message (not one at a time like full /ask): what exactly to change, where (files/area), what "done" means.
3. Everything already clear from the conversation? Skip the questions — restate the scope in 2-3 lines and move on.
4. **Escalation check.** While asking (and while implementing), watch for scope growth: a feature touching many subsystems, schema/architecture decisions, a brand-new capability, a second "and also…". If it happens, STOP and ask via form: "This looks bigger than a quick update — switch to full /brainstorm?" (yes → hand off to /brainstorm; no → continue quickupdate with the narrowed scope).
5. The restated scope IS the TDD plan. Approval given in this phase counts as plan approval — do not ask again before implementing.

## Phase 2 — /tdd

Invoke the /tdd skill with the Phase 1 scope.

- Standard RED→GREEN per behavior, surgical scope, mocks only at system boundaries.
- Full test suite runs ONCE at the end (after the last slice + refactor), together with lint / type-check if the repo has them. No full-suite runs between slices.
- Implementation reveals the scope is bigger than agreed → back to the Phase 1 escalation check.

## Phase 3 — HITL

All automated tests green. Now the human verifies.

1. Write short manual test steps (numbered, in the real app — click where, expect what). Max ~5 steps for a small update.
2. Ask via form: "Does everything work?" (all good / found a bug).
3. Bug found → fix loop: fix it, re-run the full test suite, give updated HITL steps, ask the form again. Repeat until the user confirms all good. No /ship before that confirmation.

## Phase 4 — /ship

Invoke the /ship skill (lint, type-check, commit as the user, pull, push, close the current issue).

- Keep /ship's own commit-message confirmation gate.
- Any /ship step fails → STOP, report, fix. Only return to Phase 3 if the fix changed code the user tests.

## Phase 5 — /release-product (short content)

Invoke the /release-product skill. Everything runs as usual (version proposal, ONE confirmation form, tag + release, Actions watch/fail flow) with ONE override, stated explicitly when invoking:

**Content drafts use the SHORT variant** — applied in release-product's content step:

| Channel  | Full variant      | SHORT variant (quickupdate)                                                        |
| -------- | ----------------- | ---------------------------------------------------------------------------------- |
| dev.to   | full case study   | ~60% length: TLDR + key facts + what changed + why it matters; FAQ cut to 3 items   |
| substack | full article      | condensed version of the dev.to draft                                              |
| X        | full thread       | 3-4 posts                                                                          |
| bsky.app | rich multi-post   | 1-2 posts                                                                          |
| LinkedIn | —                 | never (always excluded)                                                            |

- Voice rules unchanged: write as WE (Crystal Studio / Crystal Platforms), never "I".
- Drafts only. Never publish. Content failure → warn only; the release already exists and drafts can be regenerated later.

## Final summary

Report in one block: what changed (1-3 bullets), automated test + HITL status, commit + closed issue, release URL + version, Actions status, content draft paths + reminder to publish manually.
