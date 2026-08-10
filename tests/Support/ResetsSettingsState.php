<?php

namespace Kirki\Ecommerce\Tests\Support;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Settings\SettingsFactory;
use Kirki\Ecommerce\Framework\Supports\Facades\Option;
use ReflectionClass;

trait ResetsSettingsState
{
    /**
     * Drop every stored settings option and the cached settings instances.
     *
     * Settings sections are cached in a static on SettingsFactory, and each
     * cached instance holds the values it merged at construction, so a stored
     * option has to be removed and the cache dropped for a section to resolve
     * from its shipped defaults again.
     *
     * @return void
     * @since 1.0.0
     */
    protected static function reset_settings_state(): void
    {
        foreach (static::settings_keys() as $key) {
            Option::delete($key);
        }

        $reflection = new ReflectionClass(SettingsFactory::class);
        $property = $reflection->getProperty('cache');
        $property->setAccessible(true);
        $property->setValue(null, []);
    }

    /**
     * The settings section keys exposed by the settings API.
     *
     * @return string[]
     * @since 1.0.0
     */
    protected static function settings_keys(): array
    {
        return [
            OptionKeys::GENERAL_SETTINGS,
            OptionKeys::PRODUCT_SETTINGS,
            OptionKeys::SHIPPING_SETTINGS,
            OptionKeys::PAYMENT_SETTINGS,
            OptionKeys::TAX_SETTINGS,
            OptionKeys::CHECKOUT_SETTINGS,
            OptionKeys::CURRENCY_SETTINGS,
            OptionKeys::EMAIL_SETTINGS,
            OptionKeys::ADVANCE_SETTINGS,
        ];
    }
}
