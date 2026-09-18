<?php

namespace Kirki\Ecommerce\App\Supports;

defined('ABSPATH') || exit;

class HtmlStyle
{
    /**
     * Merge one or more associative arrays of CSS declarations into a CSS declaration string.
     * Later arrays take precedence over earlier ones for the same property.
     *
     * @param array ...$styles CSS property => value pairs.
     *
     * @return string
     */
    public static function merge(array ...$styles)
    {
        $declarations = [];

        foreach (array_merge(...$styles) as $property => $value) {
            $value = rtrim($value, ';');
            $declarations[] = "{$property}: {$value};";
        }

        return implode(' ', $declarations);
    }

    /**
     * Default CSS declarations applied to the direct children of a rich text
     * wrapper, so the spacing matches what the rich text editor shows.
     *
     * @return array
     */
    public static function print_richtext_styles()
    {
        $selector = [
            ':scope div' => [
                'margin' => '1em 0',
            ]
        ];

        static::print_style_block($selector);
    }


    /**
     * print CSS style block from one or more [ selector => styles ] arrays, without
     * printing anything or wrapping the result in a <style> tag.
     *
     * @param array ...$selector_array One or more associative arrays of selector => CSS property/value pairs.
     *                        Can be passed as a single array with multiple selectors, or as
     *                        multiple single-selector arrays.
     *
     * @return void
     */
    public static function print_style_block(array ...$selector_array)
    {
        $css = [];

        foreach ($selector_array as $selectors) {
            foreach ($selectors as $selector => $styles) {
                $css[] = sprintf('%s { %s }', $selector, static::merge($styles));
            }
        }

        $style = implode(' ', $css);

        echo wp_kses("<style>{$style}</style>", ['style' => []]);
    }

    /**
     * print inline CSS from one or more associative arrays of CSS declarations into a CSS declaration string.
     * Later arrays take precedence over earlier ones for the same property.
     *
     * @param array ...$styles CSS property => value pairs.
     *
     * @return void
     */
    public static function print_inline(array ...$styles)
    {
        echo esc_html(static::merge(...$styles));
    }
}
