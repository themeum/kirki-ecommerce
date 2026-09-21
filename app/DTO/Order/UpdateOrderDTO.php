<?php

namespace Kirki\Ecommerce\App\DTO\Order;

use Kirki\Ecommerce\Framework\DTO;
use Kirki\Ecommerce\Framework\Collections\Collection;

use function Kirki\Ecommerce\Framework\collection;

/**
 * Data object for updating an order with its totals, addresses and items.
 *
 * @since 1.0.0
 */
class UpdateOrderDTO extends DTO
{
    /** @var int */
    public $id;

    /** @var string */
    public $uuid;

    /** @var string */
    public $order_number;

    /** @var int */
    public $customer_id;

    /** @var bool */
    public $is_manual;

    /** @var string */
    public $currency_code;

    /** @var string */
    public $base_currency_code;

    /** @var float */
    public $exchange_rate;

    /** @var int */
    public $invoiced_subtotal;

    /** @var int */
    public $base_subtotal;

    /** @var int */
    public $invoiced_shipping_total;

    /** @var int */
    public $base_shipping_total;

    /** @var int */
    public $invoiced_discount_total;

    /** @var int */
    public $base_discount_total;

    /** @var int */
    public $invoiced_tax_total;

    /** @var int */
    public $base_tax_total;

    /** @var int */
    public $invoiced_shipping_tax_amount;

    /** @var int */
    public $base_shipping_tax_amount;

    /** @var int */
    public $invoiced_total;

    /** @var int */
    public $base_total;

    /** @var int */
    public $items_count;

    /** @var string */
    public $shipping_method;

    // Shipping Address Fields
    /** @var string|null */
    public $shipping_first_name;
    /** @var string|null */
    public $shipping_last_name;
    /** @var string|null */
    public $shipping_address_line1;
    /** @var string|null */
    public $shipping_address_line2;
    /** @var string|null */
    public $shipping_city;
    /** @var string|null */
    public $shipping_state;
    /** @var string|null */
    public $shipping_country;
    /** @var string|null */
    public $shipping_postal_code;
    /** @var string|null */
    public $shipping_phone;
    /** @var string|null */
    public $shipping_email;
    /** @var string|null */
    public $shipping_company;

    // Billing Address Fields
    /** @var string|null */
    public $billing_first_name;
    /** @var string|null */
    public $billing_last_name;
    /** @var string|null */
    public $billing_address_line1;
    /** @var string|null */
    public $billing_address_line2;
    /** @var string|null */
    public $billing_city;
    /** @var string|null */
    public $billing_state;
    /** @var string|null */
    public $billing_country;
    /** @var string|null */
    public $billing_postal_code;
    /** @var string|null */
    public $billing_phone;
    /** @var string|null */
    public $billing_email;
    /** @var string|null */
    public $billing_company;

    /** @var string|null */
    public $admin_notes;

    /** @var string[]|null */
    public $flags;

    /** @var Collection<CreateOrderItemDTO> */
    public $items;

    /** @var string|null */
    public $customer_email;

    /** @var string|null */
    public $customer_phone;

    /**
     * Create the DTO with an empty items collection.
     *
     * @since 1.0.0
     */
    public function __construct()
    {
        $this->items = collection();
    }
}
