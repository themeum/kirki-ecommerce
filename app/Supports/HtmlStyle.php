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
    public static function richtext_styles()
    {
        return [
            '.kirki-ecommerce-rich-text > div' => [
                'margin' => '1em 0',
            ]
        ];
    }


    /**
     * Build a CSS style block from one or more [ selector => styles ] arrays, without
     * printing anything or wrapping the result in a <style> tag.
     *
     * @param array ...$selector_array One or more associative arrays of selector => CSS property/value pairs.
     *                        Can be passed as a single array with multiple selectors, or as
     *                        multiple single-selector arrays.
     *
     * @return string
     */
    public static function build_style_block(array ...$selector_array)
    {
        $css = [];

        foreach ($selector_array as $selectors) {
            foreach ($selectors as $selector => $styles) {
                $css[] = sprintf('%s { %s }', $selector, esc_attr(static::merge($styles)));
            }
        }

        return implode(' ', $css);
    }

    /**
     * print CSS style block from one or more [ selector => styles ] arrays, wrapped
     * in a <style> tag.
     *
     * @param array ...$selector_array One or more associative arrays of selector => CSS property/value pairs.
     *                        Can be passed as a single array with multiple selectors, or as
     *                        multiple single-selector arrays.
     *
     * @return void
     */
    public static function print_style_block(array ...$selector_array)
    {
        $style = static::build_style_block(...$selector_array);

        // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- $style is built only from developer-supplied selector/property arrays (never raw user input), so esc_html()/wp_kses() are unsuitable here: they HTML-entity-encode plain CSS syntax (e.g. the `>` combinator becomes `&gt;`), corrupting the output. wp_strip_all_tags() still removes any stray tags (e.g. a `</style>` breakout) before printing, matching core's wp_custom_css_cb() in wp-includes/theme.php, which faces the same constraint and applies the same ignore.
        echo '<style type="text/css">' . wp_strip_all_tags($style) . '</style>';
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
        echo esc_attr(static::merge(...$styles));
    }
}
