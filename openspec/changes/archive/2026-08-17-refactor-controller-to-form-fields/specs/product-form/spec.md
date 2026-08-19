## MODIFIED Requirements

### Requirement: Single form instance with form context

The product form SHALL use exactly one `useForm()` instance owned by `ProductForm`. All section components MUST consume the form via `useFormContext()` and bind fields through shared form field components from `resources/app/components/form/`, or through product-scoped field components under `resources/app/features/products/components/fields/` where the binding carries product domain knowledge. Section components MUST NOT construct a `Controller` themselves.

#### Scenario: Sections read shared form state

- **WHEN** a merchant edits any product form section
- **THEN** the change is reflected in the single RHF form state
- **AND** no separate section-level `useForm()` instances exist for product fields

#### Scenario: Form field components use Controller

- **WHEN** a section renders an input
- **THEN** it uses a shared form field component or a product-scoped field component bound to the shared form control
- **AND** the `Controller` lives inside that field component rather than in the section
