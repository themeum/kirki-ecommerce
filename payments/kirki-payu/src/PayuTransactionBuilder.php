<?php

namespace Kirki\Ecommerce\Payments;

use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Supports\Url;

defined('ABSPATH') || exit;

/**
 * Builds Square request payloads and interprets transaction status.
 *
 */
class PayuTransactionBuilder
{
    protected Order $order;
    public function __construct(Order $order)
    {
        $this->order = $order;
    }

    public function build_order_payload()
    {
        return [
            'continueUrl' => Url::get_checkout_success_url($this->order->uuid),
            'customerIp' => $this->order->ip_address ?? $this->get_ip_address(),
            'description' => '# ' . $this->order->order_number . ' ' . get_bloginfo('name'),
            'extOrderId' => $this->order->uuid,
            'currencyCode' => strtoupper($this->order->currency_code),
            'totalAmount' => (string) $this->order->invoiced_total,
            'buyer' => $this->get_buyer_info(),
            'products' => $this->get_line_items(),
        ];
    }
    /**
     * Build Square order line_items for an order's items, shipping, and tax.
     *
     * @return array
     */
    protected function get_line_items(): array
    {
        $line_items = [];

        foreach ($this->order->items as $item) {
            $line_items[] = $this->make_line_item($item->product_name, (string) $item->invoiced_price, (string) $item->quantity);
        }

        if (!empty($this->order->invoiced_shipping_total)) {
            $line_items[] = $this->make_line_item(
                __('Shipping Charge', 'kirki-ecommerce-payu'),
                (string) $this->order->invoiced_shipping_total
            );
        }

        if (!empty($this->order->invoiced_tax_total)) {
            $tax_without_shipping = $this->order->invoiced_tax_total - $this->order->invoiced_shipping_tax_amount ?? 0;
            $line_items[] = $this->make_line_item(__('Tax', 'kirki-ecommerce-payu'), (string) $tax_without_shipping);
        }

        return $line_items;
    }

    protected function get_ip_address()
    {
        $client_ip = false;

        $address_headers = array(
            'HTTP_CLIENT_IP',
            'HTTP_X_FORWARDED_FOR',
            'HTTP_X_FORWARDED',
            'HTTP_X_CLUSTER_CLIENT_IP',
            'HTTP_FORWARDED_FOR',
            'HTTP_FORWARDED',
            'REMOTE_ADDR',
        );

        foreach ($address_headers as $header) {
            if (array_key_exists($header, $_SERVER)) {
                /**
                 * HTTP_X_FORWARDED_FOR can contain a chain of comma-separated
                 * addresses. The first one is the original client. It can't be
                 * trusted for authenticity, but we don't need to for this purpose.
                 **/
                $address_chain = explode(',', sanitize_text_field($_SERVER[$header]));
                $client_ip     = trim($address_chain[0]);
                break;
            }
        }

        if (!rest_is_ip_address($client_ip)) {
            return false;
        }

        // Sanitize the IP
        $client_ip = preg_replace('/[^0-9a-fA-F:., ]/', '', $client_ip);

        // Check if it's a valid IPv4 or IPv6 address.
        if (! filter_var($client_ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4) && ! filter_var($client_ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6)) {
            return false;
        }

        return $client_ip;
    }

    protected function get_buyer_info()
    {
        return [
            'email' => $this->order->billing_email ?? $this->order->customer_email,
            'phone' => $this->order->billing_phone,
            'firstName' => $this->order->billing_first_name,
            'lastName' => $this->order->billing_last_name,
            'delivery' => [
                'street' => $this->order->shipping_address_line1,
                'postalBox' => $this->order->shipping_address_line2,
                'postalCode' => $this->order->shipping_postal_code,
                'city' => $this->order->shipping_city,
                'state' => $this->order->shipping_state,
                'countryCode' => $this->order->shipping_country,
                'recipientName' => $this->order->shipping_first_name,
                'recipientPhone' => $this->order->shipping_phone,
                'recipientEmail' => $this->order->shipping_email ?? $this->order->customer_email
            ]
        ];
    }

    protected function make_line_item(string $name, string $amount, string $quantity = '1'): array
    {
        return [
            'name' => $name,
            'unitPrice' => $amount,
            'quantity' => $quantity,
        ];
    }
}
