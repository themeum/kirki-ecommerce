## Purpose

Provides a shared 3D isometric box preview that visually represents shipping box dimensions and scales proportionally when dimensions change.

## ADDED Requirements

### Requirement: Preview renders from dimensions
The shipping box preview SHALL accept length, width, height, and unit values and MUST render a 3D isometric box whose proportions reflect those dimensions. The preview MUST scale to fit its container without overflowing.

#### Scenario: Preview renders with valid dimensions
- **WHEN** length, width, height, and unit are provided
- **THEN** a 3D isometric box is rendered centered in the preview area

#### Scenario: Preview scales to container
- **WHEN** dimensions are large relative to the preview area
- **THEN** the box is scaled down to fit within the container

### Requirement: Preview updates proportionally on dimension change
When length, width, or height changes, the preview MUST update its rendered proportions to reflect the new values without requiring a page reload.

#### Scenario: Dimension change updates shape
- **WHEN** length increases while width and height stay the same
- **THEN** the preview box appears longer along the corresponding axis

#### Scenario: Unit affects visual scale
- **WHEN** the unit value changes with the same numeric dimensions converted appropriately
- **THEN** the preview reflects the updated relative proportions

### Requirement: Preview is shared across shipping UI
The same preview component MUST be usable in the product Shipping card and in the create/edit shipping box dialog so visual representation is consistent.

#### Scenario: Consistent preview in product card and dialog
- **WHEN** the same dimensions are passed to the preview in the Shipping card and in the create dialog
- **THEN** both render the same proportional box representation

### Requirement: Preview displays dimension labels on faces
The shipping box preview SHALL display text labels identifying which face corresponds to width, length, and height. Labels MUST rotate with the box. Font size MUST scale to fit each face; when a face is too small for full words, labels MUST fall back to abbreviated L, W, or H.

#### Scenario: Face labels on default view
- **WHEN** the preview renders with valid dimensions
- **THEN** width, length, and height are labeled on their corresponding box faces

#### Scenario: Abbreviated labels on small faces
- **WHEN** a box face is too small to fit the full label text at minimum readable size
- **THEN** the label displays as L, W, or H instead

### Requirement: Preview supports mouse-drag rotation
The shipping box preview SHALL allow merchants to rotate the 3D box by dragging with the mouse or pointer. Rotation MUST support both horizontal and vertical axes. Rotation angle MUST persist when dimensions change. The preview MUST show a grab cursor on hover and a grabbing cursor while dragging.

#### Scenario: Drag to rotate
- **WHEN** the merchant presses and drags on the preview area
- **THEN** the box rotates following the drag direction on both axes

#### Scenario: Rotation persists on dimension change
- **WHEN** the merchant has rotated the box and then changes length, width, or height
- **THEN** the box retains its current rotation angle

#### Scenario: Drag affordance cursor
- **WHEN** the merchant hovers over the preview
- **THEN** the cursor indicates the preview is draggable
