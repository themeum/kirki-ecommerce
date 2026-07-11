<?php

namespace Kirki\Ecommerce\Console\Commands;

use Kirki\Ecommerce\Console\CommandBase;
use Kirki\Ecommerce\Console\Synopsis;
use Kirki\Ecommerce\Supports\Facades\File;
use Kirki\Ecommerce\Supports\Str;

use function Kirki\Ecommerce\database_path;

class MakeSeederCommand extends CommandBase
{
    /**
     * The arguments
     *
     * @var array
     */
    protected $args;

    /**
     * The arguments
     *
     * @var array
     */
    protected $assoc;

    /**
     * The base path for the models
     *
     * @var string
     */
    protected $output_dir;

    /**
     * Initialize the command
     * 
     * @since 1.0.0
     */
    public function __construct()
    {
        parent::__construct();

        $this->output_dir = database_path('seeders');
    }

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

        if (File::missing($this->output_dir)) {
            File::make_dir($this->output_dir);
        }

        if ($this->is_database_seeder_missing()) {
            $this->create_database_seeder();
        }

        $this->create();
    }

    protected function is_database_seeder_missing()
    {
        return File::missing(database_path('seeders/DatabaseSeeder.php'));
    }


    protected function create_database_seeder()
    {
        $data = [
            'seeder' => 'DatabaseSeeder',
            'namespace' => 'Kirki\\Ecommerce\\Database\\Seeders',
            'output_file' => sprintf(
                '%s/%s.php',
                $this->output_dir,
                'DatabaseSeeder'
            ),
            'stub' => $this->get_stub(),
        ];

        $output_file = $data['output_file'];
        $namespace = $data['namespace'];
        $seeder = $data['seeder'];
        $content = $this->populate_stub($data);

        if (File::exists($output_file)) {
            \WP_CLI::error('Seeder file already exists.');
        }

        File::put($output_file, $content);

        \WP_CLI::success(sprintf('Seeder [%s] created successfully.', $namespace . '\\' . $seeder));
    }

    /**
     * Get data for seeder file
     *
     * @return array
     */
    protected function data()
    {
        return [
            'seeder' => Str::pascal($this->args[0]),
            'namespace' => 'Kirki\\Ecommerce\\Database\\Seeders',
            'output_file' => sprintf(
                '%s/%s.php',
                $this->output_dir,
                Str::pascal($this->args[0])
            ),
            'stub' => $this->get_stub(),
        ];
    }

    /**
     * Check if the command passed the validation
     *
     * @param array $args
     * @param array $assoc
     *
     * @return bool
     */
    protected function passed($args, $assoc)
    {
        return !empty($args[0]);
    }

    /**
     * Create a new model file
     *
     * @param string $model
     *
     * @return void
     */
    protected function create()
    {
        $data = $this->data();

        $output_file = $data['output_file'];
        $namespace = $data['namespace'];
        $seeder = $data['seeder'];
        $content = $this->populate_stub($data);

        if (File::exists($output_file)) {
            \WP_CLI::error('Seeder file already exists.');
        }

        File::put($output_file, $content);

        \WP_CLI::success(sprintf('Seeder [%s] created successfully.', $namespace . '\\' . $seeder));
    }

    /**
     * Get the stub content
     *
     * @return string
     */
    protected function get_stub()
    {
        $stub_path = $this->stub_path() . '/seeder.stub';

        if (File::missing($stub_path)) {
            \WP_CLI::error('Seeder stub not found: ' . $stub_path);
        }

        return File::get($stub_path);
    }

    /**
     * Populate the stub content
     *
     * @param string $model
     * @param string $stub
     *
     * @return string
     */
    protected function populate_stub($data)
    {
        return Str::replace(
            ['{{class_name}}', '{{namespace}}'],
            [$data['seeder'], $data['namespace']],
            $data['stub']
        );
    }

    /**
     * Prepare the command's synopsis and other metadata
     *
     * @return void
     */
    protected function prepare()
    {
        $this->summary('Create a new model class')
            ->description("## EXAMPLES \n\n wp kirki make:seeder DatabaseSeeder")
            ->synopsis(
                Synopsis::type('positional')
                    ->name('seeder')
                    ->description('The seeder name')
            );
    }
}
