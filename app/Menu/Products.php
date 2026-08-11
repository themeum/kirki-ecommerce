<?php

namespace Kirki\Ecommerce\App\Menu;

use Kirki\Ecommerce\Framework\Wordpress\Constants\MenuTypes;
use Kirki\Ecommerce\Framework\Wordpress\Menu;

class Products extends Menu
{
    /** @inheritDoc */
    protected $menu_type = MenuTypes::SUB_MENU;

    /** @inheritDoc */
    protected $capabilities = 'manage_options';

    /** @inheritDoc */
    protected $menu_slug = 'kirki-ecommerce#/products';

    /** @inheritDoc */
    protected $parent_slug = 'kirki-ecommerce';

    public function __construct()
    {
        $this->page_title = __('Products', 'kirki-ecommerce');
        $this->menu_title = __('Products', 'kirki-ecommerce');

        parent::__construct();
    }
}
