## 1. Persistence and core contracts

- [x] 1.1 Add the `migration_runs` and `migration_id_map` tables (unique key on source, entity, source_id) following `schema-upgrade-migrations`
- [x] 1.2 Add `Migration/Contracts` (`MigrationSource`, `GroupMigrator`) and `Migration/DTO` (scan, group, chunk result, skipped item)
- [x] 1.3 Implement `IdMap` (link, resolve, exists) and `RunState` (create, load, save cursor and counts, one active run)
- [x] 1.4 Implement `SourceRegistry` and `MigrationRunner` (dependency order, one chunk per call, keyset cursor, per-row error catch, skip report)
- [x] 1.5 Implement the abstract group base class (count, fetch, map, persist template; chunk size constant per group)
- [x] 1.6 Write PHP unit tests: chunk limits, resume from saved cursor, id-map idempotence, skipped-item reporting, dependency order
- [x] 1.7 Verify: run the PHP tests and phpcs (docker runner), all pass

## 2. Migration mode (side-effect suppression)

- [x] 2.1 List every mail job, listener, stock update, coupon-usage count and event that runs on product, customer, coupon and order creation
- [x] 2.2 Add `MigrationMode` guard (set per chunk request, cleared in `finally`)
- [x] 2.3 Make the listed paths skip work while the guard is set; keep original dates and order number on insert
- [x] 2.4 Write tests: no mail queued, no stock change, no coupon usage change, no event fired, dates kept
- [x] 2.5 Verify: run the PHP tests and phpcs, all pass

## 3. API

- [x] 3.1 Add `MigrationController` with sources, scan, create run, chunk and get run endpoints, with administrator-only access
- [x] 3.2 Add request validation and routes in `routes/api.php`
- [x] 3.3 Write tests: authorization rejection, scan is read-only, chunk response shape, second run start returns the active run
- [x] 3.4 Verify: run the PHP tests and phpcs, all pass

## 4. WooCommerce probes and scan

- [x] 4.1 Implement `VersionProbe` (installed, version, minimum-version constant) and `StorageProbe` (HPOS or legacy by table and option)
- [x] 4.2 Implement `ExtensionDetector` with the initial extension list and SEO plugin support flags
- [x] 4.3 Implement `WooCommerceSource::scan` returning only groups that map to Kirki DTOs, with counts
- [x] 4.4 Create WooCommerce fixture data (legacy and HPOS, two versions) for tests; confirm the "not verified" keys listed in `design.md` against the fixtures and record the result in `design.md`
- [x] 4.5 Write tests: not installed, below minimum, HPOS count, legacy count, extensions listed, zero-count group omitted
- [x] 4.6 Verify: run the PHP tests and phpcs, all pass

## 5. Catalog group

- [x] 5.1 Categories reader and mapper (parent relation through id-map; parents first)
- [x] 5.2 Tags, brands, global attributes and values readers and mappers
- [x] 5.3 Products reader and mapper: fields, status, prices, sale dates, stock, dimensions, images (attachment ids), taxonomy links, SEO fields
- [x] 5.4 Variations reader and mapper: create variants under the migrated product with attribute values and own SKU, price, stock
- [x] 5.5 Clash handling for slug and SKU with suffix and report line
- [x] 5.6 Write mapper tests for simple, variable, unsupported-type, clash and image cases
- [x] 5.7 Verify: run the PHP tests and phpcs, all pass

## 6. Customers and coupons groups

- [x] 6.1 Customers reader and mapper with billing and shipping addresses; link to existing WordPress user; reuse by email
- [x] 6.2 Guest customers from order billing email, created once for each email
- [x] 6.3 Coupons reader and mapper: type, amount, expiry, limits, spend limits, product, category and email restrictions; skip unsupported types; code clash suffix
- [x] 6.4 Write tests for registered customer, guest, email reuse, each coupon type, unsupported type
- [x] 6.5 Verify: run the PHP tests and phpcs, all pass

## 7. Orders group

- [x] 7.1 `OrderReader` interface with `LegacyPostsOrderReader` and `HposOrderReader`
- [x] 7.2 Order mapper: status map, totals, addresses, payment data, dates, original number, customer link
- [x] 7.3 Line item, fee, shipping, tax and coupon line mapping with product and variant links from the id-map; fallback to plain line when unresolved
- [x] 7.4 Order notes and refunds migration
- [x] 7.5 Write tests: both readers give the same mapped result, product and variation links, unresolved product fallback, unknown status, refund, note
- [x] 7.6 Verify: run the PHP tests and phpcs, all pass

## 8. Settings group

- [x] 8.1 Currency and store address mapper; report each Kirki value that changes
- [x] 8.2 Tax rates and classes mapper to Kirki tax regions
- [x] 8.3 Shipping zones and methods mapper to Kirki shipping profiles where a match exists
- [x] 8.4 Confirm no payment credentials are read or stored; add a test for it
- [x] 8.5 Verify: run the PHP tests and phpcs, all pass

## 9. Admin app

- [x] 9.1 Create `features/migration` with public API, service calls, query keys, and response and payload schemas with payload tests
- [x] 9.2 Scan page: skeleton loader, group checklist (`[x] Products (100)`), extension notices, error with retry, "Skip" and "Migrate" buttons, "Migrate" disabled with no group
- [x] 9.3 Run hook: create run, loop chunk requests until done or error, stop on error and offer "Resume", reload resume from `GET run`
- [x] 9.4 Run page: progress bar in the wizard progress slot, descriptive status message with range and total, translatable strings
- [x] 9.5 Summary page: counts per group, skipped item list, "Go to dashboard" button
- [x] 9.6 Update onboarding completion screen: show "Migrate from WooCommerce" only when a supported source is detected; route to the scan page
- [x] 9.7 Write tests for the status message builder, the run loop (success, error, resume) and the schemas
- [x] 9.8 Verify: run `npm run typecheck && npm test` in `resources/app/`, all pass

## 10. Documentation and final checks

- [x] 10.1 Write `docs/migration.md`: table of contents, quick start, groups, resume, safety rules, adding a new source, and a "Where this differs from WooCommerce" section
- [x] 10.2 Run an end-to-end check on a fixture store with 100 products and 1000 orders: chunk sizes, resume after forced failure, second run creates nothing
- [x] 10.3 Ask the user to check the onboarding screens visually (no browser tool is used in this project)
- [x] 10.4 Verify: `npm run typecheck && npm test`, PHP tests and phpcs all pass
