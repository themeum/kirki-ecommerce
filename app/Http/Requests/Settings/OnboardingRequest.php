<?php

namespace Kirki\Ecommerce\App\Http\Requests\Settings;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Services\CurrencyService;
use Kirki\Ecommerce\App\Supports\CountryData;
use Kirki\Ecommerce\Framework\Http\Request;
use Kirki\Ecommerce\Framework\Sanitizer;

use function Kirki\Ecommerce\Framework\app;

/**
 * Validates and sanitizes the store onboarding payload.
 *
 * @since 1.0.0
 */
class OnboardingRequest extends Request
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function rules()
    {
        return [
            'store_name' => 'required|string',
            'industry' => 'nullable|string',
            'country' => [
                'required',
                'string',
                function ($value) {
                    if (empty(CountryData::find_index_entry((string) $value))) {
                        return __('The selected country is not supported.', 'kirki-ecommerce');
                    }

                    return true;
                },
            ],
            'store_address' => 'nullable|array',
            'store_address.address_line_1' => 'nullable|string',
            'store_address.address_line_2' => 'nullable|string',
            'store_address.city' => 'nullable|string',
            'store_address.state' => 'nullable|string',
            'store_address.postal_code' => 'nullable|string',
            'currency' => [
                'required',
                'string',
                function ($value) {
                    if (empty(app()->make(CurrencyService::class)->find_definition((string) $value))) {
                        return __('The selected currency is not supported.', 'kirki-ecommerce');
                    }

                    return true;
                },
            ],
            'is_tax_collected' => 'required|boolean',
            'is_tax_inclusive_price' => 'nullable|boolean',
            'store_tax_id' => 'nullable|string',
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
            'store_name' => Sanitizer::TEXT,
            'industry' => Sanitizer::TEXT,
            'country' => Sanitizer::TEXT,
            'store_address' => Sanitizer::ARRAY,
            'store_address.address_line_1' => Sanitizer::TEXT,
            'store_address.address_line_2' => Sanitizer::TEXT,
            'store_address.city' => Sanitizer::TEXT,
            'store_address.state' => Sanitizer::TEXT,
            'store_address.postal_code' => Sanitizer::TEXT,
            'currency' => Sanitizer::TEXT,
            'is_tax_collected' => Sanitizer::BOOL,
            'is_tax_inclusive_price' => Sanitizer::BOOL,
            'store_tax_id' => Sanitizer::TEXT,
        ];
    }
}
