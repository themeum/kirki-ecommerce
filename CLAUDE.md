# Project Instructions for Claude

The PHP and React rule files (sections 2 and 3) are derived from the code in
this repository. If the codebase's conventions change, derive the rules again
from the code.

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

## 1b. Response Text

Write response text in ASD-STE100 (Simplified Technical English).

---

## 1c. Product Name

This plugin is **Kirki eCommerce**. "Kirki" is a different product. Never call
this plugin "Kirki".

- **User-facing text:** write "Kirki eCommerce" in UI strings, error messages,
  plugin headers, docs, readme, and changelogs. Example: "Requires Kirki
  eCommerce 1.0.1", not "Requires Kirki 1.0.1".
- **Identifiers:** keep the existing technical names (`kirki-ecommerce` slug and
  text domain, `KIRKI_ECOMMERCE_*` constants, `Kirki\Ecommerce` namespace).
  Do not change them only to match this rule.
- **Gateway names:** a gateway plugin's own name (for example "Kirki Stripe")
  is not the product name. Do not change it.
- **Existing text:** when you find "Kirki" used for this plugin in code you
  touch, tell me. Do not rename it outside the task.

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

## 2a. Use the themeum/framework first

Before you call a native WordPress or PHP function, check whether
`themeum/framework` already wraps it. If it does, use the framework version.
Examples: `Cache` (not transients), `Http` (not `wp_remote_*`), `File` (not
`unlink`/`hash_file`), `Extension` (not `Plugin_Upgrader`), `Superglobals` and
`Request` (not `$_GET`/`$_POST`).

Do not read a `KIRKI_ECOMMERCE_*` constant directly when `app()` gives the
same value. Examples: `app()->version()` (not `KIRKI_ECOMMERCE_VERSION`),
`app()->prefix()` (not `KIRKI_ECOMMERCE_PREFIX`), `app()->is_dev_mode()` (not
`KIRKI_ECOMMERCE_MODE`), and `app()->base_path()` (not
`KIRKI_ECOMMERCE_PLUGIN_PATH`). Use a constant only when `app()` has no
accessor that gives the same value (for example
`KIRKI_ECOMMERCE_PAYMENT_CATALOG_URL`), or in code that runs before `app()`
exists (`kirki-ecommerce.php`, `bootstrap/app.php`).

If the framework feature is buggy or incomplete, do not work around it with a
native call. Stop and tell me what is wrong, so I can improve the framework
first.

---

## 3. React / TypeScript Coding Standards

Full standards live in `.claude/rules/react-standards.md`, which loads when
working on `.ts`/`.tsx` files under `resources/app/`.

---

## 4. Backward Compatibility (strict)

Kirki eCommerce is released, and live stores use it. A store must be able to
install a new version on top of any earlier released version, and nothing
must break.

### 4.1 Branches

- `origin/main` is the last released version. It is the source of truth for
  what is "released".
- `origin/dev` is the base branch for development. Code that is on
  `origin/dev` but not on `origin/main` is not released yet. You can change it
  freely.

### 4.2 How to check

Before you change a public surface (see 4.3), do these steps:

1. Run `git fetch origin main dev`.
2. Find out if the surface exists on `origin/main` (`git show origin/main:<path>`,
   `git grep <name> origin/main`).
3. If it exists on `origin/main`, the rules in 4.3–4.6 apply. If it exists only
   on `origin/dev`, it is unreleased and the rules do not apply.

At the end of each task, write a short "Backward compatibility" note in your
response. Name each released surface that you changed and tell how the change
stays compatible. If you changed no released surface, say so.

### 4.3 Public surfaces

These surfaces are public. Third parties, gateway plugins (for example Kirki
Stripe), themes, and saved store data depend on them:

- **Database and stored data:** table schemas, columns, migrations,
  `wp_options` and settings keys and their value shapes, post meta, and
  serialized data.
- **PHP extension API:** action and filter names and their arguments, public
  classes, methods, functions, helpers, constants, and namespaces.
- **REST API:** route paths, request parameters, and response shapes.
- **Front-end output:** shortcodes, blocks and block attributes, template and
  view overrides, CSS classes, JS globals, and JS events.

### 4.4 Deprecate, do not remove

Do not remove or rename a released public function, method, class, hook,
constant, route, shortcode, or block attribute. Deprecate it first:

- Keep the old name working. Make it call the new code.
- Call `_deprecated_function()`, `_deprecated_hook()`, or
  `_deprecated_argument()` with the version that deprecates it.
- Add a `@deprecated <version> Use <replacement>.` docblock tag.
- Keep the deprecated item until the next major version (2.0.0). Remove it
  only in a major version.

Only add to signatures and payloads: add new optional parameters at the end
with defaults, and add new response fields. Do not remove, reorder, or change
the type of existing ones.

### 4.5 Stop and ask first

Do not write the change. Stop and ask me first when a task needs one of these:

- A breaking change to a released public surface that a deprecation cannot
  cover. Tell me what breaks for stores on `origin/main`, and give a
  non-breaking alternative.
- Any change to the database schema or to stored data: a new, changed, or
  dropped table or column, a new migration, or a change to how an option,
  setting, or meta value is stored. We decide each case on its own.
- A higher minimum requirement: `Requires PHP`, `Requires at least`
  (WordPress), or the Kirki eCommerce version that a gateway needs.
- A change to a default value or default behaviour that changes what an
  existing store gets when it did not change that setting (for example
  prices, tax, emails, or the checkout flow).
- The removal of a feature, setting, admin page, or email that stores on
  `origin/main` use.

### 4.6 Never edit released migrations

Do not edit a migration file that is on `origin/main`. Stores that updated
already ran it, and they will not run it again.

## 6. Documentation

User-facing features get a `docs/<feature>.md`, structured like
[`docs/emails.md`](docs/emails.md): a table of contents, then numbered `## N. Topic`
sections, quick start first, reference sections in the middle, and — for
anything modelled on an existing system (a Laravel API, a WooCommerce feature) —
a **"Where this differs from <system>"** section near the end that is honest
about the gaps. That section is not
optional; it is what stops a consumer assuming parity we don't have.

Keep docs in the same change as the code. A doc that describes the old
behaviour is worse than no doc.

---

## 7. Commits

Don't commit or push unless I ask. When I do ask commit the changes with a inferred
commit message that is good enough for PR title and description and also push on behalf of me.
And in a PR description or title or anywhere never mention "Generated with Claude Code" or don't
mention claude code.

## 8. Grilling behavior

When using the /grill-me skill ask me questions one by one and use the graphical interface
so that I can select my answer graphically. Always mention your recommendation while questioning.
