<?php

namespace Kirki\Ecommerce\Supports;

use Carbon\Carbon as BaseCarbon;
use Carbon\Exceptions\InvalidFormatException;
use DateTimeInterface;

class Carbon extends BaseCarbon
{
    const BASE_FORMAT = 'Y-m-d H:i:s';

    public static function is_valid_date($value)
    {
        if ($value instanceof DateTimeInterface) {
            return true;
        }

        try {
            static::parse($value);
            return true;
        } catch (InvalidFormatException) {
            return false;
        }
    }

    /**
     * Convert the Carbon instance to a base format string.
     *
     * @return string The formatted date string.
     */
    public function to_base_date_string()
    {
        return $this->format(static::BASE_FORMAT);
    }

    /**
     * Convert the Carbon instance to a SQL safe date string.
     *
     * @return string The formatted date string.
     */
    public function to_sql_datetime_string()
    {
        return $this->to_base_date_string();
    }
}
