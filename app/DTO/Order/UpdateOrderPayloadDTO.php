<?php

namespace Kirki\Ecommerce\App\DTO\Order;

use Kirki\Ecommerce\Framework\DTO;

class UpdateOrderPayloadDTO extends DTO
{
    /** @var int */
    public $id;

    /** @var int|null */
    public $customer_id;

    /** @var array<array{id: int|null, variant_id: int, quantity: int}> */
    public $items = [];

    /** @var string */
    public $currency_code;

    /** @var string */
    public $payment_method;

    /** @var string|null */
    public $coupon_code;

    /** @var string|null */
    public $shipping_method;

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
    public $shipping_postcode;

    /** @var string|null */
    public $shipping_country;

    /** @var string|null */
    public $shipping_phone;

    /** @var string|null */
    public $shipping_email;

    /** @var string|null */
    public $shipping_company;

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
    public $billing_postcode;

    /** @var string|null */
    public $billing_country;

    /** @var string|null */
    public $billing_phone;

    /** @var string|null */
    public $billing_email;

    /** @var string|null */
    public $billing_company;

    /** @var string|null */
    public $customer_email;

    /** @var string|null */
    public $customer_phone;

    /** @var string|null */
    public $customer_notes;

    /** @var int|null */
    public $is_manual;

    /** @var string|null */
    public $order_status;

    /** @var string|null */
    public $payment_status;
}
