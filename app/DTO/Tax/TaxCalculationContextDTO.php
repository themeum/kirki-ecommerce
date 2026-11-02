<?php

namespace Kirki\Ecommerce\App\DTO\Tax;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\Order\OrderTaxDestination;
use Kirki\Ecommerce\Framework\DTO;

/**
 * Input to tax calculation: shipping, billing and store addresses, shipping fee and the taxable items.
 *
 * @since 1.0.0
 */
class TaxCalculationContextDTO extends DTO
{
    /** @var array */
    public $shipping_address = [];

    /** @var array */
    public $billing_address = [];

    /** @var array */
    public $store_address = [];

    /** @var int */
    public $shipping_fee = 0;

    /** @var bool */
    public $is_shipping_taxable = false;

    /** @var TaxableItemDTO[] */
    public $items = [];

    /**
     * Get the address a tax destination stands for.
     *
     * @since 1.0.0
     *
     * @param string $destination An OrderTaxDestination value.
     * @return array<string, mixed> Empty when that address is not set.
     */
    public function address_for(string $destination): array
    {
        switch ($destination) {
            case OrderTaxDestination::BILLING:
                return (array) $this->billing_address;
            case OrderTaxDestination::STORE:
                return (array) $this->store_address;
            default:
                return (array) $this->shipping_address;
        }
    }
}
