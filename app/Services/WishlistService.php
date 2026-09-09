<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\App\Models\Wishlist;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Http\Response;

class WishlistService
{
    /**
     * Get all wishlist items for the given user.
     *
     * @param int $user_id user id.
     *
     * @return \Kirki\Ecommerce\Framework\Collections\Collection
     */
    public function get_for_user(int $user_id)
    {
        return Wishlist::where('user_id', $user_id)
            ->with(['variant.product.media', 'variant.product.currency', 'variant.media'])
            ->order_by('id', 'desc')
            ->get();
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

        if (!$variant) {
            throw new NotFoundException(__('Variant not found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        $existing = Wishlist::where('user_id', $user_id)
            ->where('variant_id', $variant_id)
            ->first();

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

        if (!$item) {
            throw new NotFoundException(__('Wishlist item not found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

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
