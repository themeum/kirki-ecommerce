<?php

namespace Kirki\Ecommerce\App\Supports;

/**
 * @package Kirki\Ecommerce\Supports
 *
 * @since 1.0.0
 */
class Icon
{
    /**
     * Cache for loaded icons to avoid repeated file reads.
     *
     * @var array<string, string>
     */
    private static array $cache = [];

    /**
     * Get the absolute path to the icons directory.
     *
     * @return string
     *
     * @since 1.0.0
     */
    private static function get_icons_path(): string
    {
        return KIRKI_ECOMMERCE_PLUGIN_PATH . 'assets/icons/';
    }

    /**
     * Load an SVG icon from the icons directory.
     *
     * @param string $name Icon name without .svg extension.
     * @param array<string, mixed> $options {
     *     @type string $class CSS classes to add to the SVG.
     *     @type int $size Size in pixels (sets both width and height).
     *     @type string $color Fill color (will override default).
     *     @type bool $raw Return raw SVG without modifications.
     * }
     * @return string SVG markup or empty string if not found.
     *
     * @since 1.0.0
     */
    public static function get(string $name, array $options = []): string
    {
        $defaults = [
            'class' => '',
            'size' => 16,
            'color' => null,
            'raw' => false,
        ];

        $options = array_merge($defaults, $options);
        $iconKey = $name . md5(serialize($options));

        // Return cached version if available
        if (isset(static::$cache[$iconKey])) {
            return static::$cache[$iconKey];
        }

        $filePath = static::get_icons_path() . $name . '.svg';

        if (!file_exists($filePath)) {
            return '';
        }

        $svg = file_get_contents($filePath);

        if ($svg === false) {
            return '';
        }

        // Return raw SVG if requested
        if ($options['raw']) {
            static::$cache[$iconKey] = $svg;
            return $svg;
        }

        // Modify SVG attributes
        $svg = static::modify_svg_attributes($svg, $options);

        static::$cache[$iconKey] = $svg;

        return $svg;
    }

    /**
     * Render an SVG icon directly to output.
     *
     * @param string $name Icon name without .svg extension.
     * @param array<string, mixed> $options Icon options (same as get()).
     * @return void
     *
     * @since 1.0.0
     */
    public static function render(string $name, array $options = []): void
    {
        echo static::get($name, $options);
    }

    /**
     * Modify SVG attributes based on options.
     *
     * @param string $svg SVG markup.
     * @param array<string, mixed> $options Icon options.
     * @return string Modified SVG markup.
     *
     * @since 1.0.0
     */
    private static function modify_svg_attributes(string $svg, array $options): string
    {
        // Add CSS class
        if (!empty($options['class'])) {
            $svg = static::add_svg_class($svg, $options['class']);
        }

        // Set width and height
            $svg = static::set_svg_size($svg, $options['size']);

        // Set color if provided
        if ($options['color'] !== null) {
            $svg = static::set_svg_color($svg, $options['color']);
        }

        return $svg;
    }

    /**
     * Add CSS class to SVG element.
     *
     * @param string $svg SVG markup.
     * @param string $class CSS class(es) to add.
     * @return string Modified SVG markup.
     *
     * @since 1.0.0
     */
    private static function add_svg_class(string $svg, string $class): string
    {
        // Check if class attribute exists
        if (preg_match('/<svg[^>]*class=["\']([^"\']*)["\']/', $svg, $matches)) {
            // Append to existing class
            $existingClass = $matches[1];
            $newClass = trim($existingClass . ' ' . $class);
            $svg = str_replace($matches[0], str_replace($matches[1], $newClass, $matches[0]), $svg);
        } else {
            // Add new class attribute
            $svg = preg_replace('/<svg/', '<svg class="' . esc_attr($class) . '"', $svg, 1);
        }

        return $svg;
    }

    /**
     * Set width and height attributes on SVG.
     *
     * @param string $svg SVG markup.
     * @param int $size Size in pixels (sets both width and height).
     * @return string Modified SVG markup.
     *
     * @since 1.0.0
     */
    private static function set_svg_size(string $svg, int $size): string
    {
        // Remove existing width/height
        $svg = preg_replace('/\s*width=["\'][^"\']*["\']/', '', $svg);
        $svg = preg_replace('/\s*height=["\'][^"\']*["\']/', '', $svg);

        // Add new width/height
        $svg = preg_replace('/<svg/', '<svg width="' . esc_attr($size) . '" height="' . esc_attr($size) . '"', $svg, 1);

        return $svg;
    }

    /**
     * Set fill color on SVG.
     *
     * @param string $svg SVG markup.
     * @param string $color Color value.
     * @return string Modified SVG markup.
     *
     * @since 1.0.0
     */
    private static function set_svg_color(string $svg, string $color): string
    {
        // Set fill attribute on SVG element
        if (preg_match('/<svg[^>]*>/', $svg, $matches)) {
            $svgTag = $matches[0];

            if (!preg_match('/fill=["\']/', $svgTag)) {
                // Add fill attribute
                $newSvgTag = preg_replace('/<svg/', '<svg fill="' . esc_attr($color) . '"', $svgTag, 1);
                $svg = str_replace($svgTag, $newSvgTag, $svg);
            }
        }

        // Also set fill on path elements if they don't have fill
        $svg = preg_replace('/<path(?![^>]*fill=)/', '<path fill="' . esc_attr($color) . '"', $svg);

        return $svg;
    }

    /**
     * Check if an icon exists.
     *
     * @param string $name Icon name without .svg extension.
     * @return bool
     *
     * @since 1.0.0
     */
    public static function exists(string $name): bool
    {
        return file_exists(static::get_icons_path() . $name . '.svg');
    }

    /**
     * Clear the icon cache.
     *
     * @return void
     *
     * @since 1.0.0
     */
    public static function clear_cache(): void
    {
        static::$cache = [];
    }

    /**
     * Get a list of all available icons.
     *
     * @return array<string> Array of icon names (without .svg extension).
     *
     * @since 1.0.0
     */
    public static function list(): array
    {
        $iconsPath = static::get_icons_path();
        $icons = [];

        if (is_dir($iconsPath)) {
            $files = scandir($iconsPath);
            if ($files !== false) {
                foreach ($files as $file) {
                    if (pathinfo($file, PATHINFO_EXTENSION) === 'svg') {
                        $icons[] = pathinfo($file, PATHINFO_FILENAME);
                    }
                }
            }
        }

        sort($icons);

        return $icons;
    }
}
