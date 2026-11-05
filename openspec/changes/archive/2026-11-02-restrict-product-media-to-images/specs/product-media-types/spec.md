# Spec Delta

## Purpose

Defines which attachment types a product's media fields accept and how the server
enforces that on create and update.

## ADDED Requirements

### Requirement: Product media accepts only the allowed attachment types

The product gallery, each variant's media and the product's `og_image` SHALL accept
only attachments whose type is in the product media allowed list. The list SHALL
currently contain images only. A listed type without a subtype, such as `image`,
SHALL match every subtype of it; a full MIME type SHALL match exactly.

#### Scenario: Image attachment is saved

- **WHEN** a product is created or updated with image attachment IDs in its media fields
- **THEN** the request is accepted

#### Scenario: Video or audio attachment is sent

- **WHEN** a product is created or updated with an attachment ID whose type is video or audio
- **THEN** the request is rejected with a validation error naming the offending field

#### Scenario: Attachment does not exist

- **WHEN** a product media field carries an ID that is not an attachment
- **THEN** the request is rejected with a validation error naming the offending field

### Requirement: The allowed types can be widened in one place

The product media allowed list SHALL be defined once and used by every product
media field, so that allowing another type, such as video, needs no change to the
validation of individual fields.

#### Scenario: A type is added to the list

- **WHEN** `video` is added to the product media allowed list
- **THEN** video attachments pass validation on every product media field
- **AND** other non-listed types are still rejected

### Requirement: Create and update apply the same check

Updating a product SHALL check its media fields exactly as creating one does. A
request with a non-allowed attachment SHALL be rejected as a whole and nothing
SHALL be saved. Attachments already stored on a product SHALL NOT be changed or
removed by this check.

#### Scenario: Update with a video is rejected

- **WHEN** a product is updated with a video attachment ID in a media field
- **THEN** the request is rejected and the product is left unchanged

#### Scenario: Old product still lists its video

- **WHEN** a product that already holds a video is updated and the payload still lists that video
- **THEN** the request is rejected until the video is removed from the payload

#### Scenario: Old product drops its video

- **WHEN** a product that already holds a video is updated with the video removed from the payload
- **THEN** the request is accepted

#### Scenario: Create with a video is rejected

- **WHEN** a new product is created with a video attachment
- **THEN** the request is rejected
