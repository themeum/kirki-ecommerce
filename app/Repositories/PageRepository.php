<?php

namespace Kirki\Ecommerce\App\Repositories;

use Kirki\Ecommerce\Collections\Collection;

use function Kirki\Ecommerce\collection;

class PageRepository
{
    /**
     * Get all pages
     *
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
