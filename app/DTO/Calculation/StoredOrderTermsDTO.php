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

    /** @var array<int|string, TaxRateDTO[]>|null Product tax rates per line key; null when tax is calculated again */
    public $item_tax_rates;

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
}
