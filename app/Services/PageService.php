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
}
