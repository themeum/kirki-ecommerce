<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

use Kirki\Ecommerce\App\Http\Requests\Settings\OnboardingRequest;
use Kirki\Ecommerce\App\Constants\OptionKeys;

use Kirki\Ecommerce\App\Services\CurrencyService;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use function Kirki\Ecommerce\Framework\response;

/**
 * REST controller that saves the store onboarding answers.
 *
 * @since 1.0.0
 */
class OnboardingController
{
    /** @var CurrencyService */
    protected $currency_service;

    /**
     * Create the controller with the currency service.
     *
     * @since 1.0.0
     *
     * @param CurrencyService $currency_service
     */
    public function __construct(CurrencyService $currency_service)
    {
        $this->currency_service = $currency_service;
    }

    /**
     * Save the store name, industry and address to the general settings and set the base currency.
     *
     * @since 1.0.0
     *
     * @param OnboardingRequest $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse Success response with an empty `data` array.
     */
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

        $this->currency_service->set_base($request->string('default_currency'));

        //@todo handle sample data import based on $data['should_import_samples']

        return response()->json([
            'data' => [],
            'message' => __('Onboarding settings saved', 'kirki-ecommerce'),
        ]);
    }
}
