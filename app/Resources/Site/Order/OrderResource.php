<?php

namespace Kirki\Ecommerce\App\Resources\Site\Order;

use Exception;
use Kirki\Ecommerce\App\Constants\Order\FulfillmentStatus;
use Kirki\Ecommerce\App\Constants\Order\PaymentStatus;
use Kirki\Ecommerce\App\Constants\Payment\PaymentActionType;
use Kirki\Ecommerce\App\DTO\Payment\PaymentActionDTO;
use Kirki\Ecommerce\App\Payment\Facades\Payment;
use Kirki\Ecommerce\App\Resources\Order\OrderResource as BaseOrderResource;
use Kirki\Ecommerce\App\Services\CountryService;
use Kirki\Ecommerce\App\Supports\Url;

use function Kirki\Ecommerce\App\customer;
use function Kirki\Ecommerce\Framework\app;

class OrderResource extends BaseOrderResource
{
    public function to_array()
    {
        return array_merge(parent::to_array(), [
            'shipping_country' => app(CountryService::class)->find($this->shipping_country),
            'billing_country' => app(CountryService::class)->find($this->billing_country),
            'formatted_status' => FulfillmentStatus::get_formatted($this->fulfillment_status),
            'payment_next_step' => $this->resolve_payment_next_step(),
            'item_product_data' => $this->items->map(function ($item) {
                return $item->product_data;
            })->to_array(),
            'updated_at' => $this->updated_at,
            'customer' => $this->customer_id ? customer(null, $this->customer_id)->get_customer() : [],
        ]);
    }

    /**
     * Resolve the payment action the shopper still has to take, if any.
     *
     * Payment::pay() opens a live session with the gateway, so it must only run
     * for an order that is still awaiting payment - this resource also renders
     * historical orders in the account area.
     *
     * @return \Kirki\Ecommerce\App\DTO\Payment\PaymentActionDTO|null
     */
    protected function resolve_payment_next_step()
    {
        $settled_statuses = [PaymentStatus::PAID, PaymentStatus::REFUNDING, PaymentStatus::REFUNDED];

        if (in_array($this->payment_status, $settled_statuses, true)) {
            return null;
        }

        if ($this->base_total <= 0) {
            return PaymentActionDTO::from_array([
                'type' => PaymentActionType::REDIRECT,
                'value' => Url::get_checkout_success_url($this->uuid),
            ]);
        }

        try {
            $payment_action = Payment::pay($this->resource);

            if ($payment_action instanceof PaymentActionDTO) {
                return $payment_action;
            }
        } catch (Exception $e) {
            return PaymentActionDTO::from_array([
                'type' => PaymentActionType::REDIRECT,
                'value' => Url::get_checkout_success_url($this->uuid),
            ]);
        }

        return;
    }
}
