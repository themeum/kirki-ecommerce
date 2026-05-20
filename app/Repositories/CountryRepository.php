<?php

namespace Kirki\Ecommerce\App\Repositories;

use function Kirki\Ecommerce\collection;
use function Kirki\Ecommerce\json_decoded_data;
use function Kirki\Ecommerce\resource_path;

class CountryRepository
{
    protected $data = [];

    public function __construct()
    {
        $this->load_data();
    }

    public function all(array $filters = [])
    {
        if (!empty($filters['group'])) {
            $this->data = collection($this->data)->filter(fn($country) => $country['group'] === $filters['group'])->all();
        }

        return $this->data;
    }

    public function find_by_code(string $code)
    {
        $code = strtoupper($code);

        foreach ($this->data as $country) {
            if (strtoupper($country['code']) === $code) {
                return $country;
            }
        }

        return null;
    }

    protected function load_data()
    {
        $this->data = json_decoded_data(resource_path('data/countries.json')) ?? [];
    }
}
