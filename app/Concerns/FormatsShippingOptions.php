<?php

namespace Kirki\Ecommerce\App\Concerns;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Facades\Money;

/**
 * Formats the shipping options of a calculation, shared by the order calculation and order edit resources.
 *
 * @since 1.0.0
 */
trait FormatsShippingOptions
{
    /**
     * Format the shipping options, with each cost as a base-currency money object.
     *
     * @since 1.0.0
     *
     * @param array<int, array<string, mixed>> $shipping_options Options with a `base_cost` in minor units.
     * @return array<int, array<string, mixed>> Options with `base_cost_money_object` in place of `base_cost`.
     */
    protected function format_shipping_options(array $shipping_options)
    {
        return array_map(function ($method) {
            $cost = $method['base_cost'];
            unset($method['base_cost']);
            $method['base_cost_money_object'] = Money::prepare_amount_object_from_minor($cost);
            return $method;
        }, $shipping_options);
    }
}
