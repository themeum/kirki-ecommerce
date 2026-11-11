## MODIFIED Requirements

### Requirement: Industry and location presets hook

After every other part of store setup has been applied, the system SHALL apply
the industry and location presets, as the store-presets capability defines. It
SHALL then record in the Home setup checklist which steps the presets
preconfigured, and SHALL announce that the store was created through a public
extension hook that receives the submitted setup values.

#### Scenario: Extension listens for store creation

- **WHEN** an add-on has subscribed to the store-created hook and setup succeeds
- **THEN** the add-on is notified once with the store name, industry, country, currency, and tax answers

#### Scenario: Setup fails before presets

- **WHEN** setup fails before the preset step is reached
- **THEN** the store-created hook is not fired

#### Scenario: Setup writes the presets

- **WHEN** store setup succeeds with industry "fashion-and-apparel" and country "GB"
- **THEN** the store has the preset categories, shipping zones, profiles, attributes, legal pages and consents for that industry and country when the setup response is sent

#### Scenario: Preset tax and shipping are marked preconfigured

- **WHEN** store setup created an enabled tax region with a product rate and an enabled zone with an enabled method from the presets
- **THEN** the Home setup checklist shows the tax and shipping steps as preconfigured, waiting for the merchant to confirm them
