<?php

/**
 * Site Component - Popover / Dropdown Menu.
 *
 * @package Kirki\Ecommerce\Templates
 * @since 1.0.0
 *
 * Parameters:
 * @var string      $placement      Placement variant ('bottom-end', 'bottom-start', 'top-end', 'top-start'). Default 'bottom-end'.
 * @var string      $trigger_icon   Icon name to render in trigger button. Default 'dots-vertical'.
 * @var string      $trigger_text   Optional text to display in trigger button.
 * @var string      $trigger_label  Accessible label for screen readers. Default 'Options'.
 * @var string      $trigger_class  CSS class for trigger button. Default 'kecom-btn kecom-btn-ghost kecom-btn-icon kecom-btn-sm'.
 * @var array       $items          List of menu items. Each item can be:
 *                                  - An item array:
 *                                    [
 *                                        'label'          => string,
 *                                        'click'          => string (Alpine click handler),
 *                                        'href'           => string (optional URL),
 *                                        'class'          => string (optional CSS classes),
 *                                        'bind_class'     => string (optional Alpine :class expression),
 *                                        'bind_disable'   => string (optional Alpine :disabled expression),
 *                                        'is_danger'      => bool (optional danger variant),
 *                                        'divider_before' => bool (optional divider before this item),
 *                                        'divider_after'  => bool (optional divider after this item),
 *                                    ]
 *                                  - Or a standalone divider:
 *                                    ['type' => 'divider'] or ['is_divider' => true] or 'divider'
 * @var string      $slot           Optional raw HTML content inside the popover panel.
 */

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Supports\Icon;
use function Kirki\Ecommerce\Framework\view_data;

$placement     = view_data('placement', 'bottom-end');
$trigger_icon  = view_data('trigger_icon', 'dots-vertical');
$trigger_text  = view_data('trigger_text', null);
$trigger_label = view_data('trigger_label', __('Options', 'kirki-ecommerce'));
$trigger_class = view_data('trigger_class', 'kecom-btn kecom-btn-ghost kecom-btn-icon kecom-btn-sm');
$items         = view_data('items', []);
$slot          = view_data('slot', '');
?>

<div
    class="kecom-popover"
    x-data="popover({ placement: '<?php echo esc_attr($placement); ?>' })"
    @click.outside="close()"
    @keydown.escape.window="close()"
>
    <button
        type="button"
        class="<?php echo esc_attr($trigger_class); ?>"
        @click.stop="toggle()"
        aria-label="<?php echo esc_attr($trigger_label); ?>"
    >
        <?php if (!empty($trigger_icon)) : ?>
            <?php Icon::render($trigger_icon); ?>
        <?php endif; ?>
        <?php if (!empty($trigger_text)) : ?>
            <span><?php echo esc_html($trigger_text); ?></span>
        <?php endif; ?>
    </button>

    <div
        class="kecom-popover-panel kecom-popover-panel-<?php echo esc_attr($placement); ?>"
        x-show="isOpen"
        x-transition:enter="kecom-popover-enter"
        x-transition:enter-start="kecom-popover-enter-start"
        x-transition:enter-end="kecom-popover-enter-end"
        x-transition:leave="kecom-popover-leave"
        x-transition:leave-start="kecom-popover-leave-start"
        x-transition:leave-end="kecom-popover-leave-end"
        x-cloak
    >
        <?php if (!empty($items)) : ?>
            <?php foreach ($items as $item) : ?>
                <?php
                // Handle standalone divider
                if ($item === 'divider' || !empty($item['is_divider']) || (($item['type'] ?? '') === 'divider')) : ?>
                    <div class="kecom-popover-divider"></div>
                    <?php continue; ?>
                <?php endif; ?>

                <?php if (!empty($item['divider_before'])) : ?>
                    <div class="kecom-popover-divider"></div>
                <?php endif; ?>

                <?php
                $item_class = 'kecom-popover-item';
                if (!empty($item['is_danger'])) {
                    $item_class .= ' kecom-popover-item-danger';
                }
                if (!empty($item['class'])) {
                    $item_class .= ' ' . $item['class'];
                }
                ?>
                <?php if (!empty($item['href'])) : ?>
                    <a
                        href="<?php echo esc_url($item['href']); ?>"
                        class="<?php echo esc_attr($item_class); ?>"
                        <?php if (!empty($item['click'])) : ?>
                            @click="<?php echo esc_attr($item['click']); ?>; close()"
                        <?php endif; ?>
                    >
                        <?php echo esc_html($item['label']); ?>
                    </a>
                <?php else : ?>
                    <button
                        type="button"
                        class="<?php echo esc_attr($item_class); ?>"
                        <?php if (!empty($item['click'])) : ?>
                            @click="<?php echo esc_attr($item['click']); ?>; close()"
                        <?php endif; ?>
                        <?php if (!empty($item['bind_class'])) : ?>
                            :class="<?php echo esc_attr($item['bind_class']); ?>"
                        <?php endif; ?>
                        <?php if (!empty($item['bind_disable'])) : ?>
                            :disabled="<?php echo esc_attr($item['bind_disable']); ?>"
                        <?php endif; ?>
                    >
                        <?php echo esc_html($item['label']); ?>
                    </button>
                <?php endif; ?>

                <?php if (!empty($item['divider_after'])) : ?>
                    <div class="kecom-popover-divider"></div>
                <?php endif; ?>
            <?php endforeach; ?>
        <?php endif; ?>

        <?php if (!empty($slot)) : ?>
            <?php echo $slot; ?>
        <?php endif; ?>
    </div>
</div>
