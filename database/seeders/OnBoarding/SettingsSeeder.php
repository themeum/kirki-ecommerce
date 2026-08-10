<?php

namespace Kirki\Ecommerce\Database\Seeders\OnBoarding;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Constants\SellingLocationType;
use Kirki\Ecommerce\Framework\Database\Seeder;
use Kirki\Ecommerce\Framework\Supports\Facades\Log;
use Kirki\Ecommerce\Framework\Supports\Facades\Option;

use function Kirki\Ecommerce\Framework\json_decoded_data;
use function Kirki\Ecommerce\Framework\resource_path;

class SettingsSeeder extends Seeder
{
    /**
     * Write the store's opening settings.
     *
     * @return void
     * @since 1.0.0
     */
    public function run(): void
    {
        $this->seed(OptionKeys::GENERAL_SETTINGS, [
            'selling_location_type' => SellingLocationType::ALL_COUNTRIES,
            'selling_countries' => [],
        ]);

        $this->seed(OptionKeys::PRODUCT_SETTINGS, [
            'is_enabled_reviews' => false,
            'is_enabled_star_ratings' => false,
        ]);

        $this->seed(OptionKeys::CHECKOUT_SETTINGS, [
            'is_allowed_guest_checkout' => false,
        ]);

        $this->seed(OptionKeys::PAYMENT_SETTINGS, [
            'offline_payments' => $this->get_offline_payments(),
        ]);
    }

    /**
     * Write a settings group, but only when the merchant has none of their own.
     *
     * The shipped defaults are the starting point so this seeder does not have to
     * restate the full settings tree and cannot drift from it.
     *
     * @param string $key       The settings option key.
     * @param array  $overrides The onboarding values to apply over the defaults.
     *
     * @return void
     * @since 1.0.0
     */
    protected function seed($key, array $overrides)
    {
        if (!is_null(Option::get($key))) {
            return;
        }

        $defaults = json_decoded_data(resource_path('data/settings/' . $key . '.json')) ?? [];

        if (OptionKeys::PAYMENT_SETTINGS === $key) {
            // The shipped default defines payment_gateways, which nothing reads -
            // every consumer uses offline_payments. Don't carry it into new stores.
            unset($defaults['payment_gateways']);
        }

        Option::set($key, array_merge($defaults, $overrides));

        Log::info(sprintf('OnBoarding SettingsSeeder wrote the %s settings', $key));
    }

    /**
     * The offline payment methods a new store opens with.
     *
     * PaymentProvider::from_offline() maps name to title and instructions to
     * description, and only resolves an icon from an integer attachment id - so a
     * null icon is what "no icon" looks like here.
     *
     * @return array
     * @since 1.0.0
     */
    protected function get_offline_payments()
    {
        return [
            [
                'id' => 'cod',
                'name' => __('Cash on Delivery', 'kirki-ecommerce'),
                'instructions' => __(
                    'Pay with cash when your order is delivered. Please keep the exact amount ready, as our couriers may not carry change.',
                    'kirki-ecommerce'
                ),
                'icon' => null,
                'is_enabled' => true,
                'is_offline' => true,
                'config' => [],
            ],
        ];
    }
}
