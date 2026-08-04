## Context

See proposal.md — Why. The React admin app uses Emotion with `jsxImportSource: '@emotion/react'` ([`resources/app/vite.config.js`](resources/app/vite.config.js)). Component styles are scoped under `#wpbody-content .kirki-ecommerce-root &&` via [`scoped()`](resources/app/theme/mixins.ts) to beat WordPress admin normalize styles.

Today, components define pre-scoped `SerializedStyles` at module level and compose them with `css={[styles.base, styles.variant, cssProp]}`. Two problems block reliable overrides:

1. Emotion's JSX runtime intercepts `css` on custom components and converts it to `className`; wrapper components (e.g. `TextField` → `Controller`) never forward it.
2. Pre-scoped defaults in a `css` array outrank plain override rules due to higher selector specificity.

## Goals / Non-Goals

**Goals:**

- Provide `cssOverride?: CSSObject` on all custom components as the single styling customization API
- Deep-merge overrides into component style defs, then call `scoped()` once — one rule, override wins
- Convert theme presets (`card-styles.ts`, etc.) to mergeable `CSSObject` exports
- Migrate ~55 components and ~200 call sites

**Non-Goals:**

- Multi-slot overrides (`inputCss`, `labelCss`) on form fields
- Accepting `SerializedStyles` / `css({...})` in `cssOverride`
- `&&&` or other specificity-boost override selectors
- Changing Emotion JSX runtime configuration
- Codemod automation (manual migration acceptable)

## Decisions

### 1. Merge before scoped(), not append after

**Choice:** Add `mergeCss()` (deep merge) and `scopedMerge()` in `theme/mixins.ts`. Components store style defs as `CSSObject` constants; render with `scopedMerge(BASE, VARIANT, cssOverride)`.

**Rationale:** Merging objects before scoping produces one CSS rule. Override properties replace defaults by merge order — no specificity arms race, cleaner DevTools, smaller CSS output.

**Alternative considered:** `overrideScoped()` with `&&&` — rejected after review; works but adds competing rules and specificity escalation.

### 2. cssOverride accepts CSSObject only

**Choice:** `cssOverride?: CSSObject` — callers pass plain objects: `cssOverride={{ width: '70px' }}`.

**Rationale:** `css()` returns opaque `SerializedStyles` that cannot be reverse-engineered into mergeable objects. Plain objects are simpler at call sites and enable true merge.

**Alternative considered:** Support both `CSSObject | SerializedStyles` with fallback array append — rejected; dual path defeats the merge goal and reintroduces specificity issues for SerializedStyles.

### 3. Deep merge for nested selectors

**Choice:** `mergeCss()` recursively merges nested keys (e.g. `'&:hover'`, `'& svg'`) property-by-property; later args win on leaf conflicts.

**Rationale:** Partial hover overrides should not wipe unrelated hover properties from the base definition.

**Alternative considered:** Shallow merge — rejected; replacing entire `'&:hover'` blocks loses base hover properties unintentionally.

### 4. Replace css prop entirely on custom components

**Choice:** Rename `css` → `cssOverride` on all custom components. Intrinsic DOM usage keeps native Emotion `css`.

**Rationale:** `css` on custom components is broken (Emotion interception) and ambiguous. One prop name avoids confusion.

### 5. cssOverride targets component root only

**Choice:** Overrides apply to the outermost styled DOM node per component. Form field overrides hit the Field wrapper, not the inner Input.

**Rationale:** Simple, predictable contract for v1. Matches how `css` was forwarded to `<Field>` in form fields today.

### 6. Theme presets become CSSObject exports

**Choice:** Convert `card-styles.ts` and similar modules from `scoped({...})` to plain `{...} satisfies CSSObject`. Scoping happens at component merge time.

**Rationale:** Pre-scoped presets cannot merge into a component's base selector. ~90 call sites use card presets — they become valid `cssOverride` values after conversion.

## Risks / Trade-offs

- **[Large migration surface]** → ~55 components + ~200 call sites. Mitigated: mechanical rename; TypeScript catches missed props.
- **[Breaking API change]** → `css` prop removed. Mitigated: documented in proposal; all call sites updated in same change.
- **[Component refactor depth]** → Button-like components with many layers need CSSObject constant extraction. Mitigated: establish Button/Card/Field as reference patterns first.
- **[Flex/Grid dynamic layout props]** → Currently generate inline `css({...})` fragments. Mitigated: convert to CSSObject fragments merged in `scopedMerge` at render.
- **[Array css call sites]** → ~15 sites pass `css={[a, b]}`. Mitigated: use `mergeCss(a, b)` at call site before passing as single `cssOverride`.

## Migration Plan

1. Add `mergeCss`, `scopedMerge`, `deepMergeCss`, `CssOverrideProp` to `theme/mixins.ts`
2. Convert `card-styles.ts` (and scan for similar preset modules) to CSSObject
3. Refactor reference components: Button, Card, Field, Input, TextField
4. Migrate remaining UI primitives and form fields
5. Update all call sites: `css={...}` → `cssOverride={{...}}`; arrays → `mergeCss(...)`
6. Remove `console.log` from `text-field.tsx`
7. Verify: brand-add-edit-dialog TextField width, Button background override, TypeScript check
8. Rollback: revert branch — no runtime feature flags needed

## Open Questions

(none — merge strategy, prop name, type, theme preset handling, and merge depth were resolved in planning)
