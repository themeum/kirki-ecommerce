<?php

namespace Kirki\Ecommerce\Console\Commands;

use Kirki\Ecommerce\Console\CommandBase;
use Kirki\Ecommerce\Console\Synopsis;
use Kirki\Ecommerce\Supports\Facades\File;
use Kirki\Ecommerce\Supports\Str;

use function Kirki\Ecommerce\app_path;

class MakeProviderCommand extends CommandBase
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

        $this->output_dir = app_path('Providers');
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

        $provider_class = $data['provider_class'];
        $namespace = $data['namespace'];
        $output_file = $data['output_file'];

        $content = $this->populate_stub($data);

        if (File::exists($output_file)) {
            \WP_CLI::error('Request file already exists.');
        }

        File::put($output_file, $content);

        \WP_CLI::success(sprintf('Request [%s] created successfully.', $namespace . "\\" . $provider_class));
    }

    /**
     * Make the data for the request
     *
     * @return array
     */
    protected function data()
    {
        $provider_class = Str::pascal($this->args[0]);

        $data = [
            'stub' => $this->get_stub(),
            'namespace' => 'Kirki\\Ecommerce\\App\\Providers',
            'provider_class' => $provider_class,
            'output_file' => sprintf('%s/%s.php', $this->output_dir, $provider_class),
        ];

        $folder = $this->assoc['folder'] ?? null;

        if ($folder) {
            $data['namespace'] = sprintf('%s\%s', $data['namespace'], Str::pascal($folder));
            $data['output_file'] = sprintf(
                '%s/%s/%s.php',
                $this->output_dir,
                $folder,
                $provider_class
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
        $stub_path = $this->stub_path() . '/provider.stub';

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
        $provider_class = $data['provider_class'];
        $namespace = $data['namespace'];

        return Str::replace(
            ['{{class_name}}', '{{namespace}}'],
            [$provider_class, $namespace],
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
        $this->summary('Create a new provider class')
            ->description("## EXAMPLES \n\n wp kirki make:provider ExampleServiceProvider")
            ->synopsis(
                Synopsis::type('positional')
                    ->name('name')
                    ->description('The provider name')
            );
    }
}
