<?php

namespace Kirki\Ecommerce\App\Menu;

use Kirki\Ecommerce\Framework\Wordpress\Constants\MenuTypes;
use Kirki\Ecommerce\Framework\Wordpress\Menu;

/**
 * Registers the Report submenu under the eCommerce admin menu.
 *
 * @since 1.0.0
 */
class Report extends Menu
{
    /** @inheritDoc */
    protected $menu_type = MenuTypes::SUB_MENU;

    /** @inheritDoc */
    protected $capabilities = 'manage_options';

    /** @inheritDoc */
    protected $menu_slug = 'kirki-ecommerce#/report';

    /** @inheritDoc */
    protected $parent_slug = 'kirki-ecommerce';

    /**
     * Set the Report page and menu titles.
     *
     * @since 1.0.0
     */
    public function __construct()
    {
        $this->page_title = __('Report', 'kirki-ecommerce');
        $this->menu_title = __('Report', 'kirki-ecommerce');

        parent::__construct();
    }
}
