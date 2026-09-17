<?php

use Kirki\Ecommerce\App\Menu\Brands;
use Kirki\Ecommerce\App\Menu\Categories;
use Kirki\Ecommerce\App\Menu\Collections;
use Kirki\Ecommerce\App\Menu\Coupons;
use Kirki\Ecommerce\App\Menu\Customers;
use Kirki\Ecommerce\App\Menu\Home;
use Kirki\Ecommerce\App\Menu\Inventory;
use Kirki\Ecommerce\App\Menu\Orders;
use Kirki\Ecommerce\App\Menu\Products;
use Kirki\Ecommerce\App\Menu\Root;
use Kirki\Ecommerce\App\Menu\Separator;
use Kirki\Ecommerce\App\Menu\Settings;
use Kirki\Ecommerce\App\Menu\Tags;

defined('ABSPATH') or exit;

return [
    Root::class,
    Home::class,
    Orders::class,
    Separator::class,
    Products::class,
    Inventory::class,
    Collections::class,
    Categories::class,
    Tags::class,
    Brands::class,
    Customers::class,
    Coupons::class,
    Settings::class,
];
