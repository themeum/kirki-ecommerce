<?php

namespace Kirki\Ecommerce\App\Http\Requests\OfflinePayment;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;

/**
 * Validates and sanitizes the payload for updating an offline payment method.
 *
 * @since 1.0.0
 */
class OfflinePaymentUpdateRequest extends Request
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function rules()
    {
        return [
            'id' => 'required|string',
            'name' => 'required|string',
            'icon' => 'nullable|integer',
            'is_enabled' => 'nullable|boolean',
            'is_offline' => 'nullable|boolean',
            'instructions' => 'nullable|string',
            'config' => 'nullable|array',
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
            'id' => Sanitizer::TEXT,
            'name' => Sanitizer::TEXT,
            'icon' => Sanitizer::INT,
            'is_enabled' => Sanitizer::BOOL,
            'is_offline' => Sanitizer::BOOL,
            'instructions' => Sanitizer::RICH_TEXT,
            'config' => Sanitizer::ARRAY,
        ];
    }
}
