<?php

namespace Kirki\Ecommerce\App\Menu;

use Kirki\Ecommerce\Framework\Wordpress\Constants\MenuTypes;
use Kirki\Ecommerce\Framework\Wordpress\Menu;

class Inventory extends Menu
{
    /** @inheritDoc */
    protected $menu_type = MenuTypes::SUB_MENU;

    /** @inheritDoc */
    protected $capabilities = 'manage_options';

    /** @inheritDoc */
    protected $menu_slug = 'kirki-ecommerce#/inventory';

    /** @inheritDoc */
    protected $parent_slug = 'kirki-ecommerce';

    public function __construct()
    {
        $this->page_title = __('Inventory', 'kirki-ecommerce');
        $this->menu_title = __('Inventory', 'kirki-ecommerce');

        parent::__construct();
    }
}
