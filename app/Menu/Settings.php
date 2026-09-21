<?php

namespace Kirki\Ecommerce\App\Menu;

use Kirki\Ecommerce\Framework\Wordpress\Constants\MenuTypes;
use Kirki\Ecommerce\Framework\Wordpress\Menu;

/**
 * Registers the Settings submenu under the eCommerce admin menu.
 *
 * @since 1.0.0
 */
class Settings extends Menu
{
    /** @inheritDoc */
    protected $menu_type = MenuTypes::SUB_MENU;

    /** @inheritDoc */
    protected $capabilities = 'manage_options';

    /** @inheritDoc */
    protected $menu_slug = 'kirki-ecommerce#/settings';

    /** @inheritDoc */
    protected $parent_slug = 'kirki-ecommerce';

    /**
     * Set the Settings page and menu titles.
     *
     * @since 1.0.0
     */
    public function __construct()
    {
        $this->page_title = __('Settings', 'kirki-ecommerce');
        $this->menu_title = __('Settings', 'kirki-ecommerce');

        parent::__construct();
    }
}
