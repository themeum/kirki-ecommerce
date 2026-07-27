<?php

namespace Kirki\Ecommerce\Console\Commands;

use Kirki\Ecommerce\Console\CommandBase;
use Kirki\Ecommerce\Supports\Facades\File;

use function Kirki\Ecommerce\base_path;

/**
 * Generate the OpenAPI specification JSON from annotation sources.
 *
 * @since 1.0.0
 */
class GenerateDocsCommand extends CommandBase
{
    /**
     * Run the documentation generator.
     *
     * @param array $args Positional arguments.
     * @param array $assoc Associative options.
     *
     * @return void
     * @since 1.0.0
     */
    public function run($args, $assoc)
    {
        $script = base_path('bin/generate-openapi.php');

        if (!File::exists($script)) {
            \WP_CLI::error('Generator script not found: ' . $script);
        }

        \WP_CLI::line('Running OpenAPI generator...');

        passthru('php ' . escapeshellarg($script), $exit_code);

        if ((int) $exit_code !== 0) {
            \WP_CLI::error('OpenAPI generation failed.');
        }

        \WP_CLI::success('OpenAPI specification generated successfully.');
    }

    /**
     * Prepare command metadata.
     *
     * @return void
     * @since 1.0.0
     */
    protected function prepare()
    {
        $this->summary('Generate the OpenAPI JSON specification')
            ->description("## EXAMPLES \n\n wp kirki docs:generate");
    }
}
