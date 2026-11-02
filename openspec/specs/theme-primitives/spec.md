# theme-primitives Specification

## Purpose

Ensures the React admin theme color primitives match Figma design tokens exactly, providing a single source of truth for all semantic color tokens downstream.

## Requirements

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

### Requirement: Analytics color primitives

The theme primitive palette SHALL define these analytics colors, taken from the
Analytics design, as hex values (8-digit hex when the color has alpha). Design
colors that equal an existing primitive SHALL reuse that primitive and SHALL NOT
be added again: `#5A12FF` (`violet2`), `#167BFF` (`brand1`), `#1C732A`
(`green6`), `#854807` (`orange2`), `rgba(212,0,0,.08)` (`red1`), `#EBEBEB`
(`graySolid3`), `#D40000` (`red3`). Black-alpha chart lines SHALL reuse the
nearest `gray*` primitive.

| Primitive | Hex |
|---|---|
| `analyticsPurple50` | `#EFE8FF` |
| `analyticsPurple100` | `#E6DCFF` |
| `analyticsPurple200` | `#CBB8FF` |
| `analyticsPurple300` | `#B49AFF` |
| `analyticsPurple400` | `#A98BFF` |
| `analyticsPurple700` | `#4A0FD1` |
| `analyticsPurple900` | `#2A0A7A` |
| `analyticsTeal` | `#0F9D8A` |
| `analyticsSlate` | `#8A8F98` |
| `analyticsAmber` | `#C27C0E` |
| `analyticsRed` | `#D63A3A` |
| `analyticsGray` | `#9A9AA3` |
| `analyticsMapEmpty` | `#E9E9EE` |
| `analyticsGaugeTrack` | `#EFEFEF` |
| `analyticsTooltip` | `#1A1A1A` |
| `analyticsPace1` | `#E8590C` |
| `analyticsPace2` | `#C9790A` |
| `analyticsPace3` | `#A08A0C` |
| `analyticsPace4` | `#76911A` |
| `analyticsPace5` | `#5A9E2A` |
| `analyticsPace6` | `#2F8A3A` |
| `analyticsReachedGlow` | `#3FAE5A` |
| `analyticsSuccessSoft` | `#1C732A17` |
| `analyticsWarningSoft` | `#FFF1D6` |
| `analyticsWarningSubtle` | `#FFF7E6` |

Each primitive SHALL have a CSS custom property named
`--kirki-ecommerce-color-analytics-<kebab-name>` (for example
`--kirki-ecommerce-color-analytics-purple-50`).

#### Scenario: Primitive values

- **WHEN** the theme primitive colors are inspected
- **THEN** each analytics primitive has the hex value in the table and a CSS custom property

#### Scenario: No duplicate of an existing primitive

- **WHEN** the analytics primitives are compared with the existing primitives
- **THEN** no analytics primitive has the same value as an existing primitive

### Requirement: Analytics semantic tokens

`theme.colors.analytics` SHALL group the analytics semantic tokens. Each token
SHALL resolve through a primitive's CSS custom property.

| Token | Primitive |
|---|---|
| `chart.primary` | `violet2` |
| `chart.previous` | `analyticsPurple200` |
| `chart.comparisonLine` | `gray8` |
| `chart.soft` | `analyticsPurple100` |
| `chart.mid` | `analyticsPurple300` |
| `chart.grid` | `gray3` |
| `chart.gridBase` | `gray5` |
| `chart.crosshair` | `gray7` |
| `chart.empty` | `gray5` |
| `chart.tooltip` | `analyticsTooltip` |
| `series.primary` | `violet2` |
| `series.secondary` | `analyticsTeal` |
| `series.tertiary` | `analyticsAmber` |
| `series.other` | `analyticsSlate` |
| `breakdown.bar` | `violet2` |
| `breakdown.emphasis` | `violet2` |
| `breakdown.discounts` | `analyticsAmber` |
| `fulfillment.unfulfilled` | `analyticsSlate` |
| `fulfillment.onHold` | `analyticsAmber` |
| `fulfillment.processing` | `brand1` |
| `fulfillment.shipped` | `violet2` |
| `fulfillment.delivered` | `analyticsTeal` |
| `fulfillment.returned` | `analyticsPurple900` |
| `fulfillment.cancelled` | `analyticsRed` |
| `map.low` | `analyticsPurple100` |
| `map.high` | `analyticsPurple700` |
| `map.empty` | `analyticsMapEmpty` |
| `map.outline` | `analyticsPurple900` |
| `map.ping` | `violet2` |
| `heatmap.increase` | `violet2` |
| `heatmap.decrease` | `analyticsGray` |
| `goal.track` | `analyticsGaugeTrack` |
| `goal.pace1` … `goal.pace6` | `analyticsPace1` … `analyticsPace6` |
| `goal.reached` | `green6` |
| `goal.reachedGlow` | `analyticsReachedGlow` |
| `goal.missed` | `analyticsGray` |
| `status.goodBackground` | `analyticsSuccessSoft` |
| `status.goodText` | `green6` |
| `status.neutralBackground` | `analyticsPurple50` |
| `status.neutralText` | `analyticsPurple700` |
| `status.warningBackground` | `analyticsWarningSoft` |
| `status.warningSubtleBackground` | `analyticsWarningSubtle` |
| `status.warningText` | `orange2` |
| `status.criticalBackground` | `red1` |
| `status.criticalText` | `red3` |

#### Scenario: Token resolves to a primitive

- **WHEN** a component uses `theme.colors.analytics.fulfillment.delivered`
- **THEN** the rendered color is `#0F9D8A` through `--kirki-ecommerce-color-analytics-teal`
