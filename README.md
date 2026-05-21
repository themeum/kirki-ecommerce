# Kirki Ecommerce

WordPress e-commerce plugin by Themeum — **internal developer documentation**.

This repo is **plugin code only**. WordPress core lives in a Docker volume on first `docker compose up`. Local development is **Docker-only**.

---

## Quick start

**Requirements:** Docker Compose v2, Git, Composer 2.x, bash/zsh. PHP 7.4+. Allocate **4 GB+ RAM** to Docker.

**macOS:** Docker Desktop or OrbStack (defaults use ports `20100–20102` to avoid OrbStack conflicts on `20000–20001`).  
**Linux / WSL2:** Same steps; run commands from the repo root inside WSL on Windows.

```bash
git clone git@github.com:themeum/kirki-ecommerce.git
cd kirki-ecommerce

cp .env.example .env
chmod +x wpcli kirki-test docker/scripts/*.sh
source docker/scripts/dev-env.sh   # re-run in new terminals

composer install
cd payments/kirki-stripe && composer install && cd ../..

docker compose up -d --build
docker compose logs -f wordpress-init   # first run only — wait for WP install
```

| Service    | URL (defaults)              | Login                          |
| ---------- | --------------------------- | ------------------------------ |
| WordPress  | http://localhost:20100      | `admin` / `demo` (local only)  |
| phpMyAdmin | http://localhost:20102      | see `.env` (`DB_USER` / `DB_PASSWORD`) |
| MariaDB    | `localhost:20101`           | see `.env`                     |

On first boot, **`wordpress-init`** downloads WordPress, runs `wp core install`, activates this plugin, and sets permalinks.

Edit `.env` for custom ports or credentials. Common variables: `NGINX_HTTP_PORT`, `MARIADB_PORT`, `WP_URL`, `DB_*`, `XDEBUG_*`. `DB_HOST` is `mariadb` inside containers — not set in `.env`.

### Project layout

```
app/           # Controllers, models, domain logic
framework/     # ORM, HTTP, routing, WordPress integration
database/      # Migrations and seeders
docker/        # Compose stack, nginx, PHP, scripts
payments/      # Payment gateway subprojects
tests/         # PHPUnit (Unit + Integration)
```

---

## Daily workflow

From the repo root (after `source docker/scripts/dev-env.sh`):

```bash
wpcli kirki migrate              # run pending migrations
wpcli kirki migrate:fresh --seed # reset plugin DB + seed (local only)
composer test:docker:unit        # fast unit tests
composer test:docker:integration # REST API / WordPress tests
```

Without `dev-env.sh`, prefix wrappers with `./` (e.g. `./wpcli`, `./kirki-test`).

> **Warning:** `wpcli kirki migrate:fresh` **drops all plugin tables**. Never on production/staging.  
> `docker compose down -v` removes the entire WordPress volume (core, uploads, themes).

---

## Kirki CLI

Plugin commands live under the `kirki` namespace. The [`wpcli`](wpcli) wrapper runs WP-CLI inside Docker.

```bash
wpcli help kirki
```

### Database

| Command | Description |
| ------- | ----------- |
| `wpcli kirki migrate` | Run pending migrations |
| `wpcli kirki migrate:fresh [--seed] [--class=<Seeder>]` | Drop plugin tables, re-migrate, optionally seed |
| `wpcli kirki db:seed [--class=<Seeder>]` | Run seeders (`database/seeders/`) |

```bash
wpcli kirki migrate
wpcli kirki migrate:fresh --seed
wpcli kirki db:seed --class=ProductsSeeder
```

### Code generators

Scaffold files from [`framework/Console/stubs/`](framework/Console/stubs/). Namespace prefix: `Kirki\Ecommerce\`.

| Command | Output |
| ------- | ------ |
| `make:migration <name>` | `database/migrations/` — name must be `create_<table>_table` |
| `make:model <name>` | `app/Models/` |
| `make:controller <name> [--api] [--resource]` | `app/Http/Controllers/` |
| `make:request <name> [--folder=<folder>]` | `app/Http/Requests/` |
| `make:seeder <name>` | `database/seeders/` |
| `make:provider <name>` | `app/Providers/` — register in app bootstrap |
| `make:class <name> [--folder=<path>]` | `app/` |

```bash
wpcli kirki make:migration create_widgets_table
wpcli kirki make:controller WidgetController --api --resource
```

---

## Testing

PHPUnit config: [`phpunit.xml`](phpunit.xml). Two suites:

| Suite | Needs WordPress | Run via |
| ----- | --------------- | ------- |
| **Unit** | No | `composer test:docker:unit` |
| **Integration** | Yes (MariaDB + WP test lib) | `composer test:docker:integration` |

Requires `docker compose up -d` and `composer install` on the host (`vendor/` is bind-mounted into the `php` container).

**One-time integration setup:**

```bash
composer test:docker:install
```

**Run tests:**

```bash
composer test:docker:unit
composer test:docker:integration
composer test:docker               # both suites
composer test:docker:integration -- --filter=CartApiTest
```

Integration tests reset plugin tables with `wpcli kirki migrate:fresh` before each test class against the isolated `kirki_ecommerce_test` database.

**Host-only** (without Docker test runner): create the test DB, run `bash bin/install-wp-tests.sh kirki_ecommerce_test wordpress wordpress 127.0.0.1:20101`, then `composer test:unit` / `composer test:integration`. See [`tests/.env.example`](tests/.env.example).

CI runs both suites on push/PR to `main` and `dev` — [`.github/workflows/tests.yml`](.github/workflows/tests.yml).

---

## Debugging

Enable Xdebug in `.env`:

```env
XDEBUG_MODE=debug,develop
```

```bash
docker compose restart php
```

Listen on port **9003** (`XDEBUG_CLIENT_PORT`). PHP config: `docker/php/php.ini`, team overrides in `docker/php/conf.d/`, local overrides in `docker/php/conf.d/99-local.ini` (copy from `99-local.ini.example`, gitignored).

---

## Maintenance

```bash
wpcli core update
docker compose down -v && docker compose up -d --build   # full reset
```

---

## Troubleshooting

| Problem | Fix |
| ------- | --- |
| Port already allocated | Use `20100–20102` in `.env` (OrbStack reserves `20000–20001`). `lsof -i :<port>` to check. |
| Plugin not found | Run `docker compose` from this repo root (must mount to `wp-content/plugins/kirki-ecommerce`). |
| File permission errors | `docker compose run --rm --user root wpcli chown -R 33:33 /var/www/html/wp-content/plugins/kirki-ecommerce` |
| Redirect to HTTPS | `wpcli option update home 'http://localhost:20100'` and same for `siteurl`; `docker compose restart nginx` |

---

## Docker services

| Service | Role |
| ------- | ---- |
| **nginx** | HTTP proxy (default `:20100`) |
| **php** | PHP 7.4-FPM (no Composer — install deps on host) |
| **mariadb** | Database (default `:20101`) |
| **phpmyadmin** | DB UI (default `:20102`) |
| **wordpress-init** | One-shot first-run bootstrap |
| **wpcli** | WP-CLI / Composer in stack (`--profile tools`) |
