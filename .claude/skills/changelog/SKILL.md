---
name: changelog
description: Generate the Kirki eCommerce release changelog from git and write it into readme.txt's `== Changelog ==` section, under the version from kirki-ecommerce.php. Compares origin/main (base) with origin/dev (target) by default, or any two branches the user names. Use this whenever the user asks to write, generate, update, or refresh the changelog, release notes, "what's new", or the readme.txt changelog, or asks what changed between main and dev / between two branches for a release, even if they do not say "changelog".
---

# Changelog

Write a plain-language changelog for the next Kirki eCommerce release and store
it in `readme.txt`. The readers are store owners on WordPress.org, not
developers, so every line must make sense to someone who never saw the code.

All paths are relative to the plugin root (the folder that holds
`kirki-ecommerce.php` and `readme.txt`). Run git commands from there.

## 1. Pick the branches

- Default: **base** `origin/main`, **target** `origin/dev`.
- If the user names branches, use them. "from X to Y", "X..Y", or "between X
  and Y" means base X, target Y. A bare branch name like `release/1.1` gets the
  `origin/` prefix if a remote branch with that name exists.

Run `git fetch origin` first. Local remote refs are often old, and an old ref
gives a changelog that misses work.

## 2. Find the version

Read the version from the **target** branch, because the changelog describes
that branch, not whatever is checked out locally:

```bash
git show <target>:kirki-ecommerce.php | grep -m1 'Version:'
git show <base>:kirki-ecommerce.php   | grep -m1 'Version:'
```

If the target version equals the base version, nobody has bumped the version
yet. Stop and ask the user which version to use; do not guess, because writing
under the old version would overwrite the released entry.

## 3. Collect the changes

Use commits for intent and the diff for truth:

```bash
git log --merges --format='%s%n%b' <base>..<target>   # PR titles + bodies
git log --no-merges --format='%s' <base>..<target>    # direct commits
git diff --stat <base>...<target>
```

Merge commits like `Merge pull request #457 from themeum/feat/...` give one
unit of work each; the branch name (`feat/`, `fix/`, `perf/`) and the PR body
hint at the type. Where a title is vague ("update", "fix conflict"), look at
`git diff <base>...<target> -- <paths>` for that work to see what really
changed. Ignore "Merge branch 'dev' into ..." and conflict-fix commits; they
are not changes.

**Keep technical changes that reach the store**, even when nothing looks
different on screen: performance, security, data that changes or is deleted on
update, removed settings or features, changes to the data that search engines
read, currency or compatibility limits, and email or checkout behaviour. A store
owner needs to know about these, so describe them in plain words.

**Leave out only developer-only work**, which has no effect on a running
store: tests, CI and deploy workflows, WP-CLI or other developer commands,
refactors and renames with no visible effect, `openspec/`, `dev-tools/`,
`docker/`, internal docs, lint/format, and dependency bumps with no visible
effect. If you are not sure whether a change reaches the store, keep it and
mention it in your report.

**One line per change.** Combine the commits of one change into one line (ten
commits on the bKash gateway are one line), but never combine different
changes into one line, even when they are similar. Two new gateways are two
lines; a faster dialog and a hidden tax field are two lines. A reader scans
for the one change they care about, and a combined line hides it.

## 4. Write the entries

One line per change, in this exact form:

```
* New: - Customers can now pay with bKash at checkout.
* New: - Customers can now pay with SSLCommerz at checkout.
* Update: - Bulk updates of product variants are faster.
* Update: - Schema profiles are removed. Every product now uses the same structured data.
* Fix: - Tax is no longer charged on variants that have "Charge tax" turned off.
```

These lines show the style only. Take every fact from the git history, never
from these examples.

- **Type** is one of `New` (a feature that did not exist), `Update` (an
  existing feature works better or differently, or was removed), `Fix`
  (something was broken and now works). There is no other type; technical
  changes go under one of these three. Order the list: all New, then all
  Update, then all Fix. Inside a type, put the change most owners care about
  first.
- **Description** is one short sentence, about 15 words or fewer. Say what was
  added, changed, or fixed, and stop. A changelog line tells the reader *that*
  something changed so they can decide if it matters to them; it is not
  documentation. Leave out how to turn it on, where to find it, step-by-step
  use, and side details. Use a second sentence only for something an owner
  must know before they update, such as a removed feature.
- **Be specific, not long.** Name the exact feature or thing that changed, so
  the line is not vague: "Fixes the product selection dialog" says nothing;
  "The product selection dialog is faster" names the change. If the commits do
  not tell you what changed, read the diff, but put only the result in the
  line.
- **No code.** No code names (functions, classes, fields, tables, options,
  hooks), file names or paths, commands, backticks, PR numbers, commit hashes,
  or branch names. Technical words a store owner does not know (API, endpoint,
  refactor, JSON-LD, migration) become plain words: "the data that search
  engines read", "deleted on update".
- Payment gateways, shipping, tax, and similar features keep their real names
  (PayPal, bKash, SSLCommerz, EU VAT), because owners search for those.
- Call the plugin "Kirki eCommerce", never just "Kirki". "Kirki" is a
  different product.

## 5. Write readme.txt

Save the bullet lines to a new temp file of your own (`mktemp`), so that two
runs at the same time cannot overwrite each other. Then run the bundled script. It finds the
`== Changelog ==` section, and either replaces the bullets of an existing
entry for this version (keeping its original date, so regenerating does not
move the release date) or adds a new entry at the top with today's date:

```bash
python3 .claude/skills/changelog/scripts/write_changelog.py \
  --readme readme.txt --version <version> --entries <entries-file>
```

Change nothing else in `readme.txt`. The script prints a warning when
`Stable tag:` differs from the version; pass that warning on to the user but do
not edit the tag.

## 6. Report

Tell the user, briefly:

- the base and target used, and the version
- whether the entry was inserted or replaced
- the final entry block exactly as written
- the Stable tag warning, if any
- anything you left out that might be borderline (so they can ask for it back)
