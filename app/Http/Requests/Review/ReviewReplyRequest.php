<?php

namespace Kirki\Ecommerce\App\Http\Requests\Review;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\Http\Request;
use Kirki\Ecommerce\Framework\Sanitizer;

/**
 * Validates and sanitizes the payload for adding an admin reply to a review.
 *
 * @since 1.0.1
 */
class ReviewReplyRequest extends Request
{
    /**
     * @inheritDoc
     *
     * @since 1.0.1
     */
    public function rules()
    {
        return [
            'admin_reply' => 'required|string|max:5000',
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
            'admin_reply' => Sanitizer::TEXTAREA,
        ];
    }
}
