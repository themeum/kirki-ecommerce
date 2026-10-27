<?php

namespace Kirki\Ecommerce\App\Http\Requests\Analytics;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Supports\CountryData;
use Kirki\Ecommerce\Framework\Sanitizer;

/**
 * Validates and sanitizes the country, the range and the comparison of an analytics regions request.
 *
 * @since 1.0.0
 */
class AnalyticsRegionsRequest extends AnalyticsMetricRequest
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function rules()
    {
        return array_merge(parent::rules(), [
            'country' => 'required|string|in:' . implode(',', array_keys(CountryData::index())),
        ]);
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function filters()
    {
        return array_merge(parent::filters(), [
            'country' => Sanitizer::TEXT,
        ]);
    }
}
