<?php

namespace Kirki\Ecommerce\App;

use Kirki\Ecommerce\App\Events\SettingsChanged;
use Kirki\Ecommerce\Framework\Supports\Facades\Option;
use Kirki\Ecommerce\Framework\Concerns\DeepGettable;

defined('ABSPATH') || exit;

abstract class AppSettings
{
    use DeepGettable;

    /**
     * Settings values
     * @var array
     */
    protected $settings = [];

    public function __construct()
    {
        $this->refresh();
    }

    abstract public function get_option_key();

    /**
     * Get settings values or a specific value by key
     *
     * @param string|null $key
     * @return mixed
     */
    public function get($key = null, $default = null) // phpcs:ignore
    {
        return $this->deep_get($this->settings ?? [], $key, $default);
    }

    /**
     * Convert settings to array
     * @return array
     */
    public function to_array()
    {
        return $this->settings ?? [];
    }

    /**
     * Set settings values
     *
     * @param array $value
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
     * Refresh settings values
     * @return static
     */
    public function refresh()
    {
        $default_settings = json_decoded_data(resource_path('data/settings/' . $this->get_option_key() . '.json')) ?? [];
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
