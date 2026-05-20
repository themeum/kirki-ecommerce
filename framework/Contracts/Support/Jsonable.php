<?php

namespace Kirki\Ecommerce\Contracts\Support;

interface Jsonable
{
    /**
     * Convert the object to a JSON string.
     *
     * @return string The JSON representation of the object
     * @since 1.0.0
     */
    public function to_json($options = 0);
}
