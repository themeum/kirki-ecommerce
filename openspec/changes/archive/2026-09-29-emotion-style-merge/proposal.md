## Why

Custom components in the React admin app cannot receive Emotion styles via the `css` prop — Emotion's JSX runtime intercepts `css` on wrapper components (e.g. `TextField`) and converts it to `className` before the component receives it, but wrappers like `TextField` never forward `className` to a DOM node. Even when styles do reach leaf components, pre-scoped defaults from `scoped()` beat plain override rules in the cascade. We need a consistent, merge-based override API so callers can customize component appearance and have those styles win without specificity hacks.

## What Changes

- Add `mergeCss()` (deep merge) and `scopedMerge()` utilities in `resources/app/theme/mixins.ts`
- Introduce `cssOverride?: CSSObject` prop on all custom components, replacing the broken `css` prop
- Refactor component style definitions from pre-scoped `SerializedStyles` to mergeable `CSSObject` constants, composed at render via `scopedMerge()`
- Convert theme preset modules (e.g. `card-styles.ts`) from `scoped()` exports to plain `CSSObject` presets
- **BREAKING**: Call sites must pass plain CSS objects (`cssOverride={{ width: '70px' }}`) instead of `css={css({...})}` on custom components
- **BREAKING**: Rename `css` prop to `cssOverride` on ~55 custom components; ~200 call sites updated
- Remove debug `console.log` from `text-field.tsx`

## Capabilities

### New Capabilities

- `emotion-style-merge`: Defines how component styles are merged (deep CSSObject merge before single `scoped()` call), the `cssOverride` prop contract, and override precedence over component defaults.

### Modified Capabilities

(none — no existing main specs cover component styling APIs)

## Impact

- **Theme utilities**: `resources/app/theme/mixins.ts` — new `mergeCss`, `scopedMerge`, `CssOverrideProp`
- **Theme presets**: `resources/app/theme/card-styles.ts` and similar — `CSSObject` instead of `scoped()` exports
- **UI components**: ~40 files under `resources/app/components/ui/` — style def refactor + prop rename
- **Form fields**: 14 files under `resources/app/components/form/` — forward `cssOverride` to root element
- **Call sites**: ~200 usages across pages — `css` → `cssOverride` with plain objects; array usages → `mergeCss()`
- **Unchanged**: Intrinsic DOM elements and Emotion's native `css` prop on raw `<div>`, `<Flex>`, etc.
- **Runtime**: Single scoped CSS rule per styled element (cleaner DevTools, no `&&&` specificity arms race)
