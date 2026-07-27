<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Repositories\PageRepository;
use Kirki\Ecommerce\Framework\Collections\Collection;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;
use Kirki\Ecommerce\App\DTO\ListFilterDTO;

class PageService
{
    protected $repository;

    public function __construct(PageRepository $repository)
    {
        $this->repository = $repository;
    }

    /**
     * Return all pages
     *
     * @param ListFilterDTO $filters
     * @return Collection
     */
    public function all()
    {
        return $this->repository->all();
    }
}
