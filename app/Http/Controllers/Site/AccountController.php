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

use function Kirki\Ecommerce\Framework\response;
use function Kirki\Ecommerce\Framework\view;

/**
 * Class AccountController
 *
 * @since 1.0.0
 */
class AccountController
{
    private $pages = [];

    public function __construct()
    {
        $this->pages = Utils::get_account_pages();
    }

    public function dashboard(Request $request)
    {
        return view('site.account', ['pages' => $this->pages])->layout(false);
    }

    public function orders(Request $request)
    {
        return view('site.account.orders', ['pages' => $this->pages])->layout(false);
    }

    public function addresses(Request $request)
    {
        return view('site.account.addresses', ['pages' => $this->pages])->layout(false);
    }

    public function account_details(Request $request)
    {
        return view('site.account.account-details', ['pages' => $this->pages])->layout(false);
    }
}
