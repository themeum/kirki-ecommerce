<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Repositories\CountryRepository;
use Kirki\Ecommerce\App\DTO\Country\CountryFilterDTO;
use Kirki\Ecommerce\Exceptions\NotFoundException;
use Kirki\Ecommerce\Http\Response;

class CountryService
{
    protected $repository;

    public function __construct(CountryRepository $repository)
    {
        $this->repository = $repository;
    }

    public function all(CountryFilterDTO $filters)
    {
        return $this->repository->all($filters->all());
    }

    public function find(string $code)
    {
        $country = $this->repository->find_by_code($code);

        if (!$country) {
            throw new NotFoundException(__('Country not found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        return $country;
    }
}
