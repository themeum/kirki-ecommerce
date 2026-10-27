<?php

namespace Kirki\Ecommerce\Payments;

use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Supports\Url;

defined('ABSPATH') || exit;

/**
 * Builds Square request payloads and interprets transaction status.
 *
 */
class SquareTransactionBuilder
{
    /**
     * Build the request body for Square's CreatePaymentLink endpoint.
     *
     * @param Order $order
     * @param string $location_id The Square location the order belongs to.
     * @return array
     */
    public static function build_payment_link_payload(Order $order, string $location_id): array
    {
        return [
            'idempotency_key' => SquareConstant::PREFIX . $order->uuid,
            'order' => [
                'location_id' => $location_id,
                'reference_id' => $order->uuid,
                'line_items' => static::build_line_items($order),
                'discounts' => [
                    [
                        'name' => __('Total Discount', 'kirki-ecommerce-square'),
                        'amount_money' => static::money($order, $order->invoiced_discount_total),
                    ],
                ],
                'taxes' => [
                    [
                        'name' => __('Total Tax', 'kirki-ecommerce-square'),
                        'amount_money' => static::money($order, $order->invoiced_tax_total),
                    ],
                ],
                'service_charges' => [
                    [
                        'name' => __('Shipping Charge', 'kirki-ecommerce-square'),
                        'amount_money' => static::money($order, $order->invoiced_shipping_total - $order->invoiced_shipping_tax_amount),
                        'calculation_phase' => 'TOTAL_PHASE',
                    ],
                ],
            ],
            'checkout_options' => [
                'redirect_url' => Url::get_checkout_success_url($order->uuid),
                'enable_coupon' => false,
            ],
            'pre_populated_data' => [
                'buyer_email' => $order->billing_email ?? null,
                'buyer_address' => [
                    'address_line_1' => $order->billing_address_line1 ?? null,
                    'address_line_2' => $order->billing_address_line2 ?? null,
                    'postal_code' => $order->billing_postal_code ?? null,
                    'country' => $order->billing_country ?? null,
                    'first_name' => $order->billing_first_name ?? null,
                    'last_name' => $order->billing_last_name ?? null,
                ],
            ],
        ];
    }

    /**
     * Build a Square Money object in the order's currency.
     *
     * @param Order $order
     * @param int|float|null $amount Amount in minor units.
     * @return array
     */
    protected static function money(Order $order, $amount): array
    {
        return [
            'amount' => (int) $amount,
            'currency' => strtoupper($order->currency_code),
        ];
    }

    /**
     * Build Square order line_items for an order's items, shipping, and tax.
     *
     * @param Order $order
     * @return array
     */
    public static function build_line_items(Order $order): array
    {
        $line_items = [];

        foreach ($order->items as $item) {
            $line_items[] = [
                'uid' => (string) $item->id,
                'name' => $item->product_name,
                'quantity' => (string) $item->quantity,
                'base_price_money' => [
                    'amount' => (int) $item->invoiced_price,
                    'currency' => strtoupper($order->currency_code)
                ],
            ];
        }
        return $line_items;
    }
}
