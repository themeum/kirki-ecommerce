## Purpose

Defines how a merchant finds a setting without knowing which settings page owns
it: what settings content is searchable, how a typed query is matched against
that content by meaning rather than by literal substring, how results are ranked
and presented, and how choosing a result reveals and highlights the setting it
found.

## ADDED Requirements

### Requirement: Settings content is searchable at the card level

All merchant-visible copy on a settings page SHALL be searchable — card titles,
card descriptions, section headings, field labels, placeholders, and help text —
not only the navigation item labels. The searchable unit SHALL be the individual
card or titled section, so that a result identifies a specific setting rather
than only the page containing it. The settings pages themselves SHALL also be
searchable, so that a query naming a whole area of settings can return that area.

#### Scenario: Query matches text inside a card

- **WHEN** the merchant searches for wording that appears only in a field label or
  help text inside a card, and nowhere in any navigation item's label or
  description
- **THEN** that card is returned as a result
- **AND** the result identifies the card, not merely the page it lives on

#### Scenario: Query matches a settings page itself

- **WHEN** the merchant searches for the name of a settings page
- **THEN** that page appears among the results alongside any of its cards that
  also match

### Requirement: Search matches related meaning, not only literal text

The search SHALL return results whose text expresses the same concept as the
query even when it shares no words with the query. Results SHALL be ordered by
how strongly they match, and a result that literally contains the typed words
SHALL rank above a result that matches only through a related term.

#### Scenario: Query with no literal overlap

- **WHEN** the merchant searches for wording that does not appear anywhere in the
  settings copy but means the same as wording that does
- **THEN** the card expressing that concept is returned

#### Scenario: Literal match outranks a related-term match

- **WHEN** a query's words appear literally in one card and only as related terms
  in another
- **THEN** the card containing the literal words is ordered above the other

#### Scenario: Query typed in any case

- **WHEN** the merchant types a query whose letters are capitalised differently
  from the settings copy it should match
- **THEN** the same results are returned in the same order as for the lowercase
  query
- **AND** the matching words are marked in the card even though their capitalisation
  differs from what was typed

#### Scenario: Unrelated query returns nothing

- **WHEN** the merchant searches for text unrelated to any setting
- **THEN** no results are returned rather than a list of weak matches

### Requirement: Search runs locally with no network request

Searching SHALL be performed entirely within the browser, without contacting any
external service and without requiring a request to the site's own server.
Results SHALL remain available on a site with no outbound network access.

#### Scenario: Searching offline

- **WHEN** the merchant types a query while the browser has no network connection
- **THEN** results are still returned

#### Scenario: No third-party call

- **WHEN** the merchant types any query
- **THEN** no request is made to any host outside the site

### Requirement: An active query replaces the grouped navigation with ranked results

While the search box holds a query, the sidebar SHALL show a single flat list of
results ordered by match strength, and SHALL NOT show its grouping headings. Each
result SHALL display the name of the matched setting together with the settings
page it belongs to, so the merchant can tell apart two similarly named settings
in different pages. When a query matches nothing, the sidebar SHALL show a
"No results found" message in place of the list. Clearing the query SHALL restore
the grouped navigation exactly as it was before the search.

#### Scenario: Results replace the grouped sections

- **WHEN** the merchant types a query that matches at least one setting
- **THEN** the sidebar shows a flat, ranked list of matching settings
- **AND** the grouping headings are not shown

#### Scenario: Result shows its parent page

- **WHEN** a result is a card inside a settings page
- **THEN** the result displays both the card's name and the name of its page

#### Scenario: No matches

- **WHEN** the merchant types a query that matches nothing
- **THEN** a "No results found" message is shown in place of the results list

#### Scenario: Clearing the query

- **WHEN** the merchant clears the search box
- **THEN** the grouped navigation sections and their headings are shown again
- **AND** the navigation item for the current page is highlighted as active

### Requirement: An active query survives a page reload

The active query SHALL be reflected in the browser address, so that reloading a
settings page, or returning to that address later, restores the results rather
than an empty search box. Choosing a result SHALL carry the query to the result's
page, and clearing the search box SHALL remove it from the address.

#### Scenario: Reloading mid-search

- **WHEN** the merchant reloads a settings page whose address carries a query
- **THEN** the search box shows that query
- **AND** the sidebar shows its results instead of the grouped navigation

#### Scenario: Following a result to another page

- **WHEN** the merchant chooses a result belonging to a different settings page
- **THEN** the destination address still carries the query, so the results list
  remains in place

#### Scenario: Clearing the query removes it from the address

- **WHEN** the merchant clears the search box
- **THEN** the query is no longer present in the address

### Requirement: Choosing a result reveals the setting it found

Selecting a search result SHALL navigate to the settings page that holds the
matched setting and SHALL bring the matched card into view without the merchant
scrolling to find it.

#### Scenario: Result below the fold

- **WHEN** the merchant selects a result whose card sits below the visible area of
  its settings page
- **THEN** the settings page opens and the matched card is scrolled into view

#### Scenario: Result on the current page

- **WHEN** the merchant selects a result whose card is on the settings page
  already open
- **THEN** the matched card is scrolled into view without a page transition

### Requirement: Matched terms are marked in both the results list and the page

The terms responsible for a match SHALL be visibly marked within each result in
the sidebar and, after a result is chosen, within the matched card on the
settings page. The marked terms SHALL include both the words the merchant typed
and the related terms that caused the match, so that a result matching only by
meaning shows the merchant why it was returned. Marking SHALL be removed when the
query is cleared or when the merchant navigates away from the matched setting.

#### Scenario: Literal term marked

- **WHEN** a result's text contains a word the merchant typed
- **THEN** that word is marked in the sidebar result and in the matched card

#### Scenario: Related term marked

- **WHEN** a result matched only through a term related to the query rather than
  one the merchant typed
- **THEN** the related term is marked in its place, so the result is not shown
  without any indication of why it matched

#### Scenario: Marking leaves the card's layout untouched

- **WHEN** the marked words sit in text whose position depends on how its
  container arranges its children, such as a card title sharing a row with a
  button
- **THEN** the words keep their original spacing and position, and the row is
  laid out as it was before the marking

#### Scenario: The chosen card is called out briefly

- **WHEN** the merchant chooses a result and its card is brought into view
- **THEN** the card lifts above the cards around it so it plainly stands out
- **AND** it settles back into place on its own a few seconds later, leaving the
  card as it was and moving nothing else on the page

#### Scenario: Marking is cleared

- **WHEN** the merchant clears the search box or navigates to a settings page
  other than the one holding the matched card
- **THEN** no marked terms remain

### Requirement: The search index is a generated artifact tied to the settings source

The searchable content SHALL be derived from the settings interface's own source
rather than maintained as a separate hand-written list, and SHALL be regenerated
by an explicit command. Regeneration SHALL report any searchable section that
carries merchant-visible copy but cannot be addressed by a search result, so that
content missing from the index is discoverable rather than silently absent.

#### Scenario: Regenerating after a copy change

- **WHEN** a developer changes a card's title or a field's label and runs the
  regeneration command
- **THEN** the new wording is searchable and the previous wording is not

#### Scenario: Reporting unreachable content

- **WHEN** the regeneration command encounters a card that holds merchant-visible
  copy but has no identifier a result can point at
- **THEN** the command reports that card to the developer
