<?php

namespace Kirki\Ecommerce\App\DTO\Order;

use Kirki\Ecommerce\Framework\DTO;
use Kirki\Ecommerce\Framework\Collections\Collection;

use function Kirki\Ecommerce\Framework\collection;

class CreateOrderDTO extends DTO
{
    /** @var string */
    public $uuid;

    /** @var string */
    public $order_number;

    /** @var int */
    public $customer_id;

    /** @var string */
    public $order_status;

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

    /** @var array */
    public $discount_details;

    /** @var int */
    public $invoiced_tax_total = 0;

    /** @var int */
    public $base_tax_total = 0;

    /** @var int */
    public $invoiced_total;

    /** @var int */
    public $base_total;

    /** @var int */
    public $items_count;

    /** @var string */
    public $payment_status;

    /** @var string */
    public $payment_method;

    /** @var string */
    public $payment_gateway;

    /** @var string */
    public $shipping_method;

    // Shipping Address Fields
    public $shipping_first_name;
    public $shipping_last_name;
    public $shipping_address_line1;
    public $shipping_address_line2;
    public $shipping_city;
    public $shipping_state;
    public $shipping_country;
    public $shipping_postal_code;
    public $shipping_phone;
    public $shipping_email;

    /** @var bool */
    public $is_billing_same_as_shipping = false;

    // Billing Address Fields
    public $billing_first_name;
    public $billing_last_name;
    public $billing_address_line1;
    public $billing_address_line2;
    public $billing_city;
    public $billing_state;
    public $billing_country;
    public $billing_postal_code;
    public $billing_phone;
    public $billing_email;

    /** @var string|null */
    public $customer_notes;

    /** @var string|null */
    public $ip_address;

    /** @var string|null */
    public $user_agent;

    /** @var int */
    public $created_by;

    /** @var Collection<CreateOrderItemDTO> */
    public $items;

    /** @var string|null */
    public $billing_company;

    /** @var string|null */
    public $shipping_company;

    /** @var string|null */
    public $customer_email;

    /** @var string|null */
    public $customer_phone;

    public function __construct()
    {
        $this->items = collection();
    }
}
