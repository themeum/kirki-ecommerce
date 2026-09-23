<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\App\DTO\ListFilterDTO;
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
 * Manages users' wishlists of product variants.
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
     * Build the query for a user's wishlist items, with their variants and products loaded.
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
            ->with(['variant.product.media', 'variant.product.currency', 'variant.media', 'variant.product.categories']);

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
     * Get a user's wishlist entry for a variant.
     *
     * @since 1.0.0
     *
     * @param int $user_id    User ID.
     * @param int $variant_id Variant ID.
     * @return Wishlist|null Null when the variant is not in the user's wishlist.
     */
    public function get_item(int $user_id, int $variant_id)
    {
        return Wishlist::where('user_id', $user_id)->where('variant_id', $variant_id)->first();
    }

    /**
     * Check whether a variant is in a user's wishlist.
     *
     * @since 1.0.0
     *
     * @param int $variant_id Variant ID.
     * @param int $user_id    User ID; the current user when 0.
     * @return bool False for guests.
     */
    public function is_wishlisted(int $variant_id, int $user_id = 0): bool
    {
        $user_id = $user_id ?: (int) user()->get_id();

        if (empty($user_id)) {
            return false;
        }

        return (bool) $this->get_item($user_id, $variant_id);
    }

    /**
     * Add a variant to a user's wishlist.
     *
     * Returns the existing entry when the variant is already there.
     *
     * @since 1.0.0
     *
     * @param int $user_id    User ID.
     * @param int $variant_id Variant ID.
     * @return Wishlist
     * @throws NotFoundException When the variant does not exist.
     */
    public function add_item(int $user_id, int $variant_id)
    {
        $variant = Variant::find($variant_id);

        throw_if(!$variant, __('Variant not found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        $existing = $this->get_item($user_id, $variant_id);

        if ($existing) {
            return $existing;
        }

        return Wishlist::create([
            'user_id'    => $user_id,
            'variant_id' => $variant_id,
        ]);
    }

    /**
     * Remove a variant from a user's wishlist.
     *
     * @since 1.0.0
     *
     * @param int $user_id    User ID.
     * @param int $variant_id Variant ID.
     * @return bool True when the entry was deleted.
     * @throws NotFoundException When the variant is not in the user's wishlist.
     */
    public function remove_item(int $user_id, int $variant_id)
    {
        $item = Wishlist::where('user_id', $user_id)
            ->where('variant_id', $variant_id)
            ->first();

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
