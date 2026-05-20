<?php

namespace Kirki\Ecommerce\Validation\Rules;

use Kirki\Ecommerce\Supports\Facades\DB;
use Exception;

/**
 * Rule to ensure a a post exist with id and post type.
 *
 * @since 1.0.0
 */
class ExistsRule extends BaseRule
{
    /**
     * Check if the value exists in the specified database table and column.
     *
     * @return bool
     */
    public function validate_rule()
    {
        if (stripos($this->rule_value, ',') === false) {
            throw new Exception(__("Missing parameters for exists rule.", 'kirki-ecommerce'));
        }

        [$table_name, $column_name] = explode(",", $this->rule_value, 2);

        $result = DB::table($table_name)->where($column_name, $this->value)->first();

        return !empty($result);
    }

    /**
     * Get the error message if the row does not exist in DB table.
     *
     * @return string
     */
    public function get_error_message()
    {
        return __('Resource does not exist.', 'growfund');
    }
}
