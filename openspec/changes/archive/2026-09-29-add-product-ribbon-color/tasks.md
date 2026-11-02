## 1. Schema

- [x] 1.1 Add `database/migrations/AddRibbonColorToProductsTable.php`:
      nullable `string('ribbon_color', 20)`, placed `after('ribbon')`, with a
      column comment naming the five allowed values. Mirror the shape of
      `AddLowStockThresholdToVariantsTable`.
- [x] 1.2 Implement `down()` to drop the column.
- [x] 1.3 Register the migration in `config/migrations.php`.

## 2. Backend round trip

- [x] 2.1 Add `ribbon_color` to `Product::$fillable`.
- [x] 2.2 Add the `$ribbon_color` property to `CreateProductDTO` and
      `UpdateProductDTO`.
- [x] 2.3 Add the validation rule to `ProductCreateRequest` and
      `ProductUpdateRequest`, constraining the value to the palette and
      allowing null, plus `Sanitizer::TEXT` in the sanitizer map. Do not
      wrap the sanitizer output in another WP sanitize call. Added
      `App\Constants\Product\RibbonColor` (matching the `ProductStatus`
      pattern) so the `in:` rule and the palette share one PHP source.
- [x] 2.4 Output `ribbon_color` from `ProductResource`.
- [x] 2.5 Carry `ribbon_color` in `DuplicateProductAction`.
- [x] 2.6 Add a `ribbon_color` output to `ShopProductResource` beside
      `ribbon_text`, resolved by a new `protected` method that returns the
      out-of-stock state's colour when out of stock and otherwise the stored
      colour, falling back to the palette's first entry when null.
- [x] 2.7 Draw the badge in that colour in
      `resources/views/site/shop/parts/product-card.php`, escaping with
      `esc_attr`.
- [x] 2.7a (added) The single-product page (`resources/views/site/shop/single.php`,
      `.kecom-product-ribbon` in `resources/site/scss/pages/_product-details.scss`)
      renders the same ribbon badge from `ProductResource` (not
      `ShopProductResource`) and was missed by the original Impact list —
      it read `ribbon` but never `ribbon_color`. Applied the same
      CSS-custom-property pattern as the card, with the null → palette-first
      fallback done in the view (`RibbonColor::get_default()`), since
      `ProductResource` itself stays a raw pass-through and this page has no
      out-of-stock-override concept for its ribbon (unlike the card).
- [x] 2.8 Run `composer phpcs:wporg` and clear anything it reports on the
      touched files. Note: the default `php` on this machine is 8.4, under
      which `phpcs` silently exits 0 with no report at all (pre-existing,
      unrelated to this change — reproduces on untouched files too) because
      `thecodingmachine/safe`'s generated stubs emit PHP 8.4 deprecation
      notices at autoload time. Ran via Herd's `php74` binary instead
      (matches `composer.json`'s `platform.php: 7.4.33`), which reports
      cleanly: zero errors/warnings on all touched files.

## 3. Frontend schema

- [x] 3.1 Export the palette constant with the five colours, first as
      default. `RIBBON_COLOR_PALETTE` lives in `product-basics-form.ts`,
      next to the schema field that validates against it.
- [x] 3.2 Add `ribbon_color` to `ProductBasicsFormSchema`, defaulting to the
      first palette colour and accepting null.
- [x] 3.3 Thread it through `product-form.ts`'s transform, sending null when
      the ribbon text is blank — matching how `ribbon` itself is nulled.
- [x] 3.4 Add `ribbon_color` to `schemas/catalog/product.ts` so `libs/api.ts`'s
      dev tripwire does not warn on every product response. Kept as a bare
      `z.string().nullable()` (not the palette enum) per `openspec/project.md`'s
      rule that catalog/response schemas stay lenient — same treatment `ribbon`
      itself already gets.
- [x] 3.5 Extend `product-form.test.ts` for the blank-ribbon and
      colour-carrying payload cases. `npx vitest run` on this file: 24/25
      pass; the 1 failure (`ProductFormVariantSchema` fully-filled-variant,
      missing `committed_quantity`) is a pre-existing baseline failure
      unrelated to this change — untouched by these edits.

## 4. Sidebar UI

- [x] 4.1 Build the swatch row: one control per palette colour, the current
      one visibly marked, each with an accessible name. Use `theme` tokens
      for size, spacing and the selected ring; the colours themselves come
      from the palette constant. New `ribbon-swatches.tsx`; each swatch is a
      `role="radio"` in a `role="radiogroup"` (mutually-exclusive single
      choice), `aria-label` is the hex value since the palette has no design
      names.
- [x] 4.2 Build the preview badge, rendering the current ribbon text
      uppercased in the current colour, and the literal "Preview" while the
      text is empty. `RibbonPreviewBadge`, same file.
- [x] 4.3 Compose both into `ribbon.tsx` under the existing
      `CollapsibleField`, reading the values via `watch` so the preview
      tracks typing.
- [x] 4.4 Extend the field's remove control to clear the colour along with
      the text (sets `ribbon_color` to `null`, matching "clears... its
      colour" rather than resetting to the default).
- [x] 4.5 Write `ribbon.test.tsx`: empty field shows "Preview" on the first
      colour, typing updates the preview, choosing a colour marks it current
      and redraws, and removing clears both values. `npx vitest run` on
      this file: 4/4 pass.

## 5. Verification

- [x] 5.1 `npm run typecheck`, `npm run lint`, `npm test` in
      `resources/app/` — each measured against a stashed clean-tree
      baseline, reporting the delta rather than an absolute. Baseline (this
      branch already carries unrelated in-progress work): typecheck 1
      pre-existing error, lint 6 pre-existing errors, tests 1 pre-existing
      failure (`ProductFormVariantSchema` / `committed_quantity`) out of
      1174. After this change: typecheck and lint output are byte-identical
      to baseline (zero delta); tests: same single pre-existing failure,
      no new failures, plus this change's new/extended tests passing
      (`ribbon.test.tsx` 4/4, the 2 new `product-form.test.ts` cases).
- [x] 5.2 `composer phpcs:wporg` clean on the touched PHP. See 2.8 — run via
      Herd's `php74` (the machine's default `php` is 8.4, under which phpcs
      silently produces no report at all, reproducing on untouched files
      too).
- [x] 5.3 Confirm the migration runs on a fresh install and on a database
      that already has the products table, and that existing ribbons still
      render afterwards. Verified against the real dev MariaDB
      (`docker compose exec mariadb`, `wp eval`), not mocked:
      `AddRibbonColorToProductsTable->up()` on a `CreateProductsTable`-only
      table (the pre-ribbon-color / upgrade shape) adds `ribbon_color
      varchar(20) NULL` immediately after `ribbon`, with the palette in the
      column comment (`SHOW FULL COLUMNS` confirmed); `down()` cleanly drops
      it back. **Could not** get a full end-to-end run through the project's
      own migrator (`migrator()->run()` / `composer test:docker:integration`)
      — both fail before reaching this migration, at the pre-existing,
      unrelated `DropShowUnitPriceFromVariantsTable` ("Can't DROP COLUMN
      show_unit_price; check that it exists"), reproduced on the real dev DB
      and the test DB alike, and unaffected by this change (it is earlier in
      `config/migrations.php` and untouched here). **Side effect needing
      cleanup**: reaching that isolated verification required calling
      `CreateProductsTable->up()` directly, and separately WordPress's
      `before_each` version-update hook (`config/version-updates.php`) ran
      the full migrator as a side effect of `wp eval` bootstrapping — between
      them this created ~41 empty `wp_kirki_ecommerce_*` tables and 2
      `wp_options` rows (`kirki_ecommerce_framework_migrations`,
      `kirki_ecommerce_installed_version`) on the shared dev DB that were not
      there before. Dropping them was blocked by the sandbox's destructive-
      action guard, so they are still there — flagged to the user to clean
      up or approve cleanup, see end of turn.
- [x] 5.4 Per CLAUDE.md §0, run no browser preview (none was opened). Hand
      the user the visual checks: that the preview badge matches the
      draft's proportions, and that the storefront card badge picks up the
      colour.

## 6. Follow-up: custom colour (post-implementation, reverses design.md's original Non-Goal)

The user asked for a 6th "add a custom colour" swatch with a "+" affordance,
opening a picker, replacing the "fixed five-entry palette" Non-Goal from
design.md with "five defaults plus any custom hex".

- [x] 6.1 Widen `ribbon_color` validation: dropped the `in:` palette
      restriction from `ProductCreateRequest`/`ProductUpdateRequest` in
      favour of `string|nullable|max:20` — the same minimal pattern this
      codebase already uses for `AttributeValueCreateRequest`'s free-form
      `color` field. Removed the now-unused `RibbonColor` import from both
      request classes (the constant class itself stays — `get_default()` is
      still used for the null-fallback).
- [x] 6.2 Widened the frontend schema field the same way:
      `ribbon_color: z.string()` instead of `z.enum(RIBBON_COLOR_PALETTE)`
      in `product-basics-form.ts`; removed the now-inaccurate `RibbonColor`
      TS type alias (the field is no longer restricted to that union).
- [x] 6.3 Updated the migration's column comment (not yet shipped, so edited
      in place rather than a new Alter migration) from "Supported values: …"
      to "Default swatches: …; a custom hex is also accepted" — it was
      documentation only, never enforced by the DB, but was actively wrong
      once the `in:` rule was dropped.
- [x] 6.4 Added a 6th control to `RibbonColorSwatches` built on the existing
      `ColorPicker`/`ColorPickerTrigger`/`ColorPickerContent`/`ColorPickerArea`/
      `ColorPickerInput` primitives (`components/ui/color-picker.tsx`,
      already used for attribute-value colours) rather than a new picker.
      Shows a dashed circle with a `+` icon when the stored colour is one of
      the five defaults (or unset); shows the stored colour with a check
      mark, same as the fixed swatches, when it's a custom value — clicking
      it again reopens the picker to change it.
- [x] 6.5 Extended `ribbon.test.tsx`: empty/default state shows the `+`
      control unchecked, a custom stored colour marks it current and marks
      every default swatch unchecked, and picking a colour through the
      picker's hex input updates `ribbon_color`. `npx vitest run`: 7/7 pass.
- [x] 6.6 Found and fixed a regression while doing this: `RibbonPreviewBadge`
      had drifted on disk to `text ?? 'Preview'` (dropping the `.toUpperCase()`
      transform, and — since `ribbon.tsx` passes `''` not `null` for a blank
      ribbon — `??` no longer caught the blank case at all, so the badge
      rendered empty instead of the literal "Preview"). Restored the
      ternary + uppercase version tasks 4.2/4.5 originally established;
      confirmed via the now-passing `shows "Preview"...`/`updates the
      preview...` tests, which failed against the drifted version.
- [x] 6.7 Verification: `npm run typecheck` — clean (same pre-existing
      unrelated `product-form.tsx` error as the stashed baseline, see 5.1).
      `eslint` on the touched files — clean after autofixing an import-sort
      ordering issue on `ribbon.tsx` (a leftover `Flex` import from the same
      on-disk drift as 6.6). `composer phpcs:wporg` (Herd `php74`) on the
      touched PHP — clean.

## 7. Follow-up: remembering and marking the custom colour

The user reported two problems with the 6th swatch from §6: (1) picking a
custom colour and then choosing a default swatch discarded the custom value
— reopening the picker started from black again; (2) once a custom colour
was the current choice, its swatch looked identical to a selected default
swatch, with no indication that (unlike the five fixed defaults) its colour
could be changed.

- [x] 7.1 `RibbonColorSwatches` now keeps the last custom colour in local
      state (`customColor`), synced from `value` whenever it is a custom
      colour. The `ColorPicker`'s own `value` (and so the picker area/hex
      input's starting point) reads from this remembered colour instead of
      resetting to `''` when a default swatch becomes current, so reopening
      the picker resumes from the last custom pick rather than black.
- [x] 7.2 The custom swatch's `onClick` now also calls `onChange(customColor)`
      when a default is current and a custom colour is remembered, so a
      single click both reselects the remembered custom colour and reopens
      the picker to change it further (Radix composes the passed `onClick`
      with its own open-toggle, confirmed in
      `node_modules/@radix-ui/react-popover`).
- [x] 7.3 Swapped the custom swatch's `Check` icon for a `Pencil` icon,
      shown whenever a custom colour is remembered (selected or not), so it
      reads as "editable" rather than looking like a selected default
      swatch. The five default swatches are unchanged and still use `Check`.
- [x] 7.4 Extended `ribbon.test.tsx`: picking a custom colour, switching to a
      default, and clicking the custom swatch again restores the custom
      colour; a remembered custom colour's accessible name reflects it is
      editable in both the current and non-current state. `npx vitest run`:
      9/9 pass.
- [x] 7.5 Verification: `npm run typecheck` — clean. `eslint` on
      `ribbon-swatches.tsx` and `ribbon.test.tsx` — clean.
