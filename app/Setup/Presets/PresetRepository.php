<?php

namespace Kirki\Ecommerce\App\Setup\Presets;

use Kirki\Ecommerce\App\Supports\RemoteUrl;
use Kirki\Ecommerce\Framework\Http\Client\Response as ClientResponse;
use Kirki\Ecommerce\Framework\Http\Response;
use Kirki\Ecommerce\Framework\Supports\Facades\Cache;
use Kirki\Ecommerce\Framework\Supports\Facades\Http;
use Kirki\Ecommerce\Framework\Supports\Facades\Log;

defined('ABSPATH') || exit;

/**
 * Reads the preset data and the sample products from the remote preset location.
 *
 * The base URL comes from the `KIRKI_ECOMMERCE_PRESETS_URL` constant, which the
 * plugin file defines. wp-config.php can override it.
 *
 * @since 1.0.0
 */
class PresetRepository
{
    const PRESETS_VERSION = 2;

    const PRODUCTS_VERSION = 1;

    const OTHER_PRODUCTS = 'other';

    /**
     * Prefix of the cache key that keeps a read presets file, one key per base URL.
     */
    const CACHE_KEY = 'store_presets_';

    /** @var string */
    protected $base_url;

    /** @var array<string, mixed>|null */
    protected $data = null;

    /**
     * Create the repository for a preset location.
     *
     * @since 1.0.0
     *
     * @param string|null $base_url Base URL of the preset data; the configured location when null.
     */
    public function __construct($base_url = null)
    {
        $this->base_url = rtrim($base_url ?? constant('KIRKI_ECOMMERCE_PRESETS_URL'), '/');
    }

    /**
     * Get the presets that apply to every store.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed>
     */
    public function get_common()
    {
        return $this->load()['common'] ?? [];
    }

    /**
     * Get the presets for an industry.
     *
     * @since 1.0.0
     *
     * @param string $slug Industry slug.
     * @return array<string, mixed> Empty for an industry with no entry.
     */
    public function get_industry(string $slug)
    {
        return $this->load()['industries'][$slug] ?? [];
    }

    /**
     * Get the presets for a country.
     *
     * @since 1.0.0
     *
     * @param string $code ISO 3166-1 alpha-2 country code.
     * @return array<string, mixed> Empty for a country with no entry.
     */
    public function get_country(string $code)
    {
        return $this->load()['countries'][strtoupper($code)] ?? [];
    }

    /**
     * Get the member country codes of a trade bloc.
     *
     * @since 1.0.0
     *
     * @param string $code Bloc code, such as "EU".
     * @return string[] Empty for an unknown bloc.
     */
    public function get_bloc(string $code)
    {
        return $this->load()['blocs'][$code] ?? [];
    }

    /**
     * Get every country entry, keyed by country code.
     *
     * @since 1.0.0
     *
     * @return array<string, array<string, mixed>>
     */
    public function get_countries()
    {
        return $this->load()['countries'] ?? [];
    }

    /**
     * Get every industry entry, keyed by industry slug.
     *
     * @since 1.0.0
     *
     * @return array<string, array<string, mixed>>
     */
    public function get_industries()
    {
        return $this->load()['industries'] ?? [];
    }

    /**
     * Get the sample data of an industry: its categories, tags and products.
     *
     * The "other" set is used for "other", for an empty industry, and for an
     * industry that has no products file. S3 answers 403 instead of 404 for a
     * missing file when the bucket only allows reads, so both count as missing.
     * Any other failure is not a reason to fall back.
     *
     * The sample data import needs the presets next, so when they are neither
     * loaded nor cached, the presets file is requested together with the
     * products file.
     *
     * @since 1.0.0
     *
     * @param string $industry Industry slug.
     * @return array<string, mixed>|null The products file with the `set` it was read from, or null when it cannot be read.
     */
    public function get_products(string $industry)
    {
        $set = in_array($industry, ['', static::OTHER_PRODUCTS], true) ? static::OTHER_PRODUCTS : sanitize_title($industry);
        $path = $set . '/products.json';

        if ($this->data === null && ($this->data = $this->cached_presets()) === null) {
            $results = $this->fetch_many([$path => static::PRODUCTS_VERSION, 'presets.json' => static::PRESETS_VERSION]);
            $this->data = $this->keep_presets($results['presets.json'][0]);
            [$data, $status] = $results[$path];
        } else {
            $data = $this->fetch($path, static::PRODUCTS_VERSION, $status);
        }

        if ($data === null && $set !== static::OTHER_PRODUCTS && in_array($status, [Response::FORBIDDEN, Response::NOT_FOUND], true)) {
            $set = static::OTHER_PRODUCTS;
            $data = $this->fetch($set . '/products.json', static::PRODUCTS_VERSION, $status);
        }

        if ($data === null || !is_array($data['products'] ?? null)) {
            return null;
        }

        return array_merge($data, ['set' => $set]);
    }

    /**
     * Get the URL of a sample product image.
     *
     * @since 1.0.0
     *
     * @param string $set      The product set the image belongs to.
     * @param string $filename The image filename.
     * @return string
     */
    public function get_image_url(string $set, string $filename)
    {
        return sprintf('%s/%s/images/%s', $this->base_url, rawurlencode($set), rawurlencode($filename));
    }

    /**
     * Get the base URL of the preset location, without a trailing slash.
     *
     * @since 1.0.0
     *
     * @return string
     */
    public function get_base_url()
    {
        return $this->base_url;
    }

    /**
     * Get the cache key that keeps the presets read from a base URL.
     *
     * @since 1.0.0
     *
     * @param string $base_url Base URL of the preset data.
     * @return string
     */
    public static function cache_key(string $base_url)
    {
        return static::CACHE_KEY . md5(rtrim($base_url, '/'));
    }

    /**
     * Read the presets once; a failed read yields no presets.
     *
     * A read from an earlier request in the last hour is reused.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed>
     */
    protected function load()
    {
        if ($this->data === null) {
            $this->data = $this->cached_presets() ?? $this->keep_presets($this->fetch('presets.json', static::PRESETS_VERSION));
        }

        return $this->data;
    }

    /**
     * Cache a successful presets read; a failed read is not cached.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed>|null $data The decoded presets file, or null when it could not be read.
     * @return array<string, mixed> The presets, empty after a failed read.
     */
    protected function keep_presets($data)
    {
        if ($data === null) {
            return [];
        }

        $this->cache_presets($data);

        return $data;
    }

    /**
     * Get the presets that an earlier request read from this base URL.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed>|null Null when nothing is cached.
     */
    protected function cached_presets()
    {
        $data = Cache::get(static::cache_key($this->base_url));

        return is_array($data) ? $data : null;
    }

    /**
     * Keep the presets for one hour.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $data The decoded presets file.
     * @return void
     */
    protected function cache_presets(array $data)
    {
        Cache::put(static::cache_key($this->base_url), $data, HOUR_IN_SECONDS);
    }

    /**
     * Request one data file and check its version.
     *
     * @since 1.0.0
     *
     * @param string   $path    Path below the base URL.
     * @param int      $version The data version the plugin supports.
     * @param int|null $status  Receives the response status; 0 when no response arrived.
     * @return array<string, mixed>|null The decoded file, or null when it cannot be used.
     */
    protected function fetch(string $path, int $version, &$status = null)
    {
        $status = 0;
        $url = $this->url_for($path);

        if ($url === null) {
            return null;
        }

        return $this->decode(Http::timeout(10)->get($url), $url, $version, $status);
    }

    /**
     * Request several data files at the same time and check their versions.
     *
     * @since 1.0.0
     *
     * @param array<string, int> $paths Data versions keyed by path below the base URL.
     * @return array<string, array{0: array<string, mixed>|null, 1: int}> The decoded file (or null) and the response status, keyed by path.
     */
    protected function fetch_many(array $paths)
    {
        $urls = [];

        foreach (array_keys($paths) as $path) {
            $url = $this->url_for($path);

            if ($url !== null) {
                $urls[$path] = $url;
            }
        }

        $responses = empty($urls) ? [] : Http::pool(function ($pool) use ($urls) {
            foreach ($urls as $path => $url) {
                $pool->as($path)->timeout(10)->get($url);
            }
        });

        $results = [];

        foreach ($paths as $path => $version) {
            $status = 0;
            $data = isset($responses[$path]) ? $this->decode($responses[$path], $urls[$path], $version, $status) : null;
            $results[$path] = [$data, $status];
        }

        return $results;
    }

    /**
     * Build the URL of a data file, or log and give null when it is not trusted.
     *
     * @since 1.0.0
     *
     * @param string $path Path below the base URL.
     * @return string|null
     */
    protected function url_for(string $path)
    {
        $url = $this->base_url . '/' . $path;

        if (!RemoteUrl::is_trusted($url, $this->base_url)) {
            Log::warning(sprintf('Store presets were not requested from the untrusted URL %s', $url));

            return null;
        }

        return $url;
    }

    /**
     * Decode a data file response and check its version.
     *
     * @since 1.0.0
     *
     * @param ClientResponse $response The response.
     * @param string         $url      The requested URL, for the log.
     * @param int            $version  The data version the plugin supports.
     * @param int|null       $status   Receives the response status.
     * @return array<string, mixed>|null The decoded file, or null when it cannot be used.
     */
    protected function decode(ClientResponse $response, string $url, int $version, &$status = null)
    {
        $status = $response->status();
        $data = $response->successful() ? $response->json() : null;

        if (!is_array($data)) {
            Log::warning(sprintf('Store presets could not be read from %s (status %d)', $url, $status));

            return null;
        }

        if (($data['version'] ?? null) !== $version) {
            Log::warning(sprintf('Store presets at %s have an unsupported version', $url));

            return null;
        }

        return $data;
    }
}
