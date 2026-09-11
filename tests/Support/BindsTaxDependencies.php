<?php

namespace Kirki\Ecommerce\Tests\Support;

use Kirki\Ecommerce\App\Decisions\DecisionEngine;
use Kirki\Ecommerce\App\Managers\MoneyManager;
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
