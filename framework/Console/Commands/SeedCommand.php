<?php

namespace Kirki\Ecommerce\Console\Commands;

use Kirki\Ecommerce\Console\CommandBase;
use Kirki\Ecommerce\Console\Synopsis;
use Kirki\Ecommerce\Database\Seeder;
use Kirki\Ecommerce\Database\Seeders\DatabaseSeeder;
use Kirki\Ecommerce\Supports\Facades\DB;
use Kirki\Ecommerce\Supports\Facades\Log;
use Kirki\Ecommerce\Supports\Facades\Schema;
use Kirki\Ecommerce\Supports\Str;
use Exception;
use Throwable;

use function Kirki\Ecommerce\app;
use function Kirki\Ecommerce\database_path;

class SeedCommand extends CommandBase
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

        $this->seed();
    }

    /**
     * Discover the seeders
     *
     * @return array
     */
    protected function discover()
    {
        $seeders = [];

        $seeders_files = glob(database_path('seeders/*.php'));

        if (empty($seeders_files)) {
            return $seeders;
        }

        foreach ($seeders_files as $file) {
            $classname = $this->classname($this->filename($file));

            if ($this->exists($classname)) {
                $seeders[] = $classname;
            }
        }

        return $seeders;
    }

    /**
     * Get the seeders
     *
     * @return array
     */
    protected function seeders()
    {
        if (!empty($this->assoc['class'])) {
            return $this->seeder_classes($this->assoc['class']);
        }

        return $this->discover();
    }

    /**
     * Get the seeder classes
     *
     * @param string $class
     * @return array
     */
    protected function seeder_classes($class)
    {
        $classes = Str::split(',', $class);

        foreach ($classes as $class) {
            $classname = $this->classname($class);

            if ($this->exists($classname)) {
                $seeders[] = $classname;
            }
        }

        return $seeders;
    }

    /**
     * Get the filename of the seeder
     *
     * @param string $path
     * @return string
     */
    protected function filename($path)
    {
        return basename($path, '.php');
    }

    /**
     * Get the classname of the seeder
     *
     * @param string $filename
     * @return string
     */
    protected function classname($filename)
    {
        $namespace = 'Kirki\\Ecommerce\\Database\\Seeders\\';

        return $namespace . Str::pascal($filename);
    }

    /**
     * Check if the seeder exists
     *
     * @param string $class
     * @return bool
     */
    protected function exists($class)
    {
        return class_exists($class);
    }

    /**
     * Seed the database
     *
     * @return void
     */
    protected function seed()
    {
        $seeders = $this->seeders();

        DB::begin_transaction();

        try {
            Schema::disabled_checking_foreign_key_constraints();

            if (!class_exists(DatabaseSeeder::class)) {
                $instance = app()->make(Seeder::class);
                $instance->call($seeders);
                $instance();
            } else {
                $instance = app()->make(DatabaseSeeder::class);
                $instance->run();
                $instance();
            }
        } catch (Exception $exception) {
            DB::rollback();
            Log::error($exception->getMessage());
        } finally {
            Schema::enabled_checking_foreign_key_constraints();
        }

        DB::commit();
        \WP_CLI::success('Seeder run successfully');
    }

    /**
     * Prepare the command synopsis and metadata
     *
     * @return void
     */
    protected function prepare()
    {
        $this->summary('Seed the database')
            ->description("## EXAMPLES \n\n wp kirki db:seed")
            ->synopsis(
                Synopsis::type('assoc')
                    ->name('class')
                    ->description('The seeder class name')
                    ->optional()
            );
    }
}
