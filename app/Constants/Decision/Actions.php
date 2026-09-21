<?php

namespace Kirki\Ecommerce\App\Constants\Decision;

/**
 * Actions a decision rule can apply to shipping and tax calculation.
 *
 * @since 1.0.0
 */
final class Actions
{
    const SET_SHIPPING_COST = 'set_shipping_cost';
    const ADD_SHIPPING_COST = 'add_shipping_cost';
    const MULTIPLY_SHIPPING_COST = 'multiply_shipping_cost';
    const SET_FREE_SHIPPING = 'set_free_shipping';
    const DISABLE_SHIPPING_METHOD = 'disable_shipping_method';
    const SET_PRODUCT_TAX_RATE = 'set_product_tax_rate';
    const SET_SHIPPING_TAX_RATE = 'set_shipping_tax_rate';
    const SET_PRODUCT_TAX_EXEMPT = 'set_product_tax_exempt';
}
