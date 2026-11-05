<?php

namespace Kirki\Ecommerce\App\Mcp\Concerns;

defined('ABSPATH') || exit;

/**
 * Turns money objects into the money shape of the MCP server.
 *
 * @since 1.0.0
 */
trait FormatsMoney
{
    /**
     * Turn a money object into a decimal amount, a display string and a currency code.
     *
     * @since 1.0.0
     *
     * @param \Kirki\Ecommerce\App\DTO\MoneyDTO|null $money Money object, or null when there is no value.
     *
     * @return array<string, mixed>|null
     */
    protected function money_value($money)
    {
        if ($money === null) {
            return null;
        }

        return [
            'amount' => $money->raw,
            'display' => $money->display,
            'currency' => $money->currency->code,
        ];
    }
}
