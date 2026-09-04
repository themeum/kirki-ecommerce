<?php

namespace Kirki\Ecommerce\App\Decisions\Conditions;

use Kirki\Ecommerce\App\Decisions\Contexts\DecisionContext;
use Exception;

abstract class Condition
{
    /**
     * Get the type of the condition.
     *
     * @return string
     */
    abstract public function get_type();

    /**
     * Evaluate the condition.
     *
     * @param DecisionContext $context
     * @param string $operator
     * @param mixed $value
     * @return bool
     */
    abstract public function evaluate(DecisionContext $context, $operator, $value);

    /**
     * Compare two values.
     *
     * @param mixed $value1
     * @param string $operator
     * @param mixed $value2
     * @return bool
     */
    public function compare($value1, $operator, $value2)
    {
        switch ($operator) {
            case '=':
                return $value1 == $value2;
            case '!=':
                return $value1 != $value2;
            case '>':
                return $value1 > $value2;
            case '<':
                return $value1 < $value2;
            case '>=':
                return $value1 >= $value2;
            case '<=':
                return $value1 <= $value2;
            case 'in':
                return is_array($value1) && is_array($value2) ? !empty(array_intersect($value1, $value2)) : in_array($value1, $value2);
            case '!in':
                return !(is_array($value1) && is_array($value2) ? !empty(array_intersect($value1, $value2)) : in_array($value1, $value2));
            default:
                throw new Exception(__('Invalid operator', 'kirki-ecommerce')); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Caught centrally in Route.php; ApiExceptionHandler puts the message into a JSON response (HTML-escaping would corrupt it) and SiteExceptionHandler already calls esc_html() once before wp_die().
        }
    }
}
