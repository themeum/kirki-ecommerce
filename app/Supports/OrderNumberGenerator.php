<?php

namespace Kirki\Ecommerce\App\Supports;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\Framework\Supports\Facades\Option;
use Kirki\Ecommerce\Framework\Wordpress\Models\Option as OptionModel;

use function Kirki\Ecommerce\Framework\with_prefix;

class OrderNumberGenerator
{
    protected const ORDER_NUMBER_PADDING = 6;

    /**
     * Generate an order number from the order's own auto-increment id and
     * the general.order_number prefix/suffix settings.
     *
     * @param int $order_id
     * @return string
     */
    public static function generate_order_number(int $order_id)
    {
        $settings = Settings::get('general.order_number') ?? [];

        return ($settings['prefix'] ?? '')
            . str_pad((string) $order_id, static::ORDER_NUMBER_PADDING, '0', STR_PAD_LEFT)
            . ($settings['suffix'] ?? '');
    }

    /**
     * Generate an invoice number from the general.invoice_number settings,
     * advancing the persisted running counter.
     *
     * @return string
     */
    public static function generate_invoice_number()
    {
        $settings = Settings::get('general.invoice_number') ?? [];
        $starting_sequence = $settings['sequence'] ?? '000001';
        $padding = $starting_sequence
            ? strlen((string) $starting_sequence)
            : static::ORDER_NUMBER_PADDING;
        $apply_year_prefix = !empty($settings['apply_year_prefix']);
        $reset_sequence_every_year = !empty($settings['reset_sequence_every_year']);

        if ($apply_year_prefix && $reset_sequence_every_year) {
            static::maybe_reset_yearly_counter((int) $starting_sequence);
        }

        $next = static::increment_last_invoice_number((int) $starting_sequence);
        $year_prefix = $apply_year_prefix ? date('y') . '-' : '';

        return ($settings['prefix'] ?? '')
            . $year_prefix
            . str_pad((string) $next, $padding, '0', STR_PAD_LEFT)
            . ($settings['suffix'] ?? '');
    }

    /**
     * Reset the invoice counter to just below the configured starting
     * sequence when the calendar year has rolled over since its last use.
     *
     * @param int $starting_sequence
     * @return void
     */
    protected static function maybe_reset_yearly_counter(int $starting_sequence)
    {
        $current_year = (int) date('Y');
        $reset_year = (int) Option::get(OptionKeys::LAST_INVOICE_NUMBER_RESET_YEAR, 0);

        if ($reset_year === $current_year) {
            return;
        }

        Option::set(OptionKeys::LAST_INVOICE_NUMBER, $starting_sequence - 1);
        Option::set(OptionKeys::LAST_INVOICE_NUMBER_RESET_YEAR, $current_year);
    }

    /**
     * Atomically increment the persisted invoice counter and return the
     * new value.
     *
     * @param int $starting_sequence
     * @return int
     */
    protected static function increment_last_invoice_number(int $starting_sequence)
    {
        $option_name = with_prefix(OptionKeys::LAST_INVOICE_NUMBER);
        $incremented = (bool) OptionModel::query()->where('option_name', $option_name)->increment('option_value');

        if (!$incremented) {
            Option::set(OptionKeys::LAST_INVOICE_NUMBER, $starting_sequence);

            return $starting_sequence;
        }

        $option = OptionModel::query()->where('option_name', $option_name)->first();

        return (int) ($option->option_value ?? $starting_sequence);
    }
}
