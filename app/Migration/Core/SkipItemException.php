<?php

namespace Kirki\Ecommerce\App\Migration\Core;

defined('ABSPATH') || exit;

use Exception;

/**
 * Thrown by a group migrator when one source item cannot be migrated and must be skipped.
 *
 * @since 1.0.0
 */
class SkipItemException extends Exception
{
}
