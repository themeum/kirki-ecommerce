<?php

namespace Kirki\Ecommerce\App\Http\Requests\Review;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\Http\Request;
use Kirki\Ecommerce\Framework\Sanitizer;

use function Kirki\Ecommerce\Framework\user;

/**
 * Validates and sanitizes the payload for submitting a product review.
 *
 * @since 1.0.1
 */
class ReviewCreateRequest extends Request
{
    /**
     * Prepare user and author details before validation when logged in.
     *
     * @since 1.0.1
     *
     * @return void
     */
    protected function prepare_for_validation()
    {
        if (is_user_logged_in()) {
            $current_user = wp_get_current_user();
            if (empty($this->input('author_name'))) {
                $this->merge(['author_name' => $current_user->display_name ?: $current_user->user_nicename]);
            }
            if (empty($this->input('author_email'))) {
                $this->merge(['author_email' => $current_user->user_email]);
            }
            $this->merge(['user_id' => (int) $current_user->ID]);
        }
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.1
     */
    public function rules()
    {
        return [
            'product_id' => 'required|integer',
            'rating' => 'required|integer|min:1|max:5',
            'title' => 'nullable|string|max:255',
            'content' => 'required|string|max:5000',
            'author_name' => 'required|string|max:255',
            'author_email' => 'required|email|max:255',
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
            'rating' => Sanitizer::INT,
            'title' => Sanitizer::TEXT,
            'content' => Sanitizer::TEXTAREA,
            'author_name' => Sanitizer::TEXT,
            'author_email' => Sanitizer::EMAIL,
        ];
    }
}
