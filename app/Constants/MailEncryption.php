<?php

namespace Kirki\Ecommerce\App\Constants;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

class MailEncryption
{
    use HasConstants;

    public const NONE = 'none';
    public const SSL = 'ssl';
    public const TLS = 'tls';
}
