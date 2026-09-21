<?php

namespace Kirki\Ecommerce\App\Menu;

use Kirki\Ecommerce\Framework\Wordpress\Constants\MenuTypes;
use Kirki\Ecommerce\Framework\Wordpress\Menu;

/**
 * Registers the Collections submenu under the eCommerce admin menu.
 *
 * @since 1.0.0
 */
class Collections extends Menu
{
    /** @inheritDoc */
    protected $menu_type = MenuTypes::SUB_MENU;

    /** @inheritDoc */
    protected $capabilities = 'manage_options';

    /** @inheritDoc */
    protected $menu_slug = 'kirki-ecommerce#/collections';

    /** @inheritDoc */
    protected $parent_slug = 'kirki-ecommerce';

    /**
     * Set the Collections page and menu titles.
     *
     * @since 1.0.0
     */
    public function __construct()
    {
        $this->page_title = __('Collections', 'kirki-ecommerce');
        $this->menu_title = __('Collections', 'kirki-ecommerce');

        parent::__construct();
    }
}
