<?php

namespace Kirki\Ecommerce\Supports;

class HigherOrderTapProxy
{
    /**
     * The target instance.
     *
     * @var object
     */
    protected $target;

    /**
     * Create a new proxy instance.
     *
     * @param  object  $target
     * @return void
     */
    public function __construct($target)
    {
        $this->target = $target;
    }

    /**
     * Dynamically handle calls to the object.
     *
     * @param  string  $method
     * @param  array  $parameters
     * @return mixed
     */
    public function __call($method, $parameters)
    {
        $this->target->{$method}(...$parameters);

        return $this->target;
    }
}
