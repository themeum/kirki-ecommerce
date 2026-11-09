<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Exception;
use Kirki\Ecommerce\App\Payment\PaymentGatewayCatalog;
use Kirki\Ecommerce\App\Payment\PaymentGatewayUpdates;
use WP_UnitTestCase;

class PaymentGatewayUpdatesTest extends WP_UnitTestCase
{
    protected function gateway(array $overrides = []): array
    {
        return array_merge([
            'id' => 'payfast',
            'slug' => 'kirki-payfast',
            'name' => 'PayFast',
            'description' => '',
            'version' => '1.0.1',
            'requires_kirki' => '',
            'requires_wp' => '',
            'requires_php' => '',
            'icon_url' => '',
            'download_url' => 'https://gateways.example.com/kirki-payfast/kirki-payfast-1.0.1.zip',
            'sha256' => str_repeat('a', 64),
        ], $overrides);
    }

    protected function installed(string $version): array
    {
        return ['kirki-payfast/kirki-payfast.php' => ['Name' => 'Kirki PayFast', 'Version' => $version]];
    }

    protected function catalog(array $gateways, bool $fail = false): PaymentGatewayCatalog
    {
        return new class ($gateways, $fail) extends PaymentGatewayCatalog {
            protected $gateways;
            protected $fail;

            public function __construct(array $gateways, bool $fail)
            {
                $this->gateways = $gateways;
                $this->fail = $fail;
            }

            public function all()
            {
                if ($this->fail) {
                    throw new Exception('down');
                }

                return $this->gateways;
            }
        };
    }

    public function test_a_newer_catalog_version_is_an_update(): void
    {
        $state = (new PaymentGatewayUpdates($this->catalog([])))->state($this->gateway(), $this->installed('1.0.0'));

        $this->assertSame('kirki-payfast/kirki-payfast.php', $state['plugin']);
        $this->assertSame('1.0.0', $state['installed_version']);
        $this->assertTrue($state['update_available']);
        $this->assertNull($state['update_blocked_reason']);
    }

    public function test_the_same_or_an_older_catalog_version_is_not_an_update(): void
    {
        $updates = new PaymentGatewayUpdates($this->catalog([]));

        $this->assertFalse($updates->state($this->gateway(), $this->installed('1.0.1'))['update_available']);
        $this->assertFalse($updates->state($this->gateway(), $this->installed('1.0.2'))['update_available']);
    }

    public function test_a_gateway_that_is_not_installed_has_no_update(): void
    {
        $state = (new PaymentGatewayUpdates($this->catalog([])))->state($this->gateway(), []);

        $this->assertNull($state['installed_version']);
        $this->assertFalse($state['update_available']);
        $this->assertNull($state['update_blocked_reason']);
    }

    public function test_each_requirement_can_block_an_update(): void
    {
        $updates = new PaymentGatewayUpdates($this->catalog([]));

        $cases = [
            'requires_kirki' => 'Requires Kirki 99.0.0',
            'requires_wp' => 'Requires WordPress 99.0.0',
            'requires_php' => 'Requires PHP 99.0.0',
        ];

        foreach ($cases as $field => $reason) {
            $state = $updates->state($this->gateway([$field => '99.0.0']), $this->installed('1.0.0'));

            $this->assertFalse($state['update_available'], $field);
            $this->assertSame($reason, $state['update_blocked_reason'], $field);
        }
    }

    public function test_met_requirements_do_not_block_an_update(): void
    {
        $gateway = $this->gateway(['requires_kirki' => '1.0.0', 'requires_wp' => '5.0', 'requires_php' => '7.0']);

        $state = (new PaymentGatewayUpdates($this->catalog([])))->state($gateway, $this->installed('1.0.0'));

        $this->assertTrue($state['update_available']);
    }

    public function test_a_blocked_requirement_is_not_reported_without_a_newer_version(): void
    {
        $state = (new PaymentGatewayUpdates($this->catalog([])))->state($this->gateway(['requires_kirki' => '99.0.0']), $this->installed('1.0.1'));

        $this->assertNull($state['update_blocked_reason']);
    }

    public function test_states_are_keyed_by_gateway_id(): void
    {
        $states = (new PaymentGatewayUpdates($this->catalog([$this->gateway()])))->states();

        $this->assertArrayHasKey('payfast', $states);
        $this->assertNull($states['payfast']['installed_version']);
    }

    public function test_a_catalog_failure_gives_no_updates(): void
    {
        $this->assertSame([], (new PaymentGatewayUpdates($this->catalog([], true)))->states());
    }

    public function test_an_unknown_package_url_is_not_verified(): void
    {
        $result = (new PaymentGatewayUpdates($this->catalog([$this->gateway()])))->verified_package('https://gateways.example.com/other.zip');

        $this->assertWPError($result);
        $this->assertSame('kirki_payment_package_unknown', $result->get_error_code());
    }
}
