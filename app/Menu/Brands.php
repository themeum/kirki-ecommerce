<?php

namespace Kirki\Ecommerce\App\Menu;

use Kirki\Ecommerce\Wordpress\Constants\MenuTypes;
use Kirki\Ecommerce\Wordpress\Menu;

class Brands extends Menu
{
    /** @inheritDoc */
    protected $menu_type = MenuTypes::SUB_MENU;

    /** @inheritDoc */
    protected $capabilities = 'manage_options';

    /** @inheritDoc */
    protected $menu_slug = 'ecommerce#/brands';

    /** @inheritDoc */
    protected $parent_slug = 'ecommerce';

    public function __construct()
    {
        $this->page_title = __('Brands', 'kirki-ecommerce');
        $this->menu_title = __('Brands', 'kirki-ecommerce');

        parent::__construct();
    }
}
