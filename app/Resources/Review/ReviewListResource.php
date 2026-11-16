<?php

namespace Kirki\Ecommerce\App\Resources\Review;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\Resource;

/**
 * API resource for a review in administrative list views.
 *
 * @since 1.0.1
 */
class ReviewListResource extends Resource
{
    /**
     * Convert the review resource to an array.
     *
     * @since 1.0.1
     *
     * @return array<string, mixed>
     */
    public function to_array()
    {
        return [
            'id' => (int) $this->id,
            'product_id' => (int) $this->product_id,
            'user_id' => $this->user_id ? (int) $this->user_id : null,
            'author_name' => $this->author_name,
            'author_email' => $this->author_email,
            'rating' => (int) $this->rating,
            'title' => $this->title,
            'content' => $this->content,
            'status' => $this->status,
            'is_verified_purchase' => (bool) $this->is_verified_purchase,
            'admin_reply' => $this->admin_reply,
            'admin_replied_at' => $this->admin_replied_at ? (string) $this->admin_replied_at : null,
            'helpful_count' => (int) ($this->helpful_count ?? 0),
            'created_at' => (string) $this->created_at,
            'product' => $this->product ? [
                'id' => (int) $this->product->id,
                'title' => $this->product->title,
                'slug' => $this->product->slug,
            ] : null,
        ];
    }
}
