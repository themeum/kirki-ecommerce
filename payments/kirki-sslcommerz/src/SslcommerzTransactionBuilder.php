<?php

namespace Kirki\Ecommerce\Payments;

use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Payment\PaymentProvider;
use Kirki\Ecommerce\App\Supports\CountryData;

defined('ABSPATH') || exit;

/**
 * Builds SSLCommerz session payloads.
 */
class SslcommerzTransactionBuilder
{
    /** @var Order */
    protected Order $order;

    /**
     * @param Order $order The order to build the SSLCommerz payload for.
     */
    public function __construct(Order $order)
    {
        $this->order = $order;
    }

    /**
     * Build the payload for the SSLCommerz session endpoint.
     *
     * The store credentials are not part of this payload. The client adds them.
     *
     * @param string               $tran_id The transaction ID of this session.
     * @param array<string, string> $urls    The success_url, fail_url, cancel_url and ipn_url.
     * @return array<string, mixed>
     */
    public function build_session_payload(string $tran_id, array $urls): array
    {
        $has_shipping = !empty($this->order->shipping_address_line1);

        return array_merge(
            $urls,
            [
                'total_amount' => PaymentProvider::format_amount($this->order->invoiced_total, $this->order->currency_code),
                'currency' => strtoupper($this->order->currency_code),
                'tran_id' => $tran_id,
                'product_name' => $this->product_names(),
                'product_category' => SslcommerzConstant::PRODUCT_CATEGORY,
                'product_profile' => $has_shipping ? SslcommerzConstant::PROFILE_PHYSICAL : SslcommerzConstant::PROFILE_NON_PHYSICAL,
                'num_of_item' => $this->item_count(),
                'shipping_method' => $has_shipping ? SslcommerzConstant::SHIPPING_YES : SslcommerzConstant::SHIPPING_NO,
            ],
            $this->customer_fields(),
            $has_shipping ? $this->shipping_fields() : []
        );
    }

    /**
     * Build the customer fields, from the billing address, then the shipping address, then the customer.
     *
     * @return array<string, string>
     */
    protected function customer_fields(): array
    {
        $name = trim(
            $this->first_value(['billing_first_name', 'customer_first_name', 'shipping_first_name'])
            . ' '
            . $this->first_value(['billing_last_name', 'customer_last_name', 'shipping_last_name'])
        );

        return [
            'cus_name' => $this->cut($name),
            'cus_email' => $this->cut($this->first_value(['billing_email', 'shipping_email', 'customer_email'])),
            'cus_add1' => $this->cut($this->first_value(['billing_address_line1', 'shipping_address_line1'])),
            'cus_add2' => $this->cut($this->first_value(['billing_address_line2', 'shipping_address_line2'])),
            'cus_city' => $this->cut($this->first_value(['billing_city', 'shipping_city'])),
            'cus_state' => $this->cut($this->first_value(['billing_state', 'shipping_state'])),
            'cus_postcode' => $this->cut($this->first_value(['billing_postal_code', 'shipping_postal_code']), SslcommerzConstant::MAX_POSTCODE_LENGTH),
            'cus_country' => $this->cut($this->country_name($this->first_value(['billing_country', 'shipping_country']))),
            'cus_phone' => $this->cut($this->first_value(['billing_phone', 'shipping_phone', 'customer_phone']), SslcommerzConstant::MAX_PHONE_LENGTH),
        ];
    }

    /**
     * Build the shipping fields. The docs mark ship_area and ship_sub_city as mandatory, and the
     * order has only a city for them.
     *
     * @return array<string, string>
     */
    protected function shipping_fields(): array
    {
        $city = $this->cut((string) $this->order->shipping_city);

        return [
            'ship_name' => $this->cut(trim($this->order->shipping_first_name . ' ' . $this->order->shipping_last_name)),
            'ship_add1' => $this->cut((string) $this->order->shipping_address_line1),
            'ship_add2' => $this->cut((string) $this->order->shipping_address_line2),
            'ship_area' => $city,
            'ship_city' => $city,
            'ship_sub_city' => $city,
            'ship_state' => $this->cut((string) $this->order->shipping_state),
            'ship_postcode' => $this->cut((string) $this->order->shipping_postal_code, SslcommerzConstant::MAX_POSTCODE_LENGTH),
            'ship_country' => $this->cut($this->country_name((string) $this->order->shipping_country)),
        ];
    }

    /**
     * Get the comma-separated names of the order items.
     *
     * @return string
     */
    protected function product_names(): string
    {
        $names = [];

        foreach ($this->order->items as $item) {
            $names[] = (string) $item->product_name;
        }

        return mb_substr(implode(',', $names), 0, SslcommerzConstant::MAX_PRODUCT_NAME_LENGTH);
    }

    /**
     * Get the total quantity of the order items.
     *
     * @return int
     */
    protected function item_count(): int
    {
        $count = 0;

        foreach ($this->order->items as $item) {
            $count += (int) $item->quantity;
        }

        return $count;
    }

    /**
     * Get the first order attribute that has a value.
     *
     * @param string[] $attributes The order attribute names, in order of preference.
     * @return string
     */
    protected function first_value(array $attributes): string
    {
        foreach ($attributes as $attribute) {
            $value = (string) $this->order->{$attribute};

            if ($value !== '') {
                return $value;
            }
        }

        return '';
    }

    /**
     * Get a country name from its code. The docs show a country name in these fields.
     *
     * @param string $code The country code.
     * @return string The name, or the code when it is not known.
     */
    protected function country_name(string $code): string
    {
        return $code === '' ? '' : (string) (CountryData::get_country_name($code) ?? $code);
    }

    /**
     * Cut a value to the length limit of its SSLCommerz field.
     *
     * @param string $value The value.
     * @param int    $limit The maximum length.
     * @return string
     */
    protected function cut(string $value, int $limit = SslcommerzConstant::MAX_FIELD_LENGTH): string
    {
        return mb_substr($value, 0, $limit);
    }
}
