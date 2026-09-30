## Purpose

Provides a consistent, merge-based API for customizing Emotion-styled React components so caller-supplied styles override component defaults within a single scoped CSS rule, without relying on specificity hacks or the broken `css` prop on wrapper components.

## ADDED Requirements

### Requirement: Custom components accept cssOverride prop

Every custom React component in the admin app that exposes styling customization SHALL accept an optional `cssOverride` prop typed as `CSSObject` (plain Emotion CSS object, not `SerializedStyles`).

#### Scenario: cssOverride reaches wrapper components

- **WHEN** a caller passes `cssOverride={{ width: '70px' }}` to a form wrapper component such as `TextField`
- **THEN** the component receives the prop with the supplied object intact (not `undefined`)

#### Scenario: cssOverride is optional

- **WHEN** a caller renders a component without `cssOverride`
- **THEN** the component renders with its default merged styles only

### Requirement: Overrides merge before scoping

Components SHALL deep-merge `cssOverride` with internal style definitions (base, variant, conditional layers) before applying a single `scoped()` wrapper, producing one CSS rule per styled root element.

#### Scenario: Override property replaces default

- **WHEN** a component default includes `{ width: '100%' }` and the caller passes `cssOverride={{ width: '70px' }}`
- **THEN** the rendered element has `width: 70px` in its single scoped rule

#### Scenario: Deep merge preserves non-overridden nested properties

- **WHEN** a component default includes `{ '&:hover': { backgroundColor: 'green', color: 'white' } }` and the caller passes `cssOverride={{ '&:hover': { backgroundColor: 'red' } }}`
- **THEN** the merged hover block has `backgroundColor: red` and retains `color: white`

#### Scenario: Later merge layers win on conflict

- **WHEN** a component merges base, variant, and `cssOverride` layers where both base and `cssOverride` set the same property
- **THEN** the `cssOverride` value is applied in the final scoped rule

### Requirement: Theme presets are mergeable CSSObjects

Shared theme style presets (e.g. card variants) SHALL be exported as plain `CSSObject` values, not pre-scoped `SerializedStyles`, so they can participate in the merge pipeline.

#### Scenario: Preset passed as cssOverride merges with component base

- **WHEN** a caller passes `cssOverride={cardStyles.lightCard}` to a Card component
- **THEN** the card preset properties merge with the Card base definition under one scoped selector

#### Scenario: Multiple presets combined at call site

- **WHEN** a caller needs to combine two preset objects before passing to a component
- **THEN** a shared `mergeCss()` utility merges them into a single `CSSObject` suitable for `cssOverride`

### Requirement: css prop removed from custom components

Custom components SHALL NOT accept `css` as a styling prop. The `css` prop name is reserved for Emotion's JSX runtime on intrinsic DOM elements.

#### Scenario: No css prop on custom component types

- **WHEN** TypeScript types for a custom component are inspected
- **THEN** the styling customization prop is named `cssOverride`, not `css`

#### Scenario: Intrinsic elements retain Emotion css prop

- **WHEN** a raw DOM element (e.g. `<div>`, `<span>`) or a component that renders directly to DOM with spread rest props uses Emotion's `css` prop
- **THEN** native Emotion `css` behavior is unchanged

### Requirement: Override applies to component root only

`cssOverride` on a component SHALL apply to that component's outermost styled DOM node only, not to internal sub-elements (labels, inputs, icons) unless those sub-elements expose their own override props in a future change.

#### Scenario: Form field override targets field root

- **WHEN** `cssOverride={{ width: '70px' }}` is passed to a form field wrapper
- **THEN** the width is applied to the field root wrapper element, not automatically to the inner input control
