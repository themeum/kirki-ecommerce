<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

use Kirki\Ecommerce\App\Facades\CurrencyExchange;
use Kirki\Ecommerce\Http\Request;

use function Kirki\Ecommerce\response;

use Kirki\Ecommerce\App\Resources\CurrencyExchange\CurrencyProviderResource;

class CurrencyExchangeController
{
    /**
     * Get all available currency exchange providers.
     *
     * @param Request $request
     */
    public function get_providers(Request $request)
    {
        $providers = CurrencyExchange::get_available_providers();

        return response()->json([
            'data' => CurrencyProviderResource::collection($providers),
            'message' => __('Currency exchange providers retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }
}
