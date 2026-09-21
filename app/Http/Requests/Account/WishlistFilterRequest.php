<?php

/**
 * Account Wishlist Page Request Handler.
 *
 * @package Kirki\Ecommerce\App\Http\Requests\Account
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

namespace Kirki\Ecommerce\App\Http\Requests\Account;

use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;


/**
 * Validates and sanitizes the payload for filtering the account wishlist page.
 *
 * @since 1.0.0
 */
class WishlistFilterRequest extends Request
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function rules()
    {
        return [
            'current_page' => 'nullable|integer',
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
            'current_page' => Sanitizer::INT,
        ];
    }
}