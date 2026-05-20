<?php

namespace Kirki\Ecommerce;


class Listener
{
    /**
     * The priority of the listener.
     * The default priority value is 0.
     * If you need to set more priority then increase the value on the
     * child classes. The higher the value the more the priority.
     *
     * @return int
     */
    public function priority()
    {
        return 0;
    }
}
