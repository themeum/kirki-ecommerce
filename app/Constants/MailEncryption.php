<?php

namespace Kirki\Ecommerce\App\Constants;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

/**
 * Encryption options for the SMTP connection.
 *
 * @since 1.0.0
 */
class MailEncryption
{
    use HasConstants;

    public const NONE = 'none';
    public const SSL = 'ssl';
    public const TLS = 'tls';
}
