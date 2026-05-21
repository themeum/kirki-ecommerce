<?php

namespace Kirki\Ecommerce\Supports;

use Carbon\Carbon as BaseCarbon;
use Carbon\Exceptions\InvalidFormatException;
use DateTimeInterface;

class Carbon extends BaseCarbon
{
    const BASE_FORMAT = 'Y-m-d H:i:s';

    /**
     * Check if the value is a valid date.
     *
     * @param mixed $value
     * @return bool
     * @since 1.0.0
     */
    public static function isValidDate($value)
    {
        if ($value instanceof DateTimeInterface) {
            return true;
        }

        try {
            static::parse($value);
            return true;
        } catch (InvalidFormatException $exception) {
            return false;
        }
    }

    /**
     * Convert the Carbon instance to a base format string.
     *
     * @return string The formatted date string.
     */
    public function toBaseDateString()
    {
        return $this->format(static::BASE_FORMAT);
    }

    /**
     * Convert the Carbon instance to a SQL safe date string.
     *
     * @return string The formatted date string.
     */
    public function toSqlDatetimeString()
    {
        return $this->toBaseDateString();
    }
}
