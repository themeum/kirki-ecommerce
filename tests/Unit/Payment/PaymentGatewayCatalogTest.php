<?php

namespace Kirki\Ecommerce\Tests\Unit\Payment;

use Kirki\Ecommerce\App\Payment\PaymentGatewayCatalog;
use Kirki\Ecommerce\Tests\Unit\TestCase;

class PaymentGatewayCatalogTest extends TestCase
{
    protected const BASE_URL = 'https://gateways.example.com';

    protected function entry(array $overrides = [])
    {
        return array_merge([
            'id' => 'stripe',
            'slug' => 'kirki-stripe',
            'name' => 'Kirki Stripe',
            'description' => 'Stripe gateway.',
            'version' => '1.0.0',
            'icon_url' => static::BASE_URL . '/files/kirki-stripe/logo.svg',
            'download_url' => static::BASE_URL . '/files/kirki-stripe/kirki-stripe-1.0.0.zip',
            'sha256' => str_repeat('a', 64),
            'requires_kirki' => '1.1.0',
            'requires_wp' => '6.4',
            'requires_php' => '7.4',
        ], $overrides);
    }

    public function test_it_keeps_a_valid_entry()
    {
        $gateways = PaymentGatewayCatalog::normalize([$this->entry()], static::BASE_URL);

        $this->assertCount(1, $gateways);
        $this->assertSame('stripe', $gateways[0]['id']);
    }

    public function test_it_keeps_the_slug_and_the_requirements()
    {
        $gateway = PaymentGatewayCatalog::normalize([$this->entry()], static::BASE_URL)[0];

        $this->assertSame('kirki-stripe', $gateway['slug']);
        $this->assertSame('1.1.0', $gateway['requires_kirki']);
        $this->assertSame('6.4', $gateway['requires_wp']);
        $this->assertSame('7.4', $gateway['requires_php']);
    }

    public function test_it_drops_an_entry_without_a_slug()
    {
        $entry = $this->entry();
        unset($entry['slug']);

        $this->assertSame([], PaymentGatewayCatalog::normalize([$entry], static::BASE_URL));
    }

    public function test_it_drops_an_entry_with_an_unsafe_slug()
    {
        $entry = $this->entry(['slug' => '../kirki-stripe']);

        $this->assertSame([], PaymentGatewayCatalog::normalize([$entry], static::BASE_URL));
    }

    public function test_it_blanks_a_requirement_that_is_not_a_version()
    {
        $entry = $this->entry(['requires_kirki' => '>= 1.1', 'requires_php' => 7.4]);
        unset($entry['requires_wp']);

        $gateway = PaymentGatewayCatalog::normalize([$entry], static::BASE_URL)[0];

        $this->assertSame('', $gateway['requires_kirki']);
        $this->assertSame('', $gateway['requires_wp']);
        $this->assertSame('', $gateway['requires_php']);
    }

    public function test_it_drops_a_download_url_on_another_host()
    {
        $entry = $this->entry(['download_url' => 'https://evil.example.com/files/kirki-stripe.zip']);

        $this->assertSame([], PaymentGatewayCatalog::normalize([$entry], static::BASE_URL));
    }

    public function test_it_drops_a_host_that_only_starts_like_the_base_url()
    {
        $entry = $this->entry(['download_url' => 'https://gateways.example.com.evil.io/a.zip']);

        $this->assertSame([], PaymentGatewayCatalog::normalize([$entry], static::BASE_URL));
    }

    public function test_it_drops_an_entry_with_a_malformed_checksum()
    {
        $entry = $this->entry(['sha256' => 'not-a-hash']);

        $this->assertSame([], PaymentGatewayCatalog::normalize([$entry], static::BASE_URL));
    }

    public function test_it_drops_an_entry_with_an_unsafe_id()
    {
        $entry = $this->entry(['id' => '../stripe']);

        $this->assertSame([], PaymentGatewayCatalog::normalize([$entry], static::BASE_URL));
    }

    public function test_it_blanks_an_icon_url_that_is_not_http()
    {
        $entry = $this->entry(['icon_url' => 'javascript:alert(1)']);

        $gateways = PaymentGatewayCatalog::normalize([$entry], static::BASE_URL);

        $this->assertSame('', $gateways[0]['icon_url']);
    }

    public function test_it_keeps_an_icon_url_on_another_host()
    {
        $entry = $this->entry(['icon_url' => 'http://localhost:9000/kirki-payments/kirki-stripe/logo.svg']);

        $gateways = PaymentGatewayCatalog::normalize([$entry], static::BASE_URL);

        $this->assertSame('http://localhost:9000/kirki-payments/kirki-stripe/logo.svg', $gateways[0]['icon_url']);
    }

    public function test_it_ignores_a_response_that_is_not_a_list()
    {
        $this->assertSame([], PaymentGatewayCatalog::normalize('oops', static::BASE_URL));
    }

    public function test_plain_http_is_allowed_only_for_local_hosts()
    {
        $this->assertTrue(PaymentGatewayCatalog::is_trusted_url('http://localhost:4000/files/a.zip', 'http://localhost:4000'));
        $this->assertFalse(PaymentGatewayCatalog::is_trusted_url('http://gateways.example.com/a.zip', 'http://gateways.example.com'));
    }
}
