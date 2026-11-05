<?php

namespace Kirki\Ecommerce\Tests\Support;

use Kirki\Ecommerce\App\Setup\Presets\PresetRepository;
use Kirki\Ecommerce\Framework\Supports\Facades\Cache;
use WP_Error;

/**
 * Serves the remote preset location from the repository source folder, with no network.
 *
 * A request below the preset base URL gets the file at the same path in
 * resources/data/preconfigured-data/, and an image request gets a generated
 * JPEG. Any other path answers 404.
 */
trait ServesPresetData
{
    /** @var string[] Paths below the base URL that were requested. */
    protected $preset_requests = [];

    /**
     * Answer preset requests from the source folder.
     *
     * @param array<string, mixed> $overrides Replies by path: an array (sent as JSON), a string body, an int status, or a WP_Error.
     * @return void
     */
    protected function serve_preset_data(array $overrides = [])
    {
        $base_url = rtrim(constant('KIRKI_ECOMMERCE_PRESETS_URL'), '/') . '/';
        $plugin_dir = dirname(__DIR__, 2);

        // Store setup commits the test transaction, so presets cached by an earlier test would survive.
        Cache::forget(PresetRepository::cache_key($base_url));

        add_filter('pre_http_request', function ($reply, $args, $url) use ($base_url, $plugin_dir, $overrides) {
            if (strpos($url, $base_url) !== 0) {
                return $reply;
            }

            $path = rawurldecode(substr($url, strlen($base_url)));
            $this->preset_requests[] = $path;

            if (array_key_exists($path, $overrides)) {
                $override = $overrides[$path];

                if ($override instanceof WP_Error) {
                    return $override;
                }

                if (is_int($override)) {
                    return static::preset_reply($override, '');
                }

                return static::preset_reply(200, is_string($override) ? $override : wp_json_encode($override));
            }

            // Git ignores the image folders, so every image gets a generated JPEG.
            if (strpos($path, '/images/') !== false) {
                return static::preset_reply(200, static::preset_image());
            }

            $file = $plugin_dir . '/resources/data/preconfigured-data/' . $path;

            return is_file($file) ? static::preset_reply(200, file_get_contents($file)) : static::preset_reply(404, '');
        }, 10, 3);
    }

    /**
     * Build a 1x1 JPEG.
     *
     * @return string
     */
    protected static function preset_image(): string
    {
        $image = imagecreatetruecolor(1, 1);
        ob_start();
        imagejpeg($image);

        return (string) ob_get_clean();
    }

    /**
     * Build an HTTP API reply.
     *
     * @param int    $status Response status.
     * @param string $body   Response body.
     * @return array<string, mixed>
     */
    protected static function preset_reply(int $status, string $body)
    {
        return [
            'headers' => [],
            'body' => $body,
            'response' => ['code' => $status, 'message' => ''],
            'cookies' => [],
            'filename' => null,
        ];
    }
}
