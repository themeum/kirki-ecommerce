<?php

namespace Kirki\Ecommerce\App\Resources\Site\Order;

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
            'status' => $this->format_order_status(),
            'payment_next_step' => Payment::pay($this->resource),
        ]);
    }

    protected function format_order_status()
    {
        switch ($this->order_status) {
            case 'pending':
                return __('Pending', 'kirki-ecommerce');
            case 'on-hold':
                return __('On Hold', 'kirki-ecommerce');
            case 'processing':
                return __('Processing', 'kirki-ecommerce');
            case 'completed':
                return __('Completed', 'kirki-ecommerce');
            case 'cancelled':
                return __('Cancelled', 'kirki-ecommerce');
            case 'refunded':
                return __('Refunded', 'kirki-ecommerce');
            case 'failed':
                return __('Failed', 'kirki-ecommerce');
            default:
                return __('Unknown', 'kirki-ecommerce');
        }
    }
}
