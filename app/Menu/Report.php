<?php

namespace Kirki\Ecommerce\App\Menu;

use Kirki\Ecommerce\Wordpress\Constants\MenuTypes;
use Kirki\Ecommerce\Wordpress\Menu;

class Report extends Menu
{
    /** @inheritDoc */
    protected $menu_type = MenuTypes::SUB_MENU;

    /** @inheritDoc */
    protected $capabilities = 'manage_options';

    /** @inheritDoc */
    protected $menu_slug = 'ecommerce#/report';

    /** @inheritDoc */
    protected $parent_slug = 'ecommerce';

    public function __construct()
    {
        $this->page_title = __('Report', 'kirki-ecommerce');
        $this->menu_title = __('Report', 'kirki-ecommerce');

        parent::__construct();
    }
}
