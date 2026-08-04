## Why

Emotion theme primitive colors are defined as `hsl()` values copied from Figma, but Figma and browsers convert HSL differently from the underlying sRGB values. This causes visible mismatches between design and implementation—most noticeably on brand secondary fills (`brand3`) and subtly across the gray scale. Hex values from Figma are the stable source of truth.

## What Changes

- Replace all `hsl()` entries in `primitiveColors` (`resources/app/theme/index.ts`) with hex values sourced from Figma design tokens
- Leave existing hex-only primitives unchanged (`textMuted`, `buttonTertiary`, shipping colors, etc.)
- Leave semantic token mappings (`theme.colors.*` via `cssVar()`) and component usage unchanged
- Leave shadow definitions unchanged (alpha blacks, not palette tokens)

## Capabilities

### New Capabilities

- `theme-primitives`: Defines that color primitives in the Emotion theme must use hex values matching Figma design tokens, injected as CSS custom properties on `:root`.

### Modified Capabilities

(none — no existing main specs)

## Impact

- **File**: `resources/app/theme/index.ts` — `primitiveColors` object only (~41 values)
- **Runtime**: CSS custom property values change; all components referencing semantic tokens inherit updated colors automatically via `GlobalStyles`
- **Visual**: Pixel-level alignment with Figma; largest delta on `brand3`/`brand4` secondary fills
- **No API changes**: `theme`, `cssVar`, `getCssVarName`, and component imports remain the same
