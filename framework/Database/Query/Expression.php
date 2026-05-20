<?php

namespace Kirki\Ecommerce\Database\Query;

class Expression
{
    protected $value;

    /**
     * Create a new Expression instance
     *
     * @param string|int|float $value The value to wrap in the expression
     *
     * @return void
     * 
     * @since 1.0.0
     */
    public function __construct($value)
    {
        $this->value = $value;
    }

    /**
     * Get the value of the expression
     *
     * @return string|int|float
     *
     * @since 1.0.0
     */
    public function get_value()
    {
        return $this->value;
    }

    /**
     * Get the string representation of the expression
     *
     * @return string|int|float
     *
     * @since 1.0.0
     */
    public function __toString()
    {
        return $this->get_value();
    }
}
