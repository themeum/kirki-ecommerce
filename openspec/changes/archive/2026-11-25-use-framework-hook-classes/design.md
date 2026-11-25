## Context

`FilterHook` and `ActionHook` (namespace `Kirki\Ecommerce\Framework\Wordpress`)
are static pass-throughs. Each method calls the matching WordPress function
with the same arguments. `FilterHook::add` and `ActionHook::add` declare
`callable $callback, int $priority = 10, int $accepted_args = 1`.

Native call sites today (`grep` over plugin PHP):

| File | Calls |
|------|-------|
| `kirki-ecommerce.php` | `add_action('init', …, 0)`, `add_filter('plugin_row_meta', …, 10, 2)` |
| `app/Blocks/MiniCartBlock.php` | `add_action` |
| `app/Menu/Root.php`, `app/Menu/Separator.php` | `add_action` |
| `app/Wordpress/Hooks/Actions/EnqueueAdminScripts.php` | `add_filter` ×2 |
| `app/Supports/Url.php` | `add_filter` (closure) |
| `app/Http/Controllers/Api/EmailTemplateController.php` | `add_action` (closure) |
| `app/Supports/ProductJsonLd.php`, `ProductSeo.php` ×2, `Utils.php` ×3, `Assets.php`, `Template.php` | `apply_filters` |
| `app/Payment/PaymentManager.php` | `apply_filters` (`PAYMENT_PROVIDERS`) |
| `app/Migration/Core/SourceRegistry.php` | `apply_filters` |
| `app/Services/AnalyticsRangeResolver.php` | `apply_filters('kirki_ecommerce_analytics_today', …)` |
| `app/Wordpress/User.php`, `app/Services/StoreSetupService.php`, `app/Listeners/Order/BroadcastOrderPlacedListener.php` | `do_action` |

`bootstrap/`, `config/`, `database/`, `resources/views/`, and `routes/` have no
native calls. `vendor/autoload.php` loads at `kirki-ecommerce.php:93`, before
the first hook call at line 101.

CI runs `composer phpcs:wporg` (`phpcs-wporg.xml.dist`) and
`composer phpcs:docblocks` (`phpcs.xml.dist` filtered with `--sniffs`). It does
not run the full `phpcs.xml.dist`.

## Goals / Non-Goals

**Goals:**
- A mechanical, one-to-one replacement. Each call keeps its arguments.

**Non-Goals:**
- No wrappers for `remove_filter`, `has_filter`, `apply_filters_ref_array`, or
  `do_action_ref_array`. The framework has none, and the plugin does not call
  them.
- No change to hook names or to the `DevHookNames` constants.

## Decisions

**1. Import the class, call it statically.** Add
`use Kirki\Ecommerce\Framework\Wordpress\FilterHook;` (or `ActionHook`) and
call `FilterHook::apply(...)`. This matches how the code uses other framework
classes. In `kirki-ecommerce.php`, which has no namespace, add the same `use`
statements after the autoloader `require_once`.

**2. Keep the existing casts and assignments.** For example,
`(bool) apply_filters(...)` becomes `(bool) FilterHook::apply(...)`.

**3. Enforce with `Generic.PHP.ForbiddenFunctions` in `phpcs.xml.dist`.**
Set `forbiddenFunctions` to map each native function to its replacement, so
the error names it. The sniff ignores method calls and declarations
(`$this->apply_filters()`, `function apply_filters()`), so `ProductService` is
not reported. Restrict the rule with `<include-pattern>` to the in-scope
directories and `kirki-ecommerce.php`.
- *Alternative: put it in `phpcs-wporg.xml.dist`.* CI already runs that file,
  but it holds only wp.org approval rules. This rule is a project
  convention. Rejected.
- *Alternative: only `app/` and `kirki-ecommerce.php`.* The other in-scope
  directories have no native calls now, so it costs nothing to include them,
  and the scope then matches `php-abspath-guard`.

**4. Run it in CI like `phpcs:docblocks`.** Add
`"phpcs:hooks": "phpcs --sniffs=Generic.PHP.ForbiddenFunctions app bootstrap config database resources/views routes kirki-ecommerce.php"`
and a "Run hook-call check" step after the docblock step in
`.github/workflows/tests.yml`.

**5. Tests stay native.** Tests act as third parties. They prove that a native
`add_filter`/`add_action` still reaches the plugin's hooks.

**Correction during implementation (Decision 1):** `kirki-ecommerce.php`
already has `use Kirki\Ecommerce\App\KirkiEcommerce;` near the top (line 21).
The new `use` statements go next to it, not after the autoloader. `use`
resolves at compile time, so the autoloader position does not matter.

**Note:** `phpcs.xml.dist` (PSR12) reports 73 errors in `Template.php`,
`Url.php`, and `Utils.php`. The same 73 errors are on `HEAD`. They are not
from this change, and CI does not run that full ruleset.

## Risks / Trade-offs

- [`FilterHook::add` types `$callback` as `callable`. A callback string that
  is not callable at registration time throws a `TypeError`. Native
  `add_filter` accepts it.] → The two string callbacks in
  `kirki-ecommerce.php` name functions that the same file declares, and PHP
  hoists them, so they are callable. All other callbacks are `[$this, 'method']`
  or closures. The integration test run confirms this.
- [The sniff also flags `\apply_filters(...)` with a leading backslash.] →
  That is the wanted result.
- [A future framework version that is not a pass-through could change
  behaviour.] → The public-contract scenarios in the spec are the check for
  this.

## Migration Plan

No data or runtime migration. To roll back, revert the commit.
