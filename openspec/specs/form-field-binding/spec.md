# form-field-binding Specification

## Purpose

Defines how form inputs in the admin UI bind to react-hook-form: the field component as the sole binding unit, the presentation envelope every field guarantees, and the boundary separating generic fields from fields that carry domain knowledge.

## Requirements

### Requirement: A field component is the only binding unit

A react-hook-form `Controller` SHALL appear only inside a field component. Pages, sections, dialogs, cards and tabs SHALL bind inputs by rendering a field component, never by constructing a `Controller` themselves.

A field component SHALL be generic over the form's value and field-name types, SHALL obtain `control` from `useFormContext()` rather than accepting it as a prop, and SHALL take the field name as a `name` prop.

This constraint SHALL be enforced automatically, such that introducing a `Controller` outside a field component fails the lint step rather than relying on review.

#### Scenario: A screen needs a new input

- **WHEN** a page, section or dialog must bind a new input to form state
- **THEN** it renders an existing field component, or a new field component is created for it
- **AND** no `Controller` appears in the screen's own source

#### Scenario: A Controller is introduced outside a field component

- **WHEN** a `Controller` is imported anywhere other than a field component
- **THEN** the lint step reports an error identifying the file

#### Scenario: Passing control explicitly

- **WHEN** a field component needs the form control
- **THEN** it reads it from form context, so callers pass only a field name and presentation props

### Requirement: Every field renders the same envelope

A field component SHALL render its control inside a consistent shell: an optional label associated with the control, an optional description, and validation errors for the bound field.

When the bound field is invalid, the field SHALL mark the control as invalid for assistive technology and SHALL render the field's error message. A field SHALL NOT render a label positioned outside its own shell, and SHALL NOT omit error rendering.

Because presentation is owned by the field component rather than the screen, a change to error rendering, invalid-state marking or label association SHALL take effect across every screen using that field without those screens being edited.

#### Scenario: A bound field fails validation

- **WHEN** validation fails for a field's bound name
- **THEN** the control is marked invalid for assistive technology
- **AND** the field's error message is rendered beneath the control

#### Scenario: Improving error presentation

- **WHEN** the way errors are presented changes
- **THEN** the change is made in the field components
- **AND** every screen rendering those fields reflects it without further edits

#### Scenario: A label is required alongside an action

- **WHEN** a control's label sits alongside an action, such as a button that fills the field in
- **THEN** the label and the action are owned by a field component that renders both within its shell

### Requirement: Generic and domain fields are separated

A field component whose behavior is independent of any feature SHALL be generic, taking its options and presentation entirely as props, and SHALL NOT depend on feature code.

A field component that owns feature knowledge — querying its own options, creating new entries, mapping between the form's value shape and the control's, or applying side effects to other fields — SHALL belong to the feature that owns that data. Screens SHALL NOT re-implement that wiring inline.

A generic field SHALL be extended only with data-shaped props, such as an option's icon or a control's read-only state. A generic field SHALL NOT gain a rendering escape hatch — a render callback, a display value that diverges from the bound value, or arbitrary children — to serve a single caller. Where a single caller needs different structure, a separate field component SHALL be added instead.

#### Scenario: A control needs feature data

- **WHEN** a control queries its own options, creates entries, or maps between form and control value shapes
- **THEN** it is a field component belonging to that feature, not a generic one

#### Scenario: A generic field is asked to serve one unusual caller

- **WHEN** one screen needs a bound control whose structure differs from an existing generic field
- **THEN** a separate field component is added
- **AND** the existing generic field's props are left unchanged

#### Scenario: Reusing a generic field with an icon per option

- **WHEN** a caller needs to show an icon beside each option of a generic field
- **THEN** the icon is supplied as part of the option data
- **AND** callers that supply no icon are unaffected

### Requirement: Subscribing to validation state is not a binding

A component that reads a field's validation state without owning that field's value or changes SHALL subscribe to form state directly rather than binding through a `Controller` or a field component.

Binding such a control through a field component SHALL NOT be done, because it would take ownership of a value the control does not drive.

#### Scenario: A control displays errors but does not own the value

- **WHEN** a control's value comes from elsewhere and its changes are routed to a handler rather than written to the bound field
- **THEN** it subscribes to that field's validation state to render errors
- **AND** it does not bind the field through a `Controller` or field component
