<?php

namespace Kirki\Ecommerce\App\Supports;

defined('ABSPATH') || exit;

/**
 * Checks the URLs the plugin requests from its remote servers.
 *
 * @since 1.0.0
 */
class RemoteUrl
{
    protected const LOCAL_HOST_PATTERN = '/^(localhost|127\.0\.0\.1|host\.docker\.internal|.+\.test)$/';

    /**
     * Check that a URL belongs to a base URL and uses a safe scheme.
     *
     * HTTPS is required. Plain HTTP is accepted only for local hosts.
     *
     * @since 1.0.0
     *
     * @param string $url      URL to check.
     * @param string $base_url Base URL of the remote server.
     * @return bool
     */
    public static function is_trusted(string $url, string $base_url)
    {
        $base_url = rtrim($base_url, '/');

        if (strpos($url, $base_url . '/') !== 0) {
            return false;
        }

        $parts = wp_parse_url($url);
        $scheme = $parts['scheme'] ?? '';
        $host = $parts['host'] ?? '';

        if ($scheme === 'https') {
            return true;
        }

        return $scheme === 'http' && preg_match(static::LOCAL_HOST_PATTERN, $host) === 1;
    }
}
