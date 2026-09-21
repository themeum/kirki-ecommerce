<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\DTO\Country\CountryFilterDTO;
use Kirki\Ecommerce\App\Supports\CountryData;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Http\Response;

use function Kirki\Ecommerce\Framework\collection;
use function Kirki\Ecommerce\Framework\throw_if;

/**
 * Provides the country list, with nested states, from the bundled country data.
 *
 * @since 1.0.0
 */
class CountryService
{
    /** @var array */
    protected $data = [];

    /**
     * Load the nested country data into memory.
     *
     * @since 1.0.0
     */
    public function __construct()
    {
        $this->load_data();
    }

    /**
     * Get all countries, optionally limited to one group.
     *
     * @since 1.0.0
     *
     * @param CountryFilterDTO $filters Filters; only the group is applied.
     * @return array Countries with their states nested.
     */
    public function all(CountryFilterDTO $filters)
    {
        if (empty($filters->group)) {
            return $this->data;
        }

        $filtered = collection($this->data)
            ->filter(fn($country) => $country['group'] === $filters->group)
            ->all();

        return array_values($filtered);
    }

    /**
     * Find a country, with its states, by its code.
     *
     * @since 1.0.0
     *
     * @param string $code Country code.
     * @return array
     * @throws NotFoundException When no country matches the code.
     */
    public function find(string $code)
    {
        $country = $this->find_by_code($code);

        throw_if(!$country, __('Country not found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        return $country;
    }

    /**
     * Look up a country with its states nested by code.
     *
     * @since 1.0.0
     *
     * @param string $code Country code.
     * @return array|null Null when the code is unknown.
     */
    protected function find_by_code(string $code)
    {
        return CountryData::find_nested($code);
    }

    /**
     * Populate the in-memory country list.
     *
     * @since 1.0.0
     *
     * @return void
     */
    protected function load_data()
    {
        $this->data = CountryData::nested();
    }
}
