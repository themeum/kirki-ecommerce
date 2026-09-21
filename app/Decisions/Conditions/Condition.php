<?php

namespace Kirki\Ecommerce\App\Decisions\Conditions;

use Kirki\Ecommerce\App\Decisions\Contexts\DecisionContext;

use function Kirki\Ecommerce\Framework\throw_anyway;

/**
 * Base class for decision conditions that are evaluated against a decision context.
 *
 * @since 1.0.0
 */
abstract class Condition
{
    /**
     * Get the type of the condition.
     *
     * @since 1.0.0
     *
     * @return string One of the Conditions constants, used to look the condition up in a rule.
     */
    abstract public function get_type();

    /**
     * Evaluate the condition.
     *
     * @since 1.0.0
     *
     * @param DecisionContext $context  Context to read from.
     * @param string          $operator Comparison operator.
     * @param mixed           $value    Value configured on the rule's condition.
     * @return bool Whether the condition holds.
     */
    abstract public function evaluate(DecisionContext $context, $operator, $value);

    /**
     * Compare two values with the given operator.
     *
     * Supports =, !=, >, <, >=, <=, in and !in. The in operators test overlap
     * when both sides are arrays, otherwise membership of the first value in the second.
     * Any other operator raises an exception.
     *
     * @since 1.0.0
     *
     * @param mixed  $value1   Left-hand value.
     * @param string $operator Comparison operator.
     * @param mixed  $value2   Right-hand value.
     * @return bool Whether the comparison holds.
     * @throws \Exception When the operator is not supported.
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
                throw_anyway(__('Invalid operator', 'kirki-ecommerce'));
        }
    }
}
