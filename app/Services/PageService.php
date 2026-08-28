<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Models\Page;
use Kirki\Ecommerce\Framework\Collections\Collection;

class PageService
{
    /**
     * Return all pages
     *
     * @return Collection
     */
    public function all()
    {
        return Page::order_by('id', 'desc')->get();
    }
}
