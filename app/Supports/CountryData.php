<?php

namespace Kirki\Ecommerce\App\Supports;

use function Kirki\Ecommerce\Framework\resource_path;

/**
 * Loads the generated country dataset.
 *
 * The data ships as two PHP array files so OPcache can hold them parsed in
 * shared memory. Countries and states are stored apart; `nested()` reassembles
 * the shape consumers expect.
 *
 * Every read is resolved on first call and cached in a static - never at file
 * scope. Translating the names later means calling `__()` while building the
 * index, and doing that before `init` would return untranslated strings and
 * trip WordPress 6.7's early-translation notice.
 */
class CountryData
{
    /**
     * Country index keyed by ISO 3166-1 alpha-2 code.
     *
     * @var array<string, array>|null
     */
    protected static $index = null;

    /**
     * States keyed by ISO 3166-1 alpha-2 country code.
     *
     * @var array<string, array>|null
     */
    protected static $states = null;

    /**
     * The reassembled public list.
     *
     * @var array|null
     */
    protected static $nested = null;

    /**
     * Get the country index, keyed by country code.
     *
     * @return array<string, array>
     */
    public static function index()
    {
        if (static::$index === null) {
            static::$index = require resource_path('data/countries.php');
        }

        return static::$index;
    }

    /**
     * Get a single country's index entry, or null when the code is unknown.
     *
     * @param string $code Country code, in any casing.
     *
     * @return array|null
     */
    public static function find_index_entry(string $code)
    {
        $index = static::index();
        $code = strtoupper($code);

        return $index[$code] ?? null;
    }

    /**
     * Get the states for a country.
     *
     * @param string $code Country code, in any casing.
     *
     * @return array
     */
    public static function states_for(string $code)
    {
        if (static::$states === null) {
            static::$states = require resource_path('data/states.php');
        }

        return static::$states[strtoupper($code)] ?? [];
    }

    /**
     * Get the full country list with each country's states nested inside it.
     *
     * @return array
     */
    public static function nested()
    {
        if (static::$nested === null) {
            static::$nested = static::build_nested();
        }

        return static::$nested;
    }

    /**
     * Get a single country with its states nested, or null when unknown.
     *
     * @param string $code Country code, in any casing.
     *
     * @return array|null
     */
    public static function find_nested(string $code)
    {
        $entry = static::find_index_entry($code);

        if ($entry === null) {
            return null;
        }

        return static::with_states($entry);
    }

    /**
     * Reassemble the public list from the index and the states file.
     *
     * @return array
     */
    protected static function build_nested()
    {
        $nested = [];

        foreach (static::index() as $country) {
            $nested[] = static::with_states($country);
        }

        return static::sort_by_name($nested);
    }

    /**
     * Expand one index entry into its public form.
     *
     * The keys are written out in full rather than merged, because the public
     * shape carries `states` between `flag` and `numeric_code` and drops
     * `has_states`. Key order is part of the contract: it survives into
     * json_encode, so appending `states` instead would change the wire format.
     *
     * @param array $country An index entry.
     *
     * @return array
     */
    protected static function with_states(array $country)
    {
        return [
            'name' => $country['name'],
            'code' => $country['code'],
            'phone_code' => $country['phone_code'],
            'currency' => $country['currency'],
            'currency_name' => $country['currency_name'],
            'currency_symbol' => $country['currency_symbol'],
            'flag' => $country['flag'],
            'states' => static::sort_by_name(static::states_for($country['code'])),
            'numeric_code' => $country['numeric_code'],
            'group' => $country['group'],
        ];
    }

    /**
     * Order rows by their displayed name under the active locale.
     *
     * Sorting has to happen after the names are resolved, not in the data
     * files: `__()` returns the translated name, so the stored order is only
     * alphabetical in the source language.
     *
     * @param array $rows Rows each carrying a `name`.
     *
     * @return array Sequentially indexed.
     */
    protected static function sort_by_name(array $rows)
    {
        if (count($rows) < 2) {
            return array_values($rows);
        }

        $names = [];

        foreach ($rows as $position => $row) {
            $names[$position] = (string) $row['name'];
        }

        static::asort_by_locale($names);

        $sorted = [];

        foreach (array_keys($names) as $position) {
            $sorted[] = $rows[$position];
        }

        return $sorted;
    }

    /**
     * Sort names by locale, keeping their keys, and fall back when ext-intl
     * is missing or its ICU data is broken.
     *
     * @param array $names Names keyed by their row's position.
     *
     * @return void
     */
    protected static function asort_by_locale(array &$names)
    {
        if (class_exists('Collator')) {
            try {
                $collator = new \Collator(get_locale());
                $collator->asort($names, \Collator::SORT_STRING);

                return;
            } catch (\IntlException $e) {
                // An incomplete ICU install throws rather than sorting badly.
            }
        }

        static::asort_without_collator($names);
    }

    /**
     * Sort names without ext-intl.
     *
     * Folding accents first matters: a plain byte comparison puts every
     * accented name after `Z`, so `Aland Islands` would sort after `Zimbabwe`.
     *
     * @param array $names Names keyed by their row's position.
     *
     * @return void
     */
    protected static function asort_without_collator(array &$names)
    {
        array_walk(
            $names,
            function (&$name) {
                $name = remove_accents(html_entity_decode($name));
            }
        );

        uasort($names, 'strcmp');
    }

    /**
     * Drop the cached data.
     *
     * @return void
     */
    public static function flush()
    {
        static::$index = null;
        static::$states = null;
        static::$nested = null;
    }
}
