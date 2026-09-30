# Project Instructions for Claude

This file is based on `.cursor/rules/` but the PHP and React sections have
been re-derived from the actual codebase (not just copied from the `.mdc`
files), so they reflect real conventions rather than stale ones — e.g. the
frontend moved from `.jsx` to TypeScript, and the PHP `@since`/`final` rules
didn't match what the code actually does. Section 1 (behavioral guidelines)
is a direct mirror of `karpathy-guidelines.mdc`. If the codebase's conventions
change, re-derive rather than trusting `.cursor/rules/` at face value.

---

## 0. Testing / Verification

Do not use the Browser tool (or any dev-server preview) to test or verify
changes in this project. Skip the browser-based verification workflow
entirely — rely on typecheck (`npm run typecheck`), lint, and the test suite
(`npm test` in `resources/app/`) instead. If a change genuinely needs visual
confirmation, say so and let the user check it themselves rather than
opening a browser preview.

---

## 1. Behavioral Guidelines (always apply)

Source: `.cursor/rules/karpathy-guidelines.mdc`

Behavioral guidelines to reduce common LLM coding mistakes.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

### Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: every changed line should trace directly to the user's request.

### Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

## 1a. Planning Workflow

When entering plan mode in this project, always use the **OpenSpec workflow**
instead of writing a freeform plan. Reach for the `openspec-*` / `opsx:*`
skills:

- `opsx:explore` — think through the problem before committing to a change
- `opsx:propose` — generate a full proposal (spec deltas, design, tasks)
- `opsx:apply` — implement tasks from an existing change
- `opsx:sync` — sync delta specs into main specs
- `opsx:archive` — finalize and archive a completed change

Before implementing tasks from an existing change always ask me to run the command `opsx:apply` manually
by myself instead of applying automatically.

Note: Whenever I start a new session make sure to follow the **OpenSpec workflow** by default.

---

## 2. PHP Coding Standards

Full standards live in `.claude/rules/php-standards.md`, which loads when
working on PHP files under `app/`, `database/`, or `resources/views/`.

**Do not use `vendor/libraries/framework/src/` as a style reference, and do not
hand-edit it.** It is the `themeum/framework` package, relocated there from
`vendor/themeum/framework` and namespace-rewritten by the `composer scope`
script (`php-scoper` stages the prefixed output, then `bin/scope-framework.php`
swaps it in). Any edit is lost on the next `composer install`. Its conventions
belong to the upstream package, not this project.

---

## 3. React / TypeScript Coding Standards

Full standards live in `.claude/rules/react-standards.md`, which loads when
working on `.ts`/`.tsx` files under `resources/app/`.

## 6. Documentation

User-facing features get a `docs/<feature>.md`, structured like
[`docs/cache.md`](docs/cache.md): a table of contents, then numbered `## N. Topic`
sections, quick start first, configuration and drivers in the middle, and — for
anything modelled on a Laravel API — a **"Where this differs from Laravel"**
section near the end that is honest about the gaps. That section is not
optional; it is what stops a consumer assuming parity we don't have.

Keep docs in the same change as the code. A doc that describes the old
behaviour is worse than no doc.

---

## 7. Commits

Don't commit or push unless I ask. When I do ask commit the changes with a inferred
commit message that is good enough for PR title and description and also push on behalf of me.

## 8. Grilling behavior

When using the /grill-me skill ask me questions one by one and use the graphical interface
so that I can select my answer graphically. Always mention your recommendation while questioning.
