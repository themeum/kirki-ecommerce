<?php

namespace Kirki\Ecommerce\Tests\Support;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Decisions\DecisionEngine;
use Kirki\Ecommerce\App\Managers\MoneyManager;
use Kirki\Ecommerce\App\Services\CurrencyService;
use Kirki\Ecommerce\Framework\Container;

trait BindsTaxDependencies
{
    /**
     * Bind the collaborators a tax strategy resolves at runtime: the Money facade
     * and the decision engine backing the tax rules.
     *
     * @return void
     */
    protected function bind_tax_dependencies(): void
    {
        $this->bind_money_dependencies();

        $container = Container::get_instance();
        $container->alias('money', MoneyManager::class);

        $decisions = require dirname(__DIR__, 2) . '/config/decisions.php';

        $container->singleton(
            DecisionEngine::class,
            fn() => new DecisionEngine($decisions['conditions'], $decisions['actions'])
        );
    }

    /**
     * Bind everything `Tax::get_tax_strategy()` needs to resolve a real
     * strategy end to end: `Settings::get(OptionKeys::TAX_SETTINGS)`, the
     * Money facade, and the decision engine - so a test can exercise
     * `TaxStrategyFactory`/`RecalculateCartAction` exactly as production
     * does, rather than constructing a strategy directly.
     *
     * Boots the real `Application` (not the lighter container
     * `bind_tax_dependencies()` uses) because `TaxStrategyFactory` reads
     * `config('tax-strategies')`, which needs a real `config_path()`. The
     * real country dataset loads along with it, and `EuropeanCountryChecker`
     * reads EU membership straight out of it - so it needs no faking.
     *
     * @param array $tax_regions Same shape the tax settings UI persists:
     *        each entry a region (`code`, `is_enabled`, plus its rate/rule
     *        fields).
     * @param bool $is_tax_inclusive_price
     * @param string $base_currency
     * @return void
     */
    protected function bind_full_tax_settings(array $tax_regions, bool $is_tax_inclusive_price = false, string $base_currency = 'USD'): void
    {
        $this->bootstrap_application();

        $container = Container::get_instance();

        $currency = new \stdClass();
        $currency->code = $base_currency;

        $settings_factory = new FakeSettingsFactory([
            OptionKeys::CURRENCY_SETTINGS => [],
            OptionKeys::TAX_SETTINGS => [
                'tax_regions' => $tax_regions,
                'is_tax_inclusive_price' => $is_tax_inclusive_price,
            ],
        ]);

        $currency_service = new class($currency) {
            protected $currency;

            public function __construct($currency)
            {
                $this->currency = $currency;
            }

            public function get_base_currency()
            {
                return $this->currency;
            }
        };

        $container->instance('settings', $settings_factory);
        $container->singleton(CurrencyService::class, fn() => $currency_service);
        $container->alias('money', MoneyManager::class);

        $decisions = require dirname(__DIR__, 2) . '/config/decisions.php';

        $container->singleton(
            DecisionEngine::class,
            fn() => new DecisionEngine($decisions['conditions'], $decisions['actions'])
        );
    }

    /**
     * A tax rule setting the product tax rate when the cart's tax profile matches.
     *
     * @param string    $tax_profile Tax profile the condition compares against.
     * @param int|float $rate        Rate the action sets.
     *
     * @return array
     */
    protected function set_product_tax_rate_rule($tax_profile, $rate): array
    {
        return [
            'relation' => 'AND',
            'conditions' => [
                ['type' => 'tax_profile', 'operator' => '=', 'value' => $tax_profile],
            ],
            'action' => ['type' => 'set_product_tax_rate', 'value' => $rate],
        ];
    }

    /**
     * A tax rule whose action fires when the shipping address falls in the given
     * destination. The value mirrors what the settings UI stores: `{ country,
     * state? }` with `country` a single code or an array of codes.
     *
     * @param array     $destination Destination condition value.
     * @param string    $action_type Action to run (e.g. set_product_tax_rate).
     * @param int|float $rate        Rate the action sets.
     *
     * @return array
     */
    protected function destination_region_rule(array $destination, string $action_type, $rate): array
    {
        return [
            'relation' => 'AND',
            'conditions' => [
                ['type' => 'destination_region', 'operator' => '=', 'value' => $destination],
            ],
            'action' => ['type' => $action_type, 'value' => $rate],
        ];
    }
}
