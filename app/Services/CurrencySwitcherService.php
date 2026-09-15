<?php

namespace Kirki\Ecommerce\App\Services;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Facades\Money;

/**
 * Class CurrencySwitcherService
 *
 * @since 1.0.0
 */
class CurrencySwitcherService
{
    /**
     * @var CurrencyService
     */
    protected $currency_service;

    /**
     * Constructor
     *
     * @since 1.0.0
     *
     * @param CurrencyService $currency_service
     */
    public function __construct(CurrencyService $currency_service)
    {
        $this->currency_service = $currency_service;
    }

    /**
     * Get currency switcher html
     *
     * @since 1.0.0
     *
     * @param array $attributes attributes.
     *
     * @return string currency switcher html.
     */
    public function get_currency_switcher_html($attributes)
    {
        $attributes = wp_parse_args(
            $attributes,
            [
                'class' => '',
            ]
        );

        $currencies = $this->currency_service->get_active_currencies();

        if (empty($currencies)) {
            return '';
        }

        $current_code     = Money::resolve_display_currency();
        $current_currency = null;

        foreach ($currencies as $currency) {
            if (strtoupper($currency->code) === strtoupper($current_code)) {
                $current_currency = $currency;
                break;
            }
        }

        if (! $current_currency) {
            $current_currency = $currencies[0] ?? null;
        }

        $current_code   = $current_currency ? $current_currency->code : $current_code;
        $current_symbol = $current_currency ? $current_currency->symbol : '$';

        ob_start();
        // TODO: markup and design will be updated.
        ?>
        <div
            class="kecom-currency-switcher <?php echo esc_attr($attributes['class']); ?>"
            x-data="{
                open: false,
                current: '<?php echo esc_attr($current_code); ?>',
                select(code) {
                    if (this.current === code) {
                        this.open = false;
                        return;
                    }
                    this.current = code;
                    this.open = false;
                    const maxAge = 30 * 24 * 60 * 60;
                    document.cookie = 'kirki_ecommerce_currency=' + encodeURIComponent(code) + ';path=/;max-age=' + maxAge + ';SameSite=Lax';
                    document.cookie = 'kirki-ecommerce-currency-code=' + encodeURIComponent(code) + ';path=/;max-age=' + maxAge + ';SameSite=Lax';
                    window.location.reload();
                }
            }"
            @click.outside="open = false"
            @keydown.escape.window="open = false"
        >
            <button
                type="button"
                class="kecom-currency-switcher-trigger"
                @click="open = !open"
                :aria-expanded="open"
                aria-haspopup="listbox"
            >
                <span class="kecom-currency-switcher-current-symbol"><?php echo esc_html($current_symbol); ?></span>
                <span class="kecom-currency-switcher-current-code"><?php echo esc_html($current_code); ?></span>
                <svg
                    class="kecom-currency-switcher-arrow"
                    :class="{ 'is-open': open }"
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                >
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </button>

            <div
                class="kecom-currency-switcher-dropdown"
                x-show="open"
                x-transition:enter="kecom-currency-switcher-enter"
                x-transition:enter-start="kecom-currency-switcher-enter-start"
                x-transition:enter-end="kecom-currency-switcher-enter-end"
                x-transition:leave="kecom-currency-switcher-leave"
                x-transition:leave-start="kecom-currency-switcher-leave-start"
                x-transition:leave-end="kecom-currency-switcher-leave-end"
                x-cloak
                role="listbox"
            >
                <ul class="kecom-currency-switcher-list">
                    <?php foreach ($currencies as $currency) : ?>
                        <?php $is_selected = strtoupper($currency->code) === strtoupper($current_code); ?>
                        <li
                            class="kecom-currency-switcher-item <?php echo $is_selected ? 'is-active' : ''; ?>"
                            :class="{ 'is-active': current === '<?php echo esc_attr($currency->code); ?>' }"
                            role="option"
                            :aria-selected="current === '<?php echo esc_attr($currency->code); ?>'"
                            @click="select('<?php echo esc_attr($currency->code); ?>')"
                        >
                            <div class="kecom-currency-switcher-item-left">
                                <span class="kecom-currency-switcher-item-symbol"><?php echo esc_html($currency->symbol); ?></span>
                                <span class="kecom-currency-switcher-item-code"><?php echo esc_html($currency->code); ?></span>
                                <?php if (! empty($currency->name)) : ?>
                                    <span class="kecom-currency-switcher-item-name"><?php echo esc_html($currency->name); ?></span>
                                <?php endif; ?>
                            </div>
                            <svg
                                class="kecom-currency-switcher-item-check"
                                x-show="current === '<?php echo esc_attr($currency->code); ?>'"
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2.5"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                aria-hidden="true"
                            >
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </li>
                    <?php endforeach; ?>
                </ul>
            </div>
        </div>
        <?php

        return ob_get_clean();
    }
}
