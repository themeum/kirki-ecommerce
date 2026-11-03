<?php

namespace Kirki\Ecommerce\Tests\Unit\Setup;

use Kirki\Ecommerce\App\Setup\Presets\PresetRepository;

/**
 * Reads the preset data from the repository source folder instead of the remote location.
 *
 * The unit suite has no WordPress HTTP API, and these tests guard the data,
 * not the request. The integration suite covers the request.
 */
class SourcePresetRepository extends PresetRepository
{
    public function __construct()
    {
        parent::__construct('https://presets.test');
    }

    protected function fetch(string $path, int $version, &$status = null)
    {
        $file = dirname(__DIR__, 3) . '/resources/data/preconfigured-data/' . $path;
        $status = is_file($file) ? 200 : 404;

        return $status === 200 ? json_decode(file_get_contents($file), true) : null;
    }
}
