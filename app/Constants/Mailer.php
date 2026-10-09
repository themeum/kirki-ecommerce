<?php

namespace Kirki\Ecommerce\App\Constants;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

/**
 * Mail transports the plugin can send through.
 *
 * @since 1.0.0
 */
class Mailer
{
    use HasConstants;

    public const SMTP = 'smtp';
    public const PHP_MAIL = 'php_mail';
}
