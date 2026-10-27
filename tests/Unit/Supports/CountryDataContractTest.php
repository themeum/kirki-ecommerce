<?php

namespace Kirki\Ecommerce\Tests\Unit\Supports;

use Kirki\Ecommerce\App\Supports\CountryData;
use Kirki\Ecommerce\App\Supports\Utils;
use Kirki\Ecommerce\Tests\Unit\TestCase;

/**
 * Guards the public shape of the country dataset.
 *
 * This replaces the identity test that compared the output byte-for-byte against
 * data-src/countries.json. Both halves of that proof are gone by design: the
 * authoring source is deleted, and translation plus locale-aware sorting change
 * the output deliberately. What still has to hold is the structure, and none of
 * it needs a fixture.
 */
class CountryDataContractTest extends TestCase
{
    /**
     * The key order every country in the public list must preserve.
     *
     * `states` sits between `flag` and `numeric_code`, not last. The order
     * survives into json_encode, so it is part of the wire format.
     *
     * @var string[]
     */
    protected $expected_key_order = [
        'name',
        'code',
        'phone_code',
        'currency',
        'currency_name',
        'currency_symbol',
        'flag',
        'states',
        'numeric_code',
        'group',
    ];

    protected function setUp(): void
    {
        parent::setUp();

        $this->bootstrap_application();
        CountryData::flush();
    }

    public function test_the_dataset_holds_every_country_and_state(): void
    {
        $countries = Utils::get_countries();

        $this->assertCount(250, $countries);

        $total_states = 0;

        foreach ($countries as $country) {
            $total_states += count($country['states']);
        }

        $this->assertSame(4991, $total_states);
    }

    public function test_every_country_preserves_the_key_order(): void
    {
        $countries = Utils::get_countries();

        $this->assertNotEmpty($countries);

        foreach ($countries as $index => $country) {
            $this->assertSame(
                $this->expected_key_order,
                array_keys($country),
                sprintf('Country at index %d has the wrong key order.', $index)
            );
        }
    }

    public function test_the_list_is_sequentially_indexed(): void
    {
        $countries = Utils::get_countries();

        $this->assertSame(range(0, count($countries) - 1), array_keys($countries));
    }

    public function test_states_carry_only_an_id_and_a_name(): void
    {
        foreach (Utils::get_countries() as $country) {
            foreach ($country['states'] as $state) {
                $this->assertSame(['id', 'name'], array_keys($state));
            }
        }
    }

    /**
     * `has_states` exists in the index so a consumer holding only the index can
     * answer the question without reading the states file. It is an internal
     * detail and must not reach the public list.
     */
    public function test_has_states_does_not_leak_into_the_public_output(): void
    {
        foreach (Utils::get_countries() as $country) {
            $this->assertArrayNotHasKey('has_states', $country);
        }

        $this->assertArrayHasKey('has_states', CountryData::find_index_entry('US'));
    }

    /**
     * Ordering is asserted with ASCII-only names, which collate identically
     * whether the Collator path or the accent-folding fallback runs. The
     * fallback's handling of accents is covered in the Integration suite,
     * against WordPress's own remove_accents().
     */
    public function test_countries_are_ordered_by_their_displayed_name(): void
    {
        $names = array_column(Utils::get_countries(), 'name');

        $this->assertLessThan(
            array_search('Algeria', $names, true),
            array_search('Albania', $names, true),
            'Albania must sort before Algeria.'
        );
        $this->assertLessThan(
            array_search('Zimbabwe', $names, true),
            array_search('Afghanistan', $names, true),
            'Afghanistan must sort before Zimbabwe.'
        );
    }

    public function test_states_are_ordered_within_their_country(): void
    {
        $states = CountryData::states_for('US');
        $names = array_column($states, 'name');

        $this->assertNotEmpty($names);
        $this->assertLessThan(
            array_search('Wyoming', $names, true),
            array_search('Alabama', $names, true),
            'Alabama must sort before Wyoming.'
        );
    }
}
