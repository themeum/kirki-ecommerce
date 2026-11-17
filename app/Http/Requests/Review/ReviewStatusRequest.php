<?php

namespace Kirki\Ecommerce\App\Http\Requests\Review;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\Review\ReviewStatus;
use Kirki\Ecommerce\Framework\Http\Request;
use Kirki\Ecommerce\Framework\Sanitizer;

/**
 * Validates and sanitizes the payload for changing the status of a review.
 *
 * @since 1.0.1
 */
class ReviewStatusRequest extends Request
{
    /**
     * @inheritDoc
     *
     * @since 1.0.1
     */
    public function rules()
    {
        return [
            'status' => 'required|string|in:' . ReviewStatus::join(),
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
            'status' => Sanitizer::TEXT,
        ];
    }
}
