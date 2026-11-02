## Context

See `proposal.md` for the motivation.

- Compose already isolates each worktree: the project name is the folder name,
  so containers, networks and volumes are separate. Only host ports clash.
- `docker-compose.yml` bind-mounts `.` into the plugin directory, so one
  stack can serve only one worktree's code.
- `docker/wp-config.php` sets `WP_HOME` and `WP_SITEURL` from `WP_URL`.
- `docker/php/docker-entrypoint.sh` starts `socat` on the port from `WP_URL`
  and forwards it to `nginx:80`. WP-Cron and the plugin queue worker call the
  site's own URL. Without this forward those calls fail silently. The port in
  `WP_URL` must therefore be known when the `php` container starts.
- `.env` is gitignored, so it is the right place for per-worktree values.

## Goals / Non-Goals

**Goals:**
- A new worktree needs no manual port or `.env` edit.
- Same behavior on OrbStack and Docker Desktop.
- Ports stay the same after a restart.

**Non-Goals:**
- Sharing one stack between worktrees.
- Public tunnel or webhook URL handling. `KECOM_WEBHOOK_BASE_URL` stays a
  value the developer can set in `.env`.
- Changing production or CI behavior.

## Decisions

**1. A script picks free ports and saves them in `.env`.**
`bin/dev-up` scans upward from `20100` for free ports, writes them to `.env`,
then runs `docker compose up -d`. A lock directory in `$TMPDIR` makes two runs
at the same time pick different ports. A port is free when nothing listens on
it and it can be bound.
- Alternative: let Docker choose random ports (`127.0.0.1::80`) and build the
  site URL from the `Host` header. Rejected: the `socat` loopback needs the
  site port when the `php` container starts, and Docker has not chosen it yet.
  The port would also change after each restart.
- Alternative: OrbStack `*.orb.local` domains. Rejected: Docker Desktop has
  no equivalent.
- Alternative: derive ports from a hash of the folder name. Rejected: two
  names can give the same port, and a clash again needs a manual fix.

**2. Saved ports are re-checked on each run.**
If a saved port is busy and this project's own containers do not hold it,
`bin/dev-up` picks a new port and updates `.env` and `WP_URL` together. This
handles a stopped worktree whose port another worktree took later.

**3. Compose and `wp-config.php` keep their defaults.**
The `20100`-based defaults remain as the fallback. `bin/dev-up` only supplies
`.env` values. This keeps the old flow working. The only additions are
`VITE_PORT` in the `php` service and `KECOM_VITE_DEV_SERVER` in
`wp-config.php`.

**3a. The Vite port follows the nginx port.**
`VITE_PORT = 5173 + (NGINX_HTTP_PORT - 20100)`. The dev server does not run
when `bin/dev-up` runs, so a free-port probe would give two worktrees the same
port. The nginx port is unique for each running stack, so the offset is too.
Vite uses `strictPort`: the plugin loads scripts from the saved port, so a
silent move to another port would break the admin app.
- Alternative: probe for a free port at `npm run dev` time and tell PHP. Rejected:
  PHP runs in a container and has no way to learn the new port without a
  restart or a shared file.

**4. `.env` is created from `.env.example` when it is missing.**
`bin/dev-up` copies the file, then overwrites only the port and URL keys. It
keeps any other value the developer set.

**5. Orca hooks call the same scripts a developer runs by hand.**
Setup runs `composer install` and then `bin/dev-up`. `composer install` comes
first because `wordpress-init` activates the plugin, and that needs `vendor/`.
Archive runs `docker compose down -v` so volumes do not fill the disk. Both
are single-line commands in `orca.yaml` under `scripts.setup` and
`scripts.archive`. They are inline because Orca reads the archive hook from
the main checkout but runs it in the worktree, so a relative script path can
fail there.

## Risks / Trade-offs

- [Port taken between the check and `docker compose up`] → Rare. The next
  `bin/dev-up` run picks a new port.
- [`down -v` on archive deletes the worktree database] → Intended. The
  database is test data. The task list and README say so.
- [Webhook tunnels need a stable public URL] → The developer sets
  `KECOM_WEBHOOK_BASE_URL` in `.env`. `bin/dev-up` does not overwrite a value
  that is not a `localhost` URL.
- [`bin/dev-up` needs a way to test a port] → Use `python3` (present on
  macOS and Linux) or `nc`. Task 1 picks one and documents it.

## Open Questions

- The Orca docs do not describe `scripts.setup` and `scripts.archive`. The keys
  come from Orca issue threads. Orca may skip the archive hook (the CLI needs
  `--run-hooks`). The README tells developers to run `docker compose down -v`
  by hand in that case.
