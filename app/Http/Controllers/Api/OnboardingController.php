<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

use Kirki\Ecommerce\App\Http\Requests\Settings\OnboardingRequest;
use Kirki\Ecommerce\App\Constants\OptionKeys;

use Kirki\Ecommerce\App\Services\CurrencyService;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use function Kirki\Ecommerce\Framework\response;

class OnboardingController
{
    protected $currency_service;

    public function __construct(CurrencyService $currency_service)
    {
        $this->currency_service = $currency_service;
    }

    public function store(OnboardingRequest $request)
    {
        $payload = $request->all();

        $general_settings_data = [
            'store_name' => $payload['store_name'],
            'industry' => $payload['industry'],
            'store_address' => $payload['store_address']
        ];

        $general_settings = Settings::get(OptionKeys::GENERAL_SETTINGS);
        $general_settings->set($general_settings_data);

        $this->currency_service->set_base($request->get_string('default_currency'));

        //@todo handle sample data import based on $data['should_import_samples']

        return response()->json([
            'data' => [],
            'message' => __('Onboarding settings updated successfully.', 'kirki-ecommerce'),
        ]);
    }
}
