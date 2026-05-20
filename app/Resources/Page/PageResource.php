<?php

namespace Kirki\Ecommerce\App\Resources\Page;

use Kirki\Ecommerce\Resource;

class PageResource extends Resource
{
    /**
     * Convert the page resource to an array.
     *
     * @return array The page data as an associative array.
     */
    public function to_array()
    {
        return [
            'id' => $this->ID,
            'title' => $this->post_title,
            'slug' => $this->post_name,
            'status' => $this->post_status,
            'created_at' => $this->post_date,
            'updated_at' => $this->post_modified,
        ];
    }
}
