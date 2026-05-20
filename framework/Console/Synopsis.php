<?php

namespace Kirki\Ecommerce\Console;

use Kirki\Ecommerce\Supports\Flex;

/**
 * Class Synopsis
 *
 * @method $this name(string $name)
 * @method $this description(string $description)
 * @method $this optional()
 * @method $this repeating()
 * @method $this options(array $options)
 * @method $this type('positional'|'assoc'|'flag' $type)
 * @method $this default($value)
 *
 * @since 1.0.0
 */
class Synopsis extends Flex
{
    /**
     * Handle dynamic method calls
     *
     * @param string $method
     * @param array $parameters
     *
     * @return static
     */
    public static function __callStatic($method, $parameters)
    {
        return (new static())->$method(...$parameters);
    }
}
