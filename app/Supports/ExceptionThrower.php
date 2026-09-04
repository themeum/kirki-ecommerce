<?php

namespace Kirki\Ecommerce\App\Supports;

use Throwable;

class ExceptionThrower
{
    /**
     * Throw an already-constructed exception.
     *
     * Centralizes throw sites so WordPress.Security.EscapeOutput.ExceptionNotEscaped
     * only needs to be justified here instead of on every call site: these
     * exceptions are caught centrally in Route.php, which routes to
     * ApiExceptionHandler (puts the message into a JSON response, where
     * HTML-escaping would corrupt it) or SiteExceptionHandler (already calls
     * esc_html() once before wp_die()).
     *
     * @param Throwable $t
     * @return void
     */
    public static function throw(Throwable $t)
    {
        throw $t;
    }
}
