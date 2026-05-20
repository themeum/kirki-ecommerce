<?php

namespace Kirki\Ecommerce\Concerns;

defined('ABSPATH') || exit;

trait HasConstants
{
    public static function get_constants(): array
    {
        return (new \ReflectionClass(static::class))->getConstants();
    }

    public static function get_constant_values(): array
    {
        return array_values(static::get_constants());
    }

    public static function get_constant_keys(): array
    {
        return array_keys(static::get_constants());
    }
}
