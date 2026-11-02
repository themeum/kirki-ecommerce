## Why

`database/seeders/` holds two kinds of code: developer seeders (demo data,
Faker-based) and the onboarding classes in `database/seeders/OnBoarding/` that
store setup and "Load sample data" run in production. The package build copies
the whole `database/` folder and Composer autoloads the whole seeders namespace,
so all 19 developer seeders ship in the plugin zip and are registered in the
production classmap. `ProductSeeder` needs Faker, which is a `require-dev`
package and is not in the zip, and `AppServiceProvider` binds the developer
`DatabaseSeeder` on every request. Developer-only code must not ship to
WordPress.org.

## What Changes

- Move the eight runtime classes from `database/seeders/OnBoarding/` to
  `app/Setup/` (namespace `Kirki\Ecommerce\App\Setup`). Class names and
  behavior do not change. `StoreSetupService` and `SampleDataImporter` import
  them from the new namespace.
- Move the `Kirki\Ecommerce\Database\Seeders\` PSR-4 entry in `composer.json`
  from `autoload` to `autoload-dev`. After this, `database/seeders/` holds
  developer seeders only.
- `bin/make-package.sh` copies `database/migrations` instead of the whole
  `database` folder, so no seeder file ships.
- `AppServiceProvider` binds `DatabaseSeederContract` to `DatabaseSeeder` only
  in development mode.
- The README says that `db:seed` and `migrate:fresh --seed` are development
  tools.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `plugin-packaging`: add a requirement that the package contains no
  developer seeders, neither as files nor in the autoload maps, while store
  setup and sample data still work from the package.

## Impact

- **Moved code:** `database/seeders/OnBoarding/*.php` (8 files) →
  `app/Setup/*.php`.
- **Callers:** `app/Services/StoreSetupService.php`,
  `app/Services/SampleDataImporter.php`.
- **Wiring:** `app/Providers/AppServiceProvider.php`, `composer.json`
  (`autoload` / `autoload-dev`), `bin/make-package.sh`.
- **Docs:** `README.md`.
- **Developers:** run `composer dump-autoload` after pulling. Developer
  seeding (`wpcli kirki db:seed`) works as before in a dev install.
- **Production sites:** no change to the behavior of store setup or sample
  data. In a packaged install, `db:seed` finds no seeders and does nothing.
  Before this change, it failed on the missing Faker package.
- **No data or API change.**
