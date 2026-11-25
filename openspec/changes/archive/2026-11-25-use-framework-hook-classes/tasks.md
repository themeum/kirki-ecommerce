## 1. Convert hook calls

- [x] 1.1 `kirki-ecommerce.php`: add `use` statements for `ActionHook`/`FilterHook` after the autoloader `require_once`, then convert the `init` action (priority 0) and the `plugin_row_meta` filter (10, 2)
- [x] 1.2 Convert the `add_action`/`add_filter` calls in `app/Blocks/MiniCartBlock.php`, `app/Menu/Root.php`, `app/Menu/Separator.php`, `app/Wordpress/Hooks/Actions/EnqueueAdminScripts.php` (×2), `app/Supports/Url.php`, and `app/Http/Controllers/Api/EmailTemplateController.php`, with the same priority and argument count
- [x] 1.3 Convert the `apply_filters` calls in `app/Supports/ProductJsonLd.php`, `ProductSeo.php` (×2), `Utils.php` (×3), `Assets.php`, `Template.php`, `app/Payment/PaymentManager.php`, `app/Migration/Core/SourceRegistry.php`, and `app/Services/AnalyticsRangeResolver.php`. Keep the casts
- [x] 1.4 Convert the `do_action` calls in `app/Wordpress/User.php`, `app/Services/StoreSetupService.php`, and `app/Listeners/Order/BroadcastOrderPlacedListener.php`
- [x] 1.5 Do not touch `ProductService::apply_filters()`, `payments/`, `gateways/`, or `tests/`
- [x] 1.6 Verify: `grep -rnE '(^|[^>:a-z_])(apply_filters|add_filter|do_action|add_action)\s*\(' app kirki-ecommerce.php` returns only `ProductService` method lines; run `bash kirki-ecommerce-test unit` and `bash kirki-ecommerce-test integration` (they include `CheckoutPaymentProviderTest` and `OrderPlacedEventTest`); run `composer phpcs:docblocks` and `composer phpcs:wporg` in the php container; then `npm run typecheck && npm test` in `resources/app/`

## 2. Lint enforcement

- [x] 2.1 Add a `Generic.PHP.ForbiddenFunctions` rule to `phpcs.xml.dist` that maps `apply_filters`→`FilterHook::apply`, `add_filter`→`FilterHook::add`, `do_action`→`ActionHook::fire`, `add_action`→`ActionHook::add`, with `<include-pattern>` entries for `app`, `bootstrap`, `config`, `database`, `resources/views`, `routes`, and `kirki-ecommerce.php`
- [x] 2.2 Add the `phpcs:hooks` script to `composer.json` (see design.md, Decision 4)
- [x] 2.3 Add a "Run hook-call check" step that runs `composer phpcs:hooks` after the docblock step in `.github/workflows/tests.yml`
- [x] 2.4 Verify: `composer phpcs:hooks` reports no errors; then add a temporary `add_filter('x', '__return_true');` to an `app/` file, confirm that the check fails and names `FilterHook::add`, and remove it; then `npm run typecheck && npm test` in `resources/app/`

## 3. Rules docs

- [x] 3.1 CLAUDE.md §2a: add "`FilterHook`/`ActionHook` (not `apply_filters`/`add_filter`/`do_action`/`add_action`)" to the examples list. Leave the other uncommitted changes in CLAUDE.md as they are
- [x] 3.2 `.claude/rules/php-standards.md`: add a short hooks rule that names the two classes, the `phpcs:hooks` check, and the exceptions (`tests/`, gateway plugins)
- [x] 3.3 Verify: `npm run typecheck && npm test` in `resources/app/`
