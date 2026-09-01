<?php

namespace Kirki\Ecommerce\Payments;

use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Supports\Url;

defined('ABSPATH') || exit;

/**
 * Builds QuickPay request payloads and interprets transaction status.
 *
 */
class QuickpayTransactionBuilder
{
    protected Order $order;

    /**
     * @param Order $order The order to build QuickPay payloads for.
     */
    public function __construct(Order $order)
    {
        $this->order = $order;
    }

    /**
     * Build the QuickPay payments request payload for an order.
     *
     * @return array
     */
    public function create_payment_payload(): array
    {
        return [
            'currency' => $this->order->currency_code,
            'order_id' => $this->order->order_number,
            'invoice_address' => $this->format_address('billing'),
            'shipping_address' => $this->format_address('shipping'),
            'basket' => $this->get_line_items(),
            'variables' => ['order_uuid' => $this->order->uuid]
        ];
    }

    /**
     * Build a QuickPay address array for the order's billing or shipping address.
     *
     * @param string $type Either 'billing' or 'shipping'.
     * @return array An empty array if the order has no address of that type.
     */
    protected function format_address(string $type)
    {
        if (empty($this->order->{$type . '_address_line1'})) {
            return [];
        }

        $name = $this->order->{$type . '_first_name'} . ' ' . $this->order->{$type . '_last_name'};

        return [
            'name' => $name,
            'street'  => $this->order->{$type . '_address_line1'},
            'house_number' => $this->order->{$type . '_address_line2'},
            'city' => $this->order->{$type . '_city'},
            'zip_code' => (string) $this->order->{$type . '_postal_code'},
            'region' => $this->order->{$type . '_state'},
            'phone_number' => $this->order->{$type . '_phone'},
            'email' => $this->order->{$type . '_email'},
        ];
    }

    /**
     * Build QuickPay order_lines entries for the order's items, shipping charge and tax.
     *
     * @return array
     */
    public function get_line_items(): array
    {
        $line_items = [];

        foreach ($this->order->items as $item) {
            $line_items[] = [
                'qty' => (int) $item->quantity,
                'item_no' => (string) $item->variant_id,
                'item_name' => $item->product_name,
                'item_price' => (int) $item->invoiced_total,
                'vat_rate' => (float) $item->tax_rate / 100,
            ];
        }

        if (!empty($this->order->invoiced_shipping_total)) {
            $line_items[] = [
                'item_no' => 'shipping',
                'item_name' => __('Shipping Charge', 'kirki-ecommerce-quickpay'),
                'qty' => 1,
                'item_price' => (int) $this->order->invoiced_shipping_total,
                'vat_rate' => 0
            ];
        }

        if (!empty($this->order->invoiced_tax_total)) {
            $line_items[] = [
                'item_no' => 'tax',
                'item_name' => __('Tax', 'kirki-ecommerce-quickpay'),
                'qty' => 1,
                'item_price' => (int) $this->order->invoiced_tax_total,
                'vat_rate' => 0
            ];
        }

        return $line_items;
    }

    /**
     * Build the QuickPay payment link request payload for an order.
     *
     * @param string $webhook_url URL QuickPay should notify on payment status changes.
     * @return array
     */
    public function create_payment_link_payload(string $webhook_url): array
    {
        return [
            'amount' => (int) $this->order->invoiced_total,
            'continue_url' => Url::get_checkout_success_url($this->order->uuid),
            'cancel_url' => Url::get_checkout_failed_url($this->order->uuid),
            'callback_url' => $webhook_url,
            'auto_capture' => true
        ];
    }
}
