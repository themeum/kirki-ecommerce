<?php

namespace Kirki\Ecommerce\App\Http\Requests\Review;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\Review\ReviewStatus;
use Kirki\Ecommerce\Framework\Http\Request;
use Kirki\Ecommerce\Framework\Sanitizer;

/**
 * Validates and sanitizes the payload for updating a product review.
 *
 * @since 1.0.1
 */
class ReviewUpdateRequest extends Request
{
    /**
     * @inheritDoc
     *
     * @since 1.0.1
     */
    public function rules()
    {
        return [
            'rating' => 'nullable|integer|min:1|max:5',
            'title' => 'nullable|string|max:255',
            'content' => 'nullable|string|max:5000',
            'status' => 'nullable|string|in:' . ReviewStatus::join(),
            'admin_reply' => 'nullable|string|max:5000',
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
            'rating' => Sanitizer::INT,
            'title' => Sanitizer::TEXT,
            'content' => Sanitizer::TEXTAREA,
            'status' => Sanitizer::TEXT,
            'admin_reply' => Sanitizer::TEXTAREA,
        ];
    }
}
