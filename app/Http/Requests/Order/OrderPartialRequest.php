<?php

namespace Kirki\Ecommerce\App\Http\Requests\Order;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Validation\Rule;
use Kirki\Ecommerce\Framework\Http\Request;

/**
 * Validates and sanitizes the payload for a partial order update of the note and flags.
 *
 * @since 1.0.0
 */
class OrderPartialRequest extends Request
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function rules()
    {
        // A sent null is a value (it clears the field), so check the key and not has(), which skips nulls.
        $input = $this->all();
        $has_no_field = !array_key_exists('order_notes', $input) && !array_key_exists('flags', $input);

        return [
            'id' => 'required|integer',
            'order_notes' => [Rule::required_if(fn() => $has_no_field), 'nullable', 'string'],
            'flags' => 'nullable|array',
            'flags.*' => 'string',
        ];
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function messages()
    {
        return [
            'order_notes.required' => __('Send order_notes, flags, or both.', 'kirki-ecommerce'),
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
            'order_notes' => Sanitizer::TEXTAREA,
            'flags' => Sanitizer::ARRAY,
            'flags.*' => Sanitizer::TEXT,
        ];
    }
}
