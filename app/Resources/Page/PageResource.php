<?php

namespace Kirki\Ecommerce\App\Resources\Page;

use Kirki\Ecommerce\Framework\Resource;

/**
 * API resource for a WordPress page.
 *
 * @since 1.0.0
 */
class PageResource extends Resource
{
    /**
     * Convert the page resource to an array.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed> The page ID, title, slug, status and dates.
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
