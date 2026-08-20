<?php

/**
* Handle site authentication
 *
 * @package Kirki\Ecommerce\App\Http\Middlewares
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

namespace Kirki\Ecommerce\App\Http\Middlewares;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Supports\Url;
use Kirki\Ecommerce\Framework\Contracts\Middleware;
use Kirki\Ecommerce\Framework\Contracts\Request;
use Kirki\Ecommerce\Framework\Exceptions\AuthorizationException;

/**
 * Class SiteAuthMiddleware
 *
 * @since 1.0.0
 */
class SiteAuthMiddleware implements Middleware
{
    /**
     * Handle the incoming request and determine if the user is authenticated.
     *
     * @param Request $request The incoming request instance.
     * @param callable $next The next middleware callback.
     *
     * @return mixed The result of the next middleware or a response.
     *
     * @throws AuthorizationException
     *
     * @since 1.0.0
     */
    public function handle(Request $request, callable $next)
    {
        if (is_user_logged_in()) {
            return $next($request);
        }

        $login_url = Url::get_login_url();
        wp_redirect($login_url);
        exit;
    }
}
