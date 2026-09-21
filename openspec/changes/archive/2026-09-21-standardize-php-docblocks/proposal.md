## Why

PHP docblocks in `app/` and `database/` are inconsistent: only 44 of 606 classes/interfaces/traits have one, about half of the 1958 methods have one, `@since` appears in 76 files, tag order and array-type notation vary file to file. Developers can't tell which version introduced a class or method, and reading a method's contract means reading its body.

## What Changes

- Every class, interface, trait, method, function and property in `app/**/*.php` and `database/**/*.php` gets a docblock in one fixed structure.
- Classes, interfaces, traits, methods and functions get a one-line summary and `@since 1.0.0`. Methods and functions add `@param`, `@return` and `@throws` where they apply; properties get `@var`.
- Interface implementations and overrides use `@inheritDoc`.
- Existing docblocks are normalized to the same structure (tag order, type notation, missing tags), not left as-is.
- CLAUDE.md §2 "Docblocks" is rewritten to match; it currently says not to add `@since`.
- A narrow PHPCS rule is added so new code can't drift.
- Docblock-only: no native type hints, no renames, no logic edits. A token-stream comparison (comments and whitespace ignored) proves it per file.
- Excluded: `vendor/libraries/framework/`, `resources/views/`, `config/`, `routes/`, bootstrap files, closures.

## Capabilities

### New Capabilities

- `php-docblock-standard`: the required docblock structure, tags, ordering, type notation and `@since` value for PHP declarations in `app/` and `database/`.

### Modified Capabilities

<!-- None: no existing requirement changes. -->

## Impact

- About 624 PHP files under `app/` and `database/`, comment lines only.
- `CLAUDE.md` (§2 Docblocks) and `phpcs.xml.dist` (new comment sniffs).
- No runtime, API or database behavior change. The `composer scope` output is unaffected apart from comment text.
- One PR for the whole change; work is split by folder into parallel batches during apply.
