<?php

/**
 * Utility Functions
 *
 * @package Kirki\Ecommerce\App\Supports
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

namespace Kirki\Ecommerce\App\Supports;

use Kirki\Ecommerce\Framework\Supports\Arr;

/**
 * Class Utils
 *
 * @since 1.0.0
 */
class Utils
{
    /**
     * Check nonce is valid or not.
     *
     * @since 1.0.0
     *
     * @param string $request_method request method.
     *
     * @return bool
     */
    public static function is_nonce_verified($request_method = null): bool
    {
        $request_method = !$request_method ? sanitize_text_field($_SERVER['REQUEST_METHOD']) : $request_method;
        $data = strtolower($request_method) === 'post' ? $_POST : $_GET;
        $nonce_value = sanitize_text_field(Arr::get($data, 'ajax_nonce'));

        return wp_verify_nonce($nonce_value, 'kirki_ecommerce_nonce') !== false;
    }
}
