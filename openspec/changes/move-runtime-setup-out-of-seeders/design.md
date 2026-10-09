## Context

See proposal.md for the motivation. The current state that shapes the approach:

- `database/seeders/` holds 19 developer seeders (demo catalog, customers,
  orders and so on; `ProductSeeder` uses Faker) and the `OnBoarding/`
  subfolder with eight runtime classes: `OnBoardingSeeder`, `SettingsSeeder`,
  `CategorySeeder`, `AttributeSeeder`, `ProductSchemaSeeder`, `ProductSeeder`,
  `OnBoardingCatalog` and `MediaImporter`.
- Only two app classes use the runtime ones: `StoreSetupService` (runs
  `OnBoardingSeeder`) and `SampleDataImporter` (runs the onboarding
  `ProductSeeder`). No developer seeder references an `OnBoarding` class, and
  no `OnBoarding` class references a developer seeder. The runtime classes
  depend only on `App\*` code and the framework `Seeder` base class, which ships
  in `vendor/libraries/framework`.
- `composer.json` maps `Kirki\Ecommerce\Database\Seeders\` under `autoload`.
  The build runs `composer dump-autoload --no-dev --optimize`, which skips
  `autoload-dev` entries.
- `bin/make-package.sh` lists `database` in `OPTIONAL_PATHS`. The folder holds
  only `migrations/` and `seeders/`.
- `AppServiceProvider::register()` binds `DatabaseSeederContract` to
  `new DatabaseSeeder()`. The framework's `db:seed` command resolves that
  contract. If the container cannot resolve it, the command catches the
  exception and falls back to the `*.php` files it finds in
  `database/seeders/`. If that folder does not exist, it runs nothing.
- The packaged entry file runs in production mode. `Application::is_dev_mode()`
  reports the mode.

## Goals / Non-Goals

**Goals:**

- One simple rule: everything under `database/seeders/` is developer-only and
  never ships.
- The runtime onboarding classes keep their behavior, their class names and
  their use of the framework `Seeder` queue (`call()` + `__invoke()`).

**Non-Goals:**

- Renaming the runtime classes or changing their behavior. For example,
  `OnBoardingSeeder` keeps its name even though it now lives in `app/`.
- Changing framework CLI commands. `migrate:fresh`, `make:*` and the others
  come from `vendor/libraries/framework`, which we do not edit by hand.
- Changing what the developer seeders seed.

## Decisions

### D1. The runtime classes move to `app/Setup/`, flat, with the same class names

The namespace becomes `Kirki\Ecommerce\App\Setup`. The existing `App\` PSR-4
entry already maps `app/`, so no new autoload entry is needed.

- *Why `Setup`:* the classes provision a store (store setup and sample data).
  `StoreSetupService` already uses that word.
- *Why flat, and why keep the names:* this keeps the change a move with only
  import updates. A flat folder does not cause a name clash, because the
  developer `SettingsSeeder`, `ProductSeeder` and the others live in a different
  namespace.
- *Alternative considered:* `app/Onboarding/`. Rejected because "Load sample
  data" runs after onboarding, from the Home checklist, so "onboarding" is too
  narrow.
- *Alternative considered:* renaming the classes to provisioners. Rejected
  for now. It is churn that this change does not need.

### D2. The seeders namespace moves to `autoload-dev`

Moving `"Kirki\\Ecommerce\\Database\\Seeders\\": "database/seeders/"` from
`autoload` to `autoload-dev` keeps the developer seeders loadable in any
`composer install` with dev packages (local, Docker, CI). The build's
`--no-dev` dump then leaves them out of the shipped classmap without any
`exclude-from-classmap` rules. `Database\Migrations\` stays in `autoload`,
because migrations run in production.

### D3. The build copies `database/migrations`, not `database`

In `OPTIONAL_PATHS`, `database` becomes `database/migrations`. This is an
allow-list. A file added later under `database/` does not ship unless someone
adds it on purpose.

- *Alternative considered:* copy `database` and then delete
  `database/seeders`. Rejected because it is a deny-list, and anything new
  under `database/` would ship by default.

### D4. `DatabaseSeederContract` is bound only in development mode

The binding becomes conditional on `$this->app->is_dev_mode()`. It lives in
`AppServiceProvider::boot()`, not `register()`. `Application::configure()`
registers the app providers before `bootstrap/app.php` calls `use_app_mode()`,
so the mode is reliable only from `boot()` onward. In production mode the
contract is unbound. `db:seed` then falls back to discovering files
in `database/seeders/`. That folder is not in the package, so the command
runs no seeder and writes nothing (see the spec scenario "Seeding command on a
packaged install").

- *Alternative considered:* guard with `class_exists(DatabaseSeeder::class)`.
  Rejected because a dev-mode check states the intent directly. Also, a
  production-mode run on a full checkout must not seed demo data either.
- The `use` statement for `DatabaseSeeder` stays. PHP does not autoload a class
  for an import alone.

## Risks / Trade-offs

- [A developer's local autoloader still points to the old `OnBoarding`
  paths] → Run `composer dump-autoload` after pulling. Docker and CI run
  `composer install`, which does this. The README and tasks call it out.
- [`db:seed` on a packaged install prints "Seeder run successfully" even
  though nothing ran] → The message comes from framework code. It is
  harmless, and the old behavior was a fatal error. We accept it.
- [The fallback in `db:seed` depends on the framework catching the container's
  exception for an unbound interface] → A task checks this against the
  vendored framework before the change is considered done.
- [Open changes or docs refer to `database/seeders/OnBoarding/`] → Only
  completed tasks in `merchant-home-setup-checklist` mention it. They are
  history and stay as they are.

## Migration Plan

1. Move the files and update the imports, then run `composer dump-autoload`.
2. Run the PHP integration suites that cover onboarding, the setup checklist
   and sample data.
3. Build the package and inspect the zip and `vendor/composer/autoload_*.php`.

Rollback: revert the commit. No data, option or schema changes.
