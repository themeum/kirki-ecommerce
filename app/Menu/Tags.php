<?php

namespace Kirki\Ecommerce\App\Menu;

use Kirki\Ecommerce\Framework\Wordpress\Constants\MenuTypes;
use Kirki\Ecommerce\Framework\Wordpress\Menu;

class Tags extends Menu
{
    /** @inheritDoc */
    protected $menu_type = MenuTypes::SUB_MENU;

    /** @inheritDoc */
    protected $capabilities = 'manage_options';

    /** @inheritDoc */
    protected $menu_slug = 'ecommerce#/tags';

    /** @inheritDoc */
    protected $parent_slug = 'ecommerce';

    public function __construct()
    {
        $this->page_title = __('Tags', 'kirki-ecommerce');
        $this->menu_title = __('Tags', 'kirki-ecommerce');

        parent::__construct();
    }
}
