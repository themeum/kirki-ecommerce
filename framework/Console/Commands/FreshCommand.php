<?php

namespace Kirki\Ecommerce\Console\Commands;

use Kirki\Ecommerce\Console\CommandBase;
use Kirki\Ecommerce\Console\Synopsis;

use function Kirki\Ecommerce\migrator;

class FreshCommand extends CommandBase
{
    /**
     * The sequential arguments
     *
     * @var array
     */
    protected $args;

    /**
     * The assoc arguments
     *
     * @var array
     */
    protected $assoc;

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
        $this->args = $args;
        $this->assoc = $assoc;

        $this->fresh();
        $this->run_migrations();

        if ($this->need_seeding()) {
            $this->run_seeder();
        }
    }

    /**
     * Fresh the database
     *
     * @return void
     */
    protected function fresh()
    {
        migrator()->fresh();
    }

    /**
     * Run the migrations
     *
     * @return void
     */
    protected function run_migrations()
    {
        $command = new MigrateCommand();
        $command->run([], []);
    }

    /**
     * Run the seeder
     *
     * @return void
     */
    protected function run_seeder()
    {
        $command = new SeedCommand();
        $args = [];
        $assoc = ['class' => $this->assoc['class'] ?? null];
        $command->run($args, $assoc);
    }

    /**
     * Check if the database needs to be seeded
     *
     * @return bool
     */
    protected function need_seeding()
    {
        return !empty($this->assoc['seed']);
    }

    /**
     * Prepare the command synopsis and metadata
     *
     * @return void
     */
    protected function prepare()
    {
        $this->summary('Drop all the tables and re-run all the migrations')
            ->description("## EXAMPLES \n\n wp kirki db:fresh")
            ->synopsis(
                Synopsis::type('assoc')
                    ->name('class')
                    ->description('The seeder class name')
                    ->optional()
            )
            ->synopsis(
                Synopsis::type('flag')
                    ->name('seed')
                    ->description('Seed the database')
                    ->optional()
            );
    }
}
