<?php

/**
 * Manage Customer Wishlist API
 *
 * @package Kirki\Ecommerce\App\Http\Controllers\Api\Site
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

namespace Kirki\Ecommerce\App\Http\Controllers\Api\Site;

use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\App\Constants\Product\ProductStatus;
use Kirki\Ecommerce\App\DTO\ListFilterDTO;
use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\App\Models\Wishlist;
use Kirki\Ecommerce\App\Resources\Wishlist\WishlistResource;
use Kirki\Ecommerce\App\Services\WishlistService;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;
use Kirki\Ecommerce\Framework\Http\Request;
use Kirki\Ecommerce\Framework\Http\Response;

use function Kirki\Ecommerce\Framework\response;
use function Kirki\Ecommerce\Framework\user;

/**
 * Class WishlistController
 *
 * @since 1.0.0
 */
class WishlistController
{
    /**
     * @var WishlistService
     */
    protected $wishlist_service;

    /**
     * WishlistController constructor.
     *
     * @param WishlistService $wishlist_service
     */
    public function __construct(WishlistService $wishlist_service)
    {
        $this->wishlist_service = $wishlist_service;
    }

    /**
     * Get paginated wishlist items for the authenticated user.
     *
     * @param Request $request Request.
     *
     * @return Response JSON response.
     */
    public function get(Request $request)
    {
        $user_id = (int) user()->get_id();
        $params  = ListFilterDTO::from_array($request->all());

        if ((int) $params->limit === Pagination::ALL) {
            $data = $this->wishlist_service->all($user_id, $params);

            return response()->json([
                'data'    => WishlistResource::paginated(new Paginator($data, $data->count(), $data->count(), 1)),
                'message' => __('Wishlist retrieved successfully.', 'kirki-ecommerce'),
            ]);
        }

        $data = $this->wishlist_service->paginated($user_id, $params);

        return response()->json([
            'data'    => WishlistResource::paginated($data),
            'message' => __('Wishlist retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Check variant is valid or not.
     *
     * @param int $variant_id
     * @return bool
     */
    protected function is_valid_variant(int $variant_id): bool
    {
        if (!$variant_id) {
            return false;
        }

        $variant = Variant::find($variant_id);
        if ($variant) {
            $product = Product::where(['id' => $variant->product_id, 'status' => ProductStatus::PUBLISHED])->first();
            if ($product) {
                return true;
            }
        }
        return false;
    }

    /**
     * Add an item to the authenticated user's wishlist.
     *
     * @param Request $request Request.
     *
     * @return Response JSON response.
     */
    public function add_item(Request $request)
    {
        $user_id = (int) user()->get_id();
        $variant_id = $request->int('variant_id');

        if (!$this->is_valid_variant($variant_id)) {
            return response()->json([
                'message' => __('Variant not found.', 'kirki-ecommerce'),
            ], Response::NOT_FOUND);
        }

        $wishlist = $this->wishlist_service->add_item($user_id, $variant_id);

        return response()->json([
            'data'    => WishlistResource::make($wishlist),
            'message' => __('Item added to wishlist successfully.', 'kirki-ecommerce'),
        ], Response::CREATED);
    }

    /**
     * Remove an item from the authenticated user's wishlist.
     *
     * @param Request $request Request.
     *
     * @return Response JSON response.
     */
    public function remove_item(Request $request)
    {
        $user_id = (int) user()->get_id();
        $variant_id = $request->int('variant_id');

        $wishlist = Wishlist::where(['user_id' => $user_id, 'variant_id' => $variant_id])->first();

        if (!$wishlist) {
            return response()->json([
                'message' => __('Wishlist not found.', 'kirki-ecommerce'),
            ], Response::NOT_FOUND);
        }

        $this->wishlist_service->remove_item($user_id, $variant_id);

        return response()->json([
            'data'    => true,
            'message' => __('Item removed from wishlist successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Clear all wishlist items for the authenticated user.
     *
     * @param Request $request Request.
     *
     * @return Response JSON response.
     */
    public function empty_wishlist(Request $request)
    {
        $user_id = (int) user()->get_id();
        $this->wishlist_service->empty_wishlist($user_id);

        return response()->json([
            'data'    => true,
            'message' => __('Wishlist cleared successfully.', 'kirki-ecommerce'),
        ]);
    }
}
