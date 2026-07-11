<?php

namespace Kirki\Ecommerce\Console\Commands;

use Kirki\Ecommerce\Console\CommandBase;
use Kirki\Ecommerce\Console\Synopsis;
use Kirki\Ecommerce\Supports\Facades\File;
use Kirki\Ecommerce\Supports\Str;

use function Kirki\Ecommerce\app_path;

class MakeRequestCommand extends CommandBase
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
     * The base path for the request
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

        $this->output_dir = app_path('Http/Requests');
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

        $request_class = $data['request_class'];
        $namespace = $data['namespace'];
        $output_file = $data['output_file'];

        $content = $this->populate_stub($data);

        if (File::exists($output_file)) {
            \WP_CLI::error('Request file already exists.');
        }

        File::put($output_file, $content);

        \WP_CLI::success(sprintf('Request [%s] created successfully.', $namespace . "\\" . $request_class));
    }

    /**
     * Make the data for the request
     *
     * @return array
     */
    protected function data()
    {
        $request_class = Str::pascal($this->args[0]);

        $data = [
            'stub' => $this->get_stub(),
            'namespace' => 'Kirki\\Ecommerce\\App\\Http\\Requests',
            'request_class' => $request_class,
            'output_file' => sprintf('%s/%s.php', $this->output_dir, $request_class),
        ];

        $folder = $this->assoc['folder'] ?? null;

        if ($folder) {
            $data['namespace'] = sprintf('%s\%s', $data['namespace'], Str::pascal($folder));
            $data['output_file'] = sprintf(
                '%s/%s/%s.php',
                $this->output_dir,
                $folder,
                $request_class
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
        $stub_path = $this->stub_path() . '/request.stub';

        if (File::missing($stub_path)) {
            \WP_CLI::error('Request stub not found: ' . $stub_path);
        }

        return File::get($stub_path);
    }

    /**
     * Populate the stub content
     *
     * @param string $request
     * @param string $stub
     *
     * @return string
     */
    protected function populate_stub($data)
    {
        $stub = $data['stub'];
        $request_class = $data['request_class'];
        $namespace = $data['namespace'];

        return Str::replace(
            ['{{class_name}}', '{{namespace}}'],
            [$request_class, $namespace],
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
        $this->summary('Create a new request class')
            ->description("## EXAMPLES \n\n wp kirki make:request UserRequest")
            ->synopsis(
                Synopsis::type('positional')
                    ->name('name')
                    ->description('The request name')
            )->synopsis(
                Synopsis::type('assoc')
                    ->name('folder')
                    ->description('The request folder')
                    ->optional()
            );
    }
}
