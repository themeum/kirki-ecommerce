<?php

namespace Kirki\Ecommerce\App\DTO\Calculation;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Models\OrderCoupon;
use Kirki\Ecommerce\Framework\DTO;

/**
 * The terms an order was placed with, which an edit of that order keeps.
 *
 * A calculation that carries these terms prices the order from what is stored
 * on it, not from the store's current settings. A value left null (or empty)
 * means the current settings apply to that part instead.
 *
 * @since 1.0.0
 */
class StoredOrderTermsDTO extends DTO
{
    /** @var bool Whether the order's prices include tax */
    public $is_tax_inclusive = false;

    /** @var int|null Shipping charge before discount and tax in base minor units; null when shipping is quoted again */
    public $shipping_subtotal;

    /** @var array<int|string, TaxRateDTO[]>|null Product tax rates per line key; null when tax is calculated again */
    public $item_tax_rates;

    /** @var TaxRateDTO[]|null Shipping tax rates, each with the line it was split to when the shipping tax was split across items; null when shipping tax is calculated again */
    public $shipping_tax_rates;

    /** @var bool Whether the stored shipping tax was split across the items, as in the EU */
    public $is_shipping_tax_split = false;

    /** @var string|null Address the stored tax was calculated from */
    public $tax_destination;

    /** @var array<string, OrderCoupon> Coupons of the order that stay applied, keyed by code, with their item rows loaded */
    public $coupons = [];

    /**
     * Check whether the stored tax rates apply.
     *
     * @since 1.0.0
     *
     * @return bool
     */
    public function has_stored_tax()
    {
        return $this->item_tax_rates !== null;
    }

    /**
     * Check whether the stored shipping charge applies.
     *
     * @since 1.0.0
     *
     * @return bool
     */
    public function has_stored_shipping()
    {
        return $this->shipping_subtotal !== null;
    }
}
