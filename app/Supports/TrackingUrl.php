<?php

namespace Kirki\Ecommerce\App\Supports;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\Sanitizer;

/**
 * Validates, sanitizes and resolves carrier tracking-URL templates.
 *
 * A template is an http(s) URL holding the `{tracking_number}` placeholder.
 * WordPress URL sanitizers strip braces, so a template is cleaned with the
 * placeholder swapped for an inert token.
 *
 * @since 1.0.0
 */
class TrackingUrl
{
    const PLACEHOLDER = '{tracking_number}';

    const TOKEN = 'kirkitrackingnumbertoken';

    const SCHEMES = ['http', 'https'];

    /**
     * Check that a value is an http(s) URL.
     *
     * @since 1.0.0
     *
     * @param mixed $url Value to check.
     * @return bool
     */
    public static function has_allowed_scheme($url)
    {
        if (!is_string($url) || $url === '') {
            return false;
        }

        $scheme = wp_parse_url($url, PHP_URL_SCHEME);

        return is_string($scheme) && in_array(strtolower($scheme), static::SCHEMES, true);
    }

    /**
     * Check that a value is a tracking-URL template.
     *
     * @since 1.0.0
     *
     * @param mixed $url Value to check.
     * @return bool True for an http(s) URL holding the tracking-number placeholder.
     */
    public static function is_template($url)
    {
        return static::has_allowed_scheme($url) && strpos($url, static::PLACEHOLDER) !== false;
    }

    /**
     * Describe why a value is not a tracking-URL template.
     *
     * @since 1.0.0
     *
     * @param mixed $url Value to check.
     * @return true|string True when the value is a template; otherwise the message to show.
     */
    public static function validate_template($url)
    {
        if (!static::has_allowed_scheme($url)) {
            return __('The URL must start with http:// or https://.', 'kirki-ecommerce');
        }

        if (strpos($url, static::PLACEHOLDER) === false) {
            /* translators: %s: the tracking number placeholder */
            return sprintf(__('The URL must contain the %s placeholder.', 'kirki-ecommerce'), static::PLACEHOLDER);
        }

        return true;
    }

    /**
     * Sanitize a tracking-URL template while keeping its placeholder.
     *
     * @since 1.0.0
     *
     * @param mixed $url Template to sanitize.
     * @return string Empty when the value is not a string.
     */
    public static function sanitize_template($url)
    {
        if (!is_string($url)) {
            return '';
        }

        $clean = Sanitizer::apply_rule(str_replace(static::PLACEHOLDER, static::TOKEN, trim($url)), Sanitizer::URL);

        return str_replace(static::TOKEN, static::PLACEHOLDER, $clean);
    }

    /**
     * Build a tracking URL from a template.
     *
     * Every placeholder is replaced with the URL-encoded tracking number.
     *
     * @since 1.0.0
     *
     * @param string $template        Tracking-URL template.
     * @param string $tracking_number Tracking number.
     * @return string
     */
    public static function resolve($template, $tracking_number)
    {
        return (string) Sanitizer::apply_rule(str_replace(static::PLACEHOLDER, rawurlencode((string) $tracking_number), $template), Sanitizer::URL);
    }
}
