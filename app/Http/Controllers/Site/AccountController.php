<?php

/**
 * Manage Customer Account
 *
 * @package Kirki\Ecommerce\App\Http\Controllers\Site
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

namespace Kirki\Ecommerce\App\Http\Controllers\Site;

use Kirki\Ecommerce\App\Supports\Utils;
use Kirki\Ecommerce\Framework\Http\Request;
use Kirki\Ecommerce\Framework\Http\Response;

use function Kirki\Ecommerce\Framework\response;
use function Kirki\Ecommerce\Framework\view;

/**
 * Class AccountController
 *
 * @since 1.0.0
 */
class AccountController
{
    /**
     * Account pages.
     *
     * @since 1.0.0
     *
     * @var array
     */
    private $pages = [];

    /**
     * Constructor.
     *
     * @since 1.0.0
     */
    public function __construct()
    {
        $this->pages = Utils::get_account_pages();
    }

    /**
     * Dashboard page.
     *
     * @since 1.0.0
     *
     * @param Request $request Request.
     *
     * @return Response response.
     */
    public function dashboard(Request $request)
    {
        return view('site.account', ['pages' => $this->pages])->layout(false);
    }

    /**
     * Orders page.
     *
     * @since 1.0.0
     *
     * @param Request $request Request.
     *
     * @return Response response.
     */
    public function orders(Request $request)
    {
        return view('site.account.orders', ['pages' => $this->pages])->layout(false);
    }

    /**
     * Order details page.
     *
     * @since 1.0.0
     *
     * @param Request $request Request.
     * @param string  $uuid    Order uuid.
     *
     * @return Response response.
     */
    public function order_details(Request $request, $uuid)
    {
        $order = $request->user()->orders()->where('uuid', $uuid)->first();

        return view('site.account.order-details', ['pages' => $this->pages, 'order' => $order])->layout(false);
    }

    /**
     * Addresses page.
     *
     * @since 1.0.0
     *
     * @param Request $request Request.
     *
     * @return Response response.
     */
    public function addresses(Request $request)
    {
        return view('site.account.addresses', ['pages' => $this->pages])->layout(false);
    }

    /**
     * Account details page.
     *
     * @since 1.0.0
     *
     * @param Request $request Request.
     *
     * @return Response response.
     */
    public function account_details(Request $request)
    {
        return view('site.account.account-details', ['pages' => $this->pages])->layout(false);
    }
}
