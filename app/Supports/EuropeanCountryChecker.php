<?php

namespace Kirki\Ecommerce\App\Supports;


/**
 * Tells whether a country belongs to the European Union, using the country dataset.
 *
 * @since 1.0.0
 */
class EuropeanCountryChecker
{
    /**
     * @var array<int, array<string, string>>
     */
    protected static $eu_countries = [];

    /**
     * Load the EU countries from the country dataset.
     *
     * Membership is recorded once, as `group` in the country index, rather
     * than in a second file that can drift out of step with it. Reads the
     * index rather than the nested list so the states file stays untouched.
     *
     * @since 1.0.0
     *
     * @return void
     */
    protected static function load_data()
    {
        if (!empty(static::$eu_countries)) {
            return;
        }

        foreach (CountryData::index() as $country) {
            if (($country['group'] ?? null) !== 'eu') {
                continue;
            }

            static::$eu_countries[] = [
                'name' => $country['name'],
                'code' => $country['code'],
            ];
        }
    }

    /**
     * Check if a country is in the EU by its name.
     *
     * Both sides of the comparison now come from the same dataset, so this is
     * consistent under translation - but a displayed name is still a weaker key
     * than a code, because it changes with the active locale. Prefer
     * `is_eu_by_code()` wherever a code is available.
     *
     * @since 1.0.0
     *
     * @param string $country_name Country name, compared case-insensitively.
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
     * @since 1.0.0
     *
     * @param string $country_code Country code, in any casing.
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
