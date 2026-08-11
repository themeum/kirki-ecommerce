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

$pages = $data['pages'] ?? [];

?>
<aside class="kecom-account-page-sidebar">
    <ul class="kecom-account-page-nav">
        <?php foreach ($pages as $key => $page) : ?>
            <li class="kecom-account-page-nav-item">
                <a href="<?php echo esc_url($page['url']); ?>"><?php echo esc_html($page['title']); ?></a>
            </li>
        <?php endforeach; ?>
    </ul>
</aside>