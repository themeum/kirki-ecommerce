<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\PageKeys;
use Kirki\Ecommerce\App\DTO\Onboarding\StoreSetupDTO;
use Kirki\Ecommerce\App\Http\Requests\Settings\OnboardingRequest;
use Kirki\Ecommerce\App\Services\CurrencyService;
use Kirki\Ecommerce\App\Services\SampleDataImporter;
use Kirki\Ecommerce\App\Services\StoreSetupService;
use Kirki\Ecommerce\App\Supports\CountryData;
use Kirki\Ecommerce\App\Supports\Onboarding;
use Kirki\Ecommerce\Framework\Contracts\Request;
use Kirki\Ecommerce\Framework\Http\Response;

use function Kirki\Ecommerce\Framework\response;

/**
 * REST controller that sets up the store from the onboarding answers and loads sample data.
 *
 * @since 1.0.0
 */
class OnboardingController
{
    /** @var StoreSetupService */
    protected $store_setup_service;

    /** @var SampleDataImporter */
    protected $sample_data_importer;

    /** @var CurrencyService */
    protected $currency_service;

    /**
     * Create the controller with the store setup, sample data and currency services.
     *
     * @since 1.0.0
     *
     * @param StoreSetupService  $store_setup_service
     * @param SampleDataImporter $sample_data_importer
     * @param CurrencyService    $currency_service
     */
    public function __construct(
        StoreSetupService $store_setup_service,
        SampleDataImporter $sample_data_importer,
        CurrencyService $currency_service
    ) {
        $this->store_setup_service = $store_setup_service;
        $this->sample_data_importer = $sample_data_importer;
        $this->currency_service = $currency_service;
    }

    /**
     * Set up the store from the onboarding answers and record onboarding as complete.
     *
     * @since 1.0.0
     *
     * @param OnboardingRequest $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse Summary of what was set up, or a 409 once onboarding is complete.
     * @throws \Exception When a setup step fails.
     */
    public function store(OnboardingRequest $request)
    {
        if (Onboarding::is_completed()) {
            return response()->json([
                'message' => __('The store has already been set up.', 'kirki-ecommerce'),
            ], Response::CONFLICT);
        }

        $data = StoreSetupDTO::from_request($request);
        $data->industry = !empty($data->industry) ? $data->industry : 'other';
        $data->is_tax_collected = (bool) $data->is_tax_collected;
        $data->is_tax_inclusive_price = $data->is_tax_collected && (bool) $data->is_tax_inclusive_price;
        $data->store_tax_id = $data->is_tax_collected && !empty($data->store_tax_id) ? $data->store_tax_id : null;

        $this->store_setup_service->setup($data);

        Onboarding::mark_completed();

        return response()->json([
            'data' => $this->get_summary($data),
            'message' => __('Your store has been set up', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Load the sample data into an onboarded store.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse Success response, or a 409 before onboarding is complete.
     */
    public function import_sample_data(Request $request)
    {
        if (!Onboarding::is_completed()) {
            return response()->json([
                'message' => __('Set up the store before loading sample data.', 'kirki-ecommerce'),
            ], Response::CONFLICT);
        }

        $this->sample_data_importer->import();

        return response()->json([
            'data' => [],
            'message' => __('Sample data loaded', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Build the summary of what store setup configured, shown on the onboarding completion screen.
     *
     * @since 1.0.0
     *
     * @param StoreSetupDTO $data The onboarding answers.
     * @return array<string, mixed>
     */
    protected function get_summary(StoreSetupDTO $data)
    {
        $country = CountryData::find_index_entry($data->country);
        $currency_code = strtoupper($data->currency);
        $currency = $this->currency_service->find_definition($currency_code);

        return [
            'country' => [
                'code' => strtoupper($data->country),
                'name' => $country['name'] ?? strtoupper($data->country),
            ],
            'currency' => [
                'code' => $currency_code,
                'symbol' => $currency['symbol'] ?? '',
            ],
            'pages' => array_values(PageKeys::get_list()),
            'tax' => $data->is_tax_collected ? ['is_tax_inclusive_price' => $data->is_tax_inclusive_price] : null,
        ];
    }
}
