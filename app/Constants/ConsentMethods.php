<?php

namespace Kirki\Ecommerce\App\Constants;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

defined('ABSPATH') || exit;

/**
 * Ways a consent notice is presented to the shopper.
 *
 * @since 1.0.0
 */
final class ConsentMethods
{
    use HasConstants;

    public const MANDATORY_CHECKBOX = 'mandatory_checkbox';
    public const OPTIONAL_CHECKBOX = 'optional_checkbox';
    public const DISPLAY_TEXT_ONLY = 'display_text_only';

    /**
     * Get all consent methods with key, label pair.
     *
     * @since 1.0.0
     *
     * @return array<string, string> Translated labels keyed by method.
     */
    public static function get_list()
    {
        return [
            static::MANDATORY_CHECKBOX => __('Mandatory Checkbox', 'kirki-ecommerce'),
            static::OPTIONAL_CHECKBOX => __('Optional Checkbox', 'kirki-ecommerce'),
            static::DISPLAY_TEXT_ONLY => __('Display Text Only', 'kirki-ecommerce'),
        ];
    }

    /**
     * Get the methods that render an interactive checkbox for the shopper.
     *
     * @since 1.0.0
     *
     * @return string[] Method keys.
     */
    public static function get_checkbox_methods()
    {
        return [static::MANDATORY_CHECKBOX, static::OPTIONAL_CHECKBOX];
    }
}
