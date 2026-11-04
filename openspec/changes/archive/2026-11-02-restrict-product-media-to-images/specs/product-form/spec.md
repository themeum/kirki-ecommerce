# Spec Delta

## MODIFIED Requirements

### Requirement: Media gallery in form state

Product gallery media SHALL be managed through `MediaGalleryField` bound to the `media` form field. Preview components that depend on featured image MUST read the first gallery item from form state. The gallery SHALL offer only the media types its surface accepts, which for products are images only, and SHALL open the media library restricted to them.

#### Scenario: Gallery updates form state

- **WHEN** the merchant adds, removes, or reorders gallery items
- **THEN** the `media` field in the shared form updates accordingly

#### Scenario: Gallery library is restricted to images

- **WHEN** the merchant opens the media library from the product gallery
- **THEN** the library lists image attachments only
