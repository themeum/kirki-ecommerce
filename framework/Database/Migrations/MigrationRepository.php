<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\Supports\Facades\Option;

use function Kirki\Ecommerce\app;

class MigrationRepository
{
    /**
     * Get the previous migrations.
     *
     * @return array
     */
    public function get_previous_migrations()
    {
        return Option::get(OptionKeys::MIGRATIONS, []);
    }

    /**
     * Update the migrations.
     *
     * @param array $migrations
     * @return void
     */
    public function update_migrations(array $migrations)
    {
        Option::set(OptionKeys::MIGRATIONS, $migrations);
    }

    /**
     * Remove the migrations.
     *
     * @return void
     */
    public function remove_migrations()
    {
        Option::delete(OptionKeys::MIGRATIONS);
    }

    /**
     * Get the registered migrations.
     *
     * @return array
     */
    public function get_registered_migrations()
    {
        return app()->tagged('app.migrations');
    }

    /**
     * Check if the rollback is enabled.
     *
     * @return bool
     */
    public function is_rollback_enabled()
    {
        return (bool) intval(Option::get(OptionKeys::ERASE_DATA_UPON_UNINSTALL, 0));
    }
}
