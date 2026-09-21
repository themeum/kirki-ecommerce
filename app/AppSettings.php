<?php

namespace Kirki\Ecommerce\App;

use Kirki\Ecommerce\App\Events\SettingsChanged;
use Kirki\Ecommerce\Framework\Supports\Facades\Option;
use Kirki\Ecommerce\Framework\Concerns\DeepGettable;

defined('ABSPATH') || exit;

/**
 * Base class for a settings group stored in one WordPress option, layered over the JSON defaults.
 *
 * @since 1.0.0
 */
abstract class AppSettings
{
    use DeepGettable;

    /** @var array<string, mixed> */
    protected $settings = [];

    /**
     * Load the settings, merging the stored values over the defaults.
     *
     * @since 1.0.0
     */
    public function __construct()
    {
        $this->refresh();
    }

    /**
     * Get the option key under which this settings group is stored.
     *
     * @since 1.0.0
     *
     * @return string
     */
    abstract public function get_option_key();

    /**
     * Get a setting value by its dot-notation key.
     *
     * @since 1.0.0
     *
     * @param string|string[]|null $key     Dot-notation key or list of key segments.
     * @param mixed                $default Value returned when the key is missing or empty.
     * @return mixed
     */
    public function get($key = null, $default = null) // phpcs:ignore
    {
        return $this->deep_get($this->settings ?? [], $key, $default);
    }

    /**
     * Get all settings values.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed>
     */
    public function to_array()
    {
        return $this->settings ?? [];
    }

    /**
     * Merge the given values into the stored settings and persist them.
     *
     * Top-level keys in `$value` replace existing ones. Dispatches SettingsChanged unless disabled.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $value         Settings values to merge in.
     * @param bool                 $trigger_event Whether to dispatch the SettingsChanged event.
     * @return void
     */
    public function set($value, bool $trigger_event = true)
    {
        $settings = array_merge($this->to_array(), $value);
        Option::set($this->get_option_key(), $settings);
        $this->refresh();

        if ($trigger_event) {
            SettingsChanged::dispatch($this->get_option_key());
        }
    }

    /**
     * Get the default settings from the bundled JSON file for this option key.
     *
     * @since 1.0.0
     *
     * @param string|string[]|null $key     Dot-notation key, or null for all defaults.
     * @param mixed                $default Value returned when the key is missing from the defaults.
     * @return mixed All defaults as an array when no key is given, otherwise the value at the key.
     */
    public function get_default($key = null, $default = null)
    {
        $default_settings = json_decoded_data(resource_path('data/settings/' . $this->get_option_key() . '.json')) ?? [];

        if (is_null($key)) {
            return $default_settings;
        }

        return $this->deep_get($default_settings, $key, $default);
    }

    /**
     * Reload the settings from the stored option, merged over the defaults.
     *
     * @since 1.0.0
     *
     * @return $this
     */
    public function refresh()
    {
        $default_settings = $this->get_default();
        $current_settings = Option::get($this->get_option_key());

        if (is_null($current_settings)) {
            $this->settings = $default_settings;
        }

        if (is_array($default_settings) && is_array($current_settings)) {
            $this->settings = array_merge($default_settings, $current_settings);
        }

        return $this;
    }
}
