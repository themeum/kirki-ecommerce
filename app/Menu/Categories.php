<?php

namespace Kirki\Ecommerce\App\Menu;

use Kirki\Ecommerce\Framework\Wordpress\Constants\MenuTypes;
use Kirki\Ecommerce\Framework\Wordpress\Menu;

class Categories extends Menu
{
    /** @inheritDoc */
    protected $menu_type = MenuTypes::SUB_MENU;

    /** @inheritDoc */
    protected $capabilities = 'manage_options';

    /** @inheritDoc */
    protected $menu_slug = 'ecommerce#/categories';

    /** @inheritDoc */
    protected $parent_slug = 'ecommerce';

    public function __construct()
    {
        $this->page_title = __('Categories', 'kirki-ecommerce');
        $this->menu_title = __('Categories', 'kirki-ecommerce');

        parent::__construct();
    }
}
