<?php

namespace Kirki\Ecommerce\App\Constants\Product;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

/**
 * Ribbon preset color constants
 *
 * @since 1.0.0
 */
class RibbonColor
{
    use HasConstants;

    const PURPLE = '#6d3fe0';
    const BLUE = '#1f6fe5';
    const GREEN = '#1e8e4a';
    const ORANGE = '#d9650b';
    const BLACK = '#1d1d1f';

    /**
     * Get the palette's default colour.
     *
     * @since 1.0.0
     * 
     * @return string
     */
    public static function get_default()
    {
        return static::PURPLE;
    }
}
