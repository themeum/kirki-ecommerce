<?php

namespace Kirki\Ecommerce\App\Resources\Site\Order;

use Kirki\Ecommerce\App\Constants\Order\FulfillmentStatus;
use Kirki\Ecommerce\Framework\Resource;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\App\Supports\Assets;
use Kirki\Ecommerce\Framework\Supports\MediaAttachment;

class OrderListResource extends Resource
{
    public function to_array()
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'order_number' => $this->order_number,
            'customer_id' => $this->customer_id,
            'customer_name' => $this->resolve_customer_name(),
            'customer_email' => $this->customer_email,
            'is_manual' => $this->is_manual,
            'quantity' => $this->items_count,
            'items_images' => $this->get_items_images(),
            'invoiced_total' => Money::prepare_amount_from_minor($this->invoiced_total, $this->currency_code),
            'invoiced_total_money_object' => Money::prepare_amount_object_from_minor($this->invoiced_total, $this->currency_code),
            'base_total' => Money::prepare_amount_from_minor($this->base_total),
            'base_total_money_object' => Money::prepare_amount_object_from_minor($this->base_total),
            'status' => $this->order_status,
            'fulfillment_status' => FulfillmentStatus::get_formatted($this->fulfillment_status),
            'fulfillment_status_desc' => $this->get_fulfillment_status_desc(),
            'is_refund_initiated' => $this->is_refund_initiated,
            'payment_status' => $this->payment_status,
            'payment_provider' => $this->payment_provider,
            'payment_provider_name' => $this->payment_metadata['payment_provider']['name'] ?? null,
            'payment_provider_icon' => $this->payment_metadata['payment_provider']['icon'] ?? null,
            'payment_provider_is_offline' => $this->payment_metadata['payment_provider']['is_offline'] ?? null,
            'shipping_method' => $this->shipping_method,
            'shipping_method_name' => $this->shipping_metadata['shipping_method']['name'] ?? null,
            'created_at' => $this->created_at,
        ];
    }

    /**
     * Get items images.
     *
     * @since 1.0.0
     *
     * @return array
     */
    protected function get_items_images(): array
    {
        $defaultImage = Assets::get_url('images/product-fallback.webp');

        $images = $this->items
            ->map(function ($item) {
                $media = MediaAttachment::make($item->product_image);
                return $media['url'] ?? null;
            })
            ->filter()
            ->values()
            ->all();

        return $images ?: [$defaultImage];
    }

    /**
     * Get fulfillment status description.
     *
     * @since 1.0.0
     *
     * @return string
     */
    protected function get_fulfillment_status_desc()
    {
        // TODO: need to populate this based on order status, payment status.
        switch ($this->fulfillment_status) {
            case FulfillmentStatus::UNFULFILLED:
                return __('Not fulfilled', 'kirki-ecommerce');
            case FulfillmentStatus::PROCESSING:
                return __('In progress', 'kirki-ecommerce');
            case FulfillmentStatus::SHIPPED:
                return __('Shipped', 'kirki-ecommerce');
            case FulfillmentStatus::DELIVERED:
                /* translators: %s: delivery date */
                return sprintf(__('Delivered on %s', 'kirki-ecommerce'), gmdate('M d, Y', strtotime($this->delivered_at)));
            case FulfillmentStatus::ON_HOLD:
                return __('On hold', 'kirki-ecommerce');
            case FulfillmentStatus::CANCELLED:
                return __('Cancelled', 'kirki-ecommerce');
            case FulfillmentStatus::RETURNED:
                return __('Returned', 'kirki-ecommerce');
            default:
                return '';
        }
    }

    /**
     * Build the customer name from the customer name pair.
     *
     * @return string|null
     */
    protected function resolve_customer_name()
    {
        $name = trim($this->customer_first_name . ' ' . $this->customer_last_name);

        return '' === $name ? null : $name;
    }
}
