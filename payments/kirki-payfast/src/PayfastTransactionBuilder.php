<?php

namespace Kirki\Ecommerce\Payments;

use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Supports\Url;

defined('ABSPATH') || exit;

/**
 * Builds PayMongo checkout session request payloads for an order.
 */
class PayfastTransactionBuilder
{
    protected Order $order;

    /**
     * @param Order $order The order to build PayMongo payloads for.
     */
    public function __construct(Order $order)
    {
        $this->order = $order;
    }

    /**
     * Build the PayMongo checkout session request payload for the order.
     *
     * @return array
     */
    public function create_checkout_session_payload(): array
    {
        return [
            'data' => [
                'attributes' => [
                    'billing' => [
                        'address' => $this->get_billing_address(),
                        'email' => $this->order->billing_email ?? '',
                        'name' => trim($this->order->billing_first_name . ' ' . $this->order->billing_last_name),
                        'phone' => $this->order->billing_phone ?? '',
                    ],
                    'cancel_url' => Url::get_checkout_failed_url($this->order->uuid),
                    'customer_email' => $this->order->customer_email ?? null,
                    'metadata' => [
                        'order_id' => $this->order->uuid,
                    ],
                    'line_items' => $this->get_line_items(),
                    'payment_method_types' => PaymongoConstant::ALLOWED_PAYMENT_METHODS,
                    'reference_number' => $this->order->uuid,
                    'success_url' => Url::get_checkout_success_url($this->order->uuid),
                    'send_email_receipt' => true,
                    'show_description' => true,
                    'show_line_items' => true,
                ],
            ],
        ];
    }

    /**
     * Build the PayMongo address array for the order's billing address.
     *
     * PayMongo checkout sessions only accept a billing address, never a shipping one.
     *
     * @return array An empty array if the order has no billing address.
     */
    protected function get_billing_address(): array
    {
        if (empty($this->order->billing_address_line1)) {
            return [];
        }

        return [
            'city' => $this->order->billing_city ?? '',
            'country' => $this->order->billing_country ?? '',
            'line1' => $this->order->billing_address_line1,
            'line2' => $this->order->billing_address_line2 ?? '',
            'postal_code' => (string) $this->order->billing_postal_code,
            'state' => $this->order->billing_state ?? '',
        ];
    }

    /**
     * Build PayMongo line_items entries for the order's items, shipping charge and tax.
     *
     * Item amounts are sent net of tax; the order's total tax is appended as its own line.
     *
     * @return array
     */
    protected function get_line_items(): array
    {
        $line_items = [];

        foreach ($this->order->items as $item) {
            $net_total = (int) $item->invoiced_total - (int) $item->invoiced_tax_total;
            $quantity = (int) $item->quantity;

            if ($quantity > 1 && 0 !== $net_total % $quantity) {
                // Not divisible by the quantity: send the whole line as a single unit.
                $line_items[] = $this->make_line_item(
                    sprintf('%s x %d', $item->product_name, $quantity),
                    $net_total
                );
                continue;
            }

            $line_items[] = $this->make_line_item($item->product_name, intdiv($net_total, max($quantity, 1)), $quantity);
        }

        if (!empty($this->order->invoiced_shipping_total)) {
            $line_items[] = $this->make_line_item(
                __('Shipping Charge', 'kirki-ecommerce-paymongo'),
                (int) $this->order->invoiced_shipping_total
            );
        }

        if (!empty($this->order->invoiced_tax_total)) {
            $tax_without_shipping = $this->order->invoiced_tax_total - $this->order->invoiced_shipping_tax_amount ?? 0;
            $line_items[] = $this->make_line_item(__('Tax', 'kirki-ecommerce-paymongo'), (int) $tax_without_shipping);
        }

        return $line_items;
    }

    /**
     * Build a single PayMongo line_items entry.
     *
     * @param string $name The line description shown on the checkout page.
     * @param int $amount The per-unit amount, in minor units.
     * @param int $quantity The number of units.
     * @return array
     */
    protected function make_line_item(string $name, int $amount, int $quantity = 1): array
    {
        return [
            'amount' => $amount,
            'currency' => PaymongoConstant::CURRENCY,
            'name' => $name,
            'quantity' => $quantity,
        ];
    }
}
