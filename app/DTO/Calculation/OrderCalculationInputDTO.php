<?php

namespace Kirki\Ecommerce\App\DTO\Calculation;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\Framework\DTO;

/**
 * What the calculation context service reads from an order payload.
 *
 * The calculation preview, order creation (manual and checkout) and order edits
 * each build it from their own payload, so the context service reads the same fields in
 * every case. It holds only those fields.
 *
 * @since 1.0.0
 */
class OrderCalculationInputDTO extends DTO
{
    const ADDRESS_FIELDS = ['first_name', 'last_name', 'email', 'phone', 'address_line1', 'address_line2', 'city', 'state', 'postal_code', 'country'];

    /** @var int|null */
    public $customer_id;

    /** @var string|null */
    public $customer_email;

    /** @var string[] */
    public $coupon_codes = [];

    /** @var string|null */
    public $shipping_method;

    /** @var string|null Currency the payload asks for; an edit must keep the order's currency */
    public $currency_code;

    /** @var array<int|string, OrderCalculationLineDTO> Lines keyed like the payload; the key is the line's key in the calculation */
    public $items = [];

    /** @var string|null */
    public $shipping_first_name;

    /** @var string|null */
    public $shipping_last_name;

    /** @var string|null */
    public $shipping_email;

    /** @var string|null */
    public $shipping_phone;

    /** @var string|null */
    public $shipping_address_line1;

    /** @var string|null */
    public $shipping_address_line2;

    /** @var string|null */
    public $shipping_city;

    /** @var string|null */
    public $shipping_state;

    /** @var string|null */
    public $shipping_postal_code;

    /** @var string|null */
    public $shipping_country;

    /** @var string|null */
    public $billing_first_name;

    /** @var string|null */
    public $billing_last_name;

    /** @var string|null */
    public $billing_email;

    /** @var string|null */
    public $billing_phone;

    /** @var string|null */
    public $billing_address_line1;

    /** @var string|null */
    public $billing_address_line2;

    /** @var string|null */
    public $billing_city;

    /** @var string|null */
    public $billing_state;

    /** @var string|null */
    public $billing_postal_code;

    /** @var string|null */
    public $billing_country;

    /**
     * Make the input from an order payload array.
     *
     * Fields the input does not hold are ignored.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $payload Order payload: items, customer, coupon codes, shipping method and addresses.
     * @return static
     */
    public static function from_payload(array $payload)
    {
        $input = new static($payload);
        $input->coupon_codes = $payload['coupon_codes'] ?? [];
        $input->items = array_map(fn($item) => OrderCalculationLineDTO::from_array($item), $payload['items'] ?? []);

        return $input;
    }

    /**
     * Make the input from a stored order, as the payload that would send the order back unchanged.
     *
     * Lines are sent as the order item `id` and `quantity`, and the coupon codes are those of the
     * order's coupons.
     *
     * @since 1.0.0
     *
     * @param Order $order Order with its items and order coupons loaded.
     * @return static
     */
    public static function from_order(Order $order)
    {
        $payload = [
            'customer_id' => $order->customer_id,
            'customer_email' => $order->customer_email,
            'shipping_method' => $order->shipping_method,
            'coupon_codes' => $order->order_coupons->pluck('code')->all(),
            'items' => $order->items->map(fn($item) => ['id' => $item->id, 'quantity' => $item->quantity])->all(),
        ];

        foreach (['shipping', 'billing'] as $type) {
            foreach (static::ADDRESS_FIELDS as $field) {
                $payload[$type . '_' . $field] = $order->{$type . '_' . $field};
            }
        }

        return static::from_payload($payload);
    }

    /**
     * Get one address out of the flat address fields with the given prefix.
     *
     * @since 1.0.0
     *
     * @param string $type Address prefix: `shipping` or `billing`.
     * @return array<string, string|null>
     */
    public function get_address(string $type)
    {
        $address = [];

        foreach (static::ADDRESS_FIELDS as $field) {
            $property = $type . '_' . $field;
            $address[$field] = $this->$property;
        }

        return $address;
    }
}
