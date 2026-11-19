<?php

namespace Kirki\Ecommerce\App\Http\Requests\Order;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\Order\OrderAction;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Services\OrderService;
use Kirki\Ecommerce\App\Services\ShippingService;
use Kirki\Ecommerce\App\Supports\TrackingUrl;
use Kirki\Ecommerce\Framework\Http\Request;
use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Validation\Rule;

use function Kirki\Ecommerce\Framework\app;

/**
 * Validates and sanitizes the payload for running an action on an order.
 *
 * @since 1.0.0
 */
class OrderActionRequest extends Request
{
    /**
     * Convert the submitted amount to minor units.
     *
     * Skipped when the amount is empty.
     *
     * @since 1.0.0
     *
     * @return void
     */
    protected function prepare_for_validation()
    {
        $amount = $this->input('amount');

        if (!empty($amount)) {
            $this->merge(['amount' => Money::to_minor($amount)]);
        }
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function rules()
    {
        $is_add_tracking = $this->input('action') === OrderAction::ADD_TRACKING;

        return [
            'id' => 'required|integer',
            'action' => 'required|in:' . OrderAction::join(','),
            'refund_id' => 'required_if:action,' . OrderAction::APPROVE_REFUND . ',' . OrderAction::DECLINE_REFUND . '|nullable|integer',
            'amount' => 'required_if:action,' . OrderAction::INITIATE_REFUND . '|nullable|number|gt:0',
            'carrier' => [
                Rule::required_if(fn() => $is_add_tracking && empty($this->input('carrier_id'))),
                Rule::prohibited_if(fn() => !empty($this->input('carrier_id'))),
                'nullable',
                'string'
            ],
            'carrier_id' => [
                Rule::required_if(fn() => $is_add_tracking && empty($this->input('carrier'))),
                Rule::prohibited_if(fn() => !empty($this->input('carrier'))),
                'nullable',
                'string',
                function ($carrier_id) {
                    if (empty(trim($carrier_id))) {
                        return true;
                    }

                    $order = app()->make(OrderService::class)->find_order_or_fail($this->get_int('id'));
                    $carrier = app()->make(ShippingService::class)->find_carrier_for_address([
                        'country' => $order->shipping_country,
                        'state' => $order->shipping_state,
                    ], (string) $carrier_id);

                    return $carrier !== null ? true : __('This carrier is not available for the order\'s shipping zone.', 'kirki-ecommerce');
                }
            ],
            'tracking_number' => [
                Rule::required_if(fn() => !empty($this->input('carrier')) || !empty($this->input('carrier_id'))),
                'nullable',
                'string'
            ],
            'tracking_url' => [
                Rule::required_if(fn() => !empty($this->input('carrier'))),
                'nullable',
                'string',
                function ($url) {
                    return $url === '' || TrackingUrl::has_allowed_scheme($url) ? true : __('The URL must start with http:// or https://.', 'kirki-ecommerce');
                }
            ],
            'reason' => 'nullable|string',
            'payment_provider' => 'required_if:action,' . OrderAction::MARK_AS_PAID . '|nullable|string',
            'notify_customer' => 'nullable|boolean',
        ];
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function filters()
    {
        return [
            'id' => Sanitizer::INT,
            'action' => Sanitizer::TEXT,
            'refund_id' => Sanitizer::INT,
            'amount' => Sanitizer::INT,
            'carrier_id' => Sanitizer::TEXT,
            'carrier' => Sanitizer::TEXT,
            'tracking_number' => Sanitizer::TEXT,
            'tracking_url' => function ($url) {
                return TrackingUrl::sanitize_template($url);
            },
            'reason' => Sanitizer::TEXT,
            'payment_provider' => Sanitizer::TEXT,
            'notify_customer' => Sanitizer::BOOL,
        ];
    }
}
