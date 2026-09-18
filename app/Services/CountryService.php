<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\DTO\Country\CountryFilterDTO;
use Kirki\Ecommerce\App\Supports\CountryData;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Http\Response;

use function Kirki\Ecommerce\Framework\collection;
use function Kirki\Ecommerce\Framework\throw_if;

class CountryService
{
    protected $data = [];

    public function __construct()
    {
        $this->load_data();
    }

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

    public function find(string $code)
    {
        $country = $this->find_by_code($code);

        throw_if(!$country, __('Country not found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        return $country;
    }

    protected function find_by_code(string $code)
    {
        return CountryData::find_nested($code);
    }

    protected function load_data()
    {
        $this->data = CountryData::nested();
    }
}
