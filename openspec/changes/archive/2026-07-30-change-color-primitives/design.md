## Context

See proposal.md — Why. The Emotion theme in `resources/app/theme/index.ts` defines `primitiveColors`, which `GlobalStyles` injects as `--kirki-ecommerce-color-*` CSS variables on `:root`. Semantic tokens in `theme.colors.*` reference these via `cssVar()`. Components consume semantic tokens only; they do not reference primitives directly.

Currently ~41 primitives use `hsl()` strings; ~15 already use hex. Figma hex exports are available for all palette tokens.

## Goals / Non-Goals

**Goals:**

- Replace all Figma-sourced `hsl()` primitives with exact hex values from the design export
- Maintain the existing token architecture (primitives → CSS vars → semantic tokens → components)
- Achieve pixel-level alignment with Figma for brand, gray, and semantic palette colors

**Non-Goals:**

- Changing semantic token names or mappings
- Updating shadow definitions (alpha blacks)
- Modifying pre-existing hex-only primitives not in the Figma palette export
- Introducing runtime color manipulation or dynamic theming
- Updating Figma or creating a sync pipeline

## Decisions

### 1. Hex as source format for Figma-sourced primitives

**Choice:** Store Figma hex values directly in `primitiveColors`.

**Rationale:** Figma stores colors as sRGB; hex is the lossless handoff format. Converting existing HSL strings to hex mathematically would preserve the wrong colors.

**Alternative considered:** Keep HSL and adjust values manually — rejected because the root cause is format conversion drift, not incorrect HSL math.

### 2. Single-file change scope

**Choice:** Edit only `primitiveColors` in `resources/app/theme/index.ts`.

**Rationale:** The CSS var injection (`GlobalStyles`) and semantic layer already abstract primitives. No other files need changes.

**Alternative considered:** Split primitives into a separate JSON/file — rejected as over-engineering for a value swap.

### 3. Uppercase hex convention

**Choice:** Use uppercase hex (`#167BFF`) matching the Figma export format.

**Rationale:** Consistency with the provided design tokens. CSS is case-insensitive for hex either way.

### 4. Honor Figma duplicate tokens

**Choice:** Set `brand3` and `brand4` both to `#C7DFFF`; `gray2` and `gray3` both to `#F9F9FB`.

**Rationale:** Matches Figma source of truth. Previously `brand4` had a distinct HSL-derived value; aligning to Figma is intentional.

## Risks / Trade-offs

- **[Visual regression on secondary fills]** → `brand3` has the largest delta (~23 RGB units). Spot-check buttons and secondary backgrounds after apply.
- **[Loss of HSL manipulability]** → Primitives can no longer be adjusted via HSL component math. Mitigated: semantic layer uses CSS vars; future alpha needs can use `color-mix()` or separate tokens.
- **[Design drift over time]** → No automated Figma sync. Manual update required when design tokens change.

## Migration Plan

1. Replace `hsl()` values in `primitiveColors` with Figma hex export (41 tokens)
2. Verify `:root` CSS vars in browser DevTools match expected hex
3. Visual QA on primary buttons, borders, text hierarchy, critical/success states
4. No rollback complexity — revert the single file if needed

## Open Questions

(none — Figma hex export provided and duplicate tokens confirmed intentional)
