<?php

namespace Kirki\Ecommerce\Tests\Unit\Supports;

use Kirki\Ecommerce\App\Supports\CountryData;
use Kirki\Ecommerce\App\Supports\EuropeanCountryChecker;
use Kirki\Ecommerce\Tests\Unit\TestCase;

class EuropeanCountryCheckerTest extends TestCase
{
    /**
     * The 27 member states, as `group` records them in the country dataset.
     *
     * @var string[]
     */
    protected $expected_members = [
        'AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FR', 'GR',
        'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PL', 'PT', 'RO',
        'SE', 'SI', 'SK',
    ];

    public function test_is_eu_by_code_matches_case_insensitively(): void
    {
        $this->set_european_country_checker_data([
            ['name' => 'Germany', 'code' => 'DE'],
            ['name' => 'France', 'code' => 'FR'],
        ]);

        $this->assertTrue(EuropeanCountryChecker::is_eu_by_code('DE'));
        $this->assertTrue(EuropeanCountryChecker::is_eu_by_code('de'));
        $this->assertFalse(EuropeanCountryChecker::is_eu_by_code('US'));
    }

    public function test_is_eu_by_name_matches_case_insensitively(): void
    {
        $this->set_european_country_checker_data([
            ['name' => 'Germany', 'code' => 'DE'],
        ]);

        $this->assertTrue(EuropeanCountryChecker::is_eu_by_name('Germany'));
        $this->assertTrue(EuropeanCountryChecker::is_eu_by_name('germany'));
        $this->assertFalse(EuropeanCountryChecker::is_eu_by_name('United States'));
    }

    public function test_unknown_countries_return_false(): void
    {
        $this->set_european_country_checker_data([
            ['name' => 'Austria', 'code' => 'AT'],
        ]);

        $this->assertFalse(EuropeanCountryChecker::is_eu_by_name('Canada'));
        $this->assertFalse(EuropeanCountryChecker::is_eu_by_code('CA'));
    }

    /**
     * Membership now comes from `group` in the country dataset rather than a
     * separate list, and `TaxStrategyFactory` routes EU addresses to the EU
     * strategy on the strength of it. That makes `group` load-bearing in a
     * hand-maintained file, so this asserts the exact membership: a stray edit
     * to one country's group would otherwise silently change tax behaviour.
     */
    public function test_it_derives_exactly_the_member_states_from_the_country_dataset(): void
    {
        $this->bootstrap_application();
        CountryData::flush();

        $members = [];

        foreach (array_keys(CountryData::index()) as $code) {
            if (EuropeanCountryChecker::is_eu_by_code($code)) {
                $members[] = $code;
            }
        }

        sort($members);

        $this->assertSame($this->expected_members, $members);
    }

    public function test_it_matches_a_member_by_its_name_from_the_dataset(): void
    {
        $this->bootstrap_application();
        CountryData::flush();

        $this->assertTrue(EuropeanCountryChecker::is_eu_by_name('Germany'));
        $this->assertFalse(EuropeanCountryChecker::is_eu_by_name('United States'));
    }
}
