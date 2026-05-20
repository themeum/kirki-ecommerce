<?php

namespace Kirki\Ecommerce\Validation\Rules;

use Kirki\Ecommerce\Supports\Facades\DB;
use Exception;

/**
 * Rule to ensure that a value is unique in a specified database table and column.
 *
 * @since 1.0.0
 */
class UniqueRule extends BaseRule
{
    /**
     * Check if the value unique in the specified database table and column.
     *
     * @return bool
     */
    public function validate_rule()
    {
        if (stripos($this->rule_value, ',') === false) {
            throw new Exception(__("Missing parameters for unique rule.", 'kirki-ecommerce'));
        }

        $parts = explode(',', $this->rule_value, 3);
        $table_name = $parts[0];
        $column_name = $parts[1] ?? '';
        $id = $parts[2] ?? null;

        if (!empty($id)) {
            $result = DB::table($table_name)->where($column_name, $this->value)->where('id', '!=', $id)->first();
        } else {
            $result = DB::table($table_name)->where($column_name, $this->value)->first();
        }

        return empty($result);
    }

    /**
     * Get the error message if the row exist in DB table.
     *
     * @return string
     */
    public function get_error_message()
    {
        return sprintf(__('The value for %s must be unique.', 'kirki-ecommerce'), $this->last_key_segment());
    }
}
