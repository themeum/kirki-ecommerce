<?php

namespace Kirki\Ecommerce\App\Helpers;

/**
 * Class TemplateHelper
 *
 * @since 1.0.0
 */
class TemplateHelper
{
    /**
     * Store block theme header.
     *
     * @since 1.0.0
     *
     * @var string
     */
    protected static string $block_header = '';

    /**
     * Store block theme footer.
     *
     * @since 1.0.0
     *
     * @var string
     */
    protected static string $block_footer = '';

    /**
     * Check if the current theme is a block theme.
     *
     * @since 1.0.0
     *
     * @return bool
     */
    public static function is_block_theme(): bool
    {
        return function_exists('wp_is_block_theme') && wp_is_block_theme();
    }

    /**
     * Load the header template.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public static function get_header()
    {
        if (self::is_block_theme()) {
            self::$block_header = do_blocks(
                sprintf(
                    '<!-- wp:template-part {"slug":"header","theme":"%s","tagName":"header","layout":{"inherit":true}} /-->',
                    esc_attr(get_stylesheet())
                )
            );
            self::$block_footer = do_blocks(
                sprintf(
                    '<!-- wp:template-part {"slug":"footer","theme":"%s","tagName":"footer","className":"site-footer","layout":{"inherit":true}} /-->',
                    esc_attr(get_stylesheet())
                )
            );
            ?>
            <!doctype html>
            <html <?php language_attributes(); ?>>
            <head>
                <meta charset="<?php bloginfo('charset'); ?>">
                <?php wp_head(); ?>
            </head>
            <body <?php body_class(); ?>>
                <?php wp_body_open(); ?>
                <div class="wp-site-blocks">
                <?php
                echo self::$block_header;
        } else {
            get_header();
        }
    }

    /**
     * Load the footer template.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public static function get_footer()
    {
        if (self::is_block_theme()) {
            echo self::$block_footer;

            // End of wp-site-blocks div.
            echo '</div>';

            wp_footer();

            echo '</body>';
            echo '</html>';
        } else {
            get_footer();
        }
    }

    /**
     * Normalize a template name into a relative template path.
     *
     * Supports both dot notation and optional `.php` extensions.
     *
     * Examples:
     * - `home`            → `home`
     * - `home.index`      → `home/index`
     * - `home.index.php`  → `home/index`
     *
     * @param string $template Template name or relative path.
     * @return string Normalized template path without the `.php` extension.
     */
    public static function normalize_template_name(string $template): string
    {
        // Remove an optional .php extension.
        $template = preg_replace('/\.php$/i', '', trim($template));

        // Convert dot notation to directory separators.
        return str_replace('.', '/', $template);
    }

    /**
     * Get the template path.
     *
     * @since 1.0.0
     *
     * @param string $template The template part to load.
     *
     * @return string The template path.
     */
    public static function get_template($template)
    {
        $template = self::normalize_template_name($template);
        $base_path = realpath(KIRKI_ECOMMERCE_PLUGIN_PATH . 'templates');
        $requested_path = realpath($base_path . '/' . $template . '.php');

        // Prevent directory traversal: ensure the resolved path is still inside the base path.
        if ($requested_path === false || strpos($requested_path, $base_path) !== 0) {
            return '';
        }

        // Allow child themes/plugins to modify the template path.
        $template = apply_filters(
            'kirki_ecommerce_template_path',
            $requested_path
        );

        return $template;
    }

    /**
     * Load a template part.
     *
     * @since 1.0.0
     *
     * @param string $template The template part to load.
     * @param array $data Arguments to pass to the template part.
     * @param bool $once Whether to load the template part only once.
     *
     * @return void
     */
    public static function load_template($template, $data = [], $once = true)
    {
        $template = self::get_template($template);

        if (empty($template)) {
            return;
        }

        // Verify file exists and is readable.
        if (!is_file($template) || !is_readable($template)) {
            _doing_it_wrong(
                __METHOD__,
                esc_html__('Template file is not readable.', 'kirki-ecommerce'),
                '1.0.0'
            );
            return;
        }

        // Allow child themes/plugins to modify template data.
        $data = apply_filters(
            'kirki_ecommerce_template_data',
            (array) $data,
            $template
        );

        // Load in isolated scope.
        try {
            if ($once) {
                require_once $template;
            } else {
                require $template;
            }
        } catch (\Exception $e) {
            _doing_it_wrong(
                __METHOD__,
                sprintf(
                    esc_html__('Error loading template: %s', 'kirki-ecommerce'),
                    esc_html($e->getMessage())
                ),
                '1.0.0'
            );
        }
    }
}
