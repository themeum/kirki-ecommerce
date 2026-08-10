<?php

namespace Kirki\Ecommerce\Payments;

use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Payment\PaymentGateway;
use Kirki\Ecommerce\App\Payment\PaymentProvider;

defined('ABSPATH') || exit;

/**
 * Builds Mollie API request fragments from an order.
 */
class MollieTransactionBuilder
{
    protected $order;
    public function __construct(?Order $order = null)
    {
        $this->order = $order;
    }

    /**
     * Build the `lines` payload for a Mollie payment request.
     *
     * @return array
     */
    public function build_line_items(): array
    {
        $line_items = [];

        foreach ($this->order->items as $item) {
            $line_items[] = $this->build_line_item($item);
        }

        if (!empty($this->order->invoiced_shipping_total)) {
            $line_items[] = [
                'type' => 'shipping_fee',
                'description' => __('Shipping Charge', 'kirki-mollie'),
                'quantity'    => 1,
                'unitPrice'   => $this->money($this->order->invoiced_shipping_total),
                'totalAmount' => $this->money($this->order->invoiced_shipping_total),
            ];
        }

        return $line_items;
    }

    /**
     * Build a single Mollie-formatted line item from an order item.
     *
     * @param object $item The order item
     *
     * @return array The line item structured for the Mollie API.
     */
    protected function build_line_item(object $item): array
    {
        $tax_per_unit = !empty($item->invoiced_tax_total) ? $item->invoiced_tax_total / (int) $item->quantity : 0;
        $unit_price = $item->invoiced_price + $tax_per_unit;

        $line_item = [
            'description' => $item->product_name,
            'quantity'    => (int) $item->quantity,
            'unitPrice'   => $this->money($unit_price),
            'totalAmount' => $this->money($item->invoiced_total),
        ];

        if (!empty($item->invoiced_discount_amount)) {
            $line_item['discountAmount'] = $this->money($item->invoiced_discount_amount);
        }

        if (!empty($item->tax_rate)) {
            $line_item['vatRate']   = (string) $item->tax_rate;
            $line_item['vatAmount'] = $this->money($item->invoiced_tax_total ?? 0);
        }

        return $line_item;
    }

    /**
     * Format an amount as a Mollie money object.
     *
     * @param float $amount The raw amount to format.
     *
     * @return array The money object with 'currency' and 'value' keys.
     */
    protected function money(float $amount): array
    {
        return [
            'currency' => strtoupper($this->order->currency_code),
            'value'    => PaymentProvider::format_amount($amount, $this->order->currency_code),
        ];
    }

    /**
     * Get an order address in Mollie's address format.
     *
     * @param string $type 'billing' or 'shipping'.
     * @return object
     */
    public function get_address(string $type): object
    {
        if (empty($this->order->{$type . '_address_line1'})) {
            return new \stdclass();
        }

        return (object)[
            'givenName'        => $this->order->{$type . '_first_name'},
            'familyName'       => $this->order->{$type . '_last_name'},
            'email'            => $this->order->{$type . '_email'},
            'phone'            => $this->order->{$type . '_phone'},
            'streetAndNumber'  => $this->order->{$type . '_address_line1'},
            'streetAdditional' => $this->order->{$type . '_address_line2'},
            'city'             => $this->order->{$type . '_city'},
            'postalCode'       => $this->order->{$type . '_postal_code'},
            'country'          => $this->order->{$type . '_country'},
        ];
    }
}
