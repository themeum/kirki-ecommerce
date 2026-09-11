<?php

/**
 * Account Wishlist Page Request Handler.
 *
 * @package Kirki\Ecommerce\App\Http\Controllers\Account
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

namespace Kirki\Ecommerce\App\Http\Requests\Account;

use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;


/**
 * Class WishlistFilterRequest
 *
 * @since 1.0.0
 */
class WishlistFilterRequest extends Request
{
    /**
     * Validate the request.
     *
     * @since 1.0.0
     *
     * @return array
     */
    public function rules()
    {
        return [
            'current_page' => 'nullable|integer',
        ];
    }

    /**
     * Filters
     *
     * @since 1.0.0
     *
     * @return array
     */
    public function filters()
    {
        return [
            'current_page' => Sanitizer::INT,
        ];
    }
}