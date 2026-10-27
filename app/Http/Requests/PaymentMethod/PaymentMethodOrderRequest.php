<?php

namespace Kirki\Ecommerce\App\Http\Requests\PaymentMethod;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Payment\Facades\Payment;
use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;

/**
 * Validates and sanitizes the payload for saving the payment method order.
 *
 * @since 1.0.0
 */
class PaymentMethodOrderRequest extends Request
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function rules()
    {
        return [
            'ids' => ['required', 'array', $this->registered_distinct_provider_ids()],
            'ids.*' => 'required|string',
        ];
    }

    /**
     * Build a closure rule that accepts only distinct IDs of registered payment providers.
     *
     * @since 1.0.0
     *
     * @return \Closure Rule callback returning true when every ID is a distinct registered provider ID, or an error message.
     */
    protected function registered_distinct_provider_ids()
    {
        return function ($ids) {
            if (!is_array($ids)) {
                return true;
            }

            $string_ids = array_filter($ids, 'is_string');

            if (count(array_unique($string_ids)) !== count($string_ids)) {
                return __('Each payment method can appear only once.', 'kirki-ecommerce');
            }

            foreach ($string_ids as $id) {
                if (!Payment::get_provider($id)) {
                    return __('One or more payment methods do not exist.', 'kirki-ecommerce');
                }
            }

            return true;
        };
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function filters()
    {
        return [
            'ids.*' => Sanitizer::TEXT,
        ];
    }
}
