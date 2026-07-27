# API Documentation

Kirki Ecommerce exposes an OpenAPI 3.0 specification for the REST API under the `kirki/ecommerce/v1` namespace.

## Browse the docs

1. Log in to WordPress.
2. Open **eCommerce → API Docs**, or visit:

```
{site}/wp-admin/admin.php?page=kirki-ecommerce-api-docs
```

The page embeds Swagger UI with the committed OpenAPI spec and injects a REST nonce so **Try it out** works against authenticated API routes.

## How documentation is structured

| Location | Purpose |
|---|---|
| `app/OpenApi/OpenApi.php` | API info, server, security scheme, tags |
| `app/OpenApi/Schemas/Responses.php` | Shared envelopes (`ApiResponse`, `PaginatedResponse`, `ErrorResponse`, `BulkActionRequest`) |
| `app/OpenApi/Schemas/Generated/` | Auto-generated schemas from DTOs and Resources |
| `app/OpenApi/Paths/*Paths.php` | Path/operation definitions (hand-maintained after scaffolding) |
| `storage/openapi/openapi.json` | Compiled OpenAPI document (committed) |

Request/response shapes are derived from existing DTO `@var` properties and Resource `to_array()` keys. Path files reference those schemas via `$ref`.

## Scaffold docs for a new controller

When you add a new API controller and routes:

```bash
wp kirki make:api-doc MyResourceController
```

This will:

1. Refresh generated schemas from DTOs/Resources
2. Inspect routes registered for that controller
3. Create `app/OpenApi/Paths/MyResourcePaths.php` with operation stubs

Options:

```bash
wp kirki make:api-doc MyResourceController --force
```

Then edit the path file to refine summaries, examples, and response details.

## Regenerate the OpenAPI JSON

After changing path files, DTOs, or Resources:

```bash
wp kirki docs:generate
```

Or without WordPress / WP-CLI:

```bash
composer docs:generate
# equivalent: php bin/generate-openapi.php
```

Both regenerate `app/OpenApi/Schemas/Generated/*` and write `storage/openapi/openapi.json`.

Commit the updated `openapi.json` (and any new/changed path files) with your API change.

## Response envelopes

Successful responses follow:

```json
{
  "data": {},
  "message": "..."
}
```

Paginated list endpoints wrap results as:

```json
{
  "data": {
    "results": [],
    "total": 0,
    "count": 0,
    "per_page": 10,
    "current_page": 1,
    "last_page": 1,
    "from": null,
    "to": null,
    "has_more_pages": false
  },
  "message": "..."
}
```

Validation errors (`422`) use:

```json
{
  "message": "...",
  "errors": {
    "field": ["..."]
  }
}
```

## Excluded routes

The following routes are intentionally undocumented:

- `GET /test`
- `GET /test-public`
- `GET /payment-gateways/download/{id}` (mock download)

## Dependencies

Dev dependencies used for generation:

- `zircote/swagger-php` (^4.8, PHP 7.4 compatible)
- `doctrine/annotations` (required for PHPDoc `@OA\` annotations)
