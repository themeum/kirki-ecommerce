## Purpose

Composes a readable, store-wide-unique SKU for a product variant from the
product's own data — its title, the variant's attribute values, its brand, its
first category — plus a sequence number read off the SKUs already stored, so a
merchant can identify an item from its SKU alone instead of from an opaque
random string.

## ADDED Requirements

### Requirement: SKU is composed of ordered segments

A generated SKU SHALL consist of the following segments, in this order, joined
by a single hyphen: the product title; one segment per attribute value assigned
to the variant, in the order those values are held; the product's brand; the
product's first category; and the sequence number. The sequence segment SHALL
always be present and SHALL always be last.

#### Scenario: All sources present

- **WHEN** a SKU is generated for a variant of the product "Blue Cotton Shirt"
  with attribute values "Red" and "Small", brand "Nike", first category
  "Apparel", and the highest number any stored SKU ends with is 9
- **THEN** the generated SKU is `BLU-RED-SMA-NIK-APP-010`

#### Scenario: Attribute values keep their assigned order

- **WHEN** a SKU is generated for a variant whose attribute values are "Small"
  then "Red"
- **THEN** the attribute segments appear as `SMA-RED`, not `RED-SMA`

### Requirement: Each segment is the first three characters of a normalized source

For every non-sequence segment the system SHALL derive its text by transliterating
accented Latin characters to their unaccented equivalents, discarding every
remaining character outside `A-Z` and `0-9` (case-insensitively), uppercasing the
result, and taking its first three characters. A normalized source shorter than
three characters SHALL contribute all of its characters.

#### Scenario: Multi-word source

- **WHEN** the product title is "Blue Cotton Shirt"
- **THEN** its segment is `BLU`

#### Scenario: Punctuation is discarded before counting

- **WHEN** the product title is "T-Shirt"
- **THEN** its segment is `TSH`

#### Scenario: Digits are retained

- **WHEN** the product title is "4K TV"
- **THEN** its segment is `4KT`

#### Scenario: Accented characters are transliterated

- **WHEN** the product title is "Café Latte"
- **THEN** its segment is `CAF`

#### Scenario: Source shorter than three characters

- **WHEN** an attribute value is "XL"
- **THEN** its segment is `XL`

### Requirement: A source that yields no characters is omitted entirely

When a source is absent, empty, or normalizes to an empty string, the system
SHALL omit that segment together with its separator, so the SKU never contains an
empty segment, a doubled hyphen, or a trailing hyphen.

#### Scenario: Product has no brand

- **WHEN** a SKU is generated for a variant of "Blue Cotton Shirt" with attribute
  value "Red", no brand, first category "Apparel", and the highest stored number
  is 9
- **THEN** the generated SKU is `BLU-RED-APP-010`

#### Scenario: Product has no categories

- **WHEN** the product is assigned to no category
- **THEN** no category segment appears in the SKU

#### Scenario: Variant has no attribute values

- **WHEN** the variant has no attribute values assigned
- **THEN** no attribute segments appear in the SKU

#### Scenario: Source normalizes to nothing

- **WHEN** the product title is "শার্ট", the product has no brand and no
  category, the variant has no attribute values, and the highest stored number
  is 9
- **THEN** the generated SKU is `010`

### Requirement: Attribute segments come from the variant's attribute values

The attribute portion of the SKU SHALL be derived from the values assigned to the
variant being generated for (for example "Red", "Small"), not from the names of
the attributes those values belong to (for example "Color", "Size").

#### Scenario: Sibling variants differ in their attribute segments

- **WHEN** SKUs are generated for the Red/Small and Blue/Large variants of the
  same product
- **THEN** the two SKUs differ in their attribute segments rather than only in
  their sequence numbers

### Requirement: The sequence is derived from the SKUs already stored

The system SHALL determine a SKU's number by taking one past the highest number
any stored SKU ends with, and SHALL NOT persist a counter of its own. Generating
a SKU the merchant never saves SHALL NOT consume a number: repeating the request
for the same product SHALL return the same SKU until one is stored. A stored SKU
whose trailing segment is not numeric SHALL NOT raise the sequence.

#### Scenario: Sequence continues across products

- **WHEN** one product's variants hold SKUs numbered 001 through 009 and a SKU is
  generated for a different product's variant
- **THEN** that SKU carries sequence 010

#### Scenario: An abandoned SKU costs nothing

- **WHEN** a SKU is generated and the merchant does not save it, and a SKU is then
  generated again for the same product
- **THEN** both SKUs are identical, and no number has been skipped

#### Scenario: Deleting a variant releases its number

- **WHEN** the variant holding the highest number is deleted and a new SKU is
  generated
- **THEN** the new SKU reuses that number

#### Scenario: A non-numeric SKU is ignored by the sequence

- **WHEN** the only stored SKU is `SKU-ABC-WXYZ` and a SKU is generated
- **THEN** the generated SKU carries sequence 001

### Requirement: The sequence is zero-padded to three digits and widens beyond 999

The sequence segment SHALL be rendered as decimal digits, left-padded with zeros
to a minimum width of three. A sequence of 1000 or greater SHALL be rendered at
its natural width rather than wrapping or truncating.

#### Scenario: Below one hundred

- **WHEN** the issued number is 1
- **THEN** the sequence segment is `001`

#### Scenario: Beyond three digits

- **WHEN** the issued number is 1000
- **THEN** the sequence segment is `1000`

### Requirement: A generated SKU does not duplicate a stored one

Because its number is above every number already stored, a generated SKU SHALL
NOT match the SKU of any existing variant.

#### Scenario: An existing SKU shares the prefix

- **WHEN** a variant already holds `COL-001` and a SKU is generated for a product
  titled "Collision Product"
- **THEN** the generated SKU is `COL-002`

### Requirement: SKUs are generated on request for a single variant

The system SHALL expose an authenticated admin endpoint that composes and returns
exactly one SKU per request. The request SHALL be able to identify either an
existing variant, or an unsaved draft — a product title, a brand, a set of
categories, and a set of attribute values — so that the wand works before a
product has been saved. The endpoint SHALL NOT write the generated SKU onto any
variant.

#### Scenario: Generating for an existing variant

- **WHEN** the request identifies an existing variant
- **THEN** the response carries one SKU composed from that variant's product
  title, brand, first category and its own attribute values

#### Scenario: Generating for an unsaved draft

- **WHEN** the request carries a draft title, brand, categories and attribute
  values for a product that has not been saved
- **THEN** the response carries one SKU composed from those draft values

#### Scenario: Generation does not persist

- **WHEN** a SKU is generated for an existing variant
- **THEN** that variant's stored SKU is unchanged until the merchant saves the
  form

#### Scenario: Unauthenticated request

- **WHEN** a request without admin capability is made
- **THEN** the system rejects it and returns no SKU

### Requirement: SKUs are generated for a set of variants in one request

The system SHALL expose an authenticated admin endpoint that composes one SKU for
each of a submitted set of existing variants, numbering them consecutively from
the same starting point within that one request. Results SHALL identify which
variant each SKU belongs to and SHALL follow the order the variants were
submitted in. A submitted identifier matching no variant SHALL be omitted from
the results rather than failing the request. The endpoint SHALL NOT write any
generated SKU onto a variant. An empty set SHALL be rejected.

#### Scenario: Each variant gets its own number

- **WHEN** SKUs are generated for three variants of different products in one
  request, and no stored SKU ends with a number
- **THEN** the three results carry sequence 001, 002 and 003 respectively

#### Scenario: Numbering starts above the stored maximum

- **WHEN** the highest number any stored SKU ends with is 9 and SKUs are
  generated for two variants in one request
- **THEN** the results carry sequence 010 and 011

#### Scenario: Each SKU follows the full segment rule

- **WHEN** SKUs are generated for two variants of the same product that differ in
  their attribute values
- **THEN** each result carries its own variant's attribute segments, not a copy
  of the first variant's

#### Scenario: An unknown variant is skipped

- **WHEN** the submitted set contains one identifier matching no variant
- **THEN** the response carries a SKU for every other submitted variant and none
  for the unknown one

#### Scenario: Repeating the request costs nothing

- **WHEN** the same set is submitted twice without any SKU being saved in between
- **THEN** both responses carry identical SKUs

#### Scenario: Batch generation does not persist

- **WHEN** SKUs are generated for a set of variants
- **THEN** every one of those variants' stored SKUs is unchanged

#### Scenario: Empty set

- **WHEN** the request submits no variant identifiers
- **THEN** the system rejects it and returns no SKUs

### Requirement: Generation never replaces a SKU a merchant did not ask to replace

The system SHALL populate a SKU field only in response to an explicit merchant
action. Saving a product or variant with an empty SKU SHALL NOT generate one, and
no generated SKU SHALL overwrite a stored SKU without the merchant triggering
generation and saving.

#### Scenario: Saving with an empty SKU

- **WHEN** a merchant saves a variant whose SKU field is empty
- **THEN** the variant is saved with no SKU and none is generated
