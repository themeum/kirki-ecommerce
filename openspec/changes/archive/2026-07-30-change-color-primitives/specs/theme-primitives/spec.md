## Purpose

Ensures the React admin theme color primitives match Figma design tokens exactly, providing a single source of truth for all semantic color tokens downstream.

## ADDED Requirements

### Requirement: Primitive colors use hex values from Figma

The theme primitive color palette SHALL define every Figma-sourced color as a hex string (e.g. `#167BFF`), not as `hsl()` or other derived formats.

#### Scenario: All Figma palette tokens are hex

- **WHEN** the theme primitive colors are inspected
- **THEN** each token that corresponds to a Figma `--color-*` variable is a `#`-prefixed hex value matching the Figma export

#### Scenario: No hsl primitives remain for Figma tokens

- **WHEN** the theme primitive colors are inspected
- **THEN** no Figma-sourced token uses `hsl()` or `hsla()` as its stored value

### Requirement: Semantic tokens reference primitives via CSS variables

Semantic color tokens (background, border, icon, text) SHALL continue to resolve through CSS custom properties derived from primitive keys, without embedding raw color values directly.

#### Scenario: Semantic token resolves to updated primitive

- **WHEN** a component uses a semantic token such as `theme.colors.background.fillBrand`
- **THEN** the rendered color equals the hex value of the corresponding primitive injected on `:root`

### Requirement: Pre-existing hex-only primitives are preserved

Primitive colors that were already defined as hex before this change (non-Figma palette tokens such as `textMuted`, `buttonTertiary`, shipping colors) SHALL remain unchanged unless explicitly updated in a separate design change.

#### Scenario: Non-Figma hex tokens unchanged

- **WHEN** the theme primitive colors are compared before and after this change
- **THEN** hex-only tokens not listed in the Figma palette export retain their previous values

### Requirement: Figma duplicate tokens are honored

Where Figma defines identical hex values for distinct token names (e.g. `brand3` and `brand4`, `gray2` and `gray3`), the theme SHALL store the same hex for each key rather than deriving distinct shades.

#### Scenario: Duplicate Figma tokens match

- **WHEN** Figma assigns the same hex to two primitive token names
- **THEN** both theme primitive keys resolve to that identical hex value
