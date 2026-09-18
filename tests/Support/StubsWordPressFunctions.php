<?php

if (!function_exists('__')) {
    function __($text, $domain = 'default')
    {
        return $text;
    }
}

if (!function_exists('esc_html__')) {
    function esc_html__($text, $domain = 'default')
    {
        return $text;
    }
}

if (!function_exists('_e')) {
    function _e($text, $domain = 'default')
    {
        echo __($text, $domain);
    }
}

if (!function_exists('add_action')) {
    function add_action($hook_name, $callback, $priority = 10, $accepted_args = 1)
    {
        return true;
    }
}

if (!function_exists('add_filter')) {
    function add_filter($hook_name, $callback, $priority = 10, $accepted_args = 1)
    {
        return true;
    }
}

if (!function_exists('wp_json_encode')) {
    function wp_json_encode($data, $options = 0, $depth = 512)
    {
        return json_encode($data, $options, $depth);
    }
}

if (!function_exists('wp_generate_uuid4')) {
    function wp_generate_uuid4()
    {
        return '00000000-0000-4000-8000-000000000000';
    }
}

if (!function_exists('esc_html')) {
    function esc_html($text)
    {
        return htmlspecialchars((string) $text, ENT_QUOTES, 'UTF-8');
    }
}

if (!defined('MINUTE_IN_SECONDS')) {
    define('MINUTE_IN_SECONDS', 60);
}

if (!function_exists('wp_unslash')) {
    function wp_unslash($value)
    {
        return is_array($value) ? array_map('wp_unslash', $value) : stripslashes((string) $value);
    }
}

if (!function_exists('wp_parse_url')) {
    function wp_parse_url($url, $component = -1)
    {
        return parse_url($url, $component);
    }
}

if (!function_exists('sanitize_text_field')) {
    function sanitize_text_field($str)
    {
        $filtered = strip_tags((string) $str);
        $filtered = preg_replace('/[\r\n\t ]+/', ' ', $filtered);

        return trim($filtered);
    }
}

if (!function_exists('sanitize_title')) {
    function sanitize_title($title, $fallback_title = '', $context = 'save')
    {
        $title = strtolower((string) $title);
        $title = preg_replace('/[^a-z0-9 _-]/', '', $title);
        $title = preg_replace('/\s+/', '-', $title);

        $title = trim($title, '-');

        return $title === '' ? $fallback_title : $title;
    }
}

if (!function_exists('esc_url')) {
    function esc_url($url)
    {
        $url = str_replace(['"', "'", '<', '>'], '', (string) $url);

        return htmlspecialchars($url, ENT_QUOTES, 'UTF-8');
    }
}

if (!function_exists('get_permalink')) {
    function get_permalink($post = 0, $leavename = false)
    {
        return 'https://example.test/?p=' . (int) (is_object($post) ? $post->ID : $post);
    }
}

if (!function_exists('get_locale')) {
    function get_locale()
    {
        return 'en_US';
    }
}

/**
 * The sorting fallback in CountryData calls this whenever ext-intl is missing,
 * which is the case on the Unit CI job. It only has to be deterministic and
 * non-fatal here - the fallback's actual ordering is asserted in the
 * Integration suite against WordPress's own implementation.
 */
if (!function_exists('remove_accents')) {
    function remove_accents($string)
    {
        $transliterated = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', (string) $string);

        return $transliterated === false ? (string) $string : $transliterated;
    }
}
