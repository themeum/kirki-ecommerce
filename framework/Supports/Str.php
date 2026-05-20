<?php

namespace Kirki\Ecommerce\Supports;

use Kirki\Ecommerce\Sanitizer;
use Kirki\Ecommerce\Supports\Traits\Macroable;
use Traversable;

/**
 * A utility class for string manipulation and formatting.
 *
 * Provides various static methods to handle common string operations
 * such as type conversion, slug generation, and string incrementation.
 */
class Str
{
    use Macroable;

    /**
     * The increment styles.
     *
     * @var array
     */
    protected static $increment_styles = [
        'dash' => [
            '/-(\d+)$/',
            '-%d'
        ],
        'regular' => [
            ['/\((\d+)\)$/', '/\(\d+\)$/'],
            [' (%d)', '(%d)']
        ]
    ];

    /**
     * Convert a numeric string to a corresponding number.
     *
     * @param string $value
     * @return string|int|float
     */
    public static function to_number($value)
    {
        if (empty($value) || !is_numeric($value)) {
            return $value;
        }

        return strpos($value, '.') !== false || stripos($value, 'e') !== false
            ? (float) $value
            : (int) $value;
    }

    /**
     * Sanitize a string to use as a slug.
     *
     * This function sanitizes the input string according to the Sanitizer::TITLE rule,
     * which is used to sanitize title strings.
     *
     * @param string $value The string to sanitize.
     * @return string The sanitized string.
     */
    public static function slug($value)
    {
        return Sanitizer::apply_rule($value, Sanitizer::TITLE);
    }

    /**
     * Increment the string.
     *
     * @param string $value The string to increment.
     * @param string $style The style of the increment. Available styles are 'dash' and 'regular'.
     *
     * @return string The incremented string.
     * 
     * @since 1.0.0
     */
    public static function increment($value, $style = 'dash')
    {
        $style = static::$increment_styles[$style] ?? static::$increment_styles['regular'];

        if (is_array($style[0])) {
            $search_regex = reset($style[0]);
            $replace_regex = end($style[0]);
        } else {
            $search_regex = $replace_regex = $style[0];
        }

        if (is_array($style[1])) {
            $old_format = reset($style[1]);
            $new_format = end($style[1]);
        } else {
            $old_format = $new_format = $style[1];
        }

        if (preg_match($search_regex, $value, $matches)) {
            $count = intval($matches[1]) + 1;
            return preg_replace($replace_regex, sprintf($new_format, $count), $value, 1);
        } else {
            $count = 2;
            return $value . sprintf($old_format, $count);
        }
    }

    /**
     * Trim the string.
     *
     * @param string $value The string to trim.
     * @param string $charlist The characters to trim.
     *
     * @return string The trimmed string.
     * 
     * @since 1.0.0
     */
    public static function trim($value, $charlist = null)
    {
        if (is_null($charlist)) {
            $trim_default_chars = " \n\r\t\v\0";
            $regex = '~^[\s\x{FEFF}\x{200B}\x{200E}' . $trim_default_chars . ']+|[\s\x{FEFF}\x{200B}\x{200E}' . $trim_default_chars . ']+$~u';

            return preg_replace($regex, '', $value) ?? trim($value);
        }

        return trim($value, $charlist);
    }

    /**
     * Left trim the string.
     *
     * @param string $value The string to left trim.
     * @param string $charlist The characters to left trim.
     *
     * @return string The left trimmed string.
     * 
     * @since 1.0.0
     */
    public static function ltrim($value, $charlist = null)
    {
        if (is_null($charlist)) {
            $ltrim_default_chars = " \n\r\t\v\0";
            $regex = '~^[\s\x{FEFF}\x{200B}\x{200E}' . $ltrim_default_chars . ']+~u';

            return preg_replace($regex, '', $value) ?? ltrim($value);
        }

        return ltrim($value, $charlist);
    }

    /**
     * Right trim the string.
     *
     * @param string $value The string to right trim.
     * @param string $charlist The characters to right trim.
     *
     * @return string The right trimmed string.
     * 
     * @since 1.0.0
     */
    public static function rtrim($value, $charlist = null)
    {
        if (is_null($charlist)) {
            $rtrim_default_chars = " \n\r\t\v\0";
            $regex = '~[\s\x{FEFF}\x{200B}\x{200E}' . $rtrim_default_chars . ']+$~u';

            return preg_replace($regex, '', $value) ?? rtrim($value);
        }

        return rtrim($value, $charlist);
    }

    /**
     * Squish the string.
     *
     * @param string $value The string to squish.
     *
     * @return string The squished string.
     * 
     * @since 1.0.0
     */
    public static function squish($value)
    {
        return preg_replace('~(\s|\x{3164}|\x{1160})+~u', ' ', static::trim($value));
    }

    /**
     * Get a substring of the string.
     *
     * @param string $value The string to get a substring from.
     * @param int $start The starting position of the substring.
     * @param int $length The length of the substring.
     * @param string $encoding The encoding of the string.
     *
     * @return string The substring.
     * 
     * @since 1.0.0
     */
    public static function substr($value, $start, $length = null, $encoding = 'UTF-8')
    {
        return mb_substr($value, $start, $length, $encoding);
    }

    /**
     * Get a substring of the string.
     *
     * @param string $value The string to get a substring from.
     * @param int $limit The limit of the substring.
     *
     * @return string The substring.
     * 
     * @since 1.0.0
     */
    public static function take($value, int $limit)
    {
        if ($limit < 0) {
            return static::substr($value, $limit);
        }

        return static::substr($value, 0, $limit);
    }

    /**
     * Convert the string to base64.
     *
     * @param string $value The string to convert to base64.
     *
     * @return string The base64 string.
     * 
     * @since 1.0.0
     */
    public static function to_base64($value)
    {
        return base64_encode($value);
    }

    public static function uuid()
    {
        return wp_generate_uuid4();
    }

    /**
     * Replace the string.
     *
     * @param string|array $search The string to search for.
     * @param string|array $replace The string to replace with.
     * @param string|array $subject The string to replace in.
     * @param bool $case_sensitive Whether to perform a case-sensitive search.
     *
     * @return string The replaced string.
     * 
     * @since 1.0.0
     */
    public static function replace($search, $replace, $subject, $case_sensitive = true)
    {
        if ($search instanceof Traversable) {
            $search = Arr::from($search);
        }

        if ($replace instanceof Traversable) {
            $replace = Arr::from($replace);
        }

        if ($subject instanceof Traversable) {
            $subject = Arr::from($subject);
        }

        return $case_sensitive
            ? str_replace($search, $replace, $subject)
            : str_ireplace($search, $replace, $subject);
    }

    /**
     * Convert the string to uppercase.
     *
     * @param string $value The string to convert to uppercase.
     *
     * @return string The uppercase string.
     * 
     * @since 1.0.0
     */
    public static function upper($value)
    {
        return mb_strtoupper($value, 'UTF-8');
    }

    /**
     * Convert the string to lowercase.
     *
     * @param string $value The string to convert to lowercase.
     *
     * @return string The lowercase string.
     * 
     * @since 1.0.0
     */
    public static function lower($value)
    {
        return mb_strtolower($value, 'UTF-8');
    }

    /**
     * Convert the first character of the string to uppercase.
     *
     * @param string $value The string to convert.
     *
     * @return string The string with the first character converted to uppercase.
     * 
     * @since 1.0.0
     */
    public static function ucfirst($value)
    {
        return static::upper(static::substr($value, 0, 1)) . static::substr($value, 1);
    }

    /**
     * Convert the first character of the string to lowercase.
     *
     * @param string $value The string to convert.
     *
     * @return string The string with the first character converted to lowercase.
     * 
     * @since 1.0.0
     */
    public static function lcfirst($value)
    {
        return static::lower(static::substr($value, 0, 1)) . static::substr($value, 1);
    }

    /**
     * Convert the first character of each word in the string to uppercase.
     *
     * @param string $value The string to convert.
     * @param string $separators The characters to consider as word separators.
     *
     * @return string The string with the first character of each word converted to uppercase.
     * 
     * @since 1.0.0
     */
    public static function ucwords($value, $separators = " \t\r\n\f\v")
    {
        $pattern = '/(^|[' . preg_quote($separators, '/') . '])(\p{Ll})/u';

        return preg_replace_callback($pattern, fn($matches) => $matches[1] . mb_strtoupper($matches[2]), $value);
    }

    /**
     * Convert the string to pascal case.
     *
     * @param string $value The string to convert.
     *
     * @return string The pascal case string.
     * 
     * @since 1.0.0
     */
    public static function pascal($value)
    {
        $words = mb_split('\s+', static::replace(['-', '_'], ' ', $value));

        return implode(array_map(fn($word) => static::ucfirst($word), $words));
    }

    /**
     * Convert the string to camel case.
     *
     * @param string $value The string to convert.
     *
     * @return string The camel case string.
     * 
     * @since 1.0.0
     */
    public static function camel($value)
    {
        return static::lcfirst(static::pascal($value));
    }

    /**
     * Convert the string to snake case.
     *
     * @param string $value The string to convert.
     *
     * @return string The snake case string.
     * 
     * @since 1.0.0
     */
    public static function snake($value)
    {
        return static::lower(static::replace([' ', '-'], '_', $value));
    }

    /**
     * Determine if a given string starts with a given substring.
     *
     * @param string $haystack The string to search in.
     * @param string|array $needles The substring to search for.
     *
     * @return bool Whether the string starts with the substring.
     * 
     * @since 1.0.0
     */
    public static function starts_with($haystack, $needles)
    {
        if (is_null($haystack)) {
            return false;
        }

        $needles = Arr::wrap($needles);

        foreach ($needles as $needle) {
            if (!empty((string) $needle) && str_starts_with($haystack, $needle)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Split the string into an array.
     *
     * @param string $separator The separator to use.
     * @param string $value The string to split.
     * @param bool $case_sensitive Whether to perform a case-sensitive search.
     *
     * @return array The array of strings.
     * 
     * @since 1.0.0
     */
    public static function split(string $separator, string $value, bool $case_sensitive = false)
    {
        $pattern = "/" . preg_quote($separator, '/');
        $pattern .= $case_sensitive ? '/' : '/i';

        return preg_split($pattern, $value);
    }

    public static function after(string $subject, string $search)
    {
        if (empty($search)) {
            return $subject;
        }

        $position = strpos($subject, $search);

        if ($position === false) {
            return $subject;
        }

        return substr($subject, $position + strlen($search));
    }

    public static function before(string $subject, string $search)
    {
        if (empty($search)) {
            return $subject;
        }

        $position = strpos($subject, $search);

        if ($position === false) {
            return $subject;
        }

        return substr($subject, 0, $position);
    }

    public static function after_last(string $subject, string $search)
    {
        if (empty($search)) {
            return $subject;
        }

        $position = strrpos($subject, $search);

        if ($position === false) {
            return $subject;
        }

        return substr($subject, $position + strlen($search));
    }

    public static function before_last(string $subject, string $search)
    {
        if (empty($search)) {
            return $subject;
        }

        $position = strrpos($subject, $search);

        if ($position === false) {
            return $subject;
        }

        return substr($subject, 0, $position);
    }
}
