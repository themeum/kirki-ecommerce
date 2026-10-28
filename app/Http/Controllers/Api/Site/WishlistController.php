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

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\App\DTO\ListFilterDTO;
use Kirki\Ecommerce\App\Resources\Wishlist\WishlistResource;
use Kirki\Ecommerce\App\Services\WishlistService;
use Kirki\Ecommerce\App\Supports\Template;
use Kirki\Ecommerce\Framework\Collections\Collection;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;
use Kirki\Ecommerce\Framework\Http\Request;
use Kirki\Ecommerce\Framework\Http\Response;

use function Kirki\Ecommerce\Framework\include_view;
use function Kirki\Ecommerce\Framework\response;
use function Kirki\Ecommerce\Framework\user;

/**
 * REST controller for the logged-in customer's wishlist.
 *
 * @since 1.0.0
 */
class WishlistController
{
    /** @var WishlistService */
    protected $wishlist_service;

    /**
     * Create the controller with the wishlist service.
     *
     * @since 1.0.0
     *
     * @param WishlistService $wishlist_service
     */
    public function __construct(WishlistService $wishlist_service)
    {
        $this->wishlist_service = $wishlist_service;
    }

    /**
     * List the logged-in user's wishlist items.
     *
     * When the requested limit equals Pagination::ALL, every item is returned as a single page. Otherwise items are paged nine at a time from `current_page`, and `format=html` renders them through the product card view.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The wishlist items and pagination, or rendered HTML.
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

        $format = $request->string('format', 'json');
        $params->page = $request->int('current_page', 1);
        $params->limit = 9;
        $wishlist = $this->wishlist_service->paginated($user_id, $params);
        $wishlists_resource = new Collection(WishlistResource::collection($wishlist->items()->all()));

        if ( 'html' === $format ) {
            ob_start();
            foreach( $wishlists_resource as $wishlist_item ) {
               include_view('site.shop.parts.product-card', ['product' => $wishlist_item , 'context' => 'account']);
            }

            $items_html = ob_get_clean();

            ob_start();
            Template::render_pagination($wishlist);
            $pagination_html = ob_get_clean();

            $data = [
                'items' => $items_html,
                'pagination' => $pagination_html
            ];
        } else {
            $pagination = $wishlist->to_array();
            unset($pagination['results']);

            $data = [
                'items' => $wishlists_resource,
                'pagination' => $pagination
            ];
        }

        return response()->json([
            'data'    => $data,
            'message' => __('Wishlist retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Add a product to the logged-in user's wishlist.
     *
     * The body holds `product_id` and, optionally, the `variant_id` the user chose. A product already on the wishlist keeps its single entry. The service answers 404 when the product is missing or unpublished, or the variant does not belong to it.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The wishlist entry with a 201 status.
     */
    public function add_item(Request $request)
    {
        $user_id    = (int) user()->get_id();
        $product_id = $request->int('product_id');
        $variant_id = $request->int('variant_id');

        $wishlist = $this->wishlist_service->add_item($user_id, $product_id, $variant_id ?: null);

        return response()->json([
            'data'    => WishlistResource::make($wishlist),
            'message' => __('Item added to wishlist successfully.', 'kirki-ecommerce'),
        ], Response::CREATED);
    }

    /**
     * Remove a product from the logged-in user's wishlist.
     *
     * The route `id` is the product ID. The service answers 404 when the product is not on the wishlist.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse Success response.
     */
    public function remove_item(Request $request)
    {
        $user_id    = (int) user()->get_id();
        $product_id = $request->int('id');

        $this->wishlist_service->remove_item($user_id, $product_id);

        return response()->json([
            'data'    => true,
            'message' => __('Item removed from wishlist successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Remove every item from the logged-in user's wishlist.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse Success response with `data` set to true.
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
