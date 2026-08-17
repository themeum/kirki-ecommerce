<?php

/**
 * Account Page Template.
 *
 * @package Kirki\Ecommerce\Templates
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Supports\Icon;
use Kirki\Ecommerce\App\Supports\Url;
use function Kirki\Ecommerce\Framework\view_data;

$current_page = view_data('current_page') ?: 'dashboard';
$logout_url = wp_logout_url(Url::get_account_url());

$menu_items = [
    'dashboard' => [
        'title' => __('Dashboard', 'kirki-ecommerce'),
        'url'   => Url::get_account_dashboard_url(),
        'icon'  => 'dashboard',
    ],
    'orders' => [
        'title' => __('Orders', 'kirki-ecommerce'),
        'url'   => Url::get_account_orders_url(),
        'icon'  => 'box',
    ],
    'addresses' => [
        'title' => __('Addresses', 'kirki-ecommerce'),
        'url'   => Url::get_account_addresses_url(),
        'icon'  => 'map-pin',
    ],
    'account-details' => [
        'title' => __('Account Details', 'kirki-ecommerce'),
        'url'   => Url::get_account_details_url(),
        'icon'  => 'user',
    ],
    'logout' => [
        'title' => __('Log Out', 'kirki-ecommerce'),
        'url'   => $logout_url,
        'icon'  => 'log-out',
        'class' => 'kecom-account-nav-link-logout',
    ],
];

/**
 * Filter the account navigation menu items.
 *
 * @since 1.0.0
 *
 * @param array  $menu_items   The list of menu items.
 * @param string $current_page Current active page key.
 */
$menu_items = apply_filters('kirki_ecommerce_account_menu_items', $menu_items, $current_page);
?>

<aside class="kecom-account-sidebar">
    <nav class="kecom-account-nav" aria-label="<?php esc_attr_e('Account Navigation', 'kirki-ecommerce'); ?>">
        <ul class="kecom-account-nav-list">
            <?php foreach ($menu_items as $key => $item) :
                $is_active = $current_page === $key;
                $classes = ['kecom-account-nav-link'];

                if ($is_active) {
                    $classes[] = 'is-active';
                }

                if (!empty($item['class'])) {
                    $classes[] = $item['class'];
                }
            ?>
                <li class="kecom-account-nav-item kecom-account-nav-item-<?php echo esc_attr($key); ?>">
                    <a
                        href="<?php echo esc_url($item['url']); ?>"
                        class="<?php echo esc_attr(implode(' ', $classes)); ?>"
                        <?php echo $is_active ? 'aria-current="page"' : ''; ?>
                    >
                        <?php if (!empty($item['icon'])) : ?>
                            <?php Icon::render($item['icon']); ?>
                        <?php endif; ?>
                        <span><?php echo esc_html($item['title']); ?></span>
                    </a>
                </li>
            <?php endforeach; ?>
        </ul>
    </nav>
</aside>
