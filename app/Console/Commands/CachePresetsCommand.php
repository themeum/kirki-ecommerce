<?php

namespace Kirki\Ecommerce\App\Console\Commands;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Setup\Presets\PresetRepository;
use Kirki\Ecommerce\Framework\Console\CommandBase;
use Kirki\Ecommerce\Framework\Console\Synopsis;
use Kirki\Ecommerce\Framework\Supports\Facades\Cache;
use Kirki\Ecommerce\Framework\Supports\Facades\File;

use function Kirki\Ecommerce\Framework\resource_path;

/**
 * Keeps the local preset data and sample products files in the cache, so a development site does not read them from the preset URL.
 *
 * Images are not kept. They still download from the preset URL.
 *
 * @since 1.0.0
 */
class CachePresetsCommand extends CommandBase
{
    /**
     * Run the command.
     *
     * @since 1.0.0
     *
     * @param mixed $args  The positional arguments.
     * @param mixed $assoc The associative arguments.
     * @return void
     */
    public function run($args, $assoc)
    {
        $source = resource_path('data/preconfigured-data');

        if (!File::exists($source)) {
            $this->cli_error(sprintf('The preset source folder %s does not exist. Run this command in a repository checkout.', $source));
            return;
        }

        if (!empty($assoc['forget'])) {
            $this->forget($source);
            return;
        }

        $ttl = filter_var($assoc['ttl'] ?? HOUR_IN_SECONDS, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);

        if ($ttl === false) {
            $this->cli_error('--ttl must be a whole number of seconds above 0.');
            return;
        }

        $this->cache($source, $ttl);
    }

    /**
     * Keep the local presets file and every valid local products file.
     *
     * @since 1.0.0
     *
     * @param string $source The preset source folder.
     * @param int    $ttl    Seconds to keep the data.
     * @return void
     */
    protected function cache(string $source, int $ttl)
    {
        $base_url = constant('KIRKI_ECOMMERCE_PRESETS_URL');
        $presets = $this->read($source . '/presets.json');

        if (($presets['version'] ?? null) !== PresetRepository::PRESETS_VERSION) {
            $this->cli_error(sprintf('presets.json must have version %d. Nothing was cached.', PresetRepository::PRESETS_VERSION));
            return;
        }

        $products_files = [];

        foreach ($this->get_products_paths($source) as $set => $path) {
            $products = $this->read($path);

            if (($products['version'] ?? null) !== PresetRepository::PRODUCTS_VERSION || !is_array($products['products'] ?? null)) {
                $this->cli_warning(sprintf('%s/products.json was skipped: it needs version %d and a products list.', $set, PresetRepository::PRODUCTS_VERSION));
                continue;
            }

            $products_files[$set] = $products;
        }

        Cache::put(PresetRepository::cache_key($base_url), $presets, $ttl);

        foreach ($products_files as $set => $products) {
            Cache::put(PresetRepository::products_cache_key($base_url, $set), $products, $ttl);
        }

        $this->cli_success(sprintf('Cached presets.json and %d products files for %d seconds. Images still download from %s.', count($products_files), $ttl, $base_url));
    }

    /**
     * Remove the kept presets file and the kept products file of every local set.
     *
     * @since 1.0.0
     *
     * @param string $source The preset source folder.
     * @return void
     */
    protected function forget(string $source)
    {
        $base_url = constant('KIRKI_ECOMMERCE_PRESETS_URL');

        Cache::forget(PresetRepository::cache_key($base_url));

        foreach (array_keys($this->get_products_paths($source)) as $set) {
            Cache::forget(PresetRepository::products_cache_key($base_url, $set));
        }

        $this->cli_success('The cached preset data was removed. The next read uses the preset URL.');
    }

    /**
     * Get the local products files, keyed by their set.
     *
     * @since 1.0.0
     *
     * @param string $source The preset source folder.
     * @return array<string, string> File paths keyed by set name.
     */
    protected function get_products_paths(string $source)
    {
        $paths = [];

        foreach (File::glob($source . '/*/products.json') ?: [] as $path) {
            $paths[basename(dirname($path))] = $path;
        }

        return $paths;
    }

    /**
     * Read a JSON data file.
     *
     * @since 1.0.0
     *
     * @param string $path File path.
     * @return array<string, mixed>|null Null when the file is not a JSON object.
     */
    protected function read(string $path)
    {
        $data = File::exists($path) ? File::json($path) : null;

        return is_array($data) ? $data : null;
    }

    /**
     * Prepare the command summary, description and synopsis.
     *
     * @since 1.0.0
     *
     * @return void
     */
    protected function prepare()
    {
        $this->summary('Cache the local preset data and sample products files')
            ->description("## EXAMPLES \n\n wp kirki presets:cache \n\n wp kirki presets:cache --ttl=86400 \n\n wp kirki presets:cache --forget")
            ->synopsis(Synopsis::type('assoc')->name('ttl')->description('Seconds to keep the data')->default((string) HOUR_IN_SECONDS)->optional())
            ->synopsis(Synopsis::type('flag')->name('forget')->description('Remove the cached data instead')->optional());
    }
}
