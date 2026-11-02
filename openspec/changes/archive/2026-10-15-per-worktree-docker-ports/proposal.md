## Why

Each git worktree runs its own Docker stack, but the host ports are fixed
(`20100`–`20102`). Every new worktree needs hand-edited ports in `.env`,
including `WP_URL`, or `docker compose up` fails with "port already
allocated". This is a repeated manual step. Orca creates a worktree for each
task, so the cost is paid often. The fix must work on OrbStack and on Docker
Desktop, because the team uses both.

## What Changes

- Add `bin/dev-up`. It picks free host ports for nginx, MariaDB and
  phpMyAdmin once, saves them (and the matching `WP_URL` and
  `KECOM_WEBHOOK_BASE_URL`) in the worktree's `.env`, then runs
  `docker compose up -d`. Later runs reuse the saved ports. A saved port is
  picked again only if another process now holds it.
- Make the Vite dev server port per worktree too. `bin/dev-up` saves
  `VITE_PORT` (`5173` plus the nginx port offset). `vite.config.js` reads it
  with `strictPort`, and `docker/wp-config.php` defines `KECOM_VITE_DEV_SERVER`
  from it. `EnqueueAdminScripts` uses that constant and not a hard-coded
  `localhost:5173`.
- Add `bin/dev-urls`. It prints the site, phpMyAdmin and database addresses
  of the current worktree.
- Make the Vite dev-server `origin` and the host-only test DB default read the
  worktree's saved ports and not `20100` / `20101`.
- Add `orca.yaml` with Orca hooks: a setup hook runs `composer install` and
  then `bin/dev-up` when a worktree is created. An archive hook runs
  `docker compose down -v`.
- Update `README.md`, `.env.example`, `tests/.env.example` and
  `docs/ecommerce/README.md`. Remove the "OrbStack reserves 20000–20001" advice.
- `docker-compose.yml` and `docker/wp-config.php` keep their `20100`-based
  defaults (and `5173` for Vite). People who do not use `bin/dev-up` see no change.

No requirement of the product changes. This is developer tooling only.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The change sets `skip_specs: true` because no product behavior changes.

## Impact

- New files: `bin/dev-up`, `bin/dev-urls`, `orca.yaml`.
- Edited files: `app/Wordpress/Hooks/Actions/EnqueueAdminScripts.php`,
  `docker-compose.yml`, `docker/wp-config.php`, `resources/app/vite.config.js`, `tests/wp-tests-config.php`,
  `tests/bootstrap.php`, `tests/.env.example`, `.env.example`, `README.md`,
  `docs/ecommerce/README.md`.
- Not edited: `docker/php/docker-entrypoint.sh`.
- The only plugin code change is the dev-mode Vite origin in
  `EnqueueAdminScripts`. No change to the REST API or the database schema.
