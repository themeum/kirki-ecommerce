<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Facades\CurrencyExchange;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\Framework\Http\Request;
use Kirki\Ecommerce\Framework\Http\Response;

use function Kirki\Ecommerce\Framework\response;

use Kirki\Ecommerce\App\Resources\CurrencyExchange\CurrencyProviderResource;

/**
 * REST controller for currency exchange rate providers and rate syncing.
 *
 * @since 1.0.0
 */
class CurrencyExchangeController
{
    /**
     * List the currency exchange providers that can be configured.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse Provider collection with a success message.
     */
    public function get_providers(Request $request)
    {
        $providers = CurrencyExchange::get_available_providers();

        return response()->json([
            'data' => CurrencyProviderResource::collection($providers),
            'message' => __('Currency exchange providers retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Pull fresh exchange rates from the configured provider on demand.
     *
     * Responds with 400 when no provider is configured or the sync fails.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The last sync time, next sync time and usage, or a 400 response on failure.
     */
    public function sync(Request $request)
    {
        if (CurrencyExchange::get_active_provider() === null) {
            return response()->json([
                'message' => __('Configure an exchange rate provider before syncing.', 'kirki-ecommerce'),
            ], Response::BAD_REQUEST);
        }

        try {
            CurrencyExchange::sync();
        } catch (\Throwable $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], Response::BAD_REQUEST);
        }

        $currency_settings = Settings::get(OptionKeys::CURRENCY_SETTINGS);

        return response()->json([
            'data' => [
                'last_sync_at' => $currency_settings->get('last_sync_at'),
                'next_sync_at' => $currency_settings->get('next_sync_at'),
                'usage' => $currency_settings->get('usage'),
            ],
            'message' => __('Exchange rates synced', 'kirki-ecommerce'),
        ]);
    }
}
