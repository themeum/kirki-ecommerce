<?php

namespace Kirki\Ecommerce\Payments;

use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Payment\PaymentProvider;
use Kirki\Ecommerce\App\Supports\Url;

defined('ABSPATH') || exit;

/**
 * Builds Authorize.Net request payloads and interprets transaction status.
 *
 */
class KlarnaTransactionBuilder
{
    protected Order $order;

    public function __construct(Order $order)
    {
        $this->order = $order;
    }

    public function format_address($type)
    {
        if (empty($this->order->{$type . '_address_line1'})) {
            return new \stdclass();
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

    public function get_line_items()
    {
        $line_items = [];

        foreach ($this->order->items as $item) {
            $line_items[] = [
                'name' => $item['product_name'],
                'quantity' => (int) $item['quantity'],
                'total_amount' => (int) $item['invoiced_total'],
                'total_discount_amount' => (int) $item['invoiced_discount_amount'],
                'total_tax_amount' => (int) $item['invoiced_tax_total'],
                'unit_price' => (int) $item['invoiced_price'],
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
