<?php

namespace Kirki\Ecommerce\App\Concerns;

use Kirki\Ecommerce\App\Constants\Cart;
use Kirki\Ecommerce\Framework\Http\Request;
use Kirki\Ecommerce\Framework\Sanitizer;

/**
 * Resolves the guest cart token sent with a request.
 *
 * @since 1.0.0
 */
trait HasCartToken
{
    /**
     * Read the sanitized guest cart token from the request cookie, falling back to the header.
     *
     * @since 1.0.0
     *
     * @param Request $request Current request.
     * @return string|null Null when no non-empty token was sent.
     */
    protected function cart_token(Request $request): ?string
    {
        $token = $request->cookie(Cart::COOKIE_TOKEN);

        if (empty($token)) {
            $token = $request->get_header(Cart::HEADER_TOKEN);
        }

        if (empty($token)) {
            return null;
        }

        $token = Sanitizer::apply_rule($token, Sanitizer::TEXT);

        return $token !== '' ? $token : null;
    }
}
