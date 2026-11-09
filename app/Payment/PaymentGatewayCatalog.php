<?php

namespace Kirki\Ecommerce\App\Payment;

defined('ABSPATH') || exit;

use Exception;
use Kirki\Ecommerce\App\Supports\RemoteUrl;
use Kirki\Ecommerce\Framework\Http\Response;
use Kirki\Ecommerce\Framework\Supports\Facades\Cache;
use Kirki\Ecommerce\Framework\Supports\Facades\Http;

use function Kirki\Ecommerce\Framework\throw_if;

/**
 * Catalog of the payment gateway plugins offered by the remote gateway server.
 *
 * The server base URL comes from the `KIRKI_ECOMMERCE_PAYMENT_CATALOG_URL`
 * constant, which the plugin file defines. wp-config.php can override it.
 *
 * @since 1.0.0
 */
class PaymentGatewayCatalog
{
    public const CACHE_KEY = 'payment_gateway_catalog';

    public const FRESH_CACHE_TTL = 15 * MINUTE_IN_SECONDS;

    public const STALE_CACHE_TTL = 7 * DAY_IN_SECONDS;

    public const DETAILS_CACHE_KEY_PREFIX = 'payment_gateway_details_';

    /**
     * Get the base URL of the remote gateway server, without a trailing slash.
     *
     * @since 1.0.0
     *
     * @return string
     */
    public function base_url()
    {
        return rtrim(constant('KIRKI_ECOMMERCE_PAYMENT_CATALOG_URL'), '/');
    }

    /**
     * Get the gateways the remote server offers.
     *
     * Serves the cached list while it is fresh. After that the old list is
     * served and refreshed once the response is sent, until the stale limit.
     *
     * @since 1.0.0
     *
     * @return array<int, array<string, string>> Gateways with id, slug, name, description, version, requires_kirki, requires_wp, requires_php, icon_url, download_url and sha256.
     * @throws Exception When the server fails and no earlier copy exists.
     */
    public function all()
    {
        return Cache::flexible(static::CACHE_KEY, [static::FRESH_CACHE_TTL, static::STALE_CACHE_TTL], function () {
            return $this->fetch();
        });
    }

    /**
     * Find one gateway by its ID.
     *
     * @since 1.0.0
     *
     * @param string $id Gateway ID.
     * @return array<string, string>|null Null when the catalog does not offer the gateway.
     * @throws Exception When the catalog cannot be loaded.
     */
    public function find(string $id)
    {
        foreach ($this->all() as $gateway) {
            if ($gateway['id'] === $id) {
                return $gateway;
            }
        }

        return null;
    }

    /**
     * Find one gateway by its download URL.
     *
     * @since 1.0.1
     *
     * @param string $download_url Package URL.
     * @return array<string, string>|null Null when no catalog gateway has that URL.
     * @throws Exception When the catalog cannot be loaded.
     */
    public function find_by_download_url(string $download_url)
    {
        foreach ($this->all() as $gateway) {
            if ($gateway['download_url'] === $download_url) {
                return $gateway;
            }
        }

        return null;
    }

    /**
     * Get the details file of one gateway, which holds its changelog.
     *
     * Reads `{base}/<slug>/meta.json` and caches it as long as the catalog.
     * A failed request gives an empty array, so callers can show the other
     * catalog values.
     *
     * @since 1.0.1
     *
     * @param string $slug Gateway plugin slug from the catalog.
     * @return array<string, mixed>
     */
    public function details(string $slug)
    {
        $url = $this->base_url() . '/' . $slug . '/meta.json';

        if (preg_match('/^[a-z0-9-]+$/', $slug) !== 1 || !static::is_trusted_url($url, $this->base_url())) {
            return [];
        }

        try {
            return Cache::remember(static::DETAILS_CACHE_KEY_PREFIX . $slug, static::FRESH_CACHE_TTL, function () use ($url) {
                $response = Http::timeout(10)->get($url);

                throw_if(!$response->successful(), __('Could not load the payment gateway details.', 'kirki-ecommerce'));

                $decoded = $response->json();

                return is_array($decoded) ? $decoded : [];
            });
        } catch (Exception $exception) {
            return [];
        }
    }

    /**
     * Drop the cached catalog so the next read requests the server again.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function flush()
    {
        Cache::forget(static::CACHE_KEY);
    }

    /**
     * Check that a URL belongs to the base URL and uses a safe scheme.
     *
     * HTTPS is required. Plain HTTP is accepted only for local hosts.
     *
     * @since 1.0.0
     *
     * @param string $url      URL to check.
     * @param string $base_url Base URL of the gateway server.
     * @return bool
     */
    public static function is_trusted_url(string $url, string $base_url)
    {
        return RemoteUrl::is_trusted($url, $base_url);
    }

    /**
     * Keep only the well-formed gateways of a decoded server response.
     *
     * An entry with a missing field, an unsafe ID or slug, a malformed checksum
     * or a download URL outside the base URL is dropped. A requirement that is
     * not a version string becomes an empty string. An icon URL that is not
     * http(s) is replaced with an empty string. The browser loads icons, so
     * they may use a different host than the base URL.
     *
     * @since 1.0.0
     *
     * @param mixed  $decoded  Decoded JSON body.
     * @param string $base_url Base URL of the gateway server.
     * @return array<int, array<string, string>>
     */
    public static function normalize($decoded, string $base_url)
    {
        if (!is_array($decoded)) {
            return [];
        }

        $gateways = [];

        foreach ($decoded as $entry) {
            if (!is_array($entry)) {
                continue;
            }

            $id = $entry['id'] ?? null;
            $slug = $entry['slug'] ?? null;
            $name = $entry['name'] ?? null;
            $download_url = $entry['download_url'] ?? null;
            $sha256 = $entry['sha256'] ?? null;

            $is_valid = is_string($id) && preg_match('/^[a-z0-9_-]+$/', $id) === 1
                && is_string($slug) && preg_match('/^[a-z0-9-]+$/', $slug) === 1
                && is_string($name) && $name !== ''
                && is_string($download_url) && static::is_trusted_url($download_url, $base_url)
                && is_string($sha256) && preg_match('/^[a-f0-9]{64}$/', $sha256) === 1;

            if (!$is_valid) {
                continue;
            }

            $icon_url = $entry['icon_url'] ?? '';

            $gateways[] = [
                'id' => $id,
                'slug' => $slug,
                'name' => $name,
                'description' => is_string($entry['description'] ?? null) ? $entry['description'] : '',
                'version' => is_string($entry['version'] ?? null) ? $entry['version'] : '',
                'requires_kirki' => static::version_or_empty($entry['requires_kirki'] ?? null),
                'requires_wp' => static::version_or_empty($entry['requires_wp'] ?? null),
                'requires_php' => static::version_or_empty($entry['requires_php'] ?? null),
                'icon_url' => is_string($icon_url) && preg_match('#^https?://#i', $icon_url) === 1 ? $icon_url : '',
                'download_url' => $download_url,
                'sha256' => $sha256,
            ];
        }

        return $gateways;
    }

    /**
     * Keep a value only when it is a version string such as "1.1" or "7.4.0".
     *
     * @since 1.0.1
     *
     * @param mixed $value Value from the catalog.
     * @return string The version, or an empty string.
     */
    protected static function version_or_empty($value)
    {
        return is_string($value) && preg_match('/^\d+(\.\d+)*$/', $value) === 1 ? $value : '';
    }

    /**
     * Request the gateway list from the remote server.
     *
     * @since 1.0.0
     *
     * @return array<int, array<string, string>>
     * @throws Exception When the request fails or the response is not a JSON list.
     */
    protected function fetch()
    {
        $base_url = $this->base_url();
        $response = Http::timeout(10)->get($base_url . '/payments');

        throw_if(
            !$response->successful(),
            __('Could not load the payment gateway list. Please try again later.', 'kirki-ecommerce'),
            Exception::class,
            Response::SERVICE_UNAVAILABLE
        );

        $decoded = $response->json();

        throw_if(
            !is_array($decoded),
            __('The payment gateway server returned an invalid response.', 'kirki-ecommerce'),
            Exception::class,
            Response::SERVICE_UNAVAILABLE
        );

        return static::normalize($decoded, $base_url);
    }
}
