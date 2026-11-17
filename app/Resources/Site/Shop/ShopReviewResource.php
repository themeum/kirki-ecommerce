<?php

namespace Kirki\Ecommerce\App\Resources\Site\Shop;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\Resource;

/**
 * API resource for a public customer review displayed on the storefront.
 *
 * @since 1.0.1
 */
class ShopReviewResource extends Resource
{
    /**
     * Convert the review resource to a safe storefront array.
     *
     * @since 1.0.1
     *
     * @return array<string, mixed>
     */
    public function to_array()
    {
        return [
            'id' => (int) $this->id,
            'author_name' => $this->author_name,
            'rating' => (int) $this->rating,
            'title' => $this->title,
            'content' => $this->content,
            'is_verified_purchase' => (bool) $this->is_verified_purchase,
            'admin_reply' => $this->admin_reply,
            'admin_replied_at' => $this->admin_replied_at ? (string) $this->admin_replied_at : null,
            'helpful_count' => (int) ($this->helpful_count ?? 0),
            'created_at' => (string) $this->created_at,
        ];
    }
}
