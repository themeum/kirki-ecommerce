<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Payment\PaymentGatewayCatalog;
use Kirki\Ecommerce\App\Payment\Facades\Payment;
use Kirki\Ecommerce\Framework\Supports\Facades\Cache;
use ZipArchive;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

class PaymentGatewayCatalogApiTest extends RestTestCase
{
    protected const ZIP_BODY = 'not-a-real-zip';

    protected const UPDATE_PLUGIN = 'kirki-fakepay/kirki-fakepay.php';

    /** @var string|null Zip served for the paypal update, when a test builds one. */
    protected $update_zip;

    protected function setUp(): void
    {
        parent::setUp();

        Cache::forget(PaymentGatewayCatalog::CACHE_KEY);
    }

    protected function tearDown(): void
    {
        remove_all_filters('pre_http_request');
        Cache::forget(PaymentGatewayCatalog::CACHE_KEY);

        deactivate_plugins(static::UPDATE_PLUGIN, true);
        $this->remove_dir(WP_PLUGIN_DIR . '/kirki-fakepay');
        wp_clean_plugins_cache(false);

        if ($this->update_zip && file_exists($this->update_zip)) {
            unlink($this->update_zip);
        }

        parent::tearDown();
    }

    protected function fake_server(string $checksum, bool $catalog_down = false, array $paypal = []): void
    {
        $base_url = (new PaymentGatewayCatalog())->base_url();
        $paypal = array_merge([
            'id' => 'paypal',
            'slug' => 'kirki-paypal',
            'name' => 'PayPal',
            'download_url' => $base_url . '/files/kirki-paypal/kirki-paypal.zip',
            'sha256' => str_repeat('b', 64),
        ], $paypal);

        add_filter('pre_http_request', function ($reply, $args, $url) use ($base_url, $checksum, $catalog_down, $paypal) {
            if ($url === $base_url . '/payments') {
                if ($catalog_down) {
                    return new \WP_Error('down', 'down');
                }

                return $this->http_reply(json_encode([
                    [
                        'id' => 'fakepay',
                        'slug' => 'kirki-fakepay',
                        'name' => 'Fake Pay',
                        'description' => 'Fake gateway.',
                        'version' => '1.0.0',
                        'icon_url' => $base_url . '/files/kirki-fakepay/logo.svg',
                        'download_url' => $base_url . '/files/kirki-fakepay/kirki-fakepay.zip',
                        'sha256' => $checksum,
                    ],
                    $paypal,
                    [
                        'id' => 'evil',
                        'slug' => 'kirki-evil',
                        'name' => 'Evil',
                        'download_url' => 'https://evil.example.com/evil.zip',
                        'sha256' => str_repeat('c', 64),
                    ],
                ]));
            }

            if ($this->update_zip && $url === $paypal['download_url']) {
                $body = file_get_contents($this->update_zip);

                if (!empty($args['filename'])) {
                    file_put_contents($args['filename'], $body);
                }

                return $this->http_reply($body);
            }

            if (substr($url, -strlen('kirki-fakepay.zip')) === 'kirki-fakepay.zip') {
                if (!empty($args['filename'])) {
                    file_put_contents($args['filename'], static::ZIP_BODY);
                }

                return $this->http_reply(static::ZIP_BODY);
            }

            return $reply;
        }, 10, 3);
    }

    protected function plugin_source(string $version): string
    {
        return "<?php\n/**\n * Plugin Name: Kirki Fake Pay\n * Version: {$version}\n */\n";
    }

    protected function install_fake_plugin(string $version): void
    {
        wp_mkdir_p(WP_PLUGIN_DIR . '/kirki-fakepay');
        file_put_contents(WP_PLUGIN_DIR . '/' . static::UPDATE_PLUGIN, $this->plugin_source($version));
        wp_clean_plugins_cache(false);
    }

    /**
     * Serve a real zip of kirki-fakepay as the paypal catalog entry, so the
     * built-in paypal provider stands in for an installed gateway plugin.
     */
    protected function fake_update_server(string $version, array $paypal = []): string
    {
        $this->update_zip = wp_tempnam('kirki-fakepay.zip');
        $zip = new ZipArchive();
        $zip->open($this->update_zip, ZipArchive::OVERWRITE);
        $zip->addFromString(static::UPDATE_PLUGIN, $this->plugin_source($version));
        $zip->close();

        $base_url = (new PaymentGatewayCatalog())->base_url();
        $this->fake_server(hash('sha256', static::ZIP_BODY), false, array_merge([
            'slug' => 'kirki-fakepay',
            'version' => $version,
            'download_url' => $base_url . '/files/kirki-fakepay/kirki-fakepay-' . $version . '.zip',
            'sha256' => hash_file('sha256', $this->update_zip),
        ], $paypal));

        return $base_url;
    }

    protected function remove_dir(string $dir): void
    {
        if (!is_dir($dir)) {
            return;
        }

        foreach (array_diff(scandir($dir), ['.', '..']) as $file) {
            $path = $dir . '/' . $file;
            is_dir($path) ? $this->remove_dir($path) : unlink($path);
        }

        rmdir($dir);
    }

    protected function http_reply(string $body): array
    {
        return ['headers' => [], 'body' => $body, 'response' => ['code' => 200, 'message' => 'OK'], 'cookies' => [], 'filename' => null];
    }

    public function test_listing_merges_installed_state_and_drops_untrusted_entries(): void
    {
        $this->fake_server(hash('sha256', static::ZIP_BODY));

        $data = $this->assert_api_success($this->request('GET', 'online-payments/installable'));
        $by_id = array_column($data['data'], null, 'id');

        $this->assertFalse($by_id['fakepay']['is_installed']);
        $this->assertTrue($by_id['paypal']['is_installed']);
        $this->assertArrayNotHasKey('evil', $by_id);
    }

    public function test_listing_has_the_update_state_of_installed_gateways(): void
    {
        $this->install_fake_plugin('1.0.0');
        $this->fake_update_server('1.0.1');

        $data = $this->assert_api_success($this->request('GET', 'online-payments/installable'));
        $by_id = array_column($data['data'], null, 'id');

        $this->assertSame('1.0.0', $by_id['paypal']['installed_version']);
        $this->assertTrue($by_id['paypal']['update_available']);
        $this->assertNull($by_id['paypal']['update_blocked_reason']);

        $this->assertNull($by_id['fakepay']['installed_version']);
        $this->assertFalse($by_id['fakepay']['update_available']);
        $this->assertNull($by_id['fakepay']['update_blocked_reason']);
    }

    public function test_listing_reports_a_blocked_update(): void
    {
        $this->install_fake_plugin('1.0.0');
        $this->fake_update_server('1.0.1', ['requires_kirki_ecommerce' => '99.0.0']);

        $data = $this->assert_api_success($this->request('GET', 'online-payments/installable'));
        $by_id = array_column($data['data'], null, 'id');

        $this->assertFalse($by_id['paypal']['update_available']);
        $this->assertSame(
            'This update needs Kirki eCommerce 99.0.0 or newer (you have ' . KIRKI_ECOMMERCE_VERSION . '). Update Kirki eCommerce first, then update this gateway.',
            $by_id['paypal']['update_blocked_reason']
        );
    }

    public function test_update_installs_the_catalog_version_and_keeps_the_settings(): void
    {
        $this->install_fake_plugin('1.0.0');
        $this->fake_update_server('1.0.1');
        $settings_before = Payment::get_provider('paypal')->settings();

        $response = $this->request('POST', 'online-payments/update', [
            'id' => 'paypal',
            'download_url' => 'https://evil.example.com/evil.zip',
        ]);

        $this->assert_api_success($response);
        $this->assertSame('1.0.1', get_plugin_data(WP_PLUGIN_DIR . '/' . static::UPDATE_PLUGIN, false, false)['Version']);
        $this->assertTrue(is_plugin_active(static::UPDATE_PLUGIN));
        $this->assertSame($settings_before, Payment::get_provider('paypal')->settings());
    }

    public function test_update_rejects_a_gateway_that_is_not_installed(): void
    {
        $this->fake_server(hash('sha256', static::ZIP_BODY));

        $this->assert_api_error($this->request('POST', 'online-payments/update', ['id' => 'fakepay']), 404);
    }

    public function test_update_rejects_a_gateway_that_is_up_to_date(): void
    {
        $this->install_fake_plugin('1.0.1');
        $this->fake_update_server('1.0.1');

        $this->assert_api_error($this->request('POST', 'online-payments/update', ['id' => 'paypal']), 409);
    }

    public function test_update_rejects_a_blocked_update(): void
    {
        $this->install_fake_plugin('1.0.0');
        $this->fake_update_server('1.0.1', ['requires_php' => '99.0.0']);

        $response = $this->request('POST', 'online-payments/update', ['id' => 'paypal']);

        $this->assert_api_error($response, 400);
        $this->assertSame('1.0.0', get_plugin_data(WP_PLUGIN_DIR . '/' . static::UPDATE_PLUGIN, false, false)['Version']);
    }

    public function test_update_rejects_a_checksum_mismatch(): void
    {
        $this->install_fake_plugin('1.0.0');
        $this->fake_update_server('1.0.1', ['sha256' => str_repeat('a', 64)]);

        $this->assert_api_error($this->request('POST', 'online-payments/update', ['id' => 'paypal']), 400);
        $this->assertSame('1.0.0', get_plugin_data(WP_PLUGIN_DIR . '/' . static::UPDATE_PLUGIN, false, false)['Version']);
    }

    public function test_listing_fails_when_the_server_is_down_and_nothing_is_cached(): void
    {
        $this->fake_server(str_repeat('a', 64), true);

        $this->assert_api_error($this->request('GET', 'online-payments/installable'), 503);
    }

    public function test_install_rejects_an_unknown_gateway(): void
    {
        $this->fake_server(hash('sha256', static::ZIP_BODY));

        $this->assert_api_error($this->request('POST', 'online-payments/install', ['id' => 'nope']), 404);
    }

    public function test_install_rejects_an_already_installed_gateway(): void
    {
        $this->fake_server(hash('sha256', static::ZIP_BODY));

        $this->assert_api_error($this->request('POST', 'online-payments/install', ['id' => 'paypal']), 409);
    }

    public function test_install_rejects_a_checksum_mismatch(): void
    {
        $this->fake_server(str_repeat('a', 64));

        $this->assert_api_error($this->request('POST', 'online-payments/install', ['id' => 'fakepay']), 400);
        $this->assertDirectoryDoesNotExist(WP_PLUGIN_DIR . '/kirki-fakepay');
    }

    public function test_install_ignores_a_client_supplied_download_url(): void
    {
        $this->fake_server(str_repeat('a', 64));

        $response = $this->request('POST', 'online-payments/install', [
            'id' => 'fakepay',
            'download_url' => 'https://evil.example.com/evil.zip',
        ]);

        $this->assert_api_error($response, 400);
    }

    public function test_remove_rejects_an_unknown_gateway(): void
    {
        $this->assert_api_error($this->request('DELETE', 'online-payments/nope'), 404);
    }

    public function test_remove_rejects_a_built_in_gateway(): void
    {
        $this->assert_api_error($this->request('DELETE', 'online-payments/paypal'), 400);
    }
}
