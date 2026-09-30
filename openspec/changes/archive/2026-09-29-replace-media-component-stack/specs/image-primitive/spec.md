## Purpose

Provides the single surface every image in the admin UI renders through, so that
source resolution, responsive sizing, loading affordance and failure fallback
behave identically everywhere instead of being re-decided at each call site.

## ADDED Requirements

### Requirement: An image accepts a media reference or a plain URL

An image SHALL accept its source either as a media reference — the same shape the
media library and the API return — or as a plain URL string, and SHALL render
equivalently for both. When given a media reference it SHALL use that
reference's own URL, and SHALL treat an absent source as the empty state.

Callers holding a media reference SHALL NOT be required to reach inside it for a
URL, so that a reference's additional information remains available to the image.

#### Scenario: Source given as a media reference

- **WHEN** a caller passes a media reference
- **THEN** the image renders that reference's image

#### Scenario: Source given as a URL

- **WHEN** a caller passes a URL string
- **THEN** the image renders that URL

#### Scenario: No source

- **WHEN** a caller passes no source, null, or an empty string
- **THEN** the image renders its empty state rather than a broken image

### Requirement: An image derives responsive sources from a media reference

When the source is a media reference carrying a set of generated sizes, the image
SHALL offer those sizes to the browser as candidate sources described by their
widths, so the browser downloads a variant appropriate to the rendered box rather
than always the original.

When the reference carries no generated sizes, or the source is a plain URL, the
image SHALL render that single source without candidates.

#### Scenario: Reference carries generated sizes

- **WHEN** a media reference with several generated sizes renders in a small box
- **THEN** the browser is offered every generated size with its width
- **AND** it is not forced to download the full-size original

#### Scenario: Reference carries no generated sizes

- **WHEN** a media reference has no generated sizes
- **THEN** the image renders the reference's own URL as its only source

#### Scenario: Plain URL source

- **WHEN** the source is a plain URL string
- **THEN** no candidate sources are offered

### Requirement: An image falls back when its source is absent or fails

An image SHALL render a fallback image both when it has no source and when a
source fails to load. The fallback SHALL be replaceable by the caller, and SHALL
default to a shared placeholder so that every unset slot in the product looks the
same.

When the source changes, a previously failed state SHALL be discarded so a new
valid source is attempted rather than suppressed by the earlier failure.

#### Scenario: Source fails to load

- **WHEN** an image's source fails to load
- **THEN** the fallback is rendered in its place

#### Scenario: Caller supplies its own fallback

- **WHEN** a caller supplies a fallback
- **THEN** that fallback is rendered instead of the shared placeholder

#### Scenario: Source changes after a failure

- **WHEN** a source fails and the caller then supplies a different source
- **THEN** the new source is attempted

### Requirement: An image indicates that it is loading

While its source is in flight an image SHALL occupy its final space and show a
loading placeholder, then reveal the image once loaded, so that surrounding
layout does not shift when the image arrives. A caller SHALL be able to suppress
the loading placeholder for dense surfaces where many simultaneous placeholders
would be noisier than the images themselves.

#### Scenario: Image is loading

- **WHEN** an image's source has not yet loaded
- **THEN** a loading placeholder occupies the image's box

#### Scenario: Image finishes loading

- **WHEN** the source loads
- **THEN** the loading placeholder is replaced by the image
- **AND** the box does not change size

#### Scenario: Caller suppresses the loading placeholder

- **WHEN** a caller opts out of the loading placeholder
- **THEN** no placeholder is shown while the source loads

### Requirement: An image defers loading until it is needed

An image SHALL default to being fetched only as it approaches the viewport and to
being decoded without blocking rendering, so that a long list of rows does not
fetch every image at once. A caller SHALL be able to override this for an image
known to be immediately visible.

#### Scenario: Image far down a long list

- **WHEN** a list renders many images below the fold
- **THEN** their sources are not fetched until they approach the viewport

#### Scenario: Caller overrides deferral

- **WHEN** a caller marks an image as immediately needed
- **THEN** that image is fetched without waiting

### Requirement: An image offers a shared size and shape vocabulary

An image SHALL offer a named set of sizes covering the recurring cases — an
inline marker, a compact list thumbnail, a standard row thumbnail, and a
container-filling block — and a shape choice between square and circular, so that
the recurring surfaces in the product agree without each restating dimensions.

A caller needing a size outside that set SHALL be able to state explicit
dimensions, and any caller SHALL be able to apply the same style override every
other primitive in the component library accepts.

#### Scenario: Recurring size

- **WHEN** a caller selects a named size
- **THEN** the image renders at that size with the matching corner treatment

#### Scenario: Circular shape

- **WHEN** a caller selects the circular shape
- **THEN** the image renders as a circle, including its fallback and loading states

#### Scenario: One-off dimensions

- **WHEN** a caller needs dimensions outside the named set
- **THEN** it states them explicitly and they are honoured

### Requirement: An image describes itself to assistive technology

An image SHALL take its alternative text from its caller. When no alternative
text is given and the source is a media reference carrying its own, the image
SHALL use the reference's text. When neither is available the image SHALL be
treated as decorative rather than announcing a filename or placeholder wording.

#### Scenario: Caller supplies alternative text

- **WHEN** a caller supplies alternative text
- **THEN** that text is used

#### Scenario: Media reference carries alternative text

- **WHEN** no alternative text is supplied and the media reference carries its own
- **THEN** the reference's text is used

#### Scenario: No alternative text anywhere

- **WHEN** neither the caller nor the reference supplies alternative text
- **THEN** the image is presented as decorative
