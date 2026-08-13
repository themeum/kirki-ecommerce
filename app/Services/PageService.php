<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\Framework\Collections\Collection;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;
use Kirki\Ecommerce\App\DTO\ListFilterDTO;

use function Kirki\Ecommerce\Framework\collection;

class PageService
{
    /**
     * Return all pages
     *
     * @param ListFilterDTO $filters
     * @return Collection
     */
    public function all()
    {
        $pages = get_pages([
            'post_type' => 'page',
            'post_status' => 'publish',
            'sort_column' => 'menu_order,post_title',
            'sort_order' => 'asc',
        ]);

        return collection($pages);
    }
}
