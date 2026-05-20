<?php

namespace Kirki\Ecommerce\Console\Commands;

use Kirki\Ecommerce\Console\CommandBase;
use Kirki\Ecommerce\Console\Synopsis;
use Kirki\Ecommerce\Supports\Facades\File;
use Kirki\Ecommerce\Supports\Str;

use function Kirki\Ecommerce\app_path;

class MakeModelCommand extends CommandBase
{
    /**
     * The arguments for the command
     *
     * @var array
     */
    protected $args;

    /**
     * The options for the command
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

        $this->output_dir = app_path('Models');
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

    protected function data()
    {
        return [
            'model' => Str::pascal($this->args[0]),
            'namespace' => 'Ecommerce\App\Models',
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

        $stub = $data['stub'];
        $model = $data['model'];
        $output_file = $data['output_file'];

        $content = $this->populate_stub($model, $stub);

        if (file_exists($output_file)) {
            \WP_CLI::error('Model file already exists.');
        }

        file_put_contents($output_file, $content);

        \WP_CLI::success(sprintf('Model App\Models\[%s] created successfully.', $model));
    }

    /**
     * Get the stub content
     *
     * @return string
     */
    protected function get_stub()
    {
        $stub_path = $this->stub_path() . '/model.stub';

        if (File::missing($stub_path)) {
            \WP_CLI::error('Model stub not found: ' . $stub_path);
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
    protected function populate_stub($model, $stub)
    {
        return Str::replace(
            ['{{class_name}}'],
            $model,
            $stub
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
            ->description("## EXAMPLES \n\n wp kirki make:model User")
            ->synopsis(
                Synopsis::type('positional')
                    ->name('model')
                    ->description('The model name')
            );
    }
}
