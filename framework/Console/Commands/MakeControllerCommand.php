<?php

namespace Kirki\Ecommerce\Console\Commands;

use Kirki\Ecommerce\Console\CommandBase;
use Kirki\Ecommerce\Console\Synopsis;
use Kirki\Ecommerce\Supports\Facades\File;
use Kirki\Ecommerce\Supports\Str;

use function Kirki\Ecommerce\app_path;

class MakeControllerCommand extends CommandBase
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
     * The base path for the controller
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

        $this->output_dir = app_path('Http/Controllers');
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

        $content = $this->populate_stub($data);

        $output_file = $data['output_file'];

        if (File::exists($output_file)) {
            \WP_CLI::error('Controller file already exists.');
        }

        File::put($output_file, $content);

        $namespace = $data['namespace'];
        $controller = $data['controller'];

        \WP_CLI::success(sprintf('Controller [%s\%s] created successfully.', $namespace, $controller));
    }

    /**
     * Get the data for the controller
     *
     * @return array
     */
    protected function data()
    {
        $controller = Str::pascal($this->args[0]);

        $data = [
            'stub' => $this->get_stub(),
            'controller' => $controller,
            'namespace' => 'Kirki\\Ecommerce\\App\\Http\\Controllers',
            'request_type_hint' => 'Request',
            'output_file' => sprintf(
                '%s/%s.php',
                $this->output_dir,
                $controller
            ),
        ];

        if ($this->assoc['api']) {
            $data['namespace'] = 'Kirki\\Ecommerce\\App\\Http\\Controllers\\Api';
            $data['output_file'] = sprintf(
                '%s/API/%s.php',
                $this->output_dir,
                $controller
            );
        }

        return $data;
    }

    /**
     * Get the stub content
     *
     * @return string
     */
    protected function get_stub()
    {
        $is_resource = $this->assoc['resource'] ?? false;

        $stub_path = $is_resource
            ? $this->stub_path() . '/controllers/resource-controller.stub'
            : $this->stub_path() . '/controllers/controller.stub';

        if (File::missing($stub_path)) {
            \WP_CLI::error('Controller stub not found: ' . $stub_path);
        }

        return File::get($stub_path);
    }

    /**
     * Populate the stub content
     *
     * @return string
     */
    protected function populate_stub($data)
    {
        $namespace = $data['namespace'];
        $type_hint = $data['request_type_hint'];
        $controller = $data['controller'];
        $stub = $data['stub'];

        return Str::replace(
            ['{{class_name}}', '{{namespace}}', '{{request_type_hint}}'],
            [$controller, $namespace, $type_hint],
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
        $this->summary('Create a new controller class')
            ->description("## EXAMPLES \n\n wp kirki make:controller UserController")
            ->synopsis(
                Synopsis::type('positional')
                    ->name('name')
                    ->description('The controller name')
            )->synopsis(
                Synopsis::type('flag')
                    ->name('api')
                    ->description('Create an API controller')
                    ->optional()
            )->synopsis(
                Synopsis::type('flag')
                    ->name('resource')
                    ->description('Create a resource controller')
                    ->optional()
            );
    }
}
