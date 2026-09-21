<?php

namespace Kirki\Ecommerce\App\Supports;

use function Kirki\Ecommerce\Framework\resource_path;

/**
 * Per-country address field rules.
 *
 * Says, for each country, whether the state and postal code fields are hidden,
 * optional or required, and what that country calls its subdivision. Address
 * forms and validation read this instead of guessing from whether the country
 * happens to have subdivisions in the dataset.
 *
 * Loaded on first call and memoized, the same way as CountryData.
 */
class AddressRules
{
    /**
     * Rules keyed by ISO 3166-1 alpha-2 country code.
     *
     * @var array<string, array>|null
     */
    protected static $rules = null;

    public const HIDDEN = 'hidden';
    public const OPTIONAL = 'optional';
    public const REQUIRED = 'required';

    /**
     * Get the rules for every country.
     *
     * @return array<string, array>
     */
    public static function all()
    {
        if (static::$rules === null) {
            static::$rules = require resource_path('data/address-rules.php');
        }

        return static::$rules;
    }

    /**
     * Get one country's rules.
     *
     * An unknown code returns the same permissive shape an uncovered country
     * gets, so callers never have to branch on null.
     *
     * @param string $code Country code, in any casing.
     *
     * @return array
     */
    public static function for_country(string $code)
    {
        $rules = static::all();
        $code = strtoupper($code);

        if (isset($rules[$code])) {
            return $rules[$code];
        }

        return [
            'state' => [
                'mode' => empty(CountryData::states_for($code)) ? static::HIDDEN : static::OPTIONAL,
                'label' => 'region',
            ],
            'postal_code' => ['mode' => static::OPTIONAL],
        ];
    }

    /**
     * Get every country's rules with the state label resolved for display.
     *
     * `all()` carries the label as a lookup key (`region`, `do_si`), which is
     * storage, not something to put in front of a customer. Anything that
     * publishes the rules to a client must use this instead.
     *
     * @return array<string, array>
     */
    public static function all_for_display()
    {
        $rules = [];

        foreach (array_keys(static::all()) as $code) {
            $rules[$code] = static::for_display($code);
        }

        return $rules;
    }

    /**
     * Get one country's rules with the state label resolved for display.
     *
     * @param string $code Country code, in any casing.
     *
     * @return array
     */
    public static function for_display(string $code)
    {
        $rule = static::for_country($code);
        $rule['state']['label'] = static::state_label($code);

        return $rule;
    }

    /**
     * Whether a field must be filled in for a country.
     *
     * @param string $code  Country code.
     * @param string $field Either 'state' or 'postal_code'.
     *
     * @return bool
     */
    public static function is_required(string $code, string $field)
    {
        return static::mode_for($code, $field) === static::REQUIRED;
    }

    /**
     * Whether a field should be left off the form entirely for a country.
     *
     * @param string $code  Country code.
     * @param string $field Either 'state' or 'postal_code'.
     *
     * @return bool
     */
    public static function is_hidden(string $code, string $field)
    {
        return static::mode_for($code, $field) === static::HIDDEN;
    }

    /**
     * Get a field's mode for a country.
     *
     * @param string $code  Country code.
     * @param string $field Either 'state' or 'postal_code'.
     *
     * @return string
     */
    public static function mode_for(string $code, string $field)
    {
        $rules = static::for_country($code);

        return $rules[$field]['mode'] ?? static::OPTIONAL;
    }

    /**
     * Get the translated label for a country's subdivision field.
     *
     * @param string $code Country code.
     *
     * @return string
     */
    public static function state_label(string $code)
    {
        $rules = static::for_country($code);

        return static::translate_label($rules['state']['label'] ?? 'region');
    }

    /**
     * Translate a label key into the term shown to a customer.
     *
     * The keys come from the generated data file, so they are wrapped here
     * rather than there - this keeps the data file free of gettext calls and
     * keeps every term in one place for translators.
     *
     * @param string $key
     *
     * @return string
     */
    protected static function translate_label(string $key)
    {
        switch ($key) {
            case 'area':
                return __('Area', 'kirki-ecommerce');
            case 'canton':
                return __('Canton', 'kirki-ecommerce');
            case 'council':
                return __('Council', 'kirki-ecommerce');
            case 'county':
                return __('County', 'kirki-ecommerce');
            case 'department':
                return __('Department', 'kirki-ecommerce');
            case 'district':
                return __('District', 'kirki-ecommerce');
            case 'division':
                return __('Division', 'kirki-ecommerce');
            case 'do_si':
                return __('Do / Si', 'kirki-ecommerce');
            case 'emirate':
                return __('Emirate', 'kirki-ecommerce');
            case 'island':
                return __('Island', 'kirki-ecommerce');
            case 'municipality':
                return __('Municipality', 'kirki-ecommerce');
            case 'oblast':
                return __('Oblast', 'kirki-ecommerce');
            case 'parish':
                return __('Parish', 'kirki-ecommerce');
            case 'prefecture':
                return __('Prefecture', 'kirki-ecommerce');
            case 'province':
                return __('Province', 'kirki-ecommerce');
            case 'quarter':
                return __('Quarter', 'kirki-ecommerce');
            case 'state':
                return __('State', 'kirki-ecommerce');
            default:
                return __('Region', 'kirki-ecommerce');
        }
    }

    /**
     * Drop the cached rules.
     *
     * @return void
     */
    public static function flush()
    {
        static::$rules = null;
    }
}
