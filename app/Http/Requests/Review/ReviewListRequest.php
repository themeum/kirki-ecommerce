<?php

namespace Kirki\Ecommerce\App\Http\Requests\Review;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\Review\ReviewStatus;
use Kirki\Ecommerce\Framework\Http\Request;
use Kirki\Ecommerce\Framework\Sanitizer;

/**
 * Validates and sanitizes the payload for filtering the reviews list.
 *
 * @since 1.0.1
 */
class ReviewListRequest extends Request
{
    /**
     * @inheritDoc
     *
     * @since 1.0.1
     */
    public function rules()
    {
        return [
            'product_id' => 'nullable|integer',
            'status' => 'nullable|string|in:' . ReviewStatus::join() . ',all',
            'rating' => 'nullable|integer|min:1|max:5',
            'search' => 'nullable|string',
            'page' => 'nullable|integer|min:1',
            'limit' => 'nullable|integer',
            'sort_by' => 'nullable|string',
            'sort_order' => 'nullable|string|in:asc,desc',
        ];
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.1
     */
    public function filters()
    {
        return [
            'product_id' => Sanitizer::INT,
            'status' => Sanitizer::TEXT,
            'rating' => Sanitizer::INT,
            'search' => Sanitizer::TEXT,
            'page' => Sanitizer::INT,
            'limit' => Sanitizer::INT,
            'sort_by' => Sanitizer::TEXT,
            'sort_order' => Sanitizer::TEXT,
        ];
    }
}
