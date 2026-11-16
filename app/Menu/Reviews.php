<?php

namespace Kirki\Ecommerce\App\Menu;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\Wordpress\Constants\MenuTypes;
use Kirki\Ecommerce\Framework\Wordpress\Menu;

/**
 * Registers the Reviews submenu under the eCommerce admin menu.
 *
 * @since 1.0.1
 */
class Reviews extends Menu
{
    /** @inheritDoc */
    protected $menu_type = MenuTypes::SUB_MENU;

    /** @inheritDoc */
    protected $capabilities = 'manage_options';

    /** @inheritDoc */
    protected $menu_slug = 'kirki-ecommerce#/reviews';

    /** @inheritDoc */
    protected $parent_slug = 'kirki-ecommerce';

    /**
     * Set the Reviews page and menu titles.
     *
     * @since 1.0.1
     */
    public function __construct()
    {
        $this->page_title = __('Reviews', 'kirki-ecommerce');
        $this->menu_title = __('Reviews', 'kirki-ecommerce');

        parent::__construct();
    }
}
