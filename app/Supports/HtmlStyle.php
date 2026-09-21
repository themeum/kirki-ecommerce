<?php

namespace Kirki\Ecommerce\App\Supports;

defined('ABSPATH') || exit;

/**
 * Helpers for building and printing CSS declarations and style blocks from arrays.
 *
 * @since 1.0.0
 */
class HtmlStyle
{
    /**
     * Merge one or more associative arrays of CSS declarations into a CSS declaration string.
     *
     * Later arrays take precedence over earlier ones for the same property.
     *
     * @since 1.0.0
     *
     * @param array<string, string> ...$styles CSS property => value pairs.
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
     * Get the default CSS declarations for the direct children of a rich text wrapper.
     *
     * Keeps the spacing matching what the rich text editor shows.
     *
     * @since 1.0.0
     *
     * @return array<string, array<string, string>> CSS declarations keyed by selector.
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
     * Build a CSS style block from one or more [ selector => styles ] arrays.
     *
     * Does not print anything or wrap the result in a <style> tag. Each
     * selector's declarations are escaped with `esc_attr()`.
     *
     * @since 1.0.0
     *
     * @param array<string, array<string, string>> ...$selector_array One or more associative arrays of
     *                                                                selector => CSS property/value pairs.
     *                                                                Can be passed as a single array with
     *                                                                multiple selectors, or as multiple
     *                                                                single-selector arrays.
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
     * Print a CSS style block wrapped in a <style> tag.
     *
     * @since 1.0.0
     *
     * @param array<string, array<string, string>> ...$selector_array One or more associative arrays of
     *                                                                selector => CSS property/value pairs.
     *                                                                Can be passed as a single array with
     *                                                                multiple selectors, or as multiple
     *                                                                single-selector arrays.
     * @return void
     */
    public static function print_style_block(array ...$selector_array)
    {
        $style = static::build_style_block(...$selector_array);

        // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- $style is built only from developer-supplied selector/property arrays (never raw user input), so esc_html()/wp_kses() are unsuitable here: they HTML-entity-encode plain CSS syntax (e.g. the `>` combinator becomes `&gt;`), corrupting the output. wp_strip_all_tags() still removes any stray tags (e.g. a `</style>` breakout) before printing, matching core's wp_custom_css_cb() in wp-includes/theme.php, which faces the same constraint and applies the same ignore.
        echo '<style type="text/css">' . wp_strip_all_tags($style) . '</style>';
    }

    /**
     * Print merged CSS declarations as an escaped inline style string.
     *
     * Later arrays take precedence over earlier ones for the same property.
     *
     * @since 1.0.0
     *
     * @param array<string, string> ...$styles CSS property => value pairs.
     * @return void
     */
    public static function print_inline(array ...$styles)
    {
        echo esc_attr(static::merge(...$styles));
    }
}
