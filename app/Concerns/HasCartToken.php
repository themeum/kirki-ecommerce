<?php

namespace Kirki\Ecommerce\App\Concerns;

use Kirki\Ecommerce\App\Constants\Cart;
use Kirki\Ecommerce\Framework\Http\Request;
use Kirki\Ecommerce\Framework\Sanitizer;

trait HasCartToken
{
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
