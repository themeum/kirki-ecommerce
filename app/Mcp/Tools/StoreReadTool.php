<?php

namespace Kirki\Ecommerce\App\Mcp\Tools;

defined('ABSPATH') || exit;

use DateTimeImmutable;
use DateTimeZone;
use Kirki\Ecommerce\Ahamed\FrameworkMcp\Tool;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\App\Mcp\Concerns\FormatsMoney;
use Kirki\Ecommerce\App\Mcp\Concerns\ValidatesArguments;
use Kirki\Ecommerce\Framework\Wordpress\Constants\Capabilities;

use function Kirki\Ecommerce\App\client_timezone;

/**
 * Base of the tools that read store data and change nothing. Only store administrators can run them.
 *
 * @since 1.0.0
 */
abstract class StoreReadTool extends Tool
{
    use FormatsMoney;
    use ValidatesArguments;

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
