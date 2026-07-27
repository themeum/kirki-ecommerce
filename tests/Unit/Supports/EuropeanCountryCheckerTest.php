<?php

namespace Kirki\Ecommerce\Tests\Unit\Supports;

use Kirki\Ecommerce\App\Supports\EuropeanCountryChecker;
use Kirki\Ecommerce\Tests\Unit\TestCase;

use function Kirki\Ecommerce\Framework\json_decoded_data;

class EuropeanCountryCheckerTest extends TestCase
{
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

    public function test_it_matches_countries_from_resource_file_data(): void
    {
        $countries = json_decoded_data(
            self::plugin_path() . '/resources/data/european_union_countries.json'
        );

        $this->assertNotEmpty($countries);
        $this->set_european_country_checker_data($countries);

        $this->assertTrue(EuropeanCountryChecker::is_eu_by_name('Germany'));
        $this->assertTrue(EuropeanCountryChecker::is_eu_by_code('DE'));
        $this->assertFalse(EuropeanCountryChecker::is_eu_by_code('US'));
    }
}
