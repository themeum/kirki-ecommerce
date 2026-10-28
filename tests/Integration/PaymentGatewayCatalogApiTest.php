<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Payment\PaymentGatewayCatalog;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

class PaymentGatewayCatalogApiTest extends RestTestCase
{
    protected const ZIP_BODY = 'not-a-real-zip';

    protected function setUp(): void
    {
        parent::setUp();

        delete_transient(PaymentGatewayCatalog::FRESH_CACHE_KEY);
        delete_transient(PaymentGatewayCatalog::STALE_CACHE_KEY);
    }

    protected function tearDown(): void
    {
        remove_all_filters('pre_http_request');
        delete_transient(PaymentGatewayCatalog::FRESH_CACHE_KEY);
        delete_transient(PaymentGatewayCatalog::STALE_CACHE_KEY);

        parent::tearDown();
    }

    protected function fake_server(string $checksum, bool $catalog_down = false): void
    {
        $base_url = (new PaymentGatewayCatalog())->base_url();

        add_filter('pre_http_request', function ($reply, $args, $url) use ($base_url, $checksum, $catalog_down) {
            if ($url === $base_url . '/payments') {
                if ($catalog_down) {
                    return new \WP_Error('down', 'down');
                }

                return $this->http_reply(json_encode([
                    [
                        'id' => 'fakepay',
                        'name' => 'Fake Pay',
                        'description' => 'Fake gateway.',
                        'version' => '1.0.0',
                        'icon_url' => $base_url . '/files/kirki-fakepay/logo.svg',
                        'download_url' => $base_url . '/files/kirki-fakepay/kirki-fakepay.zip',
                        'sha256' => $checksum,
                    ],
                    [
                        'id' => 'paypal',
                        'name' => 'PayPal',
                        'download_url' => $base_url . '/files/kirki-paypal/kirki-paypal.zip',
                        'sha256' => str_repeat('b', 64),
                    ],
                    [
                        'id' => 'evil',
                        'name' => 'Evil',
                        'download_url' => 'https://evil.example.com/evil.zip',
                        'sha256' => str_repeat('c', 64),
                    ],
                ]));
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
