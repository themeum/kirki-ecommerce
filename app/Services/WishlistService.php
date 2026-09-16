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

class WishlistService
{
    /**
     * Return paginated wishlist items for the given user.
     *
     * @param int $user_id user id.
     * @param ListFilterDTO $filters filter DTO.
     *
     * @return Paginator
     */
    public function paginated(int $user_id, ListFilterDTO $filters)
    {
        return $this->list_query($user_id, $filters)->paginate($filters->limit ?? Pagination::LIMIT, $filters->page ?? 1);
    }

    /**
     * Return all wishlist items for the given user.
     *
     * @param int $user_id user id.
     * @param ListFilterDTO|null $filters filter DTO.
     *
     * @return Collection
     */
    public function all(int $user_id, ?ListFilterDTO $filters = null)
    {
        return $this->list_query($user_id, $filters)->get();
    }

    /**
     * Get all wishlist items for the given user.
     *
     * @param int $user_id user id.
     *
     * @return Collection
     */
    public function get_for_user(int $user_id)
    {
        return $this->all($user_id);
    }

    /**
     * Base query for a user's wishlist items.
     *
     * @param int $user_id user id.
     * @param ListFilterDTO|null $filters filter DTO.
     *
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
     * Check if a variant is in the wishlist for the given user.
     *
     * @param int $user_id user id.
     * @param int $variant_id variant id.
     *
     * @return Wishlist|null
     */
    public function get_item(int $user_id, int $variant_id)
    {
        return Wishlist::where('user_id', $user_id)->where('variant_id', $variant_id)->first();
    }

    /**
     * Check if a variant is in the wishlist for the given user.
     *
     * @param int $variant_id variant id.
     *
     * @return bool
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
     * Add an item to the wishlist.
     *
     * @param int $user_id user id.
     * @param int $variant_id variant id.
     *
     * @return Wishlist
     *
     * @throws NotFoundException
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
     * Remove an item from the wishlist, ensuring it belongs to the given user.
     *
     * @param int $user_id user id.
     * @param int $variant_id variant id.
     *
     * @return bool
     *
     * @throws NotFoundException
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
     * Clear all wishlist items for the given user.
     *
     * @param int $user_id user id.
     *
     * @return bool
     */
    public function empty_wishlist(int $user_id)
    {
        return (bool) Wishlist::where('user_id', $user_id)->delete();
    }
}
