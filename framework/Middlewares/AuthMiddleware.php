<?php

namespace Kirki\Ecommerce\Middlewares;

use Kirki\Ecommerce\Contracts\Middleware;
use Kirki\Ecommerce\Contracts\Request;
use Kirki\Ecommerce\Exceptions\AuthorizationException;

/**
 * Middleware to ensure the user is authenticated.
 *
 * Blocks access to routes unless the user is logged in.
 *
 * @since 1.0.0
 */
class AuthMiddleware implements Middleware
{
    /**
     * Handle the incoming request and determine if the user is authenticated.
     *
     * @since 1.0.0
     *
     * @param Request $request The incoming request instance.
     * @return mixed The result of the next middleware or a response.
     */
    public function handle(Request $request, callable $next)
    {
        if (is_user_logged_in()) {
            return $next($request);
        };

        throw new AuthorizationException(__('You have to be logged in', 'kirki-ecommerce'));
    }
}
