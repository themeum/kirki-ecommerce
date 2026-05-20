# Kirki Ecommerce

WordPress e-commerce plugin by Themeum. This document is for **internal Themeum developers** setting up and working on the project locally.

This repository contains **only the plugin**. WordPress core is not committed to git; the Docker stack downloads it into a volume on first run and bind-mounts this repo into `wp-content/plugins/kirki-ecommerce`.

Local development is **Docker-only**. Use the Compose stack below as the supported environment.

---

## Prerequisites

Primary platform: **macOS** with **Docker Desktop** or **OrbStack**.

| Tool                    | Purpose                                |
| ----------------------- | -------------------------------------- |
| **Docker + Compose v2** | Local WordPress stack (required)       |
| **Git**                 | Clone and version control              |
| **Composer 2.x**        | PHP dependencies (host or container)   |
| **Shell** (bash/zsh)    | Run `source docker/scripts/dev-env.sh` |

**Linux:** Docker Engine plus the Compose plugin. Same steps as macOS; port conflicts with OrbStack do not apply.

**Windows:** WSL2 with Docker Desktop. Run all commands from the WSL terminal inside your clone.

---

## System requirements

| Component | Version                                                     |
| --------- | ----------------------------------------------------------- |
| PHP       | 7.4+ (Composer platform and Docker image: `php:7.4-fpm`)    |
| WordPress | 5.9+ (installed automatically on first `docker compose up`) |

**Docker host:** Allocate at least **4 GB RAM** to Docker. The `wordpress_data` volume stores WordPress core, uploads, and themes outside this repo.

---

## Project structure

```
kirki-ecommerce/              # This repo (plugin only)
├── app/                      # Application layer (controllers, menus, domain logic)
├── framework/                # Core PHP framework (ORM, HTTP, WordPress hooks)
├── database/                 # Migrations and seeders
├── docker/                   # Images, nginx, wp-config, helper scripts
├── payments/kirki-stripe/    # Stripe payment gateway (nested Composer project)
├── resources/                # Admin UI source and static data
├── kirki-ecommerce.php       # Plugin bootstrap
├── composer.json
└── docker-compose.yml

Docker volume (not in git):
└── wordpress_data/
    └── wp-content/plugins/kirki-ecommerce/   ← bind-mounted from this repo
```

**`framework/`** provides the shared infrastructure (database layer, routing, WordPress integration). **`app/`** holds Kirki Ecommerce–specific features built on top of that layer.

---

## Installation

Follow these steps from the repository root after cloning.

### 1. Clone the repository

```bash
git clone git@github.com:themeum/kirki-ecommerce.git
cd kirki-ecommerce
```

### 2. Create environment file

```bash
cp .env.example .env
```

Edit `.env` if you need custom ports or credentials. Key variables:

| Variable             | Purpose                             | Default                  |
| -------------------- | ----------------------------------- | ------------------------ |
| `NGINX_HTTP_PORT`    | WordPress HTTP port                 | `20100`                  |
| `MARIADB_PORT`       | MariaDB host port                   | `20101`                  |
| `PHPMYADMIN_PORT`    | phpMyAdmin port                     | `20102`                  |
| `WP_URL`             | Site URL (`WP_HOME` / `WP_SITEURL`) | `http://localhost:20100` |
| `WP_TITLE`           | Install title                       | `Kirki Ecommerce Dev`    |
| `WP_ADMIN_USER`      | WP admin username                   | `admin`                  |
| `WP_ADMIN_PASSWORD`  | WP admin password                   | `demo`                   |
| `WP_ADMIN_EMAIL`     | WP admin email                      | `admin@example.com`      |
| `DB_NAME`            | Database name                       | `kirki_ecommerce`        |
| `DB_USER`            | Database user                       | `wordpress`              |
| `DB_PASSWORD`        | Database password                   | `wordpress`              |
| `DB_ROOT_PASSWORD`   | MariaDB root password               | `root`                   |
| `XDEBUG_MODE`        | Xdebug modes                        | `off`                    |
| `XDEBUG_CLIENT_HOST` | Debug client host                   | `host.docker.internal`   |
| `XDEBUG_CLIENT_PORT` | Debug port                          | `9003`                   |
| `XDEBUG_IDEKEY`      | IDE key                             | `PHPSTORM`               |

**macOS / OrbStack:** Defaults use ports **20100–20102** because OrbStack often reserves **20000–20001**. Change the port variables in `.env` if you see "port already allocated" errors.

`DB_HOST` is set to `mariadb` inside Docker (`docker-compose.yml` / `docker/wp-config.php`), not in `.env`.

### 3. Make scripts executable

```bash
chmod +x wpcli docker/scripts/*.sh
```

### 4. Add shell helpers to PATH

```bash
source docker/scripts/dev-env.sh
```

This adds the project root to your `PATH` so you can run `wpcli` from any directory in the repo without `./`. Re-run this command in new terminal sessions.

### 5. Install PHP dependencies

On the host:

```bash
composer install
cd payments/kirki-stripe && composer install && cd ../..
```

Or inside Docker (after the stack is running):

```bash
wpcli composer install --working-dir=wp-content/plugins/kirki-ecommerce
```

Run `composer install` in `payments/droip-stripe` on the host as well if you use the Stripe gateway locally.

### 6. Start the Docker stack

```bash
docker compose up -d --build
```

### 7. First-run bootstrap

On the first `docker compose up`, the **`wordpress-init`** one-shot service:

1. Downloads WordPress core into the `wordpress_data` volume (if missing)
2. Waits for MariaDB and runs `wp core install`
3. Activates the `kirki-ecommerce` plugin (bind-mounted from this repo)
4. Sets permalink structure and flushes rewrite rules

Watch progress: `docker compose logs -f wordpress-init`

### 8. Verify access

| Service    | URL / endpoint (defaults)                 |
| ---------- | ----------------------------------------- |
| WordPress  | http://localhost:20100                    |
| phpMyAdmin | http://localhost:20102                    |
| MariaDB    | `localhost:20101` (credentials in `.env`) |

**Local dev credentials only** — default WordPress admin from `.env`: `admin` / `demo`. Do not use these outside local Docker.

---

## Services

| Service            | Role                                                                   |
| ------------------ | ---------------------------------------------------------------------- |
| **nginx**          | HTTP reverse proxy (host port from `NGINX_HTTP_PORT`, default `20100`) |
| **php**            | PHP 7.4-FPM — mysqli, gd, zip, intl, opcache, xdebug                   |
| **mariadb**        | MariaDB (host port from `MARIADB_PORT`, default `20101`)               |
| **phpmyadmin**     | Database UI (host port from `PHPMYADMIN_PORT`, default `20102`)        |
| **wordpress-init** | One-shot bootstrap on first `up`                                       |
| **wpcli**          | WP-CLI and Composer inside the stack (`--profile tools`)               |

---

## Daily development

From the project root after `source docker/scripts/dev-env.sh`:

```bash
wpcli plugin list
wpcli cache flush
wpcli core update
wpcli option update home 'http://localhost:20100'
```

If you did not source `dev-env.sh`, prefix with `./` (e.g. `./wpcli plugin list`).

---

## Kirki CLI

Kirki Ecommerce registers a set of plugin-scoped WP-CLI commands (Laravel-style migrations, seeders, and code generators) under the `kirki` namespace. Use them from the project root after sourcing `docker/scripts/dev-env.sh` and starting the Docker stack.

List all subcommands:

```bash
wpcli help kirki
wpcli help kirki migrate:fresh
```

`wpcli kirki ...` runs through the project [`wpcli`](wpcli) wrapper. Inside the container it is equivalent to `wp kirki ...`.

> **Warning — destructive database commands**
>
> `wpcli kirki migrate:fresh` **drops all plugin tables** and re-runs every migration. Use it only on local Docker or the isolated test database (`kirki_ecommerce_test`). **Never** run it on production or staging with real data.
>
> `docker compose down -v` is broader: it removes the entire WordPress volume (core, uploads, themes), not just plugin tables. See [Reset the environment](#reset-the-environment) under Maintenance.

### Database

#### `wpcli kirki migrate`

Run pending migrations from [`database/migrations/`](database/migrations/). Already-applied migration classes are skipped.

**Syntax**

```bash
wpcli kirki migrate
```

**Example — after pulling new migrations**

```bash
git pull
wpcli kirki migrate
```

---

#### `wpcli kirki migrate:fresh`

Drop all plugin tables, then re-run every migration from scratch. Optionally seed afterward.

**Syntax**

```bash
wpcli kirki migrate:fresh [--seed] [--class=<Seeder>]
```

| Flag / option | Description |
| ------------- | ----------- |
| `--seed` | Run seeders after migrations complete |
| `--class=<Seeder>` | Seeder class name(s) when using `--seed` (comma-separated short names, e.g. `ProductsSeeder,OrdersSeeder`) |

**Examples**

```bash
wpcli kirki migrate:fresh
wpcli kirki migrate:fresh --seed
wpcli kirki migrate:fresh --seed --class=DatabaseSeeder
```

---

#### `wpcli kirki db:seed`

Populate the database using seeders in [`database/seeders/`](database/seeders/).

**Syntax**

```bash
wpcli kirki db:seed [--class=<Seeder>]
```

| Option | Description |
| ------ | ----------- |
| `--class=<Seeder>` | One or more seeder short names, comma-separated (resolved to `Ecommerce\Database\Seeders\{Name}`). If omitted, all `database/seeders/*.php` files are discovered. When `DatabaseSeeder.php` exists, it is used as the entry point. |

**Examples**

```bash
wpcli kirki db:seed
wpcli kirki db:seed --class=ProductsSeeder
wpcli kirki db:seed --class=ProductsSeeder,OrdersSeeder
```

---

### Code generators

Generator commands scaffold PHP files from stubs in [`framework/Console/stubs/`](framework/Console/stubs/). Generated classes use the `Ecommerce\` namespace prefix.

#### `wpcli kirki make:migration <name>`

Create a new migration class in [`database/migrations/`](database/migrations/).

**Syntax**

```bash
wpcli kirki make:migration <name> [--prefix=<prefix>]
```

| Argument / option | Description |
| ----------------- | ----------- |
| `<name>` | Migration name. **Must** follow `create_<table>_table` (e.g. `create_widgets_table`). |
| `--prefix=<prefix>` | Table prefix override. Defaults to `app()->prefix()` (`kirki_ecommerce_` from `KIRKI_ECOMMERCE_PREFIX`). |

**Naming rules**

The command strips `create_` and `_table` from the name, then prefixes the remainder:

- `create_widgets_table` → table `kirki_ecommerce_widgets`
- `create_widgets_table --prefix=custom_` → table `custom_widgets`

The PHP class name is PascalCase of the full migration name (e.g. `CreateWidgetsTable` in `database/migrations/CreateWidgetsTable.php`). Edit the generated `up()` / `down()` methods to match existing migrations such as [`CreateProductsTable.php`](database/migrations/CreateProductsTable.php).

**Example — new table workflow**

```bash
wpcli kirki make:migration create_widgets_table
# Edit database/migrations/CreateWidgetsTable.php
wpcli kirki migrate
```

---

#### `wpcli kirki make:model <name>`

Create an Eloquent-style model in `app/Models/`.

**Syntax**

```bash
wpcli kirki make:model <name>
```

| Argument | Description |
| -------- | ----------- |
| `<name>` | Model class name (e.g. `Widget` → `Widget.php`) |

**Creates:** `app/Models/{Name}.php` — namespace `Ecommerce\App\Models`

**Example**

```bash
wpcli kirki make:model Widget
```

---

#### `wpcli kirki make:controller <name>`

Create a controller in `app/Http/Controllers/`.

**Syntax**

```bash
wpcli kirki make:controller <name> [--api] [--resource]
```

| Argument / flag | Description |
| --------------- | ----------- |
| `<name>` | Controller class name (e.g. `WidgetController`) |
| `--api` | Place under `app/Http/Controllers/API/` with namespace `Ecommerce\App\Http\Controllers\Api` |
| `--resource` | Use the resource controller stub (CRUD method skeletons) |

**Creates**

- Default: `app/Http/Controllers/{Name}.php` — `Ecommerce\App\Http\Controllers`
- With `--api`: `app/Http/Controllers/API/{Name}.php` — `Ecommerce\App\Http\Controllers\Api`

**Examples**

```bash
wpcli kirki make:controller WidgetController
wpcli kirki make:controller ProductController --api --resource
```

---

#### `wpcli kirki make:request <name>`

Create a form request class in `app/Http/Requests/`.

**Syntax**

```bash
wpcli kirki make:request <name> [--folder=<folder>]
```

| Argument / option | Description |
| --------------- | ----------- |
| `<name>` | Request class name (e.g. `StoreWidgetRequest`) |
| `--folder=<folder>` | Subfolder under `Requests/` (namespace segment appended) |

**Creates:** `app/Http/Requests/[<folder>/]{Name}.php` — namespace `Ecommerce\App\Http\Requests[\{Folder}]`

**Examples**

```bash
wpcli kirki make:request StoreWidgetRequest
wpcli kirki make:request StoreWidgetRequest --folder=Api
```

---

#### `wpcli kirki make:seeder <name>`

Create a database seeder in [`database/seeders/`](database/seeders/). Creates `DatabaseSeeder.php` automatically if it does not exist.

**Syntax**

```bash
wpcli kirki make:seeder <name>
```

| Argument | Description |
| -------- | ----------- |
| `<name>` | Seeder class name (e.g. `ProductsSeeder`) |

**Creates:** `database/seeders/{Name}.php` — namespace `Ecommerce\Database\Seeders`

**Example**

```bash
wpcli kirki make:seeder ProductsSeeder
```

---

#### `wpcli kirki make:provider <name>`

Create a service provider in `app/Providers/`.

**Syntax**

```bash
wpcli kirki make:provider <name>
```

| Argument | Description |
| -------- | ----------- |
| `<name>` | Provider class name (e.g. `WidgetServiceProvider`) |

**Creates:** `app/Providers/{Name}.php` — namespace `Ecommerce\App\Providers`

After generating, register the provider in the application bootstrap (see existing providers in [`app/Providers/`](app/Providers/)).

**Example**

```bash
wpcli kirki make:provider WidgetServiceProvider
```

---

#### `wpcli kirki make:class <name>`

Create a generic PHP class under `app/`.

**Syntax**

```bash
wpcli kirki make:class <name> [--folder=<path>]
```

| Argument / option | Description |
| ----------------- | ----------- |
| `<name>` | Class name (e.g. `BillingCalculator`) |
| `--folder=<path>` | Subpath under `app/` (supports nested paths, e.g. `Services/Billing`) |

**Creates:** `app/[<path>/]{Name}.php` — namespace `Ecommerce\App[\{PathSegments}]`

**Examples**

```bash
wpcli kirki make:class BillingCalculator
wpcli kirki make:class TaxCalculator --folder=Services/Billing
```

---

## Debugging

### Xdebug

In `.env`:

```env
XDEBUG_MODE=debug,develop
```

Restart PHP:

```bash
docker compose restart php
```

Configure your IDE to listen on port **9003** (`XDEBUG_CLIENT_PORT`).

### PHP configuration

| File                             | Purpose                              |
| -------------------------------- | ------------------------------------ |
| `docker/php/php.ini`             | Base PHP settings                    |
| `docker/php/conf.d/`             | Team-wide overrides                  |
| `docker/php/conf.d/99-local.ini` | Per-developer overrides (gitignored) |

Copy the example for local overrides:

```bash
cp docker/php/conf.d/99-local.ini.example docker/php/conf.d/99-local.ini
docker compose restart php
```

---

## Testing

REST API integration tests use the WordPress test suite with an isolated database (`kirki_ecommerce_test`). Plugin tables are reset with [`wpcli kirki migrate:fresh`](#kirki-cli) before each test class.

### Prerequisites

- PHP 7.4+ on the host with extensions: `mysqli`, `intl`, `zip`, `gd`
- Docker MariaDB running (`docker compose up -d mariadb`) — default host port `20101`
- Git or Subversion for the WordPress test library installer (`bin/install-wp-tests.sh`)
- Composer dev dependencies: `composer install`

### One-time setup

Create the isolated test database (Docker MariaDB must be running):

```bash
docker compose exec mariadb mariadb -uroot -proot -e "CREATE DATABASE IF NOT EXISTS kirki_ecommerce_test; GRANT ALL PRIVILEGES ON kirki_ecommerce_test.* TO 'wordpress'@'%'; FLUSH PRIVILEGES;"
```

Install WordPress core and the PHPUnit test library:

```bash
bash bin/install-wp-tests.sh kirki_ecommerce_test wordpress wordpress 127.0.0.1:20101
```

This downloads WordPress core and the PHPUnit test library into `/tmp/wordpress` and `/tmp/wordpress-tests-lib`, and symlinks this plugin into the test WordPress install.

Environment variables are documented in [`tests/.env.example`](tests/.env.example).

### Run tests

```bash
composer test
```

Run only integration tests:

```bash
vendor/bin/phpunit --testsuite Integration
```

### CI

GitHub Actions runs the same integration suite on `push` and `pull_request` to `main` and `develop` using a MariaDB service (see [`.github/workflows/api-tests.yml`](.github/workflows/api-tests.yml)).

---

## Maintenance

### Update WordPress core

```bash
wpcli core update
```

### Reset the environment

Removes containers and volumes (fresh WordPress install on next `up`):

```bash
docker compose down -v
docker compose up -d --build
```

---

## Troubleshooting

### Ports already allocated

OrbStack on macOS often binds `20000` and `20001`. Use the default `20100–20102` in `.env`, or pick free ports:

```env
NGINX_HTTP_PORT=20100
MARIADB_PORT=20101
PHPMYADMIN_PORT=20102
WP_URL=http://localhost:20100
```

Then:

```bash
docker compose down && docker compose up -d
```

Check what is using a port:

```bash
lsof -i :20001
```

### Plugin not found

Run `docker compose` from the **plugin repository root**. The project directory must mount to `wp-content/plugins/kirki-ecommerce`.

### Permission issues

`wordpress-init` runs as root to write the WordPress volume. If plugin files have wrong ownership:

```bash
docker compose run --rm --user root wpcli chown -R 33:33 /var/www/html/wp-content/plugins/kirki-ecommerce
```

### WordPress still redirects to HTTPS

If a previous run used HTTPS, reset the site URL:

```bash
wpcli option update home 'http://localhost:20100'
wpcli option update siteurl 'http://localhost:20100'
docker compose restart nginx
```

Adjust the URL if you changed `NGINX_HTTP_PORT` or `WP_URL` in `.env`.
