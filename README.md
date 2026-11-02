# Kirki Ecommerce

WordPress e-commerce plugin by Themeum — **internal developer documentation**.

This repo is **plugin code only**. WordPress core lives in a Docker volume on first `docker compose up`. Local development is **Docker-only**.

---

## Quick start

**Requirements:** Docker Compose v2, Git, Composer 2.x, bash/zsh. PHP 7.4+. Allocate **4 GB+ RAM** to Docker.

**macOS:** Docker Desktop or OrbStack. `bin/dev-up` picks free host ports (from `20100` upward), so several checkouts and worktrees can run at once.  
**Linux / WSL2:** Same steps; run commands from the repo root inside WSL on Windows.

```bash
git clone git@github.com:themeum/kirki-ecommerce.git
cd kirki-ecommerce

chmod +x wpcli kirki-ecommerce-test bin/dev-up bin/dev-urls docker/scripts/*.sh
source docker/scripts/dev-env.sh   # re-run in new terminals

composer install   # installs deps and scopes themeum/framework into vendor/libraries/framework
cd payments/kirki-stripe && composer install && cd ../..

bin/dev-up --build                      # creates .env, picks free ports, runs docker compose up -d
docker compose logs -f wordpress-init   # first run only — wait for WP install
bin/dev-urls                            # print this checkout's URLs
```

Do **not** activate the plugin until `composer install` finishes — scoping must relocate the package to `vendor/libraries/framework/` and rewrite its `src/` to the `Kirki\Ecommerce\Framework\` namespace first.

| Service    | URL                         | Login                          |
| ---------- | --------------------------- | ------------------------------ |
| WordPress  | `NGINX_HTTP_PORT` in `.env` | `admin` / `demo` (local only)  |
| phpMyAdmin | `PHPMYADMIN_PORT` in `.env` | see `.env` (`DB_USER` / `DB_PASSWORD`) |
| MariaDB    | `127.0.0.1:<MARIADB_PORT>`  | see `.env`                     |

Run `bin/dev-urls` to print the real addresses. Without `bin/dev-up`, Compose uses `20100` (WordPress), `20101` (MariaDB) and `20102` (phpMyAdmin).

On first boot, **`wordpress-init`** downloads WordPress, runs `wp core install`, activates this plugin, and sets permalinks.

Edit `.env` for custom credentials. Common variables: `NGINX_HTTP_PORT`, `MARIADB_PORT`, `WP_URL`, `DB_*`, `XDEBUG_*`. `DB_HOST` is `mariadb` inside containers — not set in `.env`.

`bin/dev-up` owns the port keys, `VITE_PORT` and `WP_URL`. It keeps the ports it saved, and picks a new one only if another process now holds it. It also sets `KECOM_WEBHOOK_BASE_URL`, unless you set it to a URL that is not `localhost` (for example a tunnel URL). To fix a port, edit `.env` and keep the port free. Other `bin/dev-up` arguments go to `docker compose up -d`.

`VITE_PORT` is the port of the Vite dev server (`npm run dev`). `bin/dev-up` sets it to `5173` plus the offset of `NGINX_HTTP_PORT` from `20100`, so each worktree has its own port and you can run the dev servers of several worktrees at the same time. Vite and the plugin both read the port from `.env`. Vite fails if the port is busy, because the plugin loads its scripts from that exact port. After you change `VITE_PORT`, run `bin/dev-up` again so the `php` container gets the new value.

### Orca worktrees

[`orca.yaml`](orca.yaml) gives each Orca worktree its own stack, database and volumes. The setup hook runs `composer install` and then `bin/dev-up`. The archive hook runs `docker compose down -v`, which **deletes that worktree's database and WordPress volume**. You do not edit ports or `.env` in a new worktree.

Orca runs these hooks only when the repository uses the shared `orca.yaml` commands. In Orca, open **Settings → this repository → Hooks** and make sure that the command source is not "local only". With "local only", Orca ignores `orca.yaml` and runs the script saved in your Orca settings, so no Docker stack starts and no stack is deleted. A new worktree reads `orca.yaml` from its own base branch, so the base branch must contain this file.

The first start of a new worktree takes a few minutes (Composer, then the WordPress install). Run `bin/dev-urls` in the worktree to see its addresses. If Orca does not run the archive hook, run `docker compose down -v` in the worktree before you delete it.

### Project layout

```
app/                  # Controllers, models, domain logic
app/Setup/            # Store setup and sample data classes (run in production)
database/             # Migrations, and developer seeders (never packaged)
docker/               # Compose stack, nginx, PHP, scripts
payments/             # Payment gateway subprojects
tests/                # PHPUnit (Unit + Integration)
scoper.config.php     # PHP-Scoper config (prefix: Kirki\Ecommerce)
bin/scope-framework.php  # Finalises `composer scope` (relocate, swap, metadata, strip)

vendor/libraries/framework/  # themeum/framework, relocated and scoped (gitignored)
```

`composer scope` moves the installed package from `vendor/themeum/framework` to
`vendor/libraries/framework`, rewrites its namespaces, repoints its autoload prefix and
install path in `vendor/composer/installed.json`, and strips the framework's own tests
and tooling. It is safe to re-run at any time.

After updating `themeum/framework`, re-run scoping:

```bash
composer scope
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

Without `dev-env.sh`, prefix wrappers with `./` (e.g. `./wpcli`, `./kirki-ecommerce-test`).

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

The seeders in `database/seeders/` are development tools. They are autoloaded only by
`autoload-dev`, they run only in development mode, and `npm run make:package` does not
ship them. On a packaged install, `db:seed` and `migrate:fresh --seed` run no seeder.
Code that store setup or sample data runs in production lives in `app/Setup/`, not in
`database/seeders/`. After you pull a change that moves classes between these folders,
run `composer dump-autoload`.

### Code generators

Scaffold files from [`framework/Console/stubs/`](framework/Console/stubs/). Namespace prefix: `Kirki\Ecommerce\`.

| Command | Output |
| ------- | ------ |
| `make:migration <name>` | `database/migrations/` — name must be `create_<table>_table` |
| `make:model <name>` | `app/Models/` |
| `make:controller <name> [--api] [--resource]` | `app/Http/Controllers/` |
| `make:request <name> [--folder=<folder>]` | `app/Http/Requests/` |
| `make:seeder <name>` | `database/seeders/` — developer seeders only |
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

**Host-only** (without Docker test runner): create the test DB, run `bash bin/install-wp-tests.sh kirki_ecommerce_test wordpress wordpress 127.0.0.1:<MARIADB_PORT>` (see `bin/dev-urls`), then `composer test:unit` / `composer test:integration`. See [`tests/.env.example`](tests/.env.example).

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
| Port already allocated | Run `bin/dev-up` again. It picks a new free port when a saved one is taken. `lsof -i :<port>` shows what holds a port. |
| Plugin not found | Run `docker compose` from this repo root (must mount to `wp-content/plugins/kirki-ecommerce`). |
| File permission errors | `docker compose run --rm --user root wpcli chown -R 33:33 /var/www/html/wp-content/plugins/kirki-ecommerce` |
| Redirect to HTTPS | `wpcli option update home "$(grep ^WP_URL= .env | cut -d= -f2-)"` and same for `siteurl`; `docker compose restart nginx` |
| WP-Cron / queued jobs (e.g. scheduled products) never run | `bin/dev-up --build php`. The `php` image runs a `socat` forwarder so WordPress can reach its own URL (`WP_URL`) from inside the container; without it every loopback fails silently. Check with `docker compose exec php curl -s -o /dev/null -w '%{http_code}' "$(grep ^WP_URL= .env | cut -d= -f2-)/wp-cron.php"`, which should print `200`. |

---

## Docker services

| Service | Role |
| ------- | ---- |
| **nginx** | HTTP proxy (`NGINX_HTTP_PORT`) |
| **php** | PHP 7.4-FPM (no Composer — install deps on host) |
| **mariadb** | Database (`MARIADB_PORT`) |
| **phpmyadmin** | DB UI (`PHPMYADMIN_PORT`) |
| **wordpress-init** | One-shot first-run bootstrap |
| **wpcli** | WP-CLI / Composer in stack (`--profile tools`) |
