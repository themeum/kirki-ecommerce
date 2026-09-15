<?php

namespace Kirki\Ecommerce\Payments;

use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Supports\Url;

defined('ABSPATH') || exit;

/**
 * Builds QuickPay request payloads and interprets transaction status.
 *
 */
class PaymongoTransactionBuilder
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
    public function create_checkout_session_payload(): array
    {
        return [
            'data' => [
                'attributes' => [
                    'billing' => [
                        'address' => $this->format_address('billing'),
                        'email' => $this->order->billing_email ?? '',
                        'name' => $this->order->billing_first_name . ' ' . $this->order->billing_last_name,
                        'phone' => $this->order->billing_phone ?? ''
                    ],
                    'cancel_url' => Url::get_checkout_failed_url($this->order->uuid),
                    'customer_email' => $this->order->customer_email ?? null,
                    'line_items' => $this->get_line_items(),
                    'payment_method_types' => PayMongoConstant::ALLOWED_PAYMENT_METHODS,
                    'reference_number' => $this->order->uuid,
                    'success_url' => Url::get_checkout_success_url($this->order->uuid) ,
                    'send_email_receipt' => true,
                    'show_description' => true,
                    'show_line_items' => true,
                ],
            ],
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

        return [
            'city' => $this->order->{$type . '_city'},
            'country' => $this->order->{$type . '_country'},
            'line1'  => $this->order->{$type . '_address_line1'} ?? '',
            'line2' => $this->order->{$type . '_address_line2'} ?? '',
            'postal_code' => (string) $this->order->{$type . '_postal_code'} ?? '',
            'state' => $this->order->{$type . '_state'} ?? '',
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
                'amount' => (int) $item->invoiced_price,
                'currency' => 'PHP',//$this->order->currency_code,
                'name' => $item->product_name,
                'quantity' => $item->quantity,
            ];
        }

        // if (!empty($this->order->invoiced_shipping_total)) {
        //     $line_items[] = [
        //         'item_no' => 'shipping',
        //         'item_name' => __('Shipping Charge', 'kirki-ecommerce-quickpay'),
        //         'qty' => 1,
        //         'item_price' => (int) $this->order->invoiced_shipping_total,
        //         'vat_rate' => 0
        //     ];
        // }

        // if (!empty($this->order->invoiced_tax_total)) {
        //     $line_items[] = [
        //         'item_no' => 'tax',
        //         'item_name' => __('Tax', 'kirki-ecommerce-quickpay'),
        //         'qty' => 1,
        //         'item_price' => (int) $this->order->invoiced_tax_total,
        //         'vat_rate' => 0
        //     ];
        // }

        return $line_items;
    }
}
