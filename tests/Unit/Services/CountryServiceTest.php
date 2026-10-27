<?php

namespace Kirki\Ecommerce\Tests\Unit\Services;

use Kirki\Ecommerce\App\DTO\Country\CountryFilterDTO;
use Kirki\Ecommerce\App\Services\CountryService;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Tests\Unit\TestCase;

class CountryServiceTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->bootstrap_application();
    }

    protected function make_service(): CountryService
    {
        return new CountryService();
    }

    protected function filters(?string $group = null): CountryFilterDTO
    {
        return CountryFilterDTO::from_array($group === null ? [] : ['group' => $group]);
    }

    public function test_unfiltered_list_returns_every_country(): void
    {
        $countries = $this->make_service()->all($this->filters());

        $this->assertCount(250, $countries);
        $this->assertSame(range(0, 249), array_keys($countries));
    }

    public function test_group_filtered_list_is_sequentially_indexed(): void
    {
        $countries = $this->make_service()->all($this->filters('eu'));

        $this->assertCount(27, $countries);
        $this->assertSame(
            range(0, count($countries) - 1),
            array_keys($countries),
            'A group-filtered list must be a JSON array, not an object keyed by source positions.'
        );

        foreach ($countries as $country) {
            $this->assertSame('eu', $country['group']);
        }
    }

    public function test_filtering_does_not_poison_a_later_read(): void
    {
        $service = $this->make_service();

        $service->all($this->filters('eu'));

        $this->assertCount(
            250,
            $service->all($this->filters()),
            'all() must not mutate its own dataset - a shared instance would leak the filter.'
        );
    }

    public function test_find_resolves_a_country_with_its_states(): void
    {
        $country = $this->make_service()->find('US');

        $this->assertSame('United States', $country['name']);
        $this->assertNotEmpty($country['states']);
    }

    public function test_find_is_case_insensitive(): void
    {
        $service = $this->make_service();

        $this->assertSame($service->find('US'), $service->find('us'));
    }

    public function test_find_throws_for_an_unknown_code(): void
    {
        $this->expectException(NotFoundException::class);

        $this->make_service()->find('ZZ');
    }
}
