<?php

namespace Kirki\Ecommerce\App\Resources\Site\Order;

use Kirki\Ecommerce\App\Constants\Order\FulfillmentStatus;
use Kirki\Ecommerce\App\Payment\Facades\Payment;
use Kirki\Ecommerce\App\Resources\Order\OrderResource as BaseOrderResource;
use Kirki\Ecommerce\App\Services\CountryService;

use function Kirki\Ecommerce\Framework\app;

class OrderResource extends BaseOrderResource
{
    public function to_array()
    {
        return array_merge(parent::to_array(), [
            'shipping_country' => app(CountryService::class)->find($this->shipping_country),
            'billing_country' => app(CountryService::class)->find($this->billing_country),
            'formatted_status' => FulfillmentStatus::format_fulfillment_status($this->fulfillment_status),
            'payment_next_step' => Payment::pay($this->resource),
            'item_product_data' => $this->items->map(function ($item) {
                return $item->product_data;
            })->to_array(),
            'updated_at' => $this->updated_at,
            'order_timeline' => [
                'paid_at' => ['status' => __('Payment Confirmed', 'kirki-ecommerce'), 'date' => $this->paid_at],
                'shipped_at' => ['status' => __('Order Shipped', 'kirki-ecommerce'), 'date' => $this->shipped_at],
                'cancelled_at' => ['status' => __('Order Cancelled', 'kirki-ecommerce'), 'date' => $this->cancelled_at],
                'delivered_at' => ['status' => __('Order Delivered', 'kirki-ecommerce'), 'date' => $this->delivered_at],
            ]
        ]);
    }
}
