<?php

namespace Kirki\Ecommerce\App\Resources\Product;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Resources\Variant\VariantResource;
use Kirki\Ecommerce\App\Constants\Product\AvailabilityStatus;
use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\App\Services\AvailabilityService;
use Kirki\Ecommerce\App\Services\ReviewService;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\App\Supports\ProductAttributeFormatter;
use Kirki\Ecommerce\Framework\Resource;
use Kirki\Ecommerce\Framework\Supports\MediaAttachment;
use function Kirki\Ecommerce\Framework\app;

/**
 * API resource for a full product (admin), with taxonomy, media, attributes and variants.
 *
 * @since 1.0.0
 */
class ProductResource extends Resource
{
    /**
     * Storefront preview URL of the product, when supplied.
     *
     * @var string|null
     */
    protected $preview_url;

    /**
     * Create the resource for a product.
     *
     * @since 1.0.0
     *
     * @param Product     $product     Product with its relations loaded.
     * @param string|null $preview_url Storefront preview URL to expose as `preview_url`.
     */
    public function __construct(Product $product, ?string $preview_url = null)
    {
        $this->preview_url = $preview_url;
        parent::__construct($product);
    }
    /**
     * Convert the product resource to an array.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed> The product data, including SEO fields, taxonomy, media, attributes and variants.
     */
    public function to_array()
    {
        $availability_service = app()->make(AvailabilityService::class);
        $store_default_threshold = (int) Settings::get('product.low_stock_threshold', 0);
        $availability_status = $availability_service->resolve_product_status($this->variants->all(), $store_default_threshold);

        $approved_reviews = $this->relation_loaded('approved_reviews')
            ? $this->approved_reviews
            : ($this->resource && method_exists($this->resource, 'approved_reviews') ? $this->resource->approved_reviews()->get() : null);

        $reviews_count = $approved_reviews ? $approved_reviews->count() : 0;
        $total_rating = 0;
        $rating_breakdown = [5 => 0, 4 => 0, 3 => 0, 2 => 0, 1 => 0];
        if ($approved_reviews) {
            foreach ($approved_reviews as $rev) {
                $r = max(1, min(5, (int) $rev->rating));
                $total_rating += $r;
                $rating_breakdown[$r] = ($rating_breakdown[$r] ?? 0) + 1;
            }
        }
        $average_rating = $reviews_count > 0 ? round($total_rating / $reviews_count, 1) : 0;

        foreach ($this->variants as $variant) {
            $variant->set_relation('product', $this->resource);
        }

        $current_user_id = function_exists('is_user_logged_in') && is_user_logged_in() ? get_current_user_id() : null;
        $current_wp_user = $current_user_id ? wp_get_current_user() : null;
        $current_email = $current_wp_user ? $current_wp_user->user_email : null;
        $review_eligibility = app(ReviewService::class)->check_eligibility($this->id, $current_user_id, $current_email);

        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'status' => $this->status,
            'ribbon' => $this->ribbon,
            'ribbon_color' => $this->ribbon_color,
            'reviews_count' => $reviews_count,
            'average_rating' => $average_rating,
            'rating_breakdown' => $rating_breakdown,
            'review_eligibility' => $review_eligibility,
            'reviews' => $approved_reviews ? $approved_reviews->map(function ($review) {
                return [
                    'id' => (int) $review->id,
                    'author_name' => $review->author_name,
                    'rating' => (int) $review->rating,
                    'title' => $review->title,
                    'content' => $review->content,
                    'is_verified_purchase' => (bool) $review->is_verified_purchase,
                    'admin_reply' => $review->admin_reply,
                    'admin_replied_at' => $review->admin_replied_at ? (is_string($review->admin_replied_at) ? date('M d, Y', strtotime($review->admin_replied_at)) : $review->admin_replied_at->format('M d, Y')) : null,
                    'helpful_count' => (int) ($review->helpful_count ?? 0),
                    'created_at' => $review->created_at ? (is_string($review->created_at) ? date('M d, Y', strtotime($review->created_at)) : $review->created_at->format('M d, Y')) : '',
                ];
            })->all() : [],
            'is_enabled_reviews' => (bool) Settings::get('product.is_enabled_reviews', true),
            'is_enabled_star_ratings' => (bool) Settings::get('product.is_enabled_star_ratings', true),

            'brand' => !$this->brand_id ? null : [
                'id' => $this->brand_id,
                'name' => $this->brand->name,
                'logo' => MediaAttachment::make($this->brand->logo)
            ],

            'short_description' => $this->short_description,
            'description' => $this->description,
            'additional_info' => $this->additional_info,
            'seo_title' => $this->seo_title,
            'seo_description' => $this->seo_description,
            'seo_keywords' => $this->seo_keywords,
            'og_title' => $this->og_title,
            'og_description' => $this->og_description,
            'og_image' => MediaAttachment::make($this->og_image),
            'has_variants' => $this->has_variants,
            'availability_status' => $availability_status,
            'availability_label' => !is_null($availability_status) ? AvailabilityStatus::get_formatted($availability_status) : null,

            'categories' => $this->categories ? $this->categories->map(function ($item) {
                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'parent_id' => $item->parent_id,
                    'level' => $item->level,
                ];
            }) : [],
            'tags' => $this->tags ? $this->tags->map(function ($item) {
                return [
                    'id' => $item->id,
                    'name' => $item->name,
                ];
            }) : [],
            'collections' => $this->collections ? $this->collections->map(function ($item) {
                return [
                    'id' => $item->id,
                    'title' => $item->title,
                ];
            }) : [],

            'attributes' => !empty($this->attributes)
                ? ProductAttributeFormatter::format($this->attributes->to_array(), $this->attribute_values->to_array(), $this->variants)
                : [],
            'variants' => VariantResource::collection($this->variants),
            'media' => MediaAttachment::make_many($this->media->pluck('ID')->all()),

            'preview_url' => $this->preview_url,

            'published_at' => $this->published_at,
            'scheduled_at' => $this->scheduled_at,
            'trashed_at' => $this->trashed_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
