<?php

namespace Kirki\Ecommerce\Console\Commands;

use Kirki\Ecommerce\Console\CommandBase;
use Kirki\Ecommerce\Console\Synopsis;
use Kirki\Ecommerce\Supports\Facades\File;
use Kirki\Ecommerce\Supports\Str;

use function Kirki\Ecommerce\app_path;

class MakeClassCommand extends CommandBase
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

        $this->output_dir = app_path();
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

        $this->create();
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
            'namespace' => $this->namespace(),
            'output_file' => sprintf(
                '%s/%s.php',
                $this->output_dir(),
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

        if (File::missing($output_file)) {
            File::make_dir($output_file);
        }

        if (File::exists($output_file)) {
            \WP_CLI::error('Seeder file already exists.');
        }

        File::put($output_file, $content);

        \WP_CLI::success(sprintf('Seeder [%s] created successfully.', $namespace . '\\' . $seeder));
    }

    /**
     * Get the output directory
     *
     * @return string
     */
    protected function output_dir()
    {
        return $this->assoc['folder']
            ? $this->output_dir . '/' . $this->assoc['folder']
            : $this->output_dir;
    }

    protected function namespace()
    {
        if ($this->assoc['folder']) {
            $folder = Str::split('/', $this->assoc['folder']);
            $folder = array_map(fn($folder) => Str::pascal($folder), $folder);
            return 'Kirki\\Ecommerce\\App\\' . implode('\\', $folder);
        }

        return 'Kirki\\Ecommerce\\App';
    }

    /**
     * Get the stub content
     *
     * @return string
     */
    protected function get_stub()
    {
        $stub_path = $this->stub_path() . '/class.stub';

        if (File::missing($stub_path)) {
            \WP_CLI::error('Class stub not found: ' . $stub_path);
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
            ->description("## EXAMPLES \n\n wp kirki make:class ExampleClass")
            ->synopsis(
                Synopsis::type('positional')
                    ->name('classname')
                    ->description('The class name')
            )->synopsis(
                Synopsis::type('assoc')
                    ->name('folder')
                    ->description('The folder name')
                    ->optional()
            );
    }
}
