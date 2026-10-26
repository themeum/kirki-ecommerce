<?php

namespace Kirki\Ecommerce\App\Mcp\Tools;

defined('ABSPATH') || exit;

use DateTimeImmutable;
use DateTimeZone;
use Kirki\Ecommerce\Ahamed\FrameworkMcp\Tool;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\Framework\Exceptions\ValidationException;
use Kirki\Ecommerce\Framework\Validation\Validator;
use Kirki\Ecommerce\Framework\Wordpress\Constants\Capabilities;

use function Kirki\Ecommerce\App\client_timezone;
use function Kirki\Ecommerce\Framework\throw_exception;

/**
 * Base of the tools that read store data and change nothing. Only store administrators can run them.
 *
 * @since 1.0.0
 */
abstract class StoreReadTool extends Tool
{
    const STORE_TEXT_LIMIT = 500;

    /** @var bool */
    protected $read_only = true;

    /** @var bool */
    protected $idempotent = true;

    /** @var bool */
    protected $destructive = false;

    /** @var bool */
    protected $open_world = false;

    /**
     * Allow only store administrators to run the tool.
     *
     * @since 1.0.0
     *
     * @return bool
     */
    public function permission()
    {
        return current_user_can(Capabilities::MANAGE_OPTIONS);
    }

    /**
     * Validate the arguments with the framework validator.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed>  $arguments Tool arguments.
     * @param array<string, string> $rules     Validation rules.
     * @param array<string, string> $messages  Messages that name the argument.
     *
     * @return array<string, mixed> The validated arguments.
     * @throws ValidationException When an argument is not valid.
     */
    protected function validate_arguments(array $arguments, array $rules, array $messages = [])
    {
        return Validator::make($arguments, $rules, $messages)->validate();
    }

    /**
     * Reject the call with errors keyed by argument.
     *
     * @since 1.0.0
     *
     * @param array<string, string[]> $errors Errors keyed by argument.
     *
     * @return void
     * @throws ValidationException Always.
     */
    protected function reject(array $errors)
    {
        throw_exception(ValidationException::with_errors($errors));
    }

    /**
     * Get the message for an argument that must be one of a list of values.
     *
     * @since 1.0.0
     *
     * @param string   $argument Argument name.
     * @param string[] $values   Allowed values.
     *
     * @return string
     */
    protected function one_of_message(string $argument, array $values)
    {
        /* translators: 1: argument name, 2: comma separated allowed values. */
        return sprintf(__('The "%1$s" must be one of: %2$s.', 'kirki-ecommerce'), $argument, implode(', ', $values));
    }

    /**
     * Turn a minor amount into a decimal amount, a display string and a currency code.
     *
     * @since 1.0.0
     *
     * @param int|null    $minor    Amount in minor units.
     * @param string|null $currency Currency of the amount. The base currency when null.
     *
     * @return array<string, mixed>|null Null when there is no amount.
     */
    protected function money($minor, $currency = null)
    {
        if ($minor === null) {
            return null;
        }

        return $this->money_value(Money::to_dto((int) $minor, $currency ?: null));
    }

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

    /**
     * Turn a stored UTC date-time into ISO 8601 with the offset of the client time zone.
     *
     * @since 1.0.0
     *
     * @param string|null $utc Date-time in UTC, as stored.
     *
     * @return string|null Null when there is no date-time.
     */
    protected function datetime($utc)
    {
        if (empty($utc)) {
            return null;
        }

        return (new DateTimeImmutable((string) $utc, new DateTimeZone('UTC')))
            ->setTimezone(client_timezone())
            ->format(DATE_ATOM);
    }

    /**
     * Clean text that customers or other outside people wrote: remove the tags and cut it to 500 characters.
     *
     * @since 1.0.0
     *
     * @param string|null $text Text as stored.
     *
     * @return string|null Null when there is no text.
     */
    protected function store_text($text)
    {
        if ($text === null || $text === '') {
            return null;
        }

        return mb_substr(trim(wp_strip_all_tags((string) $text)), 0, static::STORE_TEXT_LIMIT);
    }
}
