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
use Kirki\Ecommerce\App\Supports\Utils;

$menu_items = Utils::get_account_menu_items();
?>

<aside class="kecom-account-sidebar">
    <nav class="kecom-account-nav" aria-label="<?php esc_attr_e('Account Navigation', 'kirki-ecommerce'); ?>">
        <ul class="kecom-account-nav-list">
            <?php foreach ($menu_items as $key => $item) :
                $is_active = !empty($item['is_active']);
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
