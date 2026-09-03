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
}
