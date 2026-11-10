## Context

`PresetRepository::load()` reads `presets.json` from the cache key
`PresetRepository::cache_key($base_url)` before it requests S3. It keeps a
successful read for 1 hour. `PresetRepository::get_products()` has no cache:
it downloads `<set>/products.json` on every sample data load, and falls back to
`other` on 403/404. `MediaImporter` downloads images over HTTP, and reuses an
attachment that was imported before from the same URL.

The source folder `resources/data/preconfigured-data/` holds `presets.json`
and one `products.json` for each set. The images are not in the repository
(`.gitignore` excludes `*/images/`). The make-package script leaves the folder
out of the plugin zip.

Plugin WP-CLI commands are registered in `bootstrap/commands.php` and run as
`wp kirki <name>`. `ClearOptionsCommand` shows the pattern.

## Goals / Non-Goals

**Goals:**
- One command fills the cache with the local `presets.json` and products files.
- Store setup and sample data loading then make no request for these files.

**Non-Goals:**
- Images. They are not in the repository.
- Writing downloaded products files to the cache in normal use.
- A WP-CLI test harness.

## Decisions

1. **Fill the existing presets cache key.** The command calls
   `Cache::put(PresetRepository::cache_key(KIRKI_ECOMMERCE_PRESETS_URL), ...)`.
   `load()` already reads that key, so the store setup path does not change.
   *Alternative:* point `KIRKI_ECOMMERCE_PRESETS_URL` at the local folder
   through nginx. Rejected by the user, who wants a CLI step. A Docker
   container also cannot reach `localhost:20100`, so it would need a host
   alias.

2. **New products cache key, read-only in the plugin.**
   `products_cache_key($base_url, $set)` = prefix + `md5(base_url|set)`, in the
   same style as `cache_key()`. `get_products()` checks it after the set is
   resolved and before any request. The plugin never writes it, so a site
   without the command behaves as today. *Alternative:* cache every downloaded
   products file. Rejected. It changes production behavior, and it hides a
   publish for up to 1 hour.

3. **Cached presets do not need a pooled request.** When a products file is
   cached, `get_products()` returns at once. `presets.json` is then read
   through `load()` when the importer needs it (cache first, as today).

4. **Same checks as a download.** The command uses the version checks of
   `PresetRepository::decode()`. For `presets.json`, `version` must be
   `PRESETS_VERSION`. For a products file, `version` must be
   `PRODUCTS_VERSION` and `products` must be an array. A bad `presets.json`
   stops the command before anything is cached. A bad products file is skipped
   with a warning, because the other sets are still useful.

5. **Key scope is the current base URL.** Both keys include
   `KIRKI_ECOMMERCE_PRESETS_URL`. A site that changes the URL does not use
   data that was cached for another URL. This is the same as the presets cache.

6. **`--ttl` default 1 hour, `--forget`.** This is the same lifetime as a
   normal read, so stale local data does not stay long. `--forget` removes the
   presets key and the products key of each local set.

7. **Framework helpers only:** `File::exists/glob/json`, `Cache::put/forget`,
   `resource_path()`, and the `CommandBase` output methods (`cli_success`,
   `cli_warning`, `cli_error`).

## Risks / Trade-offs

- [The local files change after caching, or the branch changes] → the site uses
  the old copy until the TTL ends. Run the command again, or run `--forget`.
- [An industry with no local products file] → no key, so `get_products()`
  requests S3 and falls back to `other` as today. Every set has a products
  file now (`check:presets` enforces it).
- [Images still need the network] → this is documented. Each image is
  downloaded only once per site.
- [The command runs on a production site that has no source folder] → it stops
  with an error. It does not change anything.

## Migration Plan

Not needed. The command is additive, and the plugin never writes the new key.
To roll back, revert the code. Any cached products key then has no reader, and
it expires within its TTL.
