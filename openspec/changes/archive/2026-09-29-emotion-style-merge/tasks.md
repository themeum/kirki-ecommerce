## 1. Theme utilities

- [x] 1.1 Add `deepMergeCss()` helper to `resources/app/theme/mixins.ts` — recursively merge CSSObjects, later args win on leaf conflicts
- [x] 1.2 Add `mergeCss(...objects)` — filter falsy, deep-merge CSSObjects, export for call-site use
- [x] 1.3 Add `scopedMerge(...objects)` — `scoped(mergeCss(...objects))`, export alongside existing `scoped`
- [x] 1.4 Add and export `CssOverrideProp` type: `{ cssOverride?: CSSObject }`

## 2. Theme presets

- [x] 2.1 Convert `resources/app/theme/card-styles.ts` from `scoped()` exports to plain `CSSObject` presets
- [x] 2.2 Scan `resources/app/theme/` for other preset modules exporting pre-scoped styles and convert to CSSObject

## 3. Reference component refactors

- [x] 3.1 Refactor `resources/app/components/ui/button.tsx` — CSSObject defs (BASE, VARIANTS, SIZES), `scopedMerge()` at render, `cssOverride` prop
- [x] 3.2 Refactor `resources/app/components/ui/card.tsx` — CSSObject CARD_BASE, `scopedMerge(CARD_BASE, cssOverride)`, `cssOverride` prop
- [x] 3.3 Refactor `resources/app/components/ui/field.tsx` — CSSObject defs for all 9 Field exports, `cssOverride` prop on each
- [x] 3.4 Refactor `resources/app/components/ui/input.tsx` — CSSObject defs, `scopedMerge()`, `cssOverride` prop
- [x] 3.5 Refactor `resources/app/components/form/text-field.tsx` — accept and forward `cssOverride` to Field root; remove `console.log`

## 4. UI component migration

- [x] 4.1 Migrate remaining UI primitives in `resources/app/components/ui/` — rename `css` → `cssOverride`, refactor style defs to CSSObject + `scopedMerge`
- [x] 4.2 Handle Flex/Grid special cases — convert dynamic layout fragments to CSSObject merged at render
- [x] 4.3 Migrate composite components (`media-gallery`, `dropdown-button`, `pagination`, etc.) — `cssOverride` prop + merge pattern

## 5. Form field migration

- [x] 5.1 Migrate remaining 13 form field wrappers in `resources/app/components/form/` — accept and forward `cssOverride` to root Field/wrapper element

## 6. Call site migration

- [x] 6.1 Rename `css={...}` to `cssOverride={{...}}` on custom components across pages and components (~200 usages)
- [x] 6.2 Convert array css call sites (~15) to `cssOverride={mergeCss(a, b)}`
- [x] 6.3 Update `resources/app/pages/brands/brand-add-edit-dialog.tsx` — `TextField cssOverride={{ width: '70px' }}`

## 7. Verify

- [x] 7.1 Confirm `cssOverride` is received by TextField (no longer undefined) and width applies to Field root
- [x] 7.2 Confirm Button `cssOverride={{ background: 'red' }}` wins over variant default in DevTools (single scoped rule, no `&&&`)
- [x] 7.3 Run TypeScript check in `resources/app/` — no remaining `css` prop on custom component call sites
