<?php

namespace Kirki\Ecommerce\Console\Commands;

use Kirki\Ecommerce\Console\CommandBase;

use function Kirki\Ecommerce\migrator;

class MigrateCommand extends CommandBase
{
    /**
     * Run the command
     *
     * @param array $args
     * @param array $assoc
     *
     * @return void
     */
    public function run($args, $assoc)
    {
        migrator()->run();
        \WP_CLI::success('Migrations run successfully.');
    }
}
