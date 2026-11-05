<?php

namespace Kirki\Ecommerce\App\Services;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\App\Constants\Product\ProductStatus;
use Kirki\Ecommerce\App\DTO\ListFilterDTO;
use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\App\Models\Wishlist;
use Kirki\Ecommerce\Framework\Collections\Collection;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;
use Kirki\Ecommerce\Framework\Database\Query\QueryBuilder;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Http\Response;

use function Kirki\Ecommerce\Framework\throw_if;

use function Kirki\Ecommerce\Framework\user;

/**
 * Manages users' wishlists of products.
 *
 * @since 1.0.0
 */
class WishlistService
{
    /**
     * Get a page of a user's wishlist items.
     *
     * @since 1.0.0
     *
     * @param int           $user_id User ID.
     * @param ListFilterDTO $filters Sorting and pagination filters.
     * @return Paginator
     */
    public function paginated(int $user_id, ListFilterDTO $filters)
    {
        return $this->list_query($user_id, $filters)->paginate($filters->limit ?? Pagination::LIMIT, $filters->page ?? 1);
    }

    /**
     * Get all of a user's wishlist items, without pagination.
     *
     * @since 1.0.0
     *
     * @param int                $user_id User ID.
     * @param ListFilterDTO|null $filters Sorting filters.
     * @return Collection Collection of Wishlist.
     */
    public function all(int $user_id, ?ListFilterDTO $filters = null)
    {
        return $this->list_query($user_id, $filters)->get();
    }

    /**
     * Get all of a user's wishlist items, newest first.
     *
     * @since 1.0.0
     *
     * @param int $user_id User ID.
     * @return Collection Collection of Wishlist.
     */
    public function get_for_user(int $user_id)
    {
        return $this->all($user_id);
    }

    /**
     * Build the query for a user's wishlist items, with their products and variants loaded.
     *
     * Sorts by the filters' sort field and order, or newest first when they are missing.
     *
     * @since 1.0.0
     *
     * @param int                $user_id User ID.
     * @param ListFilterDTO|null $filters Sorting filters.
     * @return QueryBuilder
     */
    protected function list_query(int $user_id, ?ListFilterDTO $filters = null)
    {
        $query = Wishlist::query()
            ->where('user_id', $user_id)
            ->with(['product.media', 'product.categories', 'product.variants.media']);

        if ($filters) {
            $query->when(!empty($filters->sort_by) && !empty($filters->sort_order), function (QueryBuilder $q) use ($filters) {
                return $q->order_by($filters->sort_by, $filters->sort_order);
            }, function (QueryBuilder $q) {
                return $q->order_by('id', 'desc');
            });
        } else {
            $query->order_by('id', 'desc');
        }

        return $query;
    }

    /**
     * Get a user's wishlist entry for a product.
     *
     * @since 1.0.0
     *
     * @param int $user_id    User ID.
     * @param int $product_id Product ID.
     * @return Wishlist|null Null when the product is not in the user's wishlist.
     */
    public function get_item(int $user_id, int $product_id)
    {
        return Wishlist::where('user_id', $user_id)->where('product_id', $product_id)->first();
    }

    /**
     * Check whether a product is in a user's wishlist, whichever variant the entry holds.
     *
     * @since 1.0.0
     *
     * @param int $product_id Product ID.
     * @param int $user_id    User ID; the current user when 0.
     * @return bool False for guests.
     */
    public function is_wishlisted(int $product_id, int $user_id = 0): bool
    {
        $user_id = $user_id ?: (int) user()->get_id();

        if (empty($user_id)) {
            return false;
        }

        return (bool) $this->get_item($user_id, $product_id);
    }

    /**
     * Add a product to a user's wishlist.
     *
     * Returns the existing entry when the product is already there. A variant sent with an existing entry replaces the entry's variant; no variant leaves it unchanged.
     *
     * @since 1.0.0
     *
     * @param int      $user_id    User ID.
     * @param int      $product_id Product ID.
     * @param int|null $variant_id Variant the user chose, or null when they chose none.
     * @return Wishlist
     * @throws NotFoundException When the product is missing or not published, or the variant does not belong to it.
     */
    public function add_item(int $user_id, int $product_id, ?int $variant_id = null)
    {
        $product = Product::where(['id' => $product_id, 'status' => ProductStatus::PUBLISHED])->first();

        throw_if(!$product, __('Product not found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        if ($variant_id) {
            $variant = Variant::where(['id' => $variant_id, 'product_id' => $product_id])->first();

            throw_if(!$variant, __('Variant not found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);
        }

        $existing = $this->get_item($user_id, $product_id);

        if (!$existing) {
            return Wishlist::create([
                'user_id'    => $user_id,
                'product_id' => $product_id,
                'variant_id' => $variant_id ?: null,
            ]);
        }

        if ($variant_id && (int) $existing->variant_id !== $variant_id) {
            $existing->update(['variant_id' => $variant_id]);
        }

        return $existing;
    }

    /**
     * Remove a product from a user's wishlist.
     *
     * @since 1.0.0
     *
     * @param int $user_id    User ID.
     * @param int $product_id Product ID.
     * @return bool True when the entry was deleted.
     * @throws NotFoundException When the product is not in the user's wishlist.
     */
    public function remove_item(int $user_id, int $product_id)
    {
        $item = $this->get_item($user_id, $product_id);

        throw_if(!$item, __('Wishlist item not found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        return (bool) $item->delete();
    }

    /**
     * Remove every item from a user's wishlist.
     *
     * @since 1.0.0
     *
     * @param int $user_id User ID.
     * @return bool True when items were deleted.
     */
    public function empty_wishlist(int $user_id)
    {
        return (bool) Wishlist::where('user_id', $user_id)->delete();
    }
}
