<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Constants\Hooks\DevHookNames;
use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\DTO\Onboarding\StoreSetupDTO;
use Kirki\Ecommerce\App\Setup\OnBoardingSeeder;
use Kirki\Ecommerce\App\Setup\Presets\PresetContext;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\App\Supports\Utils;

use function Kirki\Ecommerce\Framework\app;

defined('ABSPATH') || exit;

/**
 * Turns the merchant's onboarding answers into a configured store.
 *
 * Every step is safe to run again, so a setup that failed partway can simply be
 * retried. Steps are not wrapped in one transaction: options, posts and the
 * plugin's own tables cannot share one.
 *
 * @since 1.0.0
 */
class StoreSetupService
{
    /** @var CurrencyService */
    protected $currency_service;

    /** @var SetupChecklistService */
    protected $setup_checklist_service;

    /** @var StorePresetService */
    protected $store_preset_service;

    /**
     * Create the service with the currency, setup checklist and store preset services.
     *
     * @since 1.0.0
     *
     * @param CurrencyService       $currency_service
     * @param SetupChecklistService $setup_checklist_service
     * @param StorePresetService    $store_preset_service
     */
    public function __construct(CurrencyService $currency_service, SetupChecklistService $setup_checklist_service, StorePresetService $store_preset_service)
    {
        $this->currency_service = $currency_service;
        $this->setup_checklist_service = $setup_checklist_service;
        $this->store_preset_service = $store_preset_service;
    }

    /**
     * Set up the store from the onboarding answers.
     *
     * @since 1.0.0
     *
     * @param StoreSetupDTO $data The onboarding answers.
     * @return void
     * @throws \Exception When a setup step fails.
     */
    public function setup(StoreSetupDTO $data)
    {
        $this->seed_baseline();
        $this->save_general_settings($data);
        $this->save_tax_settings($data);
        $this->currency_service->ensure_base($data->currency);

        Utils::generate_site_pages();

        if (!$this->store_preset_service->is_applied()) {
            $this->store_preset_service->apply(PresetContext::from_settings());
        }

        $this->setup_checklist_service->record_preconfigured();

        do_action(DevHookNames::STORE_CREATED, $data->to_array());
    }

    /**
     * Seed the baseline catalog data and settings defaults.
     *
     * @since 1.0.0
     *
     * @return void
     */
    protected function seed_baseline()
    {
        $seeder = app()->make(OnBoardingSeeder::class);
        $seeder->run();
        $seeder();
    }

    /**
     * Save the store identity, address and tax switch to the general settings.
     *
     * @since 1.0.0
     *
     * @param StoreSetupDTO $data The onboarding answers.
     * @return void
     */
    protected function save_general_settings(StoreSetupDTO $data)
    {
        $address = $data->store_address ?? [];

        Settings::get(OptionKeys::GENERAL_SETTINGS)->refresh()->set([
            'store_name' => $data->store_name,
            'industry' => $data->industry,
            'store_tax_id' => $data->is_tax_collected ? $data->store_tax_id : null,
            'store_address' => [
                'address_line_1' => $address['address_line_1'] ?? null,
                'address_line_2' => $address['address_line_2'] ?? null,
                'city' => $address['city'] ?? null,
                'state' => $address['state'] ?? null,
                'postal_code' => $address['postal_code'] ?? null,
                'country' => $data->country,
            ],
            'is_tax_calculation_enabled' => (bool) $data->is_tax_collected,
        ]);
    }

    /**
     * Save whether catalog prices include tax.
     *
     * @since 1.0.0
     *
     * @param StoreSetupDTO $data The onboarding answers.
     * @return void
     */
    protected function save_tax_settings(StoreSetupDTO $data)
    {
        Settings::get(OptionKeys::TAX_SETTINGS)->refresh()->set([
            'is_tax_inclusive_price' => $data->is_tax_collected && $data->is_tax_inclusive_price,
        ]);
    }
}
