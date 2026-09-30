---
paths:
  - "app/**/*.php"
  - "database/**/*.php"
  - "resources/views/**/*.php"
---

# PHP Coding Standards

Derived from analyzing the actual code in `app/` and `database/` (404 PHP files).
Applies to: `app/**/*.php`, `database/**/*.php`.

Target PHP **7.4** (see `composer.json` `config.platform.php`). Follow PSR-4 file naming.

### WordPress.org Plugin Directory Requirements

This plugin targets wordpress.org submission. Apply the required-for-approval
subset of WordPress coding standards (escaping, sanitization/unslashing,
nonces, i18n, ABSPATH guards, WP-version compatibility, no global PHP state
mutation) to every PHP change, in every session — not just when a task is
explicitly about submission readiness. This is narrower than full
`WordPress-Extra`/`WordPress-Docs` style compliance, which is out of scope.

Enforced by `composer phpcs:wporg` (`phpcs-wporg.xml.dist`, also in CI) —
run it, read its inline comments for the specifics and known false-positive
exceptions, and prefer `Kirki\Ecommerce\Framework\Sanitizer::apply_rule()`
over calling WP sanitize functions directly to match this codebase's
convention.

Never read `$_GET`/`$_POST`/`$_SERVER`/`$_COOKIE`/`$_FILES` directly. Use:

- `Kirki\Ecommerce\Framework\Http\Request` (via the `request()` helper) for
  single-key reads in code that only ever runs inside a dispatched site or
  REST request — it merges query, POST, and route params into one typed
  accessor (`->int()`, `->text()`, `->array()`, `->cookie()`, ...), already
  used in `CartService.php` and `resources/views/site/login.php`.
- `Kirki\Ecommerce\Framework\Http\Superglobals` everywhere else: whole-array
  reads where the exact source array matters (not `Request`'s merged
  `all()`), method-scoped or otherwise security-sensitive reads (e.g. a
  nonce check that must not blur `$_GET`/`$_POST`), and any code with no
  guaranteed request lifecycle (wp-admin hooks, raw `wp_ajax_*` endpoints,
  cross-cutting managers).

Both unslash and sanitize via `Sanitizer` internally — never wrap their
output in another `wp_unslash()`/`sanitize_*()` call.

### Classes and Files

- Class names: **PascalCase** (`CartService`, `PaymentManager`)
- File names: PSR-4 — one class per file, filename matches class name
- Namespace must match the PSR-4 autoload map in `composer.json`
  (`Kirki\Ecommerce\App\` → `app/`, `Kirki\Ecommerce\Database\...` → `database/...`)
- Interfaces live in a `Contracts/` sub-namespace (e.g. `App\Contracts`, `App\Scheduler\Contracts`)
- Traits live in a `Concerns/` sub-namespace (e.g. `App\Concerns`, `App\Scheduler\Concerns`)
- Don't declare classes `final`, with one exception: classes that only hold
  public constants and are never instantiated (e.g. `App\Constants\*`,
  `App\Constants\Order\OrderStatus`) — those may be `final`

### Methods, Properties, and Variables

- Methods and variables: **snake_case** (`get_cart`, `$customer_id`) — this is
  followed almost universally in this codebase. The only exceptions are
  methods required by a native PHP interface (`IteratorAggregate::getIterator`,
  `JsonSerializable::jsonSerialize`, `ArrayAccess::offsetGet`, etc.) — keep
  those camelCase since PHP mandates the exact method name.
- Names must be meaningful and express intent; avoid `$a`, `$b`, `$temp`
- Visibility: **`private` is never used in this codebase** — use `protected`
  or `public` instead.
  - `public` — API surface (controllers, facades, hooks called externally)
  - `protected` — default for internal members; use for anything not part
    of the public API
- Static references: always use `static::`, never `self::`

```php
// ❌ BAD
private $repository;
self::PAGINATION_LIMIT;

// ✅ GOOD
protected $repository;
static::PAGINATION_LIMIT;
```

### Arrays and Syntax

- Use short array syntax `[]`, never `array()` — 100% consistent in this codebase
- Prefer self-explanatory naming and structure over comments
- Inline `//` comments do appear, but sparingly — mainly for section dividers
  in long DTOs, `// phpcs:ignore ... -- reason` directives, and genuinely
  non-obvious context. Don't add comments that just restate what the code does.

### Type Hints and Return Types

Type hints and return types are used, but **not** on every method — treat
them as encouraged for new code, not mandatory, and match whatever the
surrounding class already does. When you do add them, PHP 7.4 syntax only
(no union types, no constructor property promotion, no enums — those are PHP 8+).

### Docblocks

Every class, interface, trait, method, function and property in `app/` and
`database/` has a docblock, whatever its visibility. Class constants and
closures don't need one. Spec: `openspec/changes/standardize-php-docblocks/`.

- One-line summary: imperative for methods/functions ("Get all online
  gateways."), descriptive for classes. Add a description paragraph only when
  behavior isn't obvious from the summary and signature.
- Order: summary, blank line, `@since`, blank line, `@param`, `@return`, `@throws`
- `@since` on every class, interface, trait, method and function. Declarations
  that predate this standard use `@since 1.0.0`; new ones use the version they ship in
- `@param` for each parameter in signature order, aligned per PHPCS conventions
- `@return` always, except on constructors/destructors (use `@return void` when the method returns nothing)
- `@throws` only when the method itself throws (including via `throw_if()`/`throw_anyway()`)
- Properties get `@var` only, no `@since`; single-line `/** @var Type */` is fine
- Overrides and interface implementations use `@inheritDoc` plus `@since`,
  unless the contract changes
- Types: `Type[]` for lists, `array<string, mixed>` for maps, `Type|null` for
  nullables, `mixed` when the type can't be established — never guess
- Docblocks are documentation only: don't turn them into native type
  declarations as part of documenting

```php
/**
 * Manages the registered payment gateways.
 *
 * @since 1.0.0
 */
class PaymentManager
{
    /**
     * Get all online gateways.
     *
     * @since 1.0.0
     *
     * @return PaymentGateway[]
     */
    public function get_all_online_gateways()
    {
        return collection($this->gateways_registry)
            ->reject(fn($gateway) => $gateway->is_manual())
            ->all();
    }

    /** @var array<string, PaymentGateway> */
    protected $gateways_registry = [];
}
```

### Money and Pricing Fields

Any DB column, model attribute, DTO property, request field, or resource
output key that holds a monetary amount must be qualified — never a bare
`price`, `amount`, `total`, `cost`, `fee`, or `subtotal`. Which prefix depends
on what currency the value is actually in:

- **`base_*`** — the amount in the store's base currency. This is the only
  form ever persisted to the database for catalog/cart/coupon money (e.g.
  `variants.base_price`, `variants.base_sale_price`, `coupons.base_discount_amount_fixed`).
- **`display_*`** — the same amount converted to the visitor's requested
  currency (`Money::resolve_display_currency()`), computed on the fly in the
  Resource layer. **Never stored** — there is no `display_*` column, only
  `display_*` keys in API responses.
- **`invoiced_*`** — a historical snapshot in the order's transaction
  currency at the time the order was placed (orders, order items, refunds,
  `orders.invoiced_payment_gateway_fee`). On `orders`/`order_items` every
  `invoiced_*` field has a `base_*` sibling captured at the same time; on
  `refunds` there is currently no `base_*` counterpart (refunds aren't
  currency-converted), so `invoiced_*` stands alone there.

Every `base_*`/`invoiced_*`/`display_*` money field in a Resource must ship
with a matching `*_money_object` key built via `Money::prepare_amount_object_from_minor()`
(a `MoneyDTO`: `raw` float, `display` formatted string, `currency` `{code, symbol}`).
`Money::prepare_amount_from_minor()` gives you the plain float for the bare key.

```php
'base_price' => Money::prepare_amount_from_minor($this->base_price),
'base_price_money_object' => Money::prepare_amount_object_from_minor($this->base_price),
'display_price' => Money::prepare_amount_from_minor($this->base_price, null, $display_currency),
'display_price_money_object' => Money::prepare_amount_object_from_minor($this->base_price, null, $display_currency),
```

Because DTO/request field names normally mirror DB columns 1:1, this
prefixing has to be threaded through the full round trip — migration column,
model `$fillable`/`$casts`, DTO property, request validation rule/sanitizer
key, and the Resource read — not just the API response. See `Variant`/`Coupon`
(migrations, models, DTOs) and `VariantResource`/`CouponResource` (output) for
the reference implementation.

**Not every "amount-shaped" field needs a prefix** — only ones that are
unambiguously a currency amount. Leave bare: percentages (`discount_amount_percentage`),
rates (`tax_rate`), quantities/counts (`available_quantity`, `spend_condition_value`),
and units of measure (`total_unit_amount`, `base_unit_amount` — a weight/volume
unit, not money, despite the `base_` in the name).

If a field's currency is ambiguous by design — e.g. `Coupon`'s `discount_amount`
request field, which is a fixed currency amount _or_ a percentage depending on
`discount_value_type` — leave it unprefixed rather than picking a misleading
prefix; the repository layer resolves it to the correct typed column
(`base_discount_amount_fixed` vs. `discount_amount_percentage`).

### General

- Match existing project patterns when editing surrounding code
- Prefer early returns for readability
- Follow the WordPress.org Plugin Directory Requirements above for escaping, sanitization, nonces, and i18n
