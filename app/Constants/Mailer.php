<?php

namespace Kirki\Ecommerce\App\Constants;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

class Mailer
{
    use HasConstants;

    public const SMTP = 'smtp';
    public const PHP_MAIL = 'php_mail';
}
