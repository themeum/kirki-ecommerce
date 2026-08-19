<?php

namespace Kirki\Ecommerce\Payments;

use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Supports\Url;

defined('ABSPATH') || exit;

/**
 * Builds Klarna request payloads and interprets transaction status.
 *
 */
class KlarnaTransactionBuilder
{
    protected Order $order;

    /**
     * @param Order $order The order to build Klarna payloads for.
     */
    public function __construct(Order $order)
    {
        $this->order = $order;
    }

    /**
     * Build a Klarna address object for the order's billing or shipping address.
     *
     * @param string $type Either 'billing' or 'shipping'.
     * @return object An empty stdClass if the order has no address of that type.
     */
    public function format_address(string $type)
    {
        if (empty($this->order->{$type . '_address_line1'})) {
            return new \stdClass();
        }

        [$address_line1, $address_line2] = $this->split_address(99, $type);
        return (object) [
            'city'            => $this->order->{$type . '_city'},
            'country'         => $this->order->{$type . '_country'},
            'phone'           => $this->order->{$type . '_phone'},
            'postal_code'     => (string) $this->order->{$type . '_postal_code'},
            'region'          => $this->order->{$type . '_state'},
            'street_address'  => $address_line1,
            'street_address2' => $address_line2,
            'email'           => $this->order->{$type . '_email'},
            'given_name'      => $this->order->{$type . '_first_name'} ?? null,
            'family_name'     => $this->order->{$type . '_last_name'} ?? null,
        ];
    }

    /**
     * Split an order address into two Klarna-length-limited street address lines.
     *
     * @param int $max_length Maximum length of each returned line.
     * @param string $type Either 'billing' or 'shipping'.
     * @return array{0: string, 1: string}|array{} A [line1, line2] pair, or [] if the order has no address of that type.
     */
    protected function split_address(int $max_length, string $type): array
    {
        $line1 = (string) ($this->order->{$type . '_address_line1'} ?? '');
        $line2 = (string) ($this->order->{$type . '_address_line2'} ?? '');

        if (empty($line1) && empty($line2)) {
            return [];
        }

        // Line 1 fits — keep both lines as entered.
        if (mb_strlen($line1) <= $max_length) {
            return [$line1, mb_substr($line2, 0, $max_length)];
        }

        // Line 1 overflows — spill the remainder into line 2.
        $combined = trim($line1 . ' ' . $line2);

        return [
            mb_substr($combined, 0, $max_length),
            mb_substr($combined, $max_length, $max_length),
        ];
    }

    /**
     * Build Klarna order_lines entries for the order's items and shipping charge.
     *
     * @return array
     */
    public function get_line_items(): array
    {
        $line_items = [];

        foreach ($this->order->items as $item) {
            $line_items[] = [
                'name' => $item->product_name,
                'quantity' => (int) $item->quantity,
                'total_amount' => (int) $item->invoiced_total,
                'total_discount_amount' => (int) $item->invoiced_discount_amount,
                'total_tax_amount' => (int) $item->invoiced_tax_total,
                'unit_price' => (int) $item->invoiced_price,
            ];
        }

        if (!empty($this->order->invoiced_shipping_total)) {
            $line_items[] = [
                'name' => __('Shipping Charge', 'kirki-ecommerce-klarna'),
                'quantity' => 1,
                'total_amount' => (int) $this->order->invoiced_shipping_total,
                'unit_price' => (int) $this->order->invoiced_shipping_total,
            ];
        }

        return $line_items;
    }

    /**
     * Build the merchant_urls block for a Klarna HPP session.
     *
     * @param string $webhook_url URL Klarna should notify on order status changes.
     * @return array
     */
    public function get_merchant_urls(string $webhook_url): array
    {
        return[
            'back' => Url::get_checkout_failed_url($this->order->uuid),
            'cancel' => Url::get_checkout_failed_url($this->order->uuid),
            'error' => Url::get_checkout_failed_url($this->order->uuid),
            'failure' => Url::get_checkout_failed_url($this->order->uuid),
            'success' => Url::get_checkout_success_url($this->order->uuid),
            'status_update' => $webhook_url
        ];
    }
}
