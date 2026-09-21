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
use Kirki\Ecommerce\App\Supports\Utils;
use Kirki\Ecommerce\Framework\Contracts\Middleware;
use Kirki\Ecommerce\Framework\Contracts\Request;
use Kirki\Ecommerce\Framework\Exceptions\AuthorizationException;
use Kirki\Ecommerce\Framework\Route;

/**
 * Restricts a site route to logged-in users, redirecting guests to the login page.
 *
 * @since 1.0.0
 */
class SiteAuthMiddleware implements Middleware
{
    /**
     * Pass the request on when the user is logged in, or on checkout when guest checkout is enabled.
     *
     * Otherwise redirects to the login URL and exits.
     *
     * @since 1.0.0
     *
     * @param Request  $request The incoming request instance.
     * @param callable $next    The next middleware callback.
     * @return mixed The result of the next middleware.
     */
    public function handle(Request $request, callable $next)
    {
        if (Route::is('checkout') && Utils::guest_checkout_enabled()) {
            return $next($request);
        }

        if (is_user_logged_in()) {
            return $next($request);
        }

        $login_url = Url::get_login_url();
        wp_safe_redirect($login_url);
        exit;
    }
}
