<?php

namespace Kirki\Ecommerce\App\Services;

defined('ABSPATH') || exit;

/**
 * Class MiniCartService
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

        ob_start();
        ?>
        <div class="kecom-currency-switcher <?php echo esc_attr($attributes['class']); ?>">
            <?php foreach ($currencies as $currency) : ?>
                <div class="kecom-currency-switcher-item">
                    <div class="kecom-currency-switcher-item-content">
                        <div class="kecom-currency-switcher-item-code">
                            <?php echo esc_html($currency->code); ?>
                        </div>
                        <div class="kecom-currency-switcher-item-symbol">
                            <?php echo esc_html($currency->symbol); ?>
                        </div>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
        <?php

        return ob_get_clean();
    }
}
