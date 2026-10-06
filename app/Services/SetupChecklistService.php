<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\App\Payment\Facades\Payment;
use Kirki\Ecommerce\App\Payment\PaymentProvider;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\App\Supports\Tax;
use Kirki\Ecommerce\Framework\Supports\Facades\Option;

use function Kirki\Ecommerce\Framework\collection;

defined('ABSPATH') || exit;

/**
 * Tracks the Home page's store setup checklist.
 *
 * Completion is sticky: a step's rule is checked only until it is first met, and
 * the completion is then kept in the options table even if the data behind it
 * goes away. Tax and shipping data that store setup itself put in place is
 * "preconfigured" and needs the merchant's explicit confirmation instead.
 *
 * @since 1.0.0
 */
class SetupChecklistService
{
    const STEP_PRODUCTS = 'products';
    const STEP_PAYMENTS = 'payments';
    const STEP_TAX = 'tax';
    const STEP_SHIPPING = 'shipping';

    /**
     * Get the visible steps, recording any that are now met.
     *
     * @since 1.0.0
     *
     * @return array<int, array<string, mixed>> Steps in display order: id, is_completed, is_preconfigured and has_data.
     */
    public function get_state()
    {
        $state = $this->read();
        $steps = [];
        $is_changed = false;

        foreach ($this->get_visible_steps() as $step) {
            $has_data = $this->has_data($step);
            $is_preconfigured = in_array($step, $state['preconfigured'], true);

            if (!isset($state['completed'][$step]) && $has_data && !$is_preconfigured) {
                $state['completed'][$step] = time();
                $is_changed = true;
            }

            $steps[] = [
                'id' => $step,
                'is_completed' => isset($state['completed'][$step]),
                'is_preconfigured' => $is_preconfigured,
                'has_data' => $has_data,
            ];
        }

        if ($is_changed) {
            $this->write($state);
        }

        return $steps;
    }

    /**
     * Record a confirmable step as completed, keeping an earlier completion time.
     *
     * @since 1.0.0
     *
     * @param string $step A confirmable step id.
     * @return array<int, array<string, mixed>> The steps, as get_state() returns them.
     */
    public function complete(string $step)
    {
        $state = $this->read();

        if (!isset($state['completed'][$step])) {
            $state['completed'][$step] = time();
            $this->write($state);
        }

        return $this->get_state();
    }

    /**
     * Record which confirmable steps already have data when store setup ends.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function record_preconfigured()
    {
        $state = $this->read();

        $state['preconfigured'] = array_values(array_filter(
            static::get_confirmable_steps(),
            fn($step) => $this->has_data($step)
        ));

        $this->write($state);
    }

    /**
     * Check whether a step can be completed by the merchant confirming it.
     *
     * @since 1.0.0
     *
     * @param string $step Step id.
     * @return bool
     */
    public static function is_confirmable(string $step)
    {
        return in_array($step, static::get_confirmable_steps(), true);
    }

    /**
     * Get every step, in display order.
     *
     * @since 1.0.0
     *
     * @return string[]
     */
    public static function get_steps()
    {
        return [
            static::STEP_PRODUCTS,
            static::STEP_PAYMENTS,
            static::STEP_TAX,
            static::STEP_SHIPPING,
        ];
    }

    /**
     * Get the steps that complete on the merchant's confirmation when preconfigured.
     *
     * @since 1.0.0
     *
     * @return string[]
     */
    public static function get_confirmable_steps()
    {
        return [static::STEP_TAX, static::STEP_SHIPPING];
    }

    /**
     * Get the steps shown to the merchant, in display order.
     *
     * @since 1.0.0
     *
     * @return string[]
     */
    protected function get_visible_steps()
    {
        if (Tax::is_tax_enabled()) {
            return static::get_steps();
        }

        return array_values(array_diff(static::get_steps(), [static::STEP_TAX]));
    }

    /**
     * Check whether the store has the data a step asks for.
     *
     * Each step needs data that checkout can use: a product, a set-up payment
     * method, a tax region with a rate, or a shipping zone with a method. Only
     * enabled entries count.
     *
     * @since 1.0.0
     *
     * @param string $step Step id.
     * @return bool
     */
    protected function has_data(string $step)
    {
        switch ($step) {
            case static::STEP_PRODUCTS:
                return Product::query()->exists();
            case static::STEP_PAYMENTS:
                return collection(Payment::get_all_providers())
                    ->contains(fn($provider) => $this->is_payment_ready($provider));
            case static::STEP_TAX:
                return collection($this->to_list(Tax::get_tax_regions()))
                    ->contains(fn($region) => !empty($region['is_enabled']) && $this->has_product_tax_rate($region));
            case static::STEP_SHIPPING:
                return collection($this->to_list(Settings::get('shipping.shipping_zones', [])))
                    ->contains(fn($zone) => !empty($zone['is_enabled']) && $this->has_enabled_entry($zone['shipping_methods'] ?? []));
            default:
                return false;
        }
    }

    /**
     * Check whether a payment method is enabled and has every required setting filled.
     *
     * A method without required admin fields, such as an offline method, only has
     * to be enabled.
     *
     * @since 1.0.0
     *
     * @param PaymentProvider $provider
     * @return bool
     */
    protected function is_payment_ready(PaymentProvider $provider)
    {
        if (!$provider->enabled()) {
            return false;
        }

        $settings = $provider->settings();

        return collection($provider->admin_fields())
            ->filter(fn($field) => !empty($field['required']))
            ->every(fn($field) => trim((string) ($settings[$field['name'] ?? ''] ?? '')) !== '');
    }

    /**
     * Check whether a tax region charges a product tax rate above zero.
     *
     * Follows the tax strategies: an EU region reads its member countries, and a
     * general region reads its central rate in central mode or its states otherwise.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $region A tax region from the tax settings.
     * @return bool
     */
    protected function has_product_tax_rate(array $region)
    {
        if ('EU' === ($region['code'] ?? '')) {
            return $this->has_positive_rate($region['countries'] ?? [], 'rate');
        }

        if (!empty($region['is_central_tax_enabled'])) {
            return (float) ($region['central_product_tax'] ?? 0) > 0;
        }

        return $this->has_positive_rate($region['states'] ?? [], 'product_tax_rate');
    }

    /**
     * Check whether any entry of a list has a rate above zero.
     *
     * @since 1.0.0
     *
     * @param mixed  $entries Entries carrying a rate.
     * @param string $key     The rate's key in each entry.
     * @return bool
     */
    protected function has_positive_rate($entries, string $key)
    {
        return collection($this->to_list($entries))
            ->contains(fn($entry) => (float) ($entry[$key] ?? 0) > 0);
    }

    /**
     * Check whether any entry of a settings list is enabled.
     *
     * @since 1.0.0
     *
     * @param mixed $entries Settings entries carrying an is_enabled flag.
     * @return bool
     */
    protected function has_enabled_entry($entries)
    {
        return collection($this->to_list($entries))
            ->contains(fn($entry) => !empty($entry['is_enabled']));
    }

    /**
     * Keep only the array entries of a settings list.
     *
     * @since 1.0.0
     *
     * @param mixed $entries A settings list, or any other stored value.
     * @return array<int, array<string, mixed>>
     */
    protected function to_list($entries)
    {
        return array_values(array_filter(is_array($entries) ? $entries : [], 'is_array'));
    }

    /**
     * Read the stored checklist state.
     *
     * @since 1.0.0
     *
     * @return array{completed: array<string, int>, preconfigured: string[]}
     */
    protected function read()
    {
        $state = Option::get(OptionKeys::SETUP_CHECKLIST);
        $state = is_array($state) ? $state : [];

        return [
            'completed' => is_array($state['completed'] ?? null) ? $state['completed'] : [],
            'preconfigured' => is_array($state['preconfigured'] ?? null) ? $state['preconfigured'] : [],
        ];
    }

    /**
     * Store the checklist state.
     *
     * @since 1.0.0
     *
     * @param array{completed: array<string, int>, preconfigured: string[]} $state
     * @return void
     */
    protected function write(array $state)
    {
        Option::set(OptionKeys::SETUP_CHECKLIST, $state);
    }
}
