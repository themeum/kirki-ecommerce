# skeleton-primitive Specification

## Purpose

Provides the shared placeholder block every loading surface is built from — a
caller-sized, gently pulsing shape that stands in for content while a request is
in flight, so a screen can reserve the space its data will occupy instead of
collapsing and snapping back when the data arrives.

## Requirements

### Requirement: A skeleton is sized by its caller

A skeleton SHALL accept a width and a height from its caller, each expressed
either as a plain number meaning pixels or as a CSS length string. When a
dimension is omitted the skeleton SHALL fall back to filling the width of its
container and to a single line's height, so that a caller who only cares about
one axis need not specify the other.

#### Scenario: Numeric dimensions

- **WHEN** a caller asks for a skeleton 120 wide and 12 high
- **THEN** the skeleton renders 120 pixels wide and 12 pixels tall

#### Scenario: String dimensions

- **WHEN** a caller asks for a skeleton whose width is expressed as a percentage
  or any other CSS length
- **THEN** that value is applied verbatim, without being reinterpreted as pixels

#### Scenario: Omitted dimensions

- **WHEN** a caller supplies neither width nor height
- **THEN** the skeleton fills the available width and occupies a single line's
  height

### Requirement: A skeleton's corner radius is chosen from the design tokens

A skeleton SHALL take its corner radius from the design system's radius scale
rather than from a raw length, and SHALL default to the same medium radius used
by the system's other small surfaces. Selecting the fully rounded token SHALL
produce a circle or pill, so that avatar and badge placeholders need no separate
component.

#### Scenario: Default radius

- **WHEN** a caller does not specify a radius
- **THEN** the skeleton uses the medium radius token

#### Scenario: Round placeholder

- **WHEN** a caller selects the fully rounded token on an equal-sided skeleton
- **THEN** the skeleton renders as a circle

### Requirement: A skeleton animates as a pulse

A skeleton SHALL indicate activity by cycling its opacity between fully opaque
and half opaque and back, on a continuous loop lasting about two seconds. It
SHALL NOT translate, sweep or otherwise move, so that a screen filled with many
skeletons reads as one calm surface rather than competing animations.

#### Scenario: Skeleton on screen

- **WHEN** a skeleton is rendered
- **THEN** it fades between full and half opacity on a repeating cycle
- **AND** its position and size do not change during the animation

#### Scenario: Many skeletons together

- **WHEN** a region renders a grid of skeletons
- **THEN** they all pulse on the same cycle rather than staggering

### Requirement: A skeleton is decorative to assistive technology

A skeleton SHALL be hidden from assistive technology. The announcement that a
region is loading SHALL come from the region being replaced, which SHALL mark
itself busy while its request is in flight, and not from the individual
placeholder shapes.

#### Scenario: Screen reader encounters a loading region

- **WHEN** a region is replaced by skeletons while its request is in flight
- **THEN** the region reports itself as busy
- **AND** none of the individual skeleton shapes are announced

#### Scenario: Request resolves

- **WHEN** the request completes and real content replaces the skeletons
- **THEN** the region no longer reports itself as busy

### Requirement: A skeleton accepts style overrides from its caller

A skeleton SHALL accept the same style-override input every other primitive in
the component library accepts, so a caller can adjust spacing or alignment for
its own layout without a new variant being added to the primitive.

#### Scenario: Caller adjusts layout

- **WHEN** a caller passes a style override alongside width and height
- **THEN** the override is applied on top of the skeleton's own styling

#### Scenario: No override supplied

- **WHEN** a caller passes no override
- **THEN** the skeleton renders with its default styling unchanged
