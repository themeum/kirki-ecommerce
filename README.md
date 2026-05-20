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

```bash
composer test
```

This runs `vendor/bin/phpunit` via the Composer script in `composer.json`.

> **Note:** `phpunit.xml` still references `backend/Tests/`, which is not present in this repository. `composer test` may fail until the test layout is updated. Dev dependencies (PHPUnit 9, Faker, WP-CLI stubs) are installed with `composer install`.

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
