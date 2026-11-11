<?php

/**
 * Protect order link pages
 *
 * @package Kirki\Ecommerce\App\Http\Middlewares
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

namespace Kirki\Ecommerce\App\Http\Middlewares;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\Contracts\Middleware;
use Kirki\Ecommerce\Framework\Contracts\Request;

/**
 * Keeps the order UUID in a page URL from leaking to other sites or to search engines.
 *
 * The UUID in the URL works as a secret link. This middleware tells the browser to send no
 * Referer header, asks search engines to skip the page, and stops shared caches from storing it.
 * It does nothing when the request carries no UUID.
 *
 * @since 1.0.0
 */
class ProtectOrderLinkMiddleware implements Middleware
{
    /**
     * Send the privacy headers when the request carries an order UUID, then pass the request on.
     *
     * @since 1.0.0
     *
     * @param Request  $request The incoming request instance.
     * @param callable $next    The next middleware callback.
     * @return mixed The result of the next middleware.
     */
    public function handle(Request $request, callable $next)
    {
        if ($request->string('uuid', '') !== '' && !headers_sent()) {
            nocache_headers();
            header('Referrer-Policy: no-referrer');
            header('X-Robots-Tag: noindex, nofollow');
        }

        return $next($request);
    }
}
