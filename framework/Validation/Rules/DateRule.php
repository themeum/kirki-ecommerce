<?php

namespace Kirki\Ecommerce\Validation\Rules;

use Kirki\Ecommerce\App\Constants\DateTimeFormats;
use DateTime;

/**
 * Validates that the given value matches db date format.
 *
 * @since 1.0.0
 */
class DateRule extends BaseRule
{
    /**
     * Determine if the value is a valid date in the given format.
     *
     * @return bool
     */
    public function validate_rule()
    {
        $date = DateTime::createFromFormat(DateTimeFormats::DB_DATE, $this->value);
        return $date && $date->format(DateTimeFormats::DB_DATE) === $this->value;
    }

    /**
     * Get the error message for invalid date format.
     *
     * @return string
     */
    public function get_error_message()
    {
        return sprintf(__('The %s field must be a valid date time in the format %s.', 'kirki-ecommerce'), $this->last_key_segment(), DateTimeFormats::DB_DATE);
    }
}
