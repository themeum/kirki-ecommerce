<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Payment\PaymentGatewayCatalog;
use Kirki\Ecommerce\Framework\Supports\Facades\Cache;
use WP_UnitTestCase;

class PaymentGatewayUpdateHooksTest extends WP_UnitTestCase
{
    protected const ZIP_BODY = 'not-a-real-zip';

    protected const PLUGIN = 'kirki-fakepay/kirki-fakepay.php';

    /** @var string */
    protected $base_url;

    protected function setUp(): void
    {
        parent::setUp();

        $this->base_url = (new PaymentGatewayCatalog())->base_url();
        Cache::forget(PaymentGatewayCatalog::CACHE_KEY);
        Cache::forget(PaymentGatewayCatalog::DETAILS_CACHE_KEY_PREFIX . 'kirki-fakepay');
    }

    protected function tearDown(): void
    {
        remove_all_filters('pre_http_request');
        Cache::forget(PaymentGatewayCatalog::CACHE_KEY);
        Cache::forget(PaymentGatewayCatalog::DETAILS_CACHE_KEY_PREFIX . 'kirki-fakepay');

        $dir = WP_PLUGIN_DIR . '/kirki-fakepay';
        if (file_exists($dir . '/kirki-fakepay.php')) {
            unlink($dir . '/kirki-fakepay.php');
            rmdir($dir);
        }
        wp_clean_plugins_cache(false);

        parent::tearDown();
    }

    protected function install_fake_plugin(string $version): void
    {
        $dir = WP_PLUGIN_DIR . '/kirki-fakepay';
        if (!is_dir($dir)) {
            mkdir($dir, 0777, true);
        }

        file_put_contents($dir . '/kirki-fakepay.php', "<?php\n/**\n * Plugin Name: Kirki Fake Pay\n * Version: {$version}\n */\n");
        wp_clean_plugins_cache(false);
    }

    protected function fake_server(array $overrides = [], string $checksum = ''): void
    {
        $base_url = $this->base_url;
        $entry = array_merge([
            'id' => 'fakepay',
            'slug' => 'kirki-fakepay',
            'name' => 'Fake Pay',
            'description' => 'Fake gateway.',
            'version' => '1.0.1',
            'requires_kirki_ecommerce' => '',
            'requires_wp' => '',
            'requires_php' => '',
            'icon_url' => $base_url . '/kirki-fakepay/logo.svg',
            'download_url' => $base_url . '/kirki-fakepay/kirki-fakepay-1.0.1.zip',
            'sha256' => $checksum !== '' ? $checksum : hash('sha256', static::ZIP_BODY),
        ], $overrides);

        add_filter('pre_http_request', function ($reply, $args, $url) use ($base_url, $entry) {
            if ($url === $base_url . '/payments') {
                return $this->http_reply(json_encode([$entry]));
            }

            if ($url === $base_url . '/kirki-fakepay/meta.json') {
                return $this->http_reply(json_encode(['changelog' => "## 1.0.1\n- Fixed <b>currency</b> check"]));
            }

            if ($url === $entry['download_url']) {
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

    protected function empty_transient(): object
    {
        return (object) ['last_checked' => time(), 'response' => [], 'no_update' => [], 'translations' => []];
    }

    public function test_an_update_is_added_to_the_plugin_update_data(): void
    {
        $this->install_fake_plugin('1.0.0');
        $this->fake_server();

        $transient = apply_filters('pre_set_site_transient_update_plugins', $this->empty_transient());

        $this->assertArrayHasKey(static::PLUGIN, $transient->response);
        $this->assertSame('1.0.1', $transient->response[static::PLUGIN]->new_version);
        $this->assertSame($this->base_url . '/kirki-fakepay/kirki-fakepay-1.0.1.zip', $transient->response[static::PLUGIN]->package);
        $this->assertArrayNotHasKey(static::PLUGIN, $transient->no_update);
    }

    public function test_an_up_to_date_gateway_is_listed_as_no_update(): void
    {
        $this->install_fake_plugin('1.0.1');
        $this->fake_server();

        $transient = apply_filters('pre_set_site_transient_update_plugins', $this->empty_transient());

        $this->assertArrayNotHasKey(static::PLUGIN, $transient->response);
        $this->assertArrayHasKey(static::PLUGIN, $transient->no_update);
    }

    public function test_a_blocked_update_is_left_out(): void
    {
        $this->install_fake_plugin('1.0.0');
        $this->fake_server(['requires_kirki_ecommerce' => '99.0.0']);

        $transient = apply_filters('pre_set_site_transient_update_plugins', $this->empty_transient());

        $this->assertArrayNotHasKey(static::PLUGIN, $transient->response);
        $this->assertArrayHasKey(static::PLUGIN, $transient->no_update);
    }

    public function test_a_wordpress_org_entry_for_a_catalog_plugin_is_replaced(): void
    {
        $this->install_fake_plugin('1.0.1');
        $this->fake_server();

        $transient = $this->empty_transient();
        $transient->response[static::PLUGIN] = (object) ['new_version' => '9.9.9', 'package' => 'https://downloads.wordpress.org/evil.zip'];

        $transient = apply_filters('pre_set_site_transient_update_plugins', $transient);

        $this->assertArrayNotHasKey(static::PLUGIN, $transient->response);
    }

    public function test_a_plugin_that_is_not_installed_is_not_listed(): void
    {
        $this->fake_server();

        $transient = apply_filters('pre_set_site_transient_update_plugins', $this->empty_transient());

        $this->assertSame([], $transient->response);
        $this->assertSame([], $transient->no_update);
    }

    public function test_plugin_information_returns_the_details_and_changelog(): void
    {
        $this->fake_server();

        $info = apply_filters('plugins_api', false, 'plugin_information', (object) ['slug' => 'kirki-fakepay']);

        $this->assertSame('Fake Pay', $info->name);
        $this->assertSame('1.0.1', $info->version);
        $this->assertStringContainsString('<h4>1.0.1</h4>', $info->sections['changelog']);
        $this->assertStringContainsString('<li>Fixed &lt;b&gt;currency&lt;/b&gt; check</li>', $info->sections['changelog']);
    }

    public function test_plugin_information_leaves_other_plugins_alone(): void
    {
        $this->fake_server();

        $this->assertFalse(apply_filters('plugins_api', false, 'plugin_information', (object) ['slug' => 'akismet']));
    }

    public function test_a_verified_package_is_given_to_wordpress(): void
    {
        $this->fake_server();

        $file = apply_filters('upgrader_pre_download', false, $this->base_url . '/kirki-fakepay/kirki-fakepay-1.0.1.zip', null);

        $this->assertIsString($file);
        $this->assertSame(static::ZIP_BODY, file_get_contents($file));
        unlink($file);
    }

    public function test_a_hash_mismatch_fails_the_download(): void
    {
        $this->fake_server([], str_repeat('a', 64));

        $result = apply_filters('upgrader_pre_download', false, $this->base_url . '/kirki-fakepay/kirki-fakepay-1.0.1.zip', null);

        $this->assertWPError($result);
        $this->assertSame('kirki_payment_package_integrity', $result->get_error_code());
    }

    public function test_an_unknown_package_under_the_base_url_fails_the_download(): void
    {
        $this->fake_server();

        $this->assertWPError(apply_filters('upgrader_pre_download', false, $this->base_url . '/kirki-other/kirki-other-1.0.0.zip', null));
    }

    public function test_other_package_downloads_are_left_alone(): void
    {
        $this->fake_server();

        $this->assertFalse(apply_filters('upgrader_pre_download', false, 'https://downloads.wordpress.org/plugin/akismet.zip', null));
    }
}
