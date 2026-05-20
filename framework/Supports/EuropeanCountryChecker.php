<?php

namespace Kirki\Ecommerce\Supports;

use function Kirki\Ecommerce\app;
use function Kirki\Ecommerce\json_decoded_data;
use function Kirki\Ecommerce\resource_path;

class EuropeanCountryChecker
{
    /**
     * @var array
     */
    protected static $eu_countries = [];

    /**
     * Load the EU countries data.
     *
     * @return void
     */
    protected static function load_data()
    {
        if (!empty(static::$eu_countries)) {
            return;
        }

        static::$eu_countries = json_decoded_data(resource_path('data/european_union_countries.json')) ?? [];
    }

    /**
     * Check if a country is in the EU by its name.
     *
     * @param string $country_name
     * @return bool
     */
    public static function is_eu_by_name(string $country_name): bool
    {
        static::load_data();

        foreach (static::$eu_countries as $country) {
            if (strcasecmp($country['name'], $country_name) === 0) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if a country is in the EU by its code.
     *
     * @param string $country_code
     * @return bool
     */
    public static function is_eu_by_code(string $country_code): bool
    {
        static::load_data();

        foreach (static::$eu_countries as $country) {
            if (strtoupper($country['code']) === strtoupper($country_code)) {
                return true;
            }
        }

        return false;
    }
}
