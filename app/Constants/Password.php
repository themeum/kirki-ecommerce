<?php

namespace Kirki\Ecommerce\App\Constants;

class Password
{
    /**
     * Default password length for general use
     */
    const DEFAULT_LENGTH = 12;

    /**
     * Default password length for temporary passwords
     */
    const TEMPORARY_LENGTH = 10;

    /**
     * Minimum password length for validation
     */
    const MIN_LENGTH = 8;

    /**
     * Default special characters setting
     */
    const DEFAULT_SPECIAL_CHARS = true;

    /**
     * Default extra special characters setting
     */
    const DEFAULT_EXTRA_SPECIAL_CHARS = false;
}
