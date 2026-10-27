<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Constants\UpdateFrequency;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

class CurrencyProviderConfigsTest extends RestTestCase
{
    /**
     * A save stores each sent configuration under its provider.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_save_stores_each_config_under_its_provider(): void
    {
        $this->save_currency_settings('provider_a', [
            'provider_a' => $this->provider_config('key-a'),
            'provider_b' => $this->provider_config('key-b', UpdateFrequency::EVERY_6_HOURS),
        ]);

        $this->assertSame([
            'provider_a' => $this->provider_config('key-a'),
            'provider_b' => $this->provider_config('key-b', UpdateFrequency::EVERY_6_HOURS),
        ], $this->stored('api_configs'));
    }

    /**
     * A save keeps the stored configurations of the providers it does not send.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_save_keeps_providers_it_does_not_send(): void
    {
        $this->save_currency_settings('provider_a', ['provider_a' => $this->provider_config('key-a')]);
        $this->save_currency_settings('provider_b', ['provider_b' => $this->provider_config('key-b')]);

        $this->assertSame([
            'provider_b' => $this->provider_config('key-b'),
            'provider_a' => $this->provider_config('key-a'),
        ], $this->stored('api_configs'));
    }

    /**
     * A sent configuration replaces the stored configuration of that provider.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_sent_config_replaces_the_stored_one(): void
    {
        $this->save_currency_settings('provider_a', ['provider_a' => $this->provider_config('key-a')]);
        $this->save_currency_settings('provider_a', ['provider_a' => $this->provider_config('new-key', UpdateFrequency::EVERY_15_MIN)]);

        $this->assertSame(['provider_a' => $this->provider_config('new-key', UpdateFrequency::EVERY_15_MIN)], $this->stored('api_configs'));
    }

    /**
     * The settings response returns the configuration of each provider and no `api_config`.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_response_returns_each_provider_config(): void
    {
        $this->save_currency_settings('provider_a', [
            'provider_a' => $this->provider_config('key-a'),
            'provider_b' => $this->provider_config('key-b'),
        ]);

        $payload = $this->assert_api_success($this->request('GET', 'settings/' . OptionKeys::CURRENCY_SETTINGS));

        $this->assertSame('key-a', $payload['data']['api_configs']['provider_a']['api_key']);
        $this->assertSame('key-b', $payload['data']['api_configs']['provider_b']['api_key']);
        $this->assertArrayNotHasKey('api_config', $payload['data']);
    }

    /**
     * A fallback behaviour in a sent configuration is not stored or returned.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_fallback_behaviour_is_not_stored(): void
    {
        $this->save_currency_settings('provider_a', [
            'provider_a' => $this->provider_config('key-a') + ['fallback_behaviour' => 'last_known_rate'],
        ]);

        $this->assertSame(['provider_a' => $this->provider_config('key-a')], $this->stored('api_configs'));

        $payload = $this->assert_api_success($this->request('GET', 'settings/' . OptionKeys::CURRENCY_SETTINGS));
        $this->assertArrayNotHasKey('fallback_behaviour', $payload['data']['api_configs']['provider_a']);
    }

    /**
     * Clearing the provider keeps the stored configurations.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_clearing_the_provider_keeps_the_configs(): void
    {
        $this->save_currency_settings('provider_a', ['provider_a' => $this->provider_config('key-a')]);
        $this->save_currency_settings(null, null);

        $this->assertNull($this->stored('api_provider'));
        $this->assertSame(['provider_a' => $this->provider_config('key-a')], $this->stored('api_configs'));
    }

    /**
     * An update frequency that is not known is rejected.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_unknown_update_frequency_is_rejected(): void
    {
        $response = $this->request('PUT', 'settings', [
            'key' => OptionKeys::CURRENCY_SETTINGS,
            'data' => $this->currency_settings('provider_a', ['provider_a' => $this->provider_config('key-a', 'every_second')]),
        ]);

        $this->assert_api_error($response, 422);
    }

    /**
     * Save the currency settings through the REST API with automatic updates off.
     *
     * @param string|null                              $provider_id
     * @param array<string, array<string, mixed>>|null $api_configs
     * @return void
     * @since 1.0.0
     */
    protected function save_currency_settings(?string $provider_id, ?array $api_configs): void
    {
        $this->assert_api_success($this->request('PUT', 'settings', [
            'key' => OptionKeys::CURRENCY_SETTINGS,
            'data' => $this->currency_settings($provider_id, $api_configs),
        ]));
    }

    /**
     * Build the currency settings request data with automatic updates off.
     *
     * @param string|null                              $provider_id
     * @param array<string, array<string, mixed>>|null $api_configs
     * @return array<string, mixed>
     * @since 1.0.0
     */
    protected function currency_settings(?string $provider_id, ?array $api_configs): array
    {
        return [
            'currency_format' => 'short',
            'currency_position' => 'before',
            'thousand_separator' => ',',
            'decimal_separator' => '.',
            'is_automatic_update_enabled' => false,
            'api_provider' => $provider_id,
            'api_configs' => $api_configs,
        ];
    }

    /**
     * Build an API configuration.
     *
     * @param string|null $api_key
     * @param string      $frequency
     * @return array<string, mixed>
     * @since 1.0.0
     */
    protected function provider_config(?string $api_key, string $frequency = UpdateFrequency::EVERY_1_HOUR): array
    {
        return [
            'api_key' => $api_key,
            'update_frequency' => $frequency,
        ];
    }

    /**
     * Read a stored currency setting.
     *
     * @param string $key
     * @return mixed
     * @since 1.0.0
     */
    protected function stored(string $key)
    {
        return Settings::get(OptionKeys::CURRENCY_SETTINGS)->get($key);
    }
}
