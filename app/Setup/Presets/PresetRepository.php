<?php

namespace Kirki\Ecommerce\App\Setup\Presets;

use Kirki\Ecommerce\App\Supports\RemoteUrl;
use Kirki\Ecommerce\Framework\Http\Response;
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
     * @since 1.0.0
     *
     * @param string $industry Industry slug.
     * @return array<string, mixed>|null The products file with the `set` it was read from, or null when it cannot be read.
     */
    public function get_products(string $industry)
    {
        $set = in_array($industry, ['', static::OTHER_PRODUCTS], true) ? static::OTHER_PRODUCTS : sanitize_title($industry);
        $data = $this->fetch($set . '/products.json', static::PRODUCTS_VERSION, $status);

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
     * Read the presets once; a failed read yields no presets.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed>
     */
    protected function load()
    {
        if ($this->data === null) {
            $this->data = $this->fetch('presets.json', static::PRESETS_VERSION) ?? [];
        }

        return $this->data;
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
        $url = $this->base_url . '/' . $path;

        if (!RemoteUrl::is_trusted($url, $this->base_url)) {
            Log::warning(sprintf('Store presets were not requested from the untrusted URL %s', $url));

            return null;
        }

        $response = Http::timeout(10)->get($url);
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
