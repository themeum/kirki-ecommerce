<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Resources\SettingResource;
use Kirki\Ecommerce\App\Http\Requests\Settings\SettingsUpdateRequest;
use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Facades\CurrencyExchange;

use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\Framework\Http\Request;

use function Kirki\Ecommerce\Framework\response;

/**
 * REST controller for reading and saving settings groups.
 *
 * @since 1.0.0
 */
class SettingsController
{
    /**
     * Currency settings keys written only by the exchange rate sync, never by a client save.
     *
     * @since 1.0.0
     *
     * @var string[]
     */
    const SERVER_OWNED_CURRENCY_KEYS = [
        'sync_token',
        'sync_fingerprint',
        'last_sync_at',
        'next_sync_at',
        'last_sync_error',
        'last_sync_error_at',
        'usage',
    ];

    /**
     * Return the settings stored under a settings key.
     *
     * The `key` parameter must be one of the known option keys.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The settings key with its current values.
     */
    public function get(Request $request)
    {
        $request->validate([
            'key' => 'required|string|in:' . implode(',', OptionKeys::get_constant_values()),
        ]);

        $settings = Settings::get($request->string('key'))->to_array();

        return response()->json([
            'data' => SettingResource::make([
                'key' => $request->string('key'),
                'settings' => $settings,
            ]),
            'message' => __('Settings retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }


    /**
     * Save the request `data` into the settings stored under a settings key.
     *
     * For the currency settings, each sent provider entry in `api_configs`
     * replaces that provider's stored entry, and providers that are not sent keep
     * their stored entry.
     *
     * @since 1.0.0
     *
     * @param SettingsUpdateRequest $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The settings key with its saved values.
     */
    public function update(SettingsUpdateRequest $request)
    {
        $key = $request->string('key');
        $clean_data = $request->all();
        $data = $clean_data['data'] ?? [];

        if ($key === OptionKeys::CURRENCY_SETTINGS) {
            $data = array_diff_key($data, array_flip(static::SERVER_OWNED_CURRENCY_KEYS));
        }

        $settings = Settings::get($key);

        if ($key === OptionKeys::CURRENCY_SETTINGS) {
            $data['api_configs'] = static::merge_provider_configs($settings->get('api_configs'), $data['api_configs'] ?? null);
        }

        $settings->set($data);

        return response()->json([
            'data' => SettingResource::make([
                'key' => $key,
                'settings' => $settings->to_array(),
            ]),
            'message' => __('Settings saved', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Merge the sent provider API configurations into the stored ones.
     *
     * @since 1.0.0
     *
     * @param mixed $stored Stored `api_configs` map.
     * @param mixed $sent   `api_configs` map from the request.
     * @return array<string, array<string, mixed>>
     */
    protected static function merge_provider_configs($stored, $sent)
    {
        return CurrencyExchange::normalize_provider_configs($sent) + CurrencyExchange::normalize_provider_configs($stored);
    }
}
