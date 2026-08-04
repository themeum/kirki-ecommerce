<?php
/**
 * Breadcrumb Template Part.
 *
 * @package Kirki\Ecommerce\Templates
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

defined('ABSPATH') || exit;
extract($data);

$items = $items ?? [];
$current = $current ?? '';
?>

<nav class="kecom-breadcrumb" aria-label="<?php echo esc_attr__('Breadcrumb', 'kirki-ecommerce'); ?>">
    <ol class="kecom-breadcrumb-list">
        <?php foreach ($items as $index => $item): ?>
            <?php if (isset($item['url'])): ?>
                <li class="kecom-breadcrumb-item">
                    <a class="kecom-breadcrumb-link" href="<?php echo esc_url($item['url']); ?>">
                        <?php echo esc_html($item['label']); ?>
                    </a>
                </li>
            <?php else: ?>
                <li class="kecom-breadcrumb-item" aria-current="page">
                    <?php echo esc_html($item['label']); ?>
                </li>
            <?php endif; ?>
        <?php endforeach; ?>
        
        <?php if ($current): ?>
            <li class="kecom-breadcrumb-item" aria-current="page">
                <?php echo esc_html($current); ?>
            </li>
        <?php endif; ?>
    </ol>
</nav>
