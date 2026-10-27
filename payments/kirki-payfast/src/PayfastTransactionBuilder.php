<?php

namespace Kirki\Ecommerce\Payments;

use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Supports\Url;

defined('ABSPATH') || exit;

/**
 * Builds the fields PayFast's hosted checkout form is posted with.
 */
class PayfastTransactionBuilder
{
    protected Order $order;

    /**
     * @param Order $order The order being paid.
     */
    public function __construct(Order $order)
    {
        $this->order = $order;
    }

    /**
     * Build the checkout form fields, in the order PayFast signs them.
     *
     * @param string $merchant_id The PayFast merchant ID.
     * @param string $merchant_key The PayFast merchant key.
     * @param string $webhook_url The URL PayFast sends its ITN callback to.
     *
     * @return array<string, string|int>
     */
    public function build_checkout_fields($merchant_id, $merchant_key, $webhook_url): array
    {
        $total_amount = $this->get_total_amount();

        return [
            'merchant_id' => $merchant_id,
            'merchant_key' => $merchant_key,
            'return_url' => Url::get_checkout_success_url($this->order->uuid),
            'cancel_url' => Url::get_checkout_failed_url($this->order->uuid),
            'notify_url' => $webhook_url,
            'name_first' => $this->order->customer_first_name ?: ($this->order->billing_first_name ?: ''),
            'name_last' => $this->order->customer_last_name ?: ($this->order->billing_last_name ?: ''),
            'email_address' => $this->order->customer_email ?: ($this->order->billing_email ?: ''),
            'm_payment_id' => $this->order->uuid,
            'amount' => $total_amount,
            'item_name' => $this->get_site_name() . ' - ' . $this->order->order_number,
            'custom_str1' => wp_json_encode(['total_amount' => $total_amount]),
            'email_confirmation' => 1,
        ];
    }

    /**
     * Get the order total as the two-decimal string PayFast expects.
     *
     * @return float
     */
    protected function get_total_amount(): float
    {
        return Money::of_minor($this->order->invoiced_total, $this->order->currency_code)
                    ->getAmount()
                    ->toFloat();
    }

    /**
     * Get the site name, with HTML entities decoded for PayFast's item label.
     *
     * @return string
     */
    protected function get_site_name(): string
    {
        return html_entity_decode(get_bloginfo('name'), ENT_QUOTES, get_bloginfo('charset'));
    }
}
