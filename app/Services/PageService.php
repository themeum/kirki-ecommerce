<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\DTO\PageFilterDTO;
use Kirki\Ecommerce\App\Models\Page;
use Kirki\Ecommerce\Framework\Collections\Collection;
use Kirki\Ecommerce\Framework\Supports\Str;

class PageService
{
    /**
     * Return all pages
     *
     * @return Collection
     */
    public function get(PageFilterDTO $filters = null)
    {
        $query = Page::query()->where('post_type', 'page')->order_by('id', 'desc');

        if ($filters->status) {
            $query->where_in('post_status', Str::split(',', $filters->status));
        }

        return $query->get();
    }

    /**
     * Find published pages by their slugs in a single query.
     *
     * @param string[] $slugs
     *
     * @return Collection
     */
    public function find_published_by_slugs(array $slugs)
    {
        $slugs = array_values(array_unique(array_filter($slugs)));

        if (empty($slugs)) {
            return Page::query()->where('ID', 0)->get();
        }

        return Page::query()
            ->where('post_type', 'page')
            ->where('post_status', 'publish')
            ->where_in('post_name', $slugs)
            ->get();
    }
}
