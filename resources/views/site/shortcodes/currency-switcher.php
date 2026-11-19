<?php

/**
 * Currency Switcher Template for Shortcode.
 *
 * @package Kirki\Ecommerce\Templates
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\CookieNames;
use Kirki\Ecommerce\App\Supports\Icon;

$items_json    = $data['items_json'] ?? [];
$selected_json = $data['selected_json'] ?? '';
$attributes    = $data['attributes'] ?? [];
$current_code   = $data['current_code'] ?? '';
$current_symbol = $data['current_symbol'] ?? '';
$current_flag   = $data['current_flag'] ?? '';

?>
<div
    class="kecom-dropdown kecom-currency-switcher <?php echo esc_attr($attributes['class']); ?>"
    x-data="dropdown({
        items: <?php echo esc_attr($items_json); ?>,
        selected: <?php echo esc_attr($selected_json); ?>,
        align: '<?php echo esc_js($attributes['align']); ?>',
        onChange(item) {
            const maxAge = 30 * 24 * 60 * 60;
            const encoded = encodeURIComponent(item.value);
            const opts = ';path=/;max-age=' + maxAge + ';SameSite=Lax';
            document.cookie = '<?php echo esc_js(CookieNames::CURRENCY); ?>=' + encoded + opts;
            window.location.reload();
        },
    })"
    x-on:click.outside="close()"
    x-on:keydown.escape.window="close(true)"
>
    <button
        type="button"
        x-ref="trigger"
        class="kecom-dropdown-trigger"
        x-on:click="toggle()"
        x-on:keydown="onTriggerKeydown($event)"
        x-bind:aria-expanded="isOpen"
        aria-haspopup="listbox"
    >
        <span class="kecom-dropdown-flag" x-text="selectedItem?.flag" x-show="selectedItem?.flag"><?php echo esc_html($current_flag); ?></span>
        <span class="kecom-dropdown-label" x-text="selectedItem?.code || '<?php echo esc_js($current_code); ?>'"><?php echo esc_html($current_code); ?></span>
        <span class="kecom-dropdown-sublabel" x-show="selectedItem?.symbol" x-text="selectedItem?.symbol ? `${selectedItem.symbol}` : ''"><?php echo esc_html($current_symbol ? "{$current_symbol}" : ''); ?></span>
        <span class="kecom-dropdown-arrow" x-bind:class="{ 'is-open': isOpen }">
            <?php Icon::render('chevron-down', ['size' => 16]); ?>
        </span>
    </button>

    <div
        x-ref="menu"
        class="kecom-dropdown-menu"
        x-bind:class="{ 'kecom-dropdown-menu-end': isAlignEnd }"
        x-show="isOpen"
        x-transition:enter="kecom-dropdown-enter"
        x-transition:enter-start="kecom-dropdown-enter-start"
        x-transition:enter-end="kecom-dropdown-enter-end"
        x-transition:leave="kecom-dropdown-leave"
        x-transition:leave-start="kecom-dropdown-leave-start"
        x-transition:leave-end="kecom-dropdown-leave-end"
        x-cloak
        role="listbox"
        x-bind:aria-activedescendant="activeId"
        x-on:keydown="onListKeydown($event)"
        tabindex="-1"
    >
        <ul class="kecom-dropdown-list">
            <template x-for="item in filteredItems" x-bind:key="item.value">
                <li
                    x-bind:id="itemId(item)"
                    class="kecom-dropdown-item"
                    role="option"
                    x-bind:aria-selected="isSelected(item)"
                    x-bind:class="{ 'is-focused': isFocused(item) }"
                    x-on:click="select(item)"
                    x-on:mouseenter="focusedIndex = filteredItems.indexOf(item)"
                >
                    <div class="kecom-dropdown-item-content">
                        <span class="kecom-dropdown-item-flag" x-text="item.flag" x-show="item.flag"></span>
                        <span class="kecom-dropdown-item-label" x-text="item.label"></span>
                        <span class="kecom-dropdown-item-sublabel" x-text="item.sublabel"></span>
                    </div>
                    <div class="kecom-dropdown-item-check" x-show="isSelected(item)">
                        <?php Icon::render('check', ['size' => 16]); ?>
                    </div>
                </li>
            </template>
        </ul>
    </div>
</div>