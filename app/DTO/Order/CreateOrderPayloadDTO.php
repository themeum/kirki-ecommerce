<?php

namespace Kirki\Ecommerce\App\DTO\Order;

use Kirki\Ecommerce\Framework\DTO;

class CreateOrderPayloadDTO extends DTO
{
    /** @var int|null */
    public $customer_id;

    /** @var array<array{variant_id: int, quantity: int}> */
    public $items = [];

    /** @var string */
    public $currency_code;

    /** @var string */
    public $payment_provider;

    /**
     * @var string[] Coupon codes to apply. Populated either from the checkout
     *      cart's applied coupons (resolve_checkout_cart()) or, for a manual/
     *      direct order, from the single `coupon_code` request field - see
     *      from_array().
     */
    public $coupon_codes = [];

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

    /** @var bool */
    public $is_billing_same_as_shipping = false;

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
    public $customer_notes;

    /** @var string|null */
    public $admin_notes;

    /** @var string|null */
    public $ip_address;

    /** @var string|null */
    public $user_agent;

    /** @var int|null */
    public $created_by;

    /** @var int|null */
    public $is_manual;

    /** @var string|null */
    public $cart_token;

    /** @var int|null */
    public $user_id;

    /**
     * Normalizes the request's single `coupon_code` field into `coupon_codes`,
     * so the DTO only ever exposes one (array) representation of "which
     * coupons apply" - `resolve_checkout_cart()` can then set `coupon_codes`
     * directly for a real multi-coupon cart checkout.
     *
     * @param array $data
     * @return static
     */
    public static function from_array(array $data)
    {
        // @todo: Remove this after we refactor to use coupon_codes instead of coupon_code
        if (empty($data['coupon_codes']) && !empty($data['coupon_code'])) {
            $data['coupon_codes'] = [$data['coupon_code']];
        }

        return parent::from_array($data);
    }
}
