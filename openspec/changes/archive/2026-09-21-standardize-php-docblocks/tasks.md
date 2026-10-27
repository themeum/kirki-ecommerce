## 1. Shared setup (main agent, serial)

- [x] 1.1 Update CLAUDE.md §2 "Docblocks": require the fixed structure and `@since 1.0.0` on every class, interface, trait, method and function, `@var` on properties, `@inheritDoc` for overrides; remove the "`@since` is not used" note
- [x] 1.2 Write the token-comparison script (strips `T_COMMENT`, `T_DOC_COMMENT`, `T_WHITESPACE`; compares a file against `git HEAD`) into the session scratchpad
- [x] 1.3 Write the coverage script that lists every `*.php` under `app/` and `database/` and fails unless each belongs to exactly one of batches B1-B16 in design.md
- [x] 1.4 Write the shared sub-agent brief: spec rules, docblock templates, verification commands, report format, "write only inside your batch, no git, no `composer scope`, report but do not fix unrelated problems"
- [x] 1.5 Verify: run the coverage script and the token script on an unchanged tree (both pass)

## 2. Parallel batches (main agent launches B1-B16 as sub-agents in a single message)

Each batch: read every file in scope, add or normalize docblocks per the spec, run `php -l` and the token script on each file, fix failures, then report files done, files skipped and why, and any suspicious code noticed.

- [x] 2.1 B1: `app/Http/Controllers/Api` (35 files)
- [x] 2.2 B2: `app/Http/Controllers/Site`, `Http/Middlewares`, `Blocks`, `Shortcodes`, `Hooks` (19 files)
- [x] 2.3 B3: `app/Http/Requests`, first half alphabetically (~32 files)
- [x] 2.4 B4: `app/Http/Requests`, second half (~31 files)
- [x] 2.5 B5: `app/DTO` (73 files)
- [x] 2.6 B6: `app/Constants`, `Contracts`, `Events`, `Listeners`, `Jobs`, `Policies`, `Traits`, `Facades` (73 files)
- [x] 2.7 B7: `app/Resources` (44 files)
- [x] 2.8 B8: `app/Services`, first half alphabetically (18 files)
- [x] 2.9 B9: `app/Services`, second half (18 files)
- [x] 2.10 B10: `app/Models`, `Concerns`, `Parsers`, `Wordpress` (49 files)
- [x] 2.11 B11: `app/Actions`, `app/Decisions` (42 files)
- [x] 2.12 B12: `app/Supports`, `Currency`, `Tax` (29 files)
- [x] 2.13 B13: `app/Menu`, `Scheduler`, `Settings`, `Providers`, `Mails`, `app/AppSettings.php`, `app/KirkiEcommerce.php`, `app/helpers.php` (57 files)
- [x] 2.14 B14: `app/Managers`, `app/Payment` (10 files)
- [x] 2.15 B15: `database/migrations` (66 files)
- [x] 2.16 B16: `database/seeders` including `OnBoarding` (28 files)
- [x] 2.17 Verify: every batch report received; any batch reporting failures or skipped files is re-run for those files only

## 3. Whole-tree gate (main agent, serial)

- [x] 3.1 Run the token script over every changed file against `git HEAD`; revert and redo any file that differs
- [x] 3.2 Run `php -l` over every file under `app/` and `database/`
- [x] 3.3 Confirm no file outside `app/` and `database/` changed (`git status`), and `vendor/libraries/framework/` is untouched
- [x] 3.4 Spot-read a sample of docblocks from each batch for restated names, wrong types, and missing `@throws`; send fixes back to the owning batch
- [x] 3.5 Collect the "suspicious code noticed" items from all reports into one list for the user
- [x] 3.6 Verify: token script, `php -l` and `git status` checks all clean

## 4. Enforcement

- [x] 4.1 Determine which PHPCS sniffs cover summary, `@since`, `@param`, `@return`, `@throws`, `@var` and tag order; add a minimal local sniff only if no stock sniff can require `@since`
- [x] 4.2 Add the sniffs to `phpcs.xml.dist` scoped to `app/` and `database/`, excluding individual sniffs only with a stated reason
- [x] 4.3 Run `vendor/bin/phpcs` and fix any docblock errors it reports (comment-only edits, re-run the token script on touched files)
- [x] 4.4 Add a temporary method without a docblock, confirm the check fails, then remove it
- [x] 4.5 Verify: `composer phpcs:wporg` and `vendor/bin/phpcs` pass; token script still clean on all changed files; `composer test:unit` passes if runnable locally, otherwise say it was not run

## 5. Wrap-up

- [x] 5.1 Report to the user: files changed, per-batch skipped items, suspicious-code list, and whether tests ran
- [x] 5.2 Do not commit or push; the user asks for that separately
