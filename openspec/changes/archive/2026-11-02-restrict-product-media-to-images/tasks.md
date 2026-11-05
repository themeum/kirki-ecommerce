# Tasks

## 1. Backend rule and allowed list

- [x] 1.1 Add `app/Constants/Product/ProductMediaTypes.php` with `ALLOWED = ['image']`; verify it is the only place in `app/` naming the accepted product media types (`grep`).
- [x] 1.2 Add `app/Rules/AttachmentRule.php` (extends the framework `ValidationRule`, static `of($types)`): fails for non-attachments and for types not in the list; bare type matches `type/*`, full MIME matches exactly. Verify with a unit test in `tests/Unit/Rules/AttachmentRuleTest.php` covering image pass, video/audio fail, non-attachment fail, full-MIME match and widened list. (Test lives in `tests/Integration/AttachmentRuleTest.php` instead: the Unit suite has no WordPress, and the rule needs real attachments.)
- [x] 1.3 Run `composer phpcs:wporg` and `composer phpcs:docblocks` on the new files and verify they report no errors.

## 2. Apply the rule to product requests

- [x] 2.1 In `ProductCreateRequest`, add `AttachmentRule::of(ProductMediaTypes::ALLOWED)` to `media.*`, `variants.*.media` and `og_image`; verify with request tests that a video ID gets a validation error naming the field and an image ID passes.
- [x] 2.2 In `ProductUpdateRequest`, add the same rule to the same three fields; verify with tests: video added (rejected, product unchanged), old video still in payload (rejected), old video removed from payload (accepted), image added (accepted).
- [x] 2.3 Run `composer test:unit` (or `composer test:docker:unit`) and verify it passes; run the integration suite for the product endpoints and verify it passes.

## 3. Frontend accept prop

- [x] 3.1 Add `accept?: AcceptedMediaTypes[]` (default `['image']`) to `MediaGallery` and `MediaGalleryField`, forwarded to `useMediaLibrary({ multiple: true, types: accept })`; verify with a Vitest test that the library is opened with `types: ['image']` by default and with a custom value when given.
- [x] 3.2 Run `npm run typecheck && npm test` in `resources/app/` and verify both pass.

## 4. Docs and specs

- [x] 4.1 Document product media type rules (allowed list, bare vs full MIME, same check on create and update, old products must drop their video to save, 422 for API clients) in the product docs under `docs/`, with a "Where this differs from WooCommerce" section if the doc is new; verify the example request in the doc returns the documented error.
- [x] 4.2 Run `openspec validate restrict-product-media-to-images --strict` and verify it passes.

## Workflow follow-up

- Run `/opsx:apply` manually to implement; archive with `/opsx:archive` after review.
